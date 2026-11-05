import { AppSettings, PlnReceiptData } from '../types/receipt';
import { renderReceiptToCanvas } from './receiptCanvas';
import { normalizeTarifDaya } from './formatters';

/**
 * Generates an ultra-crisp PNG Blob of the receipt.
 * Uses native HTML5 Canvas drawing, guaranteed 100% error-free
 * without any Tailwind CSS v4 oklch incompatibility issues.
 */
export async function generateReceiptImageBlob(
  receipt: PlnReceiptData,
  settings: AppSettings,
  style: 'thermal' | 'modern' = 'thermal'
): Promise<Blob> {
  const canvas = await renderReceiptToCanvas(receipt, settings, style);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Gagal menghasilkan blob gambar'));
        }
      },
      'image/png',
      1.0
    );
  });
}

/**
 * Downloads the receipt image directly as PNG.
 * Handles both Android Chrome, iOS Safari, and desktop environments.
 */
export async function downloadReceiptImage(
  receipt: PlnReceiptData,
  settings: AppSettings,
  style: 'thermal' | 'modern' = 'thermal',
  filename?: string
): Promise<void> {
  const safeFilename =
    filename ||
    `struk-pln-${receipt.namaPelanggan.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}-${Date.now().toString().slice(-4)}.png`;

  const blob = await generateReceiptImageBlob(receipt, settings, style);
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = safeFilename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();

  // Cleanup after a delay so mobile browsers have time to process download stream
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 4000);
}

/**
 * Shares the receipt image directly to WhatsApp, Telegram, etc. via Web Share API.
 * If file sharing is not supported by the browser, cleanly falls back to downloading the PNG.
 */
export async function shareReceiptImage(
  receipt: PlnReceiptData,
  settings: AppSettings,
  style: 'thermal' | 'modern' = 'thermal',
  filename?: string
): Promise<{ shared: boolean; method: 'native-share' | 'download-fallback'; message?: string }> {
  const safeFilename =
    filename ||
    `struk-pln-${receipt.namaPelanggan.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.png`;

  const blob = await generateReceiptImageBlob(receipt, settings, style);
  const file = new File([blob], safeFilename, { type: 'image/png' });

  const shareText = `*STRUK PEMBELIAN LISTRIK PRABAYAR*\nLoket: ${receipt.namaAgen}\nNama: ${receipt.namaPelanggan}\nNo Meter: ${receipt.noMeter}\nToken: ${receipt.token}\nTotal: Rp ${receipt.totalBayar.toLocaleString('id-ID')}`;

  // Check if Web Share API with files is supported
  const canShareFiles =
    typeof navigator !== 'undefined' &&
    !!navigator.share &&
    !!navigator.canShare &&
    navigator.canShare({ files: [file] });

  if (canShareFiles) {
    try {
      // Note: Passing title and files only provides greatest compatibility across Android WhatsApp/Telegram
      await navigator.share({
        title: 'Struk Token Listrik PLN',
        text: shareText,
        files: [file],
      });
      return { shared: true, method: 'native-share' };
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        // User voluntarily closed/cancelled the share picker
        return { shared: false, method: 'native-share' };
      }
      console.warn('Native share threw error, falling back to download:', err);
    }
  }

  // Fallback: download PNG directly to device
  await downloadReceiptImage(receipt, settings, style, safeFilename);
  return {
    shared: true,
    method: 'download-fallback',
    message: 'Gambar struk berhasil diunduh ke galeri HP.',
  };
}

/**
 * Copies formatted text summary of the receipt for easy WhatsApp/chat pasting.
 */
export async function copyReceiptText(receipt: PlnReceiptData): Promise<boolean> {
  const text = `*STRUK PEMBELIAN LISTRIK PRABAYAR*
--------------------------------
Loket      : ${receipt.namaAgen}
Tgl/Jam    : ${receipt.tanggal}
No Ref     : ${receipt.noRef}
No Meter   : ${receipt.noMeter}
Idpel      : ${receipt.idpel}
Nama       : ${receipt.namaPelanggan}
Tarif/Daya : ${normalizeTarifDaya(receipt.tarifDaya)}
Jml kWh    : ${receipt.kwh} kWh
--------------------------------
*STROOM / TOKEN PLN:*
*${receipt.token}*
--------------------------------
Beli Token : Rp ${receipt.nominal.toLocaleString('id-ID')}
Admin Bank : Rp ${receipt.adminBank.toLocaleString('id-ID')}
*TOTAL     : Rp ${receipt.totalBayar.toLocaleString('id-ID')}*
--------------------------------
Simpan struk ini sebagai bukti pembayaran sah.`;

  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
