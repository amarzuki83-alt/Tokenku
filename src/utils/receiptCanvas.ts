import { AppSettings, PlnReceiptData } from '../types/receipt';
import { formatRupiah, normalizeTarifDaya } from './formatters';

/**
 * Generates a high-resolution, compact receipt image on a pure HTML5 Canvas.
 * Proportionally designed with narrow thermal width (58mm cash register roll look)
 * so left and right margins are compact and balanced, eliminating excessive empty space.
 */
export async function renderReceiptToCanvas(
  receipt: PlnReceiptData,
  settings: AppSettings,
  style: 'thermal' | 'modern' = 'thermal'
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Tidak dapat membuat konteks canvas 2D');

  // Narrow, compact receipt proportions (slender thermal roll)
  const width = 380;
  const height = 820;

  // Render at 2x resolution for Retina / high-DPI clarity (760px x 1640px)
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
 * Narrowed to 380px for authentic POS cash register receipt proportions.
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
  ctx.lineWidth = 1.2;
  ctx.strokeRect(10, 10, w - 20, h - 20);

  let y = 42;
  const cx = w / 2;
  // Narrow margins for authentic compact receipt slip
  const leftX = 22;
  const rightX = w - 22;

  // Header: Nama Loket / Agen (Bold Centered)
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 18px "Courier New", Courier, monospace';
  ctx.textAlign = 'center';
  ctx.fillText((r.namaAgen || s.namaAgen || 'LOKET PPOB').toUpperCase(), cx, y);
  y += 22;

  // Subheader: Alamat Loket
  ctx.font = '12px "Courier New", Courier, monospace';
  ctx.fillStyle = '#64748b';
  ctx.fillText(r.alamatAgen || s.alamatAgen || 'Loket Resmi Pembayaran Listrik PLN', cx, y);
  y += 20;

  // Title: Struk Pembelian
  ctx.font = 'bold 14px "Courier New", Courier, monospace';
  ctx.fillStyle = '#0f172a';
  ctx.fillText('STRUK PEMBELIAN LISTRIK PRABAYAR', cx, y);
  y += 16;

  // Helper to draw dashed separator
  const drawDashedLine = (posY: number) => {
    ctx.beginPath();
    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.moveTo(leftX, posY);
    ctx.lineTo(rightX, posY);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  drawDashedLine(y);
  y += 22;

  // Helper to draw 2-column table row with compact spacing
  const drawRow = (label: string, value: string, isBold: boolean = false) => {
    ctx.font = '13px "Courier New", Courier, monospace';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'left';
    ctx.fillText(label, leftX, y);

    ctx.font = isBold
      ? 'bold 13px "Courier New", Courier, monospace'
      : '13px "Courier New", Courier, monospace';
    ctx.fillStyle = isBold ? '#0f172a' : '#334155';
    ctx.textAlign = 'right';
    ctx.fillText(value, rightX, y);
    y += 21;
  };

  // Details
  drawRow('TGL/JAM', r.tanggal);
  drawRow('NO REF', r.noRef);
  drawRow('NO METER', r.noMeter, true);
  drawRow('IDPEL', r.idpel, true);
  drawRow('NAMA', r.namaPelanggan, true);
  drawRow('TARIF/DAYA', normalizeTarifDaya(r.tarifDaya));
  drawRow('JML KWH', `${r.kwh} kWh`);

  y += 4;
  drawDashedLine(y);
  y += 16;

  // STROOM / TOKEN BOX (Large, High Contrast, Compact side margins)
  const boxX = leftX;
  const boxW = w - leftX * 2;
  const boxH = 96;

  // Box background & border
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(boxX, y, boxW, boxH);
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.8;
  ctx.strokeRect(boxX, y, boxW, boxH);

  // Box title
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 12px "Courier New", Courier, monospace';
  ctx.textAlign = 'center';
  ctx.fillText('STROOM / TOKEN PLN', cx, y + 22);

  // 2-Row Token Display (Big & Bold)
  const tokenParts = r.token.split('-').filter(Boolean);
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 22px "Courier New", Courier, monospace';

  if (tokenParts.length === 5) {
    const line1 = `${tokenParts[0]}-${tokenParts[1]}-${tokenParts[2]}`;
    const line2 = `${tokenParts[3]}-${tokenParts[4]}`;
    ctx.fillText(line1, cx, y + 54);
    ctx.fillText(line2, cx, y + 82);
  } else {
    ctx.fillText(r.token, cx, y + 62);
  }

  y += boxH + 16;
  drawDashedLine(y);
  y += 22;

  // Payment Breakdown
  drawRow('RP TOKEN', formatRupiah(r.nominal));
  drawRow('ADMIN BANK', formatRupiah(r.adminBank));

  y += 2;
  // Double solid line for Total
  ctx.beginPath();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 1.8;
  ctx.moveTo(leftX, y);
  ctx.lineTo(rightX, y);
  ctx.stroke();
  y += 24;

  // TOTAL BAYAR (Extra Large Bold)
  ctx.font = 'bold 15px "Courier New", Courier, monospace';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.fillText('TOTAL BAYAR', leftX, y);

  ctx.font = 'bold 19px "Courier New", Courier, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(formatRupiah(r.totalBayar), rightX, y);

  y += 14;
  drawDashedLine(y);
  y += 26;

  // Footer note
  ctx.textAlign = 'center';
  ctx.fillStyle = '#64748b';
  ctx.font = '11px "Courier New", Courier, monospace';
  const footerLines = (
    s.catatanFooter ||
    'Terima kasih atas kepercayaan Anda.\nStruk ini merupakan bukti pembayaran yang sah.'
  ).split('\n');
  for (const line of footerLines) {
    ctx.fillText(line.trim(), cx, y);
    y += 17;
  }

  // App Watermark
  y += 8;
  ctx.font = '10px "Courier New", Courier, monospace';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Aplikasi tokenku PWA', cx, y);
}

/**
 * Draws the Modern Digital Card look (Light Blue & Navy).
 * Narrowed to 380px for a clean, compact digital voucher look.
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

  // Outer border
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(8, 8, w - 16, h - 16);

  // Header Banner Gradient
  const grad = ctx.createLinearGradient(0, 0, w, 120);
  grad.addColorStop(0, '#0284c7');
  grad.addColorStop(1, '#0369a1');
  ctx.fillStyle = grad;
  ctx.fillRect(8, 8, w - 16, 116);

  // Header text
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(r.namaAgen || s.namaAgen || 'LOKET RESMI PLN', w / 2, 48);

  ctx.fillStyle = '#e0f2fe';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  ctx.fillText('Struk Pembelian Listrik Prabayar', w / 2, 72);
  ctx.fillText(r.tanggal, w / 2, 94);

  let y = 154;
  const leftX = 26;
  const rightX = w - 26;

  // Table rows
  const drawModernRow = (label: string, value: string, isBold: boolean = false) => {
    ctx.font = '13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'left';
    ctx.fillText(label, leftX, y);

    ctx.font = isBold
      ? 'bold 14px system-ui, -apple-system, sans-serif'
      : '13px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = isBold ? '#0f172a' : '#334155';
    ctx.textAlign = 'right';
    ctx.fillText(value, rightX, y);
    y += 24;
  };

  drawModernRow('No. Referensi', r.noRef);
  drawModernRow('No. Meter', r.noMeter, true);
  drawModernRow('IDPEL', r.idpel, true);
  drawModernRow('Nama Pelanggan', r.namaPelanggan, true);
  drawModernRow('Tarif / Daya', normalizeTarifDaya(r.tarifDaya));
  drawModernRow('Jumlah kWh', `${r.kwh} kWh`);

  y += 8;

  // Big Glowing Token Box
  const boxX = leftX;
  const boxW = w - leftX * 2;
  const boxH = 106;

  const boxGrad = ctx.createLinearGradient(boxX, y, boxX + boxW, y + boxH);
  boxGrad.addColorStop(0, '#0284c7');
  boxGrad.addColorStop(0.5, '#0369a1');
  boxGrad.addColorStop(1, '#1e3a8a');
  ctx.fillStyle = boxGrad;
  ctx.beginPath();
  ctx.roundRect(boxX, y, boxW, boxH, 14);
  ctx.fill();

  ctx.fillStyle = '#bae6fd';
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NOMOR STROOM / TOKEN PLN', w / 2, y + 24);

  const tokenParts = r.token.split('-').filter(Boolean);
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 23px "Courier New", Courier, monospace';

  if (tokenParts.length === 5) {
    const l1 = `${tokenParts[0]}-${tokenParts[1]}-${tokenParts[2]}`;
    const l2 = `${tokenParts[3]}-${tokenParts[4]}`;
    ctx.fillText(l1, w / 2, y + 58);
    ctx.fillText(l2, w / 2, y + 88);
  } else {
    ctx.fillText(r.token, w / 2, y + 68);
  }

  y += boxH + 26;

  drawModernRow('Nominal Token', formatRupiah(r.nominal));
  drawModernRow('Admin Bank', formatRupiah(r.adminBank));

  y += 6;
  // Total Highlight Box
  ctx.fillStyle = '#f0f9ff';
  ctx.beginPath();
  ctx.roundRect(leftX, y, boxW, 50, 10);
  ctx.fill();
  ctx.strokeStyle = '#bae6fd';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.fillStyle = '#0369a1';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Total Pembayaran', leftX + 14, y + 31);

  ctx.fillStyle = '#0c4a6e';
  ctx.font = 'bold 19px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(formatRupiah(r.totalBayar), rightX - 14, y + 31);

  y += 74;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText(s.catatanFooter || 'Simpan struk ini sebagai bukti pembayaran yang sah.', w / 2, y);
}
