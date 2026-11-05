import { createWorker } from 'tesseract.js';
import { PlnReceiptData } from '../types/receipt';
import { formatToken, generateRandomRef, getCurrentDateTimeFormatted, parseNumberOnly, normalizeTarifDaya } from './formatters';

export interface OcrProgress {
  status: string;
  progress: number; // 0 to 1
}

/**
 * Preprocesses an image before OCR for higher accuracy on receipt text.
 * Converts to high-contrast grayscale on an offscreen canvas with optimal resolution.
 */
async function preprocessImage(imageSource: File | Blob | string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource as Blob));
        return;
      }

      // Upscale if below 1600px so small receipt text has crisp raster edges
      const targetMinDimension = 1600;
      let width = img.width;
      let height = img.height;
      if (width < targetMinDimension || height < targetMinDimension) {
        const scale = Math.max(targetMinDimension / width, targetMinDimension / height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      canvas.width = width;
      canvas.height = height;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Draw and apply optimized contrast/brightness filter
      ctx.filter = 'grayscale(100%) contrast(140%) brightness(105%)';
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource as Blob));
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}

/**
 * Executes 100% client-side local OCR using Tesseract.js.
 */
export async function runLocalOcr(
  imageSource: File | Blob | string,
  onProgress?: (progress: OcrProgress) => void
): Promise<string> {
  onProgress?.({ status: 'Memuat modul OCR lokal...', progress: 0.1 });

  const processedUrl = await preprocessImage(imageSource);
  onProgress?.({ status: 'Menginisialisasi pemindaian...', progress: 0.25 });

  const worker = await createWorker('eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') {
        const p = 0.3 + (m.progress || 0) * 0.65;
        onProgress?.({
          status: `Mengenali teks: ${Math.round((m.progress || 0) * 100)}%`,
          progress: Math.min(p, 0.95),
        });
      }
    },
  });

  onProgress?.({ status: 'Menganalisis teks struk & nama pelanggan...', progress: 0.4 });
  const ret = await worker.recognize(processedUrl);
  await worker.terminate();

  onProgress?.({ status: 'Ekstraksi selesai!', progress: 1 });
  return ret.data.text;
}

/**
 * Blacklist of system/financial keywords that CANNOT be a customer's name.
 */
const SYSTEM_WORDS_BLACKLIST = new Set([
  'PLN', 'TOKEN', 'PRABAYAR', 'PASCABAYAR', 'STRUK', 'PEMBELIAN', 'PEMBAYARAN',
  'TAGIHAN', 'JUMLAH', 'BIAYA', 'TRANSAKSI', 'BERHASIL', 'SUKSES', 'DETAIL',
  'STATUS', 'INFORMASI', 'TANGGAL', 'WAKTU', 'JAM', 'NO', 'NOMOR', 'METER',
  'MSN', 'MTR', 'IDPEL', 'ID', 'DPE', 'DPEL', 'TARIF', 'DAYA', 'VA', 'KWH', 'STROOM',
  'REF', 'NOREF', 'BANK', 'BCA', 'BRI', 'BRIMO', 'BNI', 'MANDIRI', 'LIVIN', 'DANA',
  'GOPAY', 'OVO', 'SHOPEEPAY', 'FLIP', 'LINKAJA', 'ALFAMART', 'INDOMARET', 'LOKET',
  'KASIR', 'AGEN', 'RP', 'RUPIAH', 'ADMIN', 'TOTAL', 'BAYAR', 'PPN', 'MATERAI',
  'PPJ', 'PBJT', 'PBJT-TL', 'ANGSURAN', 'CATATAN', 'TERIMA KASIH', 'TERIMAKASIH',
  'CUSTOMER', 'PELANGGAN', 'KONSUMEN', 'PENERIMA', 'PENGGUNA', 'PEMBELI', 'SUMBER',
  'REKENING', 'METODE', 'BUKTI', 'KODE', 'PRODUK', 'SN', 'SERIAL', 'NOMINAL',
  'DENOM', 'EVERYDAY', 'ACCOUNT', 'TMRW', 'UOB', 'KOMENTAR', 'LANGSUNG', 'CALL',
  'CENTER', 'HUBUNGI', 'WIB'
]);

/**
 * Validates whether a candidate string is a plausible person's name.
 */
