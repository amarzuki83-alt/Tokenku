import React, { useRef, useState } from 'react';
import {
  Printer,
  Download,
  Share2,
  Copy,
  Edit3,
  Check,
  Zap,
  Sparkles,
  FileCheck2,
  Settings,
  Layers,
  ArrowLeft,
} from 'lucide-react';
import { AppSettings, PlnReceiptData } from '../types/receipt';
import { formatRupiah } from '../utils/formatters';
import { copyReceiptText, downloadReceiptImage, shareReceiptImage } from '../utils/shareReceipt';
import { bluetoothPrinter } from '../utils/bluetoothPrinter';

interface ReceiptPreviewProps {
  receipt: PlnReceiptData;
  settings: AppSettings;
  onEditField: (field: keyof PlnReceiptData) => void;
  onBackToScan: () => void;
  onOpenSettings: () => void;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({
  receipt,
  settings,
  onEditField,
  onBackToScan,
  onOpenSettings,
}) => {
  const receiptCardRef = useRef<HTMLDivElement>(null);
  const [viewStyle, setViewStyle] = useState<'thermal' | 'modern'>(settings.themeStyle || 'thermal');
  const [copiedToken, setCopiedToken] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyTokenOnly = async () => {
    try {
      await navigator.clipboard.writeText(receipt.token);
      setCopiedToken(true);
      showToast('Nomor Token PLN disalin ke clipboard!');
      setTimeout(() => setCopiedToken(false), 2000);
    } catch {
      showToast('Gagal menyalin token.');
    }
  };

  const handleCopyFullText = async () => {
    const success = await copyReceiptText(receipt);
    if (success) {
      showToast('Teks struk lengkap berhasil disalin untuk WhatsApp!');
    }
  };

  const handleDownloadImage = async () => {
    try {
      setIsExporting(true);
      await downloadReceiptImage(receipt, settings, viewStyle);
      showToast('Gambar struk PNG berhasil diunduh!');
    } catch (err) {
      console.error(err);
      showToast('Gagal mengunduh gambar struk.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleShareImage = async () => {
    try {
      setIsExporting(true);
      const result = await shareReceiptImage(receipt, settings, viewStyle);
      if (result.method === 'download-fallback') {
        showToast(result.message || 'Gambar struk berhasil diunduh ke HP.');
      } else if (result.shared) {
        showToast('Membuka menu bagikan...');
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal membagikan struk.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleBluetoothPrint = async () => {
    setIsPrinting(true);
    try {
      await bluetoothPrinter.print(receipt, settings);
      showToast('Berhasil mengirim struk ke printer Bluetooth!');
    } catch (err: unknown) {
      const msg = (err as Error)?.message || 'Gagal mencetak via Bluetooth.';
      showToast(msg);
    } finally {
      setIsPrinting(false);
    }
  };

  const handleBrowserPrint = () => {
    window.print();
  };

  // Helper row component for Tap-to-Edit
  const EditableRow: React.FC<{
    label: string;
    value: string | number;
    field: keyof PlnReceiptData;
    isBold?: boolean;
    customRender?: React.ReactNode;
  }> = ({ label, value, field, isBold, customRender }) => (
    <div
      onClick={() => onEditField(field)}
      className="group relative flex items-baseline justify-between py-1.5 px-2 -mx-2 rounded-lg hover:bg-sky-500/10 cursor-pointer transition select-none"
      title={`Ketuk untuk mengedit ${label}`}
    >
      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
        <span>{label}</span>
      </span>
      <div className="flex items-center gap-1.5 text-right">
        {customRender || (
          <span className={`text-xs font-mono ${isBold ? 'font-extrabold text-slate-900' : 'text-slate-800'}`}>
            {value}
          </span>
        )}
        <Edit3 className="w-3 h-3 text-sky-400 opacity-0 group-hover:opacity-100 transition shrink-0" />
      </div>
    </div>
  );

  return (
    <div className="space-y-4 pb-20">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-xl flex items-center gap-2 border border-slate-700 animate-in fade-in slide-in-from-top duration-200">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Bar Navigation & Style Toggle */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToScan}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-sky-700 font-semibold py-1 px-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs hover:bg-slate-50 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Pindai Ulang</span>
        </button>

        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-sky-100 shadow-2xs">
          <button
            onClick={() => setViewStyle('thermal')}
            className={`text-xs px-2.5 py-1 rounded-xl font-medium transition ${
              viewStyle === 'thermal'
                ? 'bg-sky-600 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kertas Kasir
          </button>
          <button
            onClick={() => setViewStyle('modern')}
            className={`text-xs px-2.5 py-1 rounded-xl font-medium transition ${
              viewStyle === 'modern'
                ? 'bg-sky-600 text-white font-semibold shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kartu Digital
          </button>
        </div>
      </div>

      {/* Interactive Helper Banner */}
      <div className="flex items-center justify-between bg-sky-50/80 border border-sky-200/80 px-3.5 py-2 rounded-2xl text-[11px] text-sky-800">
        <div className="flex items-center gap-1.5">
          <Edit3 className="w-3.5 h-3.5 text-sky-600 shrink-0" />
          <span>
            <strong>Tap-to-Edit:</strong> Sentuh bagian mana saja pada struk untuk langsung mengedit nilainya.
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RECEIPT VIEW CONTAINER (Capturable by html2canvas)        */}
      {/* ========================================================= */}
      <div className="flex justify-center">
        {viewStyle === 'thermal' ? (
          /* THERMAL RECEIPT STYLE (PHYSICAL PAPER ROLL LOOK) */
          <div
            ref={receiptCardRef}
            className="thermal-receipt-printable w-full max-w-[340px] bg-[#fbfbf8] border border-slate-300 shadow-md rounded-lg p-5 font-receipt text-slate-900 relative transition"
            style={{ minHeight: '520px' }}
          >
            {/* Top Paper Perforation Line simulation */}
            <div className="border-b-2 border-dashed border-slate-300 pb-3 mb-3 text-center">
              <div
                onClick={() => onEditField('namaAgen')}
                className="cursor-pointer group hover:bg-sky-500/10 p-1 rounded-md transition"
                title="Ketuk untuk ubah nama loket"
              >
                <h3 className="font-extrabold text-sm uppercase tracking-wide">
                  {receipt.namaAgen || settings.namaAgen}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {receipt.alamatAgen || settings.alamatAgen}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-200">
                <span className="text-[11px] font-black tracking-wider uppercase block">
                  STRUK PEMBELIAN LISTRIK PRABAYAR
                </span>
              </div>
            </div>

            {/* Details Table */}
            <div className="space-y-0.5 text-xs border-b border-dashed border-slate-300 pb-3 mb-3">
              <EditableRow label="TGL/JAM" value={receipt.tanggal} field="tanggal" />
              <EditableRow label="NO REF" value={receipt.noRef} field="noRef" />
              <EditableRow label="NO METER" value={receipt.noMeter} field="noMeter" isBold />
              <EditableRow label="IDPEL" value={receipt.idpel} field="idpel" isBold />
              <EditableRow label="NAMA" value={receipt.namaPelanggan} field="namaPelanggan" isBold />
              <EditableRow label="TARIF/DAYA" value={receipt.tarifDaya} field="tarifDaya" />
              <EditableRow label="JML KWH" value={`${receipt.kwh} kWh`} field="kwh" />
            </div>

            {/* STROOM / TOKEN (CENTERPIECE OF RECEIPT - EXTRA LARGE FONT) */}
            {(() => {
              const tokenParts = receipt.token.split('-').filter(Boolean);
              const isFormatted = tokenParts.length === 5;
              return (
                <div
                  onClick={() => onEditField('token')}
                  className="group cursor-pointer bg-slate-100 hover:bg-sky-50 border-2 border-slate-900 hover:border-sky-600 rounded-xl p-3.5 text-center transition my-3.5 relative shadow-xs"
                  title="Ketuk untuk mengedit Token"
                >
                  <div className="flex items-center justify-center gap-1.5 mb-1.5 text-[11px] font-black text-slate-800 uppercase tracking-widest">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>STROOM / TOKEN PLN</span>
                  </div>

                  {/* Extra Large Bold Token Display */}
                  {isFormatted ? (
                    <div className="font-mono font-black text-2xl xs:text-3xl tracking-widest text-slate-950 py-1.5 select-all flex flex-col items-center justify-center gap-0.5 leading-tight">
                      <span>{tokenParts[0]}-{tokenParts[1]}-{tokenParts[2]}</span>
                      <span>{tokenParts[3]}-{tokenParts[4]}</span>
                    </div>
                  ) : (
                    <div className="font-mono font-black text-2xl xs:text-3xl tracking-wider text-slate-950 py-2 break-all select-all">
                      {receipt.token}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-1 text-[11px] text-sky-700 font-bold mt-1.5">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ketuk untuk koreksi token</span>
                  </div>
                </div>
              );
            })()}

            {/* Quick 1-tap Copy Token Floating button */}
            <div className="flex justify-end no-print mb-3">
              <button
                type="button"
                onClick={handleCopyTokenOnly}
                className="inline-flex items-center gap-1 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-300 text-[10px] font-bold px-2 py-1 rounded-md shadow-2xs transition"
              >
                {copiedToken ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Salin Token Saja</span>
                  </>
                )}
              </button>
            </div>

            {/* Payment Summary */}
            <div className="border-t border-dashed border-slate-300 pt-2 space-y-0.5 text-xs">
              <EditableRow label="RP TOKEN" value={formatRupiah(receipt.nominal)} field="nominal" />
              <EditableRow label="ADMIN BANK" value={formatRupiah(receipt.adminBank)} field="adminBank" />

              <div className="border-t-2 border-slate-800 my-1" />

              <div
                onClick={() => onEditField('nominal')}
                className="group flex items-baseline justify-between py-1 px-2 -mx-2 rounded-lg hover:bg-sky-500/10 cursor-pointer font-black text-sm text-slate-950"
              >
                <span>TOTAL BAYAR</span>
                <span className="text-base text-right">{formatRupiah(receipt.totalBayar)}</span>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="mt-4 pt-3 border-t border-dashed border-slate-300 text-center text-[10px] text-slate-500 leading-relaxed">
              <p className="whitespace-pre-line font-mono">
                {settings.catatanFooter || 'Terima kasih atas kepercayaan Anda.\nStruk ini bukti pembayaran yang sah.'}
              </p>
            </div>

            {/* Serrated edge pattern at bottom of receipt */}
            <div className="absolute -bottom-2 left-0 right-0 h-2 bg-radial from-slate-200 to-transparent bg-repeat-x opacity-40" />
          </div>
        ) : (
          /* MODERN DIGITAL CARD STYLE (LIGHT BLUE & NAVY) */
          <div
            ref={receiptCardRef}
            className="w-full max-w-[360px] bg-white border border-sky-100 shadow-xl rounded-3xl p-6 text-slate-800 relative overflow-hidden transition"
          >
            {/* Background Decorative Accent */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-sky-200/50 via-cyan-100/30 to-transparent rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between border-b border-sky-100 pb-4 mb-4">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full mb-1">
                  <Zap className="w-3 h-3 text-sky-600 fill-sky-600" />
                  Listrik Prabayar
                </span>
                <h3
                  onClick={() => onEditField('namaAgen')}
                  className="font-extrabold text-base text-slate-900 cursor-pointer hover:text-sky-600 transition"
                >
                  {receipt.namaAgen || settings.namaAgen}
                </h3>
                <p className="text-[11px] text-slate-500">{receipt.tanggal}</p>
              </div>

              <div className="w-10 h-10 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600 shrink-0">
                <FileCheck2 className="w-5 h-5" />
              </div>
            </div>

            {/* Token Highlight Box - EXTRA LARGE FONT */}
            {(() => {
              const tokenParts = receipt.token.split('-').filter(Boolean);
              const isFormatted = tokenParts.length === 5;
              return (
                <div
                  onClick={() => onEditField('token')}
                  className="bg-gradient-to-br from-sky-600 via-sky-700 to-blue-800 text-white p-5 rounded-3xl shadow-lg shadow-sky-600/30 text-center my-4 cursor-pointer hover:brightness-105 transition border border-sky-400/40 relative overflow-hidden"
                >
                  <div className="text-[11px] font-extrabold text-sky-200 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    <span>NOMOR STROOM / TOKEN PLN</span>
                  </div>

                  {isFormatted ? (
                    <div className="font-mono font-black text-2xl xs:text-3xl sm:text-4xl tracking-widest text-amber-300 py-1.5 select-all drop-shadow-sm flex flex-col items-center justify-center gap-0.5 leading-tight">
                      <span>{tokenParts[0]}-{tokenParts[1]}-{tokenParts[2]}</span>
                      <span>{tokenParts[3]}-{tokenParts[4]}</span>
                    </div>
                  ) : (
                    <div className="font-mono font-black text-2xl xs:text-3xl tracking-widest text-amber-300 py-2 break-all select-all drop-shadow-sm">
                      {receipt.token}
                    </div>
                  )}

                  <div className="text-[11px] text-sky-100 font-medium mt-1.5 flex items-center justify-center gap-1">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Ketuk untuk ubah / edit</span>
                  </div>
                </div>
              );
            })()}

            {/* Details List */}
            <div className="space-y-1 py-1 text-xs">
              <EditableRow label="No. Referensi" value={receipt.noRef} field="noRef" />
              <EditableRow label="Nama Pelanggan" value={receipt.namaPelanggan} field="namaPelanggan" isBold />
              <EditableRow label="No. Meter" value={receipt.noMeter} field="noMeter" isBold />
              <EditableRow label="IDPEL" value={receipt.idpel} field="idpel" isBold />
              <EditableRow label="Tarif / Daya" value={receipt.tarifDaya} field="tarifDaya" />
              <EditableRow label="Jumlah kWh" value={`${receipt.kwh} kWh`} field="kwh" />
            </div>

            {/* Payment Details */}
            <div className="border-t border-sky-100 pt-3 mt-3 space-y-1">
              <EditableRow label="Nominal Token" value={formatRupiah(receipt.nominal)} field="nominal" />
              <EditableRow label="Admin Bank" value={formatRupiah(receipt.adminBank)} field="adminBank" />

              <div className="bg-sky-50/70 p-3 rounded-xl mt-2 flex items-center justify-between border border-sky-100">
                <span className="text-xs font-bold text-slate-700">Total Pembayaran</span>
                <span className="text-base font-black text-sky-700">{formatRupiah(receipt.totalBayar)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center mt-4 text-[10px] text-slate-400">
              <p className="whitespace-pre-line">
                {settings.catatanFooter || 'Simpan struk ini sebagai bukti transaksi resmi.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* ACTION TOOLBAR (MOBILE-FIRST BUTTONS)                    */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-4 border border-sky-100 shadow-md space-y-3">
        {/* Primary Row: Print Thermal Bluetooth & Bagikan Medsos */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleBluetoothPrint}
            disabled={isPrinting}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold py-3.5 px-3 rounded-2xl shadow-sm hover:shadow transition active:scale-[0.98] disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span className="text-xs">
              {isPrinting ? 'Mencetak...' : 'Cetak Thermal'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleShareImage}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold py-3.5 px-3 rounded-2xl shadow-sm hover:shadow transition active:scale-[0.98] disabled:opacity-50"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-xs">
              {isExporting ? 'Memproses...' : 'Bagikan Gambar'}
            </span>
          </button>
        </div>

        {/* Secondary Row: Simpan Gambar PNG & Salin Struk Teks */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 py-2.5 px-2 rounded-xl text-xs font-semibold transition active:scale-[0.98]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Simpan PNG</span>
          </button>

          <button
            type="button"
            onClick={handleCopyFullText}
            className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 py-2.5 px-2 rounded-xl text-xs font-semibold transition active:scale-[0.98]"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Teks</span>
          </button>

          <button
            type="button"
            onClick={handleBrowserPrint}
            className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 py-2.5 px-2 rounded-xl text-xs font-semibold transition active:scale-[0.98]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF</span>
          </button>
        </div>

        {/* Quick link to printer settings */}
        <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
          <span>Ukuran kertas struk: <strong>{settings.printerWidth}</strong></span>
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1"
          >
            <Settings className="w-3 h-3" />
            <span>Atur Printer</span>
          </button>
        </div>
      </div>
    </div>
  );
};
