export function formatRupiah(amount: number | string | undefined | null): string {
  const num = typeof amount === 'string' ? parseInt(amount.replace(/\D/g, '') || '0', 10) : (amount || 0);
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(num);
}

export function parseNumberOnly(val: string | number): number {
  if (typeof val === 'number') return val;
  return parseInt(val.replace(/\D/g, '') || '0', 10);
}

export function formatToken(token: string): string {
  // Strip non-digits
  const clean = token.replace(/\D/g, '').slice(0, 20);
  if (clean.length === 0) return '';
  // Format as groups of 4 digits: XXXX-XXXX-XXXX-XXXX-XXXX
  const parts: string[] = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.slice(i, i + 4));
  }
  return parts.join('-');
}

export function generateRandomRef(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `PLN${year}${month}${day}${hours}${mins}${rand}`;
}

export function getCurrentDateTimeFormatted(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Normalizes Tarif / Daya to standard Indonesian PLN format:
 * Strips leading zeros from power numbers (e.g. 000000900 -> 900)
 * Formats as: <TARIF> / <DAYA>VA (e.g. "R1 / 900VA", "R1M / 900VA", "R1 / 1300VA")
 */
export function normalizeTarifDaya(raw: string | undefined | null): string {
  if (!raw) return 'R1 / 900VA';
  const str = raw.toUpperCase().trim();

  // 1. Extract tarif code: R1M, R1T, R1, R2, R3, B1, B2, B3, I1, I2, I3, P1, P2, P3, S1, S2, S3
  const tarifMatch = str.match(/\b(R1M|R1T|R1|R2|R3|B1|B2|B3|I1|I2|I3|P1|P2|P3|S1|S2|S3)\b/i);
  let tarif = 'R1';
  if (tarifMatch) {
    tarif = tarifMatch[1].toUpperCase();
  } else {
    const fallbackTarif = str.match(/^([A-Z][0-9][A-Z]?)/i);
    if (fallbackTarif) {
      tarif = fallbackTarif[1].toUpperCase();
    }
  }

  // 2. Extract daya number, stripping leading zeros (e.g. 000000900 -> 900)
  let dayaNum = '';

  // Case A: Look after slash '/' if exists
  if (str.includes('/')) {
    const afterSlash = str.substring(str.indexOf('/') + 1);
    const m = afterSlash.match(/0*([1-9]\d{1,5})/);
    if (m) {
      dayaNum = m[1];
    }
  }

  // Case B: Look for number followed by VA or WATT
  if (!dayaNum) {
    const vaMatch = str.match(/0*([1-9]\d{1,5})\s*(?:VA|WATT)/i);
    if (vaMatch) {
      dayaNum = vaMatch[1];
    }
  }

  // Case C: Look for any multi-digit number (3 to 6 digits, e.g. 450, 900, 1300, 2200, 3500)
  if (!dayaNum) {
    const matches = str.match(/0*([1-9]\d{2,5})/g);
    if (matches && matches.length > 0) {
      const last = matches[matches.length - 1];
      const clean = last.replace(/^0+/, '');
      if (clean) dayaNum = clean;
    }
  }

  if (!dayaNum) {
    dayaNum = '900';
  }

  return `${tarif} / ${dayaNum}VA`;
}

