export interface PlnReceiptData {
  id: string;
  tanggal: string;
  noRef: string;
  noMeter: string;
  idpel: string;
  namaPelanggan: string;
  tarifDaya: string;
  kwh: string;
  token: string;
  nominal: number;
  adminBank: number;
  totalBayar: number;
  namaAgen: string;
  alamatAgen?: string;
  catatanFooter?: string;
  tipeTransaksi?: 'PLN_PRABAYAR' | 'TRANSFER_DANA' | 'TAGIHAN_LISTRIK';
  createdAt: number;
}

export interface AppSettings {
  namaAgen: string;
  alamatAgen: string;
  catatanFooter: string;
  defaultAdminBank: number;
  printerWidth: '58mm' | '80mm';
  savedPrinterName: string;
  savedPrinterId: string;
  themeStyle: 'thermal' | 'modern';
}

export const DEFAULT_SETTINGS: AppSettings = {
  namaAgen: 'Loket PPOB Athar digital',
  alamatAgen: 'Loket Resmi Pembayaran Listrik PLN',
  catatanFooter: 'Terima kasih atas kepercayaan Anda.\nStruk ini merupakan bukti pembayaran yang sah.',
  defaultAdminBank: 5000,
  printerWidth: '58mm',
  savedPrinterName: '',
  savedPrinterId: '',
  themeStyle: 'thermal',
};