function isValidCustomerName(candidate: string): boolean {
  if (!candidate || candidate.length < 2 || candidate.length > 45) return false;

  const upper = candidate.toUpperCase().trim();

  // Must have at least 2 alphabetic characters
  const lettersOnly = upper.replace(/[^A-Z]/g, '');
  if (lettersOnly.length < 2) return false;

  // Cannot be purely numbers, dates, or timestamps
  if (/^[\d\s./:-]+$/.test(upper)) return false;

  const words = upper.split(/\s+/).filter(Boolean);
  if (words.length === 0) return false;

  // If any word is a system keyword (like JUMLAH, TAGIHAN, TRANSAKSI, etc.), reject
  for (const w of words) {
    if (SYSTEM_WORDS_BLACKLIST.has(w)) return false;
  }

  // Reject abbreviations
  if (['DPE', 'IDP', 'MSN', 'KWH', 'VA', 'TRF', 'ADM', 'RP'].includes(upper)) return false;

  // Reject if it contains tariff or currency markers
  if (/\b(?:VA|KWH|WATT|IDR|RUPIAH)\b/i.test(upper)) return false;

  return true;
}

/**
 * Cleans candidate customer name by removing labels, separators, numbers, and trailing tariff/idpel text.
 */
function cleanCustomerName(candidate: string): string {
  let clean = candidate.trim();

  // Strip leading prefixes like "NAMA :", "PLG :", "A/N :", etc.
  clean = clean.replace(/^(?:NAMA\s*PELANGGAN|NAMA\s*PLG|NAMA\s*KONSUMEN|NAMA\s*PENERIMA|NAMA\s*PENGGUNA|NAMA\s*PEMBELI|ATAS\s*NAMA|A\s*\/\s*N|NM\s*PLG|PLG|CUSTOMER\s*NAME|CUSTOMER|NAMA|NANA|NAM4|N4MA)[^a-zA-Z0-9]*[:=-]?\s*/i, '');

  // Strip trailing segments after separators like '/' or '-' if followed by tariff, daya, or numbers
  clean = clean.replace(/\s*[/|-]\s*(?:R1|R2|R3|B1|B2|I1|S1|\d{3,5}\s*VA|TARIF|DAYA|IDPEL|\d{10,12}).*$/i, '');

  // Strip trailing keyword phrases
  clean = clean.replace(/\s+(?:TARIF|DAYA|IDPEL|NOMOR|NO\.?\s*METER|KWH|BL\/TH|STROOM|RP|ADMIN|TOTAL).*$/i, '');

  // Remove trailing standalone 10-12 digit numbers (like attached IDPEL)
  clean = clean.replace(/\s+\d{10,12}$/, '');

  // Remove non-name symbols
  clean = clean.replace(/[;:=[\]{}<>*_#~]/g, ' ');

  // Collapse consecutive spaces
  clean = clean.replace(/\s+/g, ' ').trim();

  return clean.toUpperCase();
}

/**
 * Robust multi-strategy extractor for customer name from Indonesian receipts & screenshots.
 */
function extractCustomerNameFromText(rawText: string, lines: string[]): string {
  // Strategy 1: Explicit labels (Same-line and Next-line detection)
  const labelPatterns = [
    /^(?:NAMA\s*PELANGGAN|NAMA\s*PLG|NAMA\s*KONSUMEN|NAMA\s*PENERIMA|NAMA\s*PENGGUNA|NAMA\s*PEMBELI|NAMA\s*AKUN|NAMA\s*TUJUAN|ATAS\s*NAMA|A\s*\/\s*N|CUSTOMER\s*NAME|CUSTOMER|NM\s*PLG|PLG|NAMA)\b[:.\s-=/]*(.*)$/i,
    /^(?:NANA|NAM4|N4MA|MANA)\s*(?:PELANGGAN|PLG)?\b[:.\s-=/]*(.*)$/i,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pattern of labelPatterns) {
      const match = line.match(pattern);
      if (match) {
        const remainder = match[1] || '';
        const cleanedSameLine = cleanCustomerName(remainder);

        // 1A. Candidate is on the same line after label
        if (isValidCustomerName(cleanedSameLine)) {
          return cleanedSameLine;
        }

        // 1B. Label is alone on this line; the name is on the NEXT line
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1].trim();
          const cleanedNextLine = cleanCustomerName(nextLine);
          if (isValidCustomerName(cleanedNextLine)) {
            return cleanedNextLine;
          }
        }
      }
    }
  }

  // Strategy 2: Directly inspect line right after 11-12 digit IDPEL/NO METER and before TARIF/DAYA
  // This is the standard physical and banking layout (e.g. UOB, BCA, DANA) where NAMA label might be faint
  let idpelLineIdx = -1;
  let tarifLineIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (/^\d{11,12}$/.test(l)) {
      idpelLineIdx = i;
    }
    if ((l.toUpperCase().includes('TARIF') || l.toUpperCase().includes('DAYA')) && tarifLineIdx === -1 && idpelLineIdx !== -1) {
      tarifLineIdx = i;
      break;
    }
  }

  if (idpelLineIdx !== -1 && tarifLineIdx > idpelLineIdx) {
    for (let i = idpelLineIdx + 1; i < tarifLineIdx; i++) {
      const candidate = cleanCustomerName(lines[i]);
      if (isValidCustomerName(candidate)) {
        return candidate;
      }
    }
  }

  // Strategy 3: Inline search within lines (e.g. "IDPEL: 537210987654  NAMA: BUDI SANTOSO")
  for (const line of lines) {
    const inlineMatch = line.match(/\b(?:NAMA|PLG|A\/N|CUSTOMER)\b[^a-zA-Z0-9:]*[:=]\s*([a-zA-Z\s.,'/-]{2,40})/i);
    if (inlineMatch) {
      const cleaned = cleanCustomerName(inlineMatch[1]);
      if (isValidCustomerName(cleaned)) {
        return cleaned;
      }
    }
  }

  // Strategy 4: Fallback to any line containing a person name format (e.g. "M. AFIFUDDIN" or 2-3 words)
  for (const line of lines) {
    const cleaned = cleanCustomerName(line);
    if (/^(?:[A-Z]\.\s+)?[A-Z]{3,}(?:\s+[A-Z]{3,})+$/.test(cleaned) || /^[A-Z]\.\s+[A-Z]{3,}$/.test(cleaned)) {
      if (isValidCustomerName(cleaned)) {
        return cleaned;
      }
    }
  }

  return '';
}

/**
 * Extracts the exact PLN token purchase nominal.
 * Ensures round denominations (20k, 50k, 100k, 200k, 500k, 1M) are selected over net tariff/tax figures.
 */
function extractTokenNominal(rawText: string): number {
  const PLN_DENOMS = [5000000, 1000000, 500000, 200000, 100000, 50000, 20000];

  // Check if RP BAYAR or TAGIHAN or PEMBELIAN contains a standard PLN round denomination
  const payMatch = rawText.match(/(?:RP\s*BAYAR|TAGIHAN|JUMLAH\s*TAGIHAN|TOTAL\s*BAYAR|PEMBELIAN|BELI|DENOM)[^0-9]*([1-9][0-9]{0,2}(?:[.,][0-9]{3})+|[0-9]{5,7})/i);
  if (payMatch) {
    const val = parseNumberOnly(payMatch[1]);
    if (PLN_DENOMS.includes(val)) {
      return val;
    }
  }

  // Check if any standard PLN denom appears as "Rp XX.000" in the text
  for (const denom of PLN_DENOMS) {
    const dotted = denom.toLocaleString('id-ID'); // "50.000"
    const regex = new RegExp(`(?:RP|TAGIHAN|BAYAR)[^0-9]*\\b${dotted}\\b`, 'i');
    if (regex.test(rawText)) {
      return denom;
    }
  }

  // Next check standalone standard denoms
  for (const denom of PLN_DENOMS) {
    const dotted = denom.toLocaleString('id-ID');
    if (rawText.includes(dotted)) {
      return denom;
    }
  }

  // General fallback
  const generalPattern = /(?:RP|RUPIAH|BELI|PEMBELIAN|NOMINAL|DENOM)[^0-9]*([1-9][0-9]{0,2}(?:[.,][0-9]{3})+|[0-9]{5,7})/i;
  const generalMatch = rawText.match(generalPattern);
  if (generalMatch) {
    const parsed = parseNumberOnly(generalMatch[1]);
    if (parsed >= 10000 && parsed <= 50000000) {
      return parsed;
    }
  }

  return 50000;
}

/**
 * Smart Parser to extract PLN token & transaction receipt data from raw OCR text.
 */
export function parseReceiptText(
  rawText: string,
  defaultAdmin: number = 5000,
  defaultAgen: string = 'Loket PPOB Athar digital'
): Partial<PlnReceiptData> {
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const fullText = rawText.toUpperCase();

  // 1. Extract 20-digit Stroom / Token
  let token = '';
  const groupedTokenRegex = /\b(\d{4})[-.\s](\d{4})[-.\s](\d{4})[-.\s](\d{4})[-.\s](\d{4})\b/;
  const groupedMatch = rawText.match(groupedTokenRegex);
  if (groupedMatch) {
    token = `${groupedMatch[1]}-${groupedMatch[2]}-${groupedMatch[3]}-${groupedMatch[4]}-${groupedMatch[5]}`;
  } else {
    const continuousTokenRegex = /\b\d{20}\b/;
    const contMatch = rawText.match(continuousTokenRegex);
    if (contMatch) {
      token = formatToken(contMatch[0]);
    } else {
      const tokenHeaderIndex = fullText.search(/(STROOM|TOKEN|STROM)/);
      if (tokenHeaderIndex !== -1) {
        const sub = rawText.substring(tokenHeaderIndex, tokenHeaderIndex + 140);
        const digitsOnly = sub.replace(/\D/g, '');
        if (digitsOnly.length >= 20) {
          token = formatToken(digitsOnly.slice(0, 20));
        }
      }
    }
  }

  // 2. Extract Nomor Meter (11-12 digits)
  let noMeter = '';
  const meterRegex = /(?:NO\s*METER|NOMER\s*METER|METER|MSN|NO\.?\s*MTR)[^0-9:]*[:\s]*([0-9]{11,12})/i;
  const meterMatch = rawText.match(meterRegex);
  if (meterMatch) {
    noMeter = meterMatch[1].trim();
  }

  // 3. Extract Idpel (11-12 digits)
  let idpel = '';
  const idpelRegex = /(?:IDPEL|ID\s*PEL|ID\s*PELANGGAN|IDP|DPE)[^0-9:]*[:\s]*([0-9]{11,12})/i;
  const idpelMatch = rawText.match(idpelRegex);
  if (idpelMatch) {
    idpel = idpelMatch[1].trim();
  }

  // If noMeter or idpel is still missing, search for 11 or 12 digit standalone numbers
  if (!noMeter || !idpel) {
    const standalone11or12 = rawText.match(/\b\d{11,12}\b/g) || [];
    for (const num of standalone11or12) {
      if (!noMeter && num !== idpel) {
        noMeter = num;
      } else if (!idpel && num !== noMeter) {
        idpel = num;
      }
    }
  }

  // 4. Robust Extract Nama Pelanggan using multi-strategy engine
  const namaPelanggan = extractCustomerNameFromText(rawText, lines);

  // 5. Extract Tarif / Daya and normalize (e.g. R1 /000000900 VA -> R1 / 900VA)
  let rawTarifText = '';
  const tarifRegex = /(?:TARIF\s*[/]?\s*DAYA|TARIF\/DAYA|TRF\/DAYA)[^a-zA-Z0-9:]*[:\s]*([A-Z0-9\s/]+(?:VA|WATT)?)/i;
  const tarifMatch = rawText.match(tarifRegex);
  if (tarifMatch) {
    rawTarifText = tarifMatch[1].trim().split('\n')[0].replace(/(RP|JML|KWH).*/i, '').trim();
  } else {
    const directPattern = /(R1M?|R1T?|R2|R3|B1|B2|B3|I1|I2|P1|S1|S2)\s*[/]?\s*0*(\d+)\s*(?:VA)?/i;
    const directMatch = rawText.match(directPattern);
    if (directMatch) {
      rawTarifText = `${directMatch[1]} / ${directMatch[2]}VA`;
    } else {
      const vaOnly = /0*(\d{3,5})\s*VA/i;
      const vaMatch = rawText.match(vaOnly);
      if (vaMatch) {
        rawTarifText = `R1 / ${vaMatch[1]}VA`;
      }
    }
  }

  const tarifDaya = normalizeTarifDaya(rawTarifText);

  // 6. Extract Jumlah kWh
  let kwh = '';
  const kwhRegex = /(?:JML\s*KWH|JUMLAH\s*KWH|MLKWH|KWH)[^0-9:]*[:\s]*([0-9]+[.,]?[0-9]*)/i;
  const kwhMatch = rawText.match(kwhRegex);
  if (kwhMatch) {
    let cleanKwh = kwhMatch[1].trim().replace(',', '.');
    // If OCR missed decimal comma, e.g. "337" -> "33.7"
    if (!cleanKwh.includes('.') && cleanKwh.length === 3 && parseInt(cleanKwh, 10) > 100) {
      cleanKwh = `${cleanKwh.slice(0, 2)}.${cleanKwh.slice(2)}`;
    }
    kwh = cleanKwh;
  }

  // 7. Extract Tanggal / Jam
  let tanggal = '';
  const dateRegex = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})(?:\s+(\d{1,2}:\d{2}(?::\d{2})?))?\b/;
  const dateMatch = rawText.match(dateRegex);
  if (dateMatch) {
    const d = dateMatch[1].replace(/-/g, '/');
    const t = dateMatch[2] || '12:00:00';
    tanggal = `${d} ${t}`;
  } else {
    // Check Indonesian month names (e.g. "04 Nov 2026")
    const indoDateRegex = /\b(\d{1,2})\s*(Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)[a-z]*\s*(\d{4})\b/i;
    const indoMatch = rawText.match(indoDateRegex);
    if (indoMatch) {
      const months: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', mei: '05', jun: '06',
        jul: '07', agu: '08', sep: '09', okt: '10', nov: '11', des: '12'
      };
      const day = indoMatch[1].padStart(2, '0');
      const mStr = indoMatch[2].toLowerCase();
      const month = months[mStr] || '11';
      const year = indoMatch[3];

      // Time match (e.g. "07:38 WIB")
      const timeMatch = rawText.match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*(?:WIB|WITA|WIT)?/i);
      const timeStr = timeMatch ? timeMatch[1] : '12:00:00';
      tanggal = `${day}/${month}/${year} ${timeStr}`;
    } else {
      tanggal = getCurrentDateTimeFormatted();
    }
  }

  // 8. Extract No Referensi (No Ref)
  let noRef = '';
  const refRegex = /(?:NO\.?\s*REF|REF|REFERENSI|NO\s*REFERENSI|ID\s*TRX|KODE\s*REF)[^a-zA-Z0-9:]*[:\s]*([a-zA-Z0-9]+)/i;
  const refMatch = rawText.match(refRegex);
  if (refMatch && refMatch[1].trim().length >= 6) {
    noRef = refMatch[1].trim();
  } else {
    noRef = generateRandomRef();
  }

  // 9. Extract Nominal Token (Denomination e.g. Rp 50.000)
  const nominal = extractTokenNominal(rawText);

  // 10. Admin Bank: ALWAYS DEFAULT TO defaultAdmin (Rp 5.000) as explicitly requested!
  // Do not allow bank's Rp 0 to override the agent's markup.
  const adminBank = defaultAdmin || 5000;

  // Total Bayar: automatically calculated (Nominal + Admin Bank)
  const totalBayar = nominal + adminBank;

  return {
    tanggal,
    noRef,
    noMeter: noMeter || '14235678901',
    idpel: idpel || '537210987654',
    namaPelanggan: namaPelanggan || 'PELANGGAN PLN',
    tarifDaya: tarifDaya || 'R1 / 1300VA',
    kwh: kwh || '33.2',
    token: token || '1839-4920-5819-2049-1193',
    nominal,
    adminBank,
    totalBayar,
    namaAgen: defaultAgen,
  };
}

