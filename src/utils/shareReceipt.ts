import html2canvas from 'html2canvas';
import { PlnReceiptData } from '../types/receipt';

/**
 * Converts a DOM element (the receipt card) to a high-resolution PNG Blob using html2canvas.
 */
export async function generateReceiptImageBlob(element: HTMLElement): Promise<Blob> {
  const canvas = await html2canvas(element, {
    scale: 3, // High-DPI for crisp text and thermal barcode/token
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Gagal menghasilkan gambar dari struk'));
      }
    }, 'image/png', 1.0);
  });
}

/**
 * Downloads the receipt image directly as PNG.
 */
export async function downloadReceiptImage(element: HTMLElement, filename: string = 'struk-token-pln.png'): Promise<void> {
  const blob = await generateReceiptImageBlob(element);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Shares the receipt image directly to WhatsApp, Telegram, Instagram, etc. via Web Share API.
 * Falls back to download if navigator.share with files is not supported.
 */
export async function shareReceiptImage(
  element: HTMLElement,
  receiptData: PlnReceiptData,
  filename: string = 'struk-token-pln.png'
): Promise<{ shared: boolean; method: 'native-share' | 'download-fallback' }> {
  const blob = await generateReceiptImageBlob(element);
  const file = new File([blob], filename, { type: 'image/png' });

  const shareText = `Struk Token Listrik PLN - ${receiptData.namaPelanggan}\nToken: ${receiptData.token}\nTotal: Rp ${receiptData.totalBayar.toLocaleString('id-ID')}\nLoket: ${receiptData.namaAgen}`;

  if (
    typeof navigator !== 'undefined' &&
    navigator.share &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        title: 'Struk Token Listrik PLN',
        text: shareText,
        files: [file],
      });
      return { shared: true, method: 'native-share' };
    } catch (err: unknown) {
      if ((err as Error)?.name === 'AbortError') {
        return { shared: false, method: 'native-share' };
      }
      console.warn('Share cancelled or failed, falling back to download:', err);
    }
  }

  // Fallback to direct download
  await downloadReceiptImage(element, filename);
  return { shared: true, method: 'download-fallback' };
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
Tarif/Daya : ${receipt.tarifDaya}
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
