import React, { useState } from 'react';
import {
  Building2,
  Printer,
  DollarSign,
  FileText,
  Save,
  Check,
  RefreshCw,
  Trash2,
  Smartphone,
  Share2,
  Sparkles,
  Zap,
  Info,
} from 'lucide-react';
import { AppSettings } from '../types/receipt';
import { bluetoothPrinter } from '../utils/bluetoothPrinter';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface SettingsViewProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  printerConnected: boolean;
  onRefreshPrinterStatus: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
  printerConnected,
  onRefreshPrinterStatus,
}) => {
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);
  const [isTestingPrinter, setIsTestingPrinter] = useState(false);
  const [printerMsg, setPrinterMsg] = useState<string | null>(null);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();

  const handleChange = (field: keyof AppSettings, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e?: React.FormEvent) => {
    e?.preventDefault();
    onSaveSettings(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleConnectBluetooth = async () => {
    setPrinterMsg('Membuka dialog pencarian Bluetooth...');
    try {
      await bluetoothPrinter.connect();
      const saved = bluetoothPrinter.getSavedPrinterInfo();
      if (saved) {
        setFormData((prev) => ({
          ...prev,
          savedPrinterName: saved.name,
          savedPrinterId: saved.id,
        }));
        onSaveSettings({
          ...formData,
          savedPrinterName: saved.name,
          savedPrinterId: saved.id,
        });
      }
      onRefreshPrinterStatus();
      setPrinterMsg('Berhasil terhubung ke Printer Bluetooth!');
    } catch (err: unknown) {
      setPrinterMsg((err as Error)?.message || 'Gagal menghubungkan printer.');
    }
  };

  const handleTestPrint = async () => {
    setIsTestingPrinter(true);
    setPrinterMsg('Mengirim tes cetak...');
    try {
      await bluetoothPrinter.printTest(formData);
      setPrinterMsg('Tes cetak berhasil dicetak!');
    } catch (err: unknown) {
      setPrinterMsg((err as Error)?.message || 'Gagal melakukan tes cetak.');
    } finally {
      setIsTestingPrinter(false);
    }
  };

  const handleDisconnectPrinter = () => {
    bluetoothPrinter.clearSavedPrinter();
    setFormData((prev) => ({
      ...prev,
      savedPrinterName: '',
      savedPrinterId: '',
    }));
    onSaveSettings({
      ...formData,
      savedPrinterName: '',
      savedPrinterId: '',
    });
    onRefreshPrinterStatus();
    setPrinterMsg('Printer diputuskan dan memori dibersihkan.');
  };

  const ADMIN_PRESETS = [0, 2000, 2500, 3000, 5000];

  return (
    <div className="space-y-4 pb-20">
      {/* Header Notification */}
      {isSaved && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4" />
          <span>Pengaturan berhasil disimpan!</span>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. IDENTITY & DEFAULT LOKET SETTINGS                     */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Identitas Loket / Agen</h3>
            <p className="text-[11px] text-slate-500">Nama dan kop loket yang tercetak di kepala struk</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Nama Agen / Loket PPOB
            </label>
            <input
              type="text"
              value={formData.namaAgen}
              onChange={(e) => handleChange('namaAgen', e.target.value)}
              placeholder="Contoh: Loket PPOB Athar digital atau Agen Batara Bekasi"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <button
                type="button"
                onClick={() => handleChange('namaAgen', 'Loket PPOB Athar digital')}
                className="text-[10px] bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 px-2 py-0.5 rounded-md transition"
              >
                PPOB Athar digital
              </button>
              <button
                type="button"
                onClick={() => handleChange('namaAgen', 'Agen Batara Bekasi')}
                className="text-[10px] bg-slate-100 hover:bg-sky-50 text-slate-600 hover:text-sky-700 px-2 py-0.5 rounded-md transition"
              >
                Agen Batara Bekasi
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Alamat / Sub-Header Loket
            </label>
            <input
              type="text"
              value={formData.alamatAgen}
              onChange={(e) => handleChange('alamatAgen', e.target.value)}
              placeholder="Contoh: Loket Resmi Pembayaran Listrik PLN"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Biaya Admin Default */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Default Biaya Admin Bank
              </label>
              <span className="text-xs font-extrabold text-sky-700">
                Rp {formData.defaultAdminBank.toLocaleString('id-ID')}
              </span>
            </div>
            <input
              type="number"
              step="500"
              value={formData.defaultAdminBank}
              onChange={(e) => handleChange('defaultAdminBank', parseInt(e.target.value || '0', 10))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
            {/* Admin Presets */}
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {ADMIN_PRESETS.map((adm) => (
                <button
                  type="button"
                  key={adm}
                  onClick={() => handleChange('defaultAdminBank', adm)}
                  className={`text-[10px] px-2 py-1 rounded-lg border transition ${
                    formData.defaultAdminBank === adm
                      ? 'bg-sky-600 text-white border-sky-600 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {adm === 0 ? 'Gratis' : `Rp ${adm.toLocaleString('id-ID')}`}
                </button>
              ))}
            </div>
          </div>

          {/* Footer Notice */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Catatan Kaki Struk (Footer)
            </label>
            <textarea
              rows={2}
              value={formData.catatanFooter}
              onChange={(e) => handleChange('catatanFooter', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. BLUETOOTH THERMAL PRINTER SETTINGS                    */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Printer Thermal Bluetooth</h3>
              <p className="text-[11px] text-slate-500">Koneksi Web Bluetooth API langsung ke printer kasir</p>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              printerConnected
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            {printerConnected ? 'Terhubung' : 'Terputus'}
          </span>
        </div>

        {/* Printer Persistence Status */}
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Printer Tersimpan:</span>
            <span className="font-bold text-slate-900">
              {formData.savedPrinterName || 'Belum ada printer tersimpan'}
            </span>
          </div>
          {formData.savedPrinterId && (
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">ID / Device:</span>
              <span className="font-mono text-slate-500 truncate max-w-[180px]">
                {formData.savedPrinterId}
              </span>
            </div>
          )}
          <p className="text-[10px] text-slate-400 pt-1">
            *Printer yang sudah dihubungkan sekali akan tersimpan di HP agar tidak perlu pairing ulang.
          </p>
        </div>

        {/* Paper Width Selector */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1.5">
            Lebar Kertas Struk
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleChange('printerWidth', '58mm')}
              className={`p-3 rounded-2xl border text-left transition ${
                formData.printerWidth === '58mm'
                  ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs block">58 mm (32 Karakter)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Format standar printer mini portable
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleChange('printerWidth', '80mm')}
              className={`p-3 rounded-2xl border text-left transition ${
                formData.printerWidth === '80mm'
                  ? 'border-sky-600 bg-sky-50 text-sky-900 font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="text-xs block">80 mm (48 Karakter)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                Format printer kasir meja / POS
              </span>
            </button>
          </div>
        </div>

        {/* Status Message */}
        {printerMsg && (
          <div className="bg-sky-50 border border-sky-200 text-sky-800 text-xs p-2.5 rounded-xl font-medium">
            {printerMsg}
          </div>
        )}

        {/* Bluetooth Actions */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleConnectBluetooth}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold py-3 px-4 rounded-2xl shadow-sm text-xs transition active:scale-[0.98]"
          >
            <Printer className="w-4 h-4" />
            <span>Hubungkan / Cari Printer Bluetooth</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleTestPrint}
              disabled={isTestingPrinter}
              className="flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 py-2.5 px-3 rounded-xl text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{isTestingPrinter ? 'Mencetak...' : 'Tes Cetak'}</span>
            </button>

            {formData.savedPrinterName && (
              <button
                type="button"
                onClick={handleDisconnectPrinter}
                className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-2.5 px-3 rounded-xl text-xs font-semibold transition active:scale-[0.98]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Printer</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex items-start gap-2 bg-amber-50/80 border border-amber-200 text-amber-900 p-3 rounded-xl text-[11px] leading-relaxed">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            Pastikan Bluetooth HP aktif dan printer thermal sudah menyala (paired) sebelum menekan tombol cari. Di Android, gunakan Google Chrome untuk dukungan Web Bluetooth penuh.
          </p>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. PWA & ANDROID SHARE TARGET INTEGRATION INFO           */}
      {/* ========================================================= */}
      <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Integrasi PWA Android</h3>
            <p className="text-[11px] text-slate-500">Instalasi aplikasi & menu Share Target Android</p>
          </div>
        </div>

        <div className="space-y-2 text-xs text-slate-600">
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
            <span>Status Instalasi PWA:</span>
            <span className="font-bold text-sky-700">
              {isInstalled ? 'Sudah Terinstal (Standalone)' : 'Berjalan di Browser'}
            </span>
          </div>

          {!isInstalled && isInstallable && (
            <button
              onClick={install}
              className="w-full bg-gradient-to-r from-sky-600 to-blue-600 text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm hover:shadow transition"
            >
              Install tokenku ke Layar Utama
            </button>
          )}

          <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200 text-[11px] space-y-1 text-sky-900">
            <div className="font-bold flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Fitur Android Web Share Target:</span>
            </div>
            <p className="leading-relaxed">
              Setelah tokenku terinstal, saat Anda membuka foto struk atau screenshot transfer di Galeri/WhatsApp, ketuk tombol <strong>Share (Bagikan)</strong> dan pilih <strong>tokenku</strong>. Aplikasi akan otomatis membuka dan membaca tokennya!
            </p>
          </div>
        </div>
      </div>

      {/* Save Settings Primary Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => handleSave()}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-bold py-3.5 px-4 rounded-2xl shadow-md text-xs transition active:scale-[0.98]"
        >
          <Save className="w-4 h-4" />
          <span>Simpan Seluruh Pengaturan</span>
        </button>
      </div>
    </div>
  );
};
