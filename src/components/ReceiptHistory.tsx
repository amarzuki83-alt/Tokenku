import React, { useState } from 'react';
import { Search, Trash2, ArrowUpRight, Zap, Calendar, User, Hash, Clock, FileText } from 'lucide-react';
import { PlnReceiptData } from '../types/receipt';
import { formatRupiah, normalizeTarifDaya } from '../utils/formatters';

interface ReceiptHistoryProps {
  history: PlnReceiptData[];
  onSelectReceipt: (receipt: PlnReceiptData) => void;
  onDeleteReceipt: (id: string) => void;
  onClearHistory: () => void;
}

export const ReceiptHistory: React.FC<ReceiptHistoryProps> = ({
  history,
  onSelectReceipt,
  onDeleteReceipt,
  onClearHistory,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = history.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      item.namaPelanggan.toLowerCase().includes(q) ||
      item.noMeter.includes(q) ||
      item.idpel.includes(q) ||
      item.noRef.toLowerCase().includes(q) ||
      item.token.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
    );
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Header & Search */}
      <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Riwayat Struk</h3>
            <p className="text-xs text-slate-500">Daftar transaksi struk token yang tersimpan di HP</p>
          </div>
          {history.length > 0 && (
            <button
              onClick={() => {
                if (window.confirm('Yakin ingin menghapus semua riwayat transaksi?')) {
                  onClearHistory();
                }
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, no meter, IDPEL, atau token..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* History List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border border-sky-100 text-center shadow-xs space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              {searchQuery ? 'Tidak Ada Hasil Pencarian' : 'Belum Ada Riwayat Struk'}
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {searchQuery
                ? 'Coba gunakan kata kunci pencarian nama atau nomor meter lainnya.'
                : 'Struk yang Anda pindai atau buat akan otomatis tercatat di sini untuk cetak ulang.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-4 border border-sky-100 shadow-2xs hover:border-sky-300 hover:shadow-xs transition group"
            >
              <div className="flex items-start justify-between gap-3">
                <div
                  onClick={() => onSelectReceipt(item)}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-semibold bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-sky-600 fill-sky-600" />
                      PLN Prabayar
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {item.tanggal}
                    </span>
                  </div>

                  <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-sky-600 transition">
                    {item.namaPelanggan}
                  </h4>

                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-mono">
                    <span className="font-bold text-slate-800">Mtr: {item.noMeter}</span>
                    <span className="text-slate-400">•</span>
                    <span className="font-bold text-slate-800">Daya: {normalizeTarifDaya(item.tarifDaya)}</span>
                  </div>

                  {/* Token Highlight */}
                  <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-mono font-black text-xs text-sky-950 inline-block tracking-wider">
                    {item.token}
                  </div>
                </div>

                {/* Right Total & Actions */}
                <div className="text-right flex flex-col items-end shrink-0 justify-between">
                  <span className="text-sm font-black text-slate-900">
                    {formatRupiah(item.totalBayar)}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 mt-0.5">
                    Token: {formatRupiah(item.nominal)}
                  </span>

                  <div className="flex items-center gap-1.5 mt-3">
                    <button
                      onClick={() => onSelectReceipt(item)}
                      className="p-1.5 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                      title="Buka Struk"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteReceipt(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Struk"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
