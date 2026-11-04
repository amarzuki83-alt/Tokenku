import { AppSettings, PlnReceiptData } from '../types/receipt';
import { formatRupiah } from './formatters';

/**
 * Generates a high-resolution, ultra-crisp receipt image on a pure HTML5 Canvas.
 * This guarantees 100% compatibility across all browsers and mobile devices,
 * completely immune to Tailwind v4 oklch CSS parser errors.
 */
export async function renderReceiptToCanvas(
  receipt: PlnReceiptData,
  settings: AppSettings,
  style: 'thermal' | 'modern' = 'thermal'
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tidak dapat membuat konteks canvas 2D');

  const width = 640;
  // Estimate height: header (140) + details (240) + token box (180) + payment (160) + footer (140)
  const height = 980;

  // Render at 2x resolution for Retina / high-DPI clarity
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;
  ctx.scale(scale, scale);

  if (style === 'thermal') {
    renderThermalReceipt(ctx, width, height, receipt, settings);
  } else {
    renderModernReceipt(ctx, width, height, receipt, settings);
  }

  return canvas;
}

/**
 * Draws the realistic Thermal Receipt look (Physical Paper Roll).
 */
function renderThermalReceipt(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  r: PlnReceiptData,
  s: AppSettings
) {
  // Background: off-white receipt paper
  ctx.fillStyle = '#fafaf8';
  ctx.fillRect(0, 0, w, h);

  // Outer subtle border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(16, 16, w - 32, h - 32);

  let y = 52;
  const cx = w / 2;
  const leftX = 40;
  const rightX = w - 40;

  // Header: Nama Loket / Agen (Bold Centered)
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px "Courier New", Courier, monospace';
  ctx.textAlign = 'center';
  ctx.fillText((r.namaAgen || s.namaAgen || 'LOKET PPOB').toUpperCase(), cx, y);
  y += 24;

  // Subheader: Alamat
  ctx.font = '14px "Courier New", Courier, monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText(r.alamatAgen || s.alamatAgen || 'Loket Resmi Pembayaran Listrik PLN', cx, y);
  y += 24;

  // Receipt Title
  ctx.font = 'bold 16px "Courier New", Courier, monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('STRUK PEMBELIAN LISTRIK PRABAYAR', cx, y);
  y += 18;

  // Helper to draw dashed separator
  const drawDashedLine = (posY: number) => {
    ctx.beginPath();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.moveTo(leftX, posY);
    ctx.lineTo(rightX, posY);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  drawDashedLine(y);
  y += 26;

  // Helper to draw 2-column table row
  const drawRow = (label: string, value: string, isBold: boolean = false) => {
    ctx.font = '15px "Courier New", Courier, monospace';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'left';
    ctx.fillText(label, leftX, y);

    ctx.font = isBold
      ? 'bold 15px "Courier New", Courier, monospace'
      : '15px "Courier New", Courier, monospace';
    ctx.fillStyle = isBold ? '#0f172a' : '#334155';
    ctx.textAlign = 'right';
    ctx.fillText(value, rightX, y);
    y += 24;
  };

  // Details
  drawRow('TGL/JAM', r.tanggal);
  drawRow('NO REF', r.noRef);
  drawRow('NO METER', r.noMeter, true);
  drawRow('IDPEL', r.idpel, true);
  drawRow('NAMA', r.namaPelanggan, true);
  drawRow('TARIF/DAYA', r.tarifDaya);
  drawRow('JML KWH', `${r.kwh} kWh`);

  y += 6;
  drawDashedLine(y);
  y += 20;

  // STROOM / TOKEN BOX (Large, High Contrast)
  const boxX = leftX + 10;
  const boxW = w - (leftX + 10) * 2;
  const boxH = 110;

  // Box background & border
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(boxX, y, boxW, boxH);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, y, boxW, boxH);

  // Box title
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 13px "Courier New", Courier, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('STROOM / TOKEN PLN', cx, y + 26);

  // 2-Row Token Display (Big & Bold)
  const tokenParts = r.token.split('-').filter(Boolean);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 26px "Courier New", Courier, monospace';

  if (tokenParts.length === 5) {
    const line1 = `${tokenParts[0]}-${tokenParts[1]}-${tokenParts[2]}`;
    const line2 = `${tokenParts[3]}-${tokenParts[4]}`;
    ctx.fillText(line1, cx, y + 62);
    ctx.fillText(line2, cx, y + 94);
  } else {
    ctx.fillText(r.token, cx, y + 72);
  }

  y += boxH + 20;
  drawDashedLine(y);
  y += 26;

  // Payment Breakdown
  drawRow('RP TOKEN', formatRupiah(r.nominal));
  drawRow('ADMIN BANK', formatRupiah(r.adminBank));

  y += 4;
  // Double solid line for Total
  ctx.beginPath();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.moveTo(leftX, y);
  ctx.lineTo(rightX, y);
  ctx.stroke();
  y += 28;

  // TOTAL BAYAR (Extra Large Bold)
  ctx.font = 'bold 18px "Courier New", Courier, monospace';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL BAYAR', leftX, y);

  ctx.font = 'bold 22px "Courier New", Courier, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(formatRupiah(r.totalBayar), rightX, y);

  y += 18;
  drawDashedLine(y);
  y += 34;

  // Footer note
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '13px "Courier New", Courier, monospace';
  const footerLines = (
    s.catatanFooter ||
    'Terima kasih atas kepercayaan Anda.\nStruk ini merupakan bukti pembayaran yang sah.'
  ).split('\n');
  for (const line of footerLines) {
    ctx.fillText(line.trim(), cx, y);
    y += 20;
  }

  // App Watermark
  y += 10;
  ctx.font = '11px "Courier New", Courier, monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Aplikasi tokenku PWA - www.tokenku.app', cx, y);
}

