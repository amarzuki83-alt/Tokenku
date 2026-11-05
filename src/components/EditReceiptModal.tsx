import React, { useState } from 'react';
import { X, Check, Dices, Sparkles, Building2, Calendar, Hash, User, Zap, DollarSign } from 'lucide-react';
import { PlnReceiptData } from '../types/receipt';
import { formatRupiah, formatToken, generateRandomRef, normalizeTarifDaya, parseNumberOnly } from '../utils/formatters';

interface EditReceiptModalProps {
  receipt: PlnReceiptData;
  initialField?: keyof PlnReceiptData;
  onSave: (updated: PlnReceiptData) => void;
  onClose: () => void;
}

export const EditReceiptModal: React.FC<EditReceiptModalProps> = ({
  receipt,
  initialField,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<PlnReceiptData>({ ...receipt });

  const handleChange = (field: keyof PlnReceiptData, value: unknown) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'nominal' || field === 'adminBank') {
        const nom = typeof next.nominal === 'number' ? next.nominal : parseNumberOnly(String(next.nominal));
        const adm = typeof next.adminBank === 'number' ? next.adminBank : parseNumberOnly(String(next.adminBank));
        next.totalBayar = nom + adm;
      }
      return next;
    });
  };

  const handleRandomizeRef = () => {
    handleChange('noRef', generateRandomRef());
  };

  const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    handleChange('token', formatToken(raw));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      tarifDaya: normalizeTarifDaya(formData.tarifDaya),
    });
  };

  const NOMINAL_PRESETS = [20000, 50000, 100000, 200000, 500000, 1000000];
  const ADMIN_PRESETS = [0, 2500, 3000, 5000];
  const DAYA_PRESETS = ['R1 / 450VA', 'R1 / 900VA', 'R1M / 900VA', 'R1 / 1300VA', 'R1 / 2200VA', 'B1 / 4500VA'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Edit Data Struk</h3>
              <p className="text-[11px] text-slate-500">Koreksi hasil scan atau ubah nilai</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Stroom / Token (Most Important) */}
          <div className="bg-sky-50/70 p-3.5 rounded-2xl border border-sky-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-sky-600 fill-sky-600" />
                <span>STROOM / TOKEN PLN (20 Digit)</span>
              </label>
              <span className="text-[10px] font-mono text-sky-600 bg-sky-100 px-1.5 py-0.5 rounded">
                {formData.token.replace(/\D/g, '').length}/20 digit
              </span>
            </div>
            <input
              type="text"
              autoFocus={initialField === 'token'}
              value={formData.token}
              onChange={handleTokenChange}
              placeholder="XXXX-XXXX-XXXX-XXXX-XXXX"
              className="w-full bg-white border-2 border-sky-400 rounded-2xl px-3 py-3.5 font-mono text-center font-black text-xl sm:text-2xl tracking-widest text-slate-950 focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-xs"
            />
          </div>

          {/* Nama Pelanggan */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>Nama Pelanggan</span>
            </label>
            <input
              type="text"
              autoFocus={initialField === 'namaPelanggan'}
              value={formData.namaPelanggan}
              onChange={(e) => handleChange('namaPelanggan', e.target.value.toUpperCase())}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              placeholder="CONTOH: BUDI SANTOSO"
            />
          </div>

          {/* Nomor Meter & Idpel in 2 cols */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Nomor Meter
              </label>
              <input
                type="text"
                autoFocus={initialField === 'noMeter'}
                value={formData.noMeter}
                onChange={(e) => handleChange('noMeter', e.target.value.replace(/\D/g, '').slice(0, 12))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                placeholder="11-12 digit"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                IDPEL
              </label>
              <input
                type="text"
                autoFocus={initialField === 'idpel'}
                value={formData.idpel}
                onChange={(e) => handleChange('idpel', e.target.value.replace(/\D/g, '').slice(0, 12))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                placeholder="12 digit"
              />
            </div>
          </div>

          {/* Tarif / Daya & kWh */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Tarif / Daya
                </label>
                <input
                  type="text"
                  autoFocus={initialField === 'tarifDaya'}
                  value={formData.tarifDaya}
                  onChange={(e) => handleChange('tarifDaya', e.target.value.toUpperCase())}
                  onBlur={() => handleChange('tarifDaya', normalizeTarifDaya(formData.tarifDaya))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 uppercase focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  placeholder="R1 / 900VA"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Jumlah kWh
                </label>
                <input
                  type="text"
                  autoFocus={initialField === 'kwh'}
                  value={formData.kwh}
                  onChange={(e) => handleChange('kwh', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono text-sm text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                  placeholder="Contoh: 65.8"
                />
              </div>
            </div>

            {/* Quick Daya Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {DAYA_PRESETS.map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => handleChange('tarifDaya', d)}
                  className={`text-[11px] px-2 py-1 rounded-lg border transition ${
                    formData.tarifDaya === d
                      ? 'bg-sky-600 text-white border-sky-600 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Nominal Pembelian Token & Quick Chips */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                Nominal Pembelian Token
              </span>
              <span className="text-xs font-bold text-sky-700">{formatRupiah(formData.nominal)}</span>
            </label>
            <input
              type="number"
              step="1000"
              value={formData.nominal}
              onChange={(e) => handleChange('nominal', parseInt(e.target.value || '0', 10))}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
            />
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {NOMINAL_PRESETS.map((nom) => (
                <button
                  type="button"
                  key={nom}
                  onClick={() => handleChange('nominal', nom)}
                  className={`text-[11px] px-2 py-1 rounded-lg border transition ${
                    formData.nominal === nom
                      ? 'bg-sky-600 text-white border-sky-600 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {nom >= 1000000 ? `${nom / 1000000} Jt` : `${nom / 1000}rb`}
                </button>
              ))}
            </div>
          </div>

          {/* Admin Bank & Total Bayar */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Admin Bank
              </label>
              <input
                type="number"
                step="500"
                value={formData.adminBank}
                onChange={(e) => handleChange('adminBank', parseInt(e.target.value || '0', 10))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
              <div className="flex flex-wrap gap-1 pt-1">
                {ADMIN_PRESETS.map((adm) => (
                  <button
                    type="button"
                    key={adm}
                    onClick={() => handleChange('adminBank', adm)}
                    className={`text-[10px] px-1.5 py-0.5 rounded border transition ${
                      formData.adminBank === adm
                        ? 'bg-sky-600 text-white border-sky-600 font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {adm === 0 ? 'Gratis' : adm.toLocaleString('id-ID')}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-sky-50 rounded-2xl p-3 border border-sky-200 flex flex-col justify-center">
              <span className="text-[10px] font-semibold text-sky-800 uppercase tracking-wider">
                Total Pembayaran
              </span>
              <span className="text-base font-extrabold text-sky-950 mt-0.5">
                {formatRupiah(formData.totalBayar)}
              </span>
              <span className="text-[10px] text-sky-600 mt-0.5">Otomatis dihitung</span>
            </div>
          </div>

          {/* Tanggal & No Referensi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Tanggal / Jam</span>
              </label>
              <input
                type="text"
                value={formData.tanggal}
                onChange={(e) => handleChange('tanggal', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  No. Referensi
                </span>
                <button
                  type="button"
                  onClick={handleRandomizeRef}
                  className="text-[10px] text-sky-600 hover:text-sky-700 flex items-center gap-0.5 font-medium"
                >
                  <Dices className="w-3 h-3" />
                  Acak Baru
                </button>
              </label>
              <input
                type="text"
                value={formData.noRef}
                onChange={(e) => handleChange('noRef', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Nama Agen Pengirim */}
          <div>
            <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Nama Agen / Loket Pengirim</span>
            </label>
            <input
              type="text"
              value={formData.namaAgen}
              onChange={(e) => handleChange('namaAgen', e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              placeholder="Loket PPOB Athar digital"
            />
          </div>
        </form>

        {/* Action Button Footer */}
        <div className="p-4 border-t border-slate-100 flex gap-2 shrink-0 bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 border border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold rounded-2xl text-xs transition"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 py-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-semibold rounded-2xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
