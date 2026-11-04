import React, { useState } from 'react';
import { Zap, Download, Printer, WifiOff, Smartphone, HelpCircle, X, Check } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  printerConnected: boolean;
  printerName?: string;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  printerConnected,
  printerName,
  onOpenSettings,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-sky-100 shadow-xs px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Logo & App Name */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 via-sky-500 to-cyan-400 p-0.5 shadow-md shadow-sky-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-sky-600 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-extrabold text-slate-900 tracking-tight text-lg leading-tight">
                  token<span className="text-sky-600">ku</span>
                </h1>
                <span className="text-[10px] font-semibold bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded-full">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Struk PLN & Bukti Transfer</p>
            </div>
          </div>

          {/* Right Action Badges */}
          <div className="flex items-center gap-1.5">
            {!isOnline && (
              <div className="flex items-center gap-1 text-[11px] bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Offline</span>
              </div>
            )}

            {/* Bluetooth Quick Status */}
            <button
              onClick={onOpenSettings}
              className={`flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full transition ${
                printerConnected
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
              title={printerConnected ? `Printer: ${printerName || 'Terhubung'}` : 'Printer belum terhubung'}
            >
              <Printer className={`w-3.5 h-3.5 ${printerConnected ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span className="hidden xs:inline">{printerConnected ? 'Siap Cetak' : 'Printer'}</span>
            </button>

            {/* In-App Install Prompt */}
            {!isInstalled && isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm hover:shadow hover:brightness-105 active:scale-95 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
            )}

            {!isInstalled && !isInstallable && isIOS && (
              <button
                onClick={() => setShowIOSModal(true)}
                className="flex items-center gap-1 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-medium px-2.5 py-1.5 rounded-full hover:bg-sky-100 transition"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* iOS Safari Install Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center font-bold">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Install di iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Buka browser <strong>Safari</strong> dan ketuk tombol <strong>Share</strong> (ikon kotak dengan panah ke atas di bilah navigasi bawah).
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Gulir ke bawah dan pilih menu <strong>Add to Home Screen</strong> (Tambah ke Layar Utama).
                </p>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Ketuk <strong>Add</strong> di pojok kanan atas. Ikon <strong>tokenku</strong> akan muncul di layar utama HP Anda.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 rounded-xl transition shadow-sm"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
