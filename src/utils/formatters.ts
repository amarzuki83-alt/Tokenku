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