/**
 * Preset sample receipts for instant 1-tap testing
 */
export const SAMPLE_RECEIPTS: { title: string; subtitle: string; data: Partial<PlnReceiptData> }[] = [
  {
    title: 'Token PLN Rp 50.000',
    subtitle: 'R1M / 900VA - M. Afifuddin (UOB TMRW)',
    data: {
      tanggal: '04/11/2026 07:38:00',
      noRef: '2611043202676749',
      noMeter: '14433568319',
      idpel: '518031830937',
      namaPelanggan: 'M. AFIFUDDIN',
      tarifDaya: 'R1M / 900VA',
      kwh: '33.7',
      token: '1548-4746-3651-5701-9313',
      nominal: 50000,
      adminBank: 5000,
      totalBayar: 55000,
      namaAgen: 'Loket PPOB Athar digital',
    },
  },
  {
    title: 'Token PLN Rp 100.000',
    subtitle: 'R1 / 1300VA - Siti Rahmawati',
    data: {
      tanggal: getCurrentDateTimeFormatted(),
      noRef: generateRandomRef(),
      noMeter: '32091482710',
      idpel: '531928471029',
      namaPelanggan: 'SITI RAHMAWATI',
      tarifDaya: 'R1 / 1300VA',
      kwh: '65.8',
      token: '7182-3904-8192-4710-3849',
      nominal: 100000,
      adminBank: 5000,
      totalBayar: 105000,
      namaAgen: 'Loket PPOB Athar digital',
    },
  },
  {
    title: 'Token PLN Rp 200.000',
    subtitle: 'R1 / 2200VA - Hendra Gunawan',
    data: {
      tanggal: getCurrentDateTimeFormatted(),
      noRef: generateRandomRef(),
      noMeter: '14820938172',
      idpel: '539182740192',
      namaPelanggan: 'HENDRA GUNAWAN',
      tarifDaya: 'R1 / 2200VA',
      kwh: '131.6',
      token: '8291-0492-7481-9302-5819',
      nominal: 200000,
      adminBank: 5000,
      totalBayar: 205000,
      namaAgen: 'Loket PPOB Athar digital',
    },
  },
];