/**
 * Draws the Modern Digital Card look (Light Blue & Navy).
 */
function renderModernReceipt(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  r: PlnReceiptData,
  s: AppSettings
) {
  // Rounded card background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Header Banner Gradient
  const grad = ctx.createLinearGradient(0, 0, w, 140);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(1, '#0369a1');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, 140);

  // Header text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(r.namaAgen || s.namaAgen || 'LOKET RESMI PLN', w / 2, 56);

  ctx.fillStyle = '#e0f2fe';
  ctx.font = '14px system-ui, -apple-system, sans-serif';
  ctx.fillText('Struk Pembelian Listrik Prabayar', w / 2, 84);
  ctx.fillText(r.tanggal, w / 2, 108);

  let y = 180;
  const leftX = 48;
  const rightX = w - 48;

  // Table rows
  const drawModernRow = (label: string, value: string, isBold: boolean = false) => {
    ctx.font = '15px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText(label, leftX, y);

    ctx.font = isBold
      ? 'bold 16px system-ui, -apple-system, sans-serif'
      : '15px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = isBold ? '#0f172a' : '#334155';
    ctx.textAlign = 'right';
    ctx.fillText(value, rightX, y);
    y += 28;
  };

  drawModernRow('No. Referensi', r.noRef);
  drawModernRow('No. Meter', r.noMeter, true);
  drawModernRow('IDPEL', r.idpel, true);
  drawModernRow('Nama Pelanggan', r.namaPelanggan, true);
  drawModernRow('Tarif / Daya', r.tarifDaya);
  drawModernRow('Jumlah kWh', `${r.kwh} kWh`);

  y += 12;

  // Big Glowing Token Box
  const boxX = leftX;
  const boxW = w - leftX * 2;
  const boxH = 126;

  const boxGrad = ctx.createLinearGradient(boxX, y, boxX + boxW, y + boxH);
  boxGrad.addColorStop(0, '#0284c7');
  boxGrad.addColorStop(0.5, '#0369a1');
  boxGrad.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = boxGrad;
  ctx.beginPath();
  ctx.roundRect(boxX, y, boxW, boxH, 16);
  ctx.fill();

  ctx.fillStyle = '#bae6fd';
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NOMOR STROOM / TOKEN PLN', w / 2, y + 30);

  const tokenParts = r.token.split('-').filter(Boolean);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 28px "Courier New", Courier, monospace';

  if (tokenParts.length === 5) {
    const l1 = `${tokenParts[0]}-${tokenParts[1]}-${tokenParts[2]}`;
    const l2 = `${tokenParts[3]}-${tokenParts[4]}`;
    ctx.fillText(l1, w / 2, y + 68);
    ctx.fillText(l2, w / 2, y + 104);
  } else {
    ctx.fillText(r.token, w / 2, y + 78);
  }

  y += boxH + 34;

  drawModernRow('Nominal Token', formatRupiah(r.nominal));
  drawModernRow('Admin Bank', formatRupiah(r.adminBank));

  y += 8;
  // Total Highlight Box
  ctx.fillStyle = '#f0f9ff';
  ctx.beginPath();
  ctx.roundRect(leftX, y, boxW, 58, 12);
  ctx.fill();
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#0369a1';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Total Pembayaran', leftX + 16, y + 36);

  ctx.fillStyle = '#0c4a6e';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(formatRupiah(r.totalBayar), rightX - 16, y + 36);

  y += 88;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  ctx.fillText(s.catatanFooter || 'Simpan struk ini sebagai bukti pembayaran yang sah.', w / 2, y);
}
