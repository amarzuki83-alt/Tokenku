import React, { useRef, useState } from 'react';
import { Camera, Image, Upload, FileText, Sparkles, Share2, ArrowRight, RefreshCw, Zap } from 'lucide-react';
import { SAMPLE_RECEIPTS } from '../utils/ocrParser';
import { PlnReceiptData } from '../types/receipt';

interface ReceiptScannerProps {
  onScanImage: (file: File | Blob) => void;
  onSelectSample: (sampleData: Partial<PlnReceiptData>) => void;
  onManualInput: () => void;
  isScanning: boolean;
  scanProgress: { status: string; progress: number };
}

export const ReceiptScanner: React.FC<ReceiptScannerProps> = ({
  onScanImage,
  onSelectSample,
  onManualInput,
  isScanning,
  scanProgress,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onScanImage(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onScanImage(file);
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Hero Banner / Android Share info */}
      <div className="bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 text-white rounded-3xl p-5 shadow-lg shadow-sky-500/15 relative overflow-hidden">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-semibold text-sky-100 mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>OCR Otomatis Offline</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white mb-1">
            Pindai Bukti Transfer & Struk PLN
          </h2>
          <p className="text-xs text-sky-100/90 leading-relaxed max-w-sm">
            Ekstrak nomor token, meter, IDPEL, dan nominal seketika tanpa kuota/API. Siap dicetak ke printer Bluetooth!
          </p>

          <div className="mt-4 pt-3 border-t border-white/15 flex items-center gap-2 text-[11px] text-sky-100">
            <Share2 className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>
              <strong>Tips Android:</strong> Bagikan gambar dari WhatsApp / Galeri langsung ke menu <strong>tokenku</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Main Upload / Scan Card */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`bg-white rounded-3xl border-2 transition p-6 text-center shadow-xs ${
          isDragOver
            ? 'border-sky-500 bg-sky-50/50'
            : 'border-dashed border-sky-200 hover:border-sky-400'
        }`}
      >
        {isScanning ? (
          /* Scanning Progress View */
          <div className="py-8 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center animate-spin">
              <RefreshCw className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Sedang Memindai Bukti...</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">{scanProgress.status}</p>
            </div>
            {/* Progress bar */}
            <div className="max-w-xs mx-auto w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-sky-500 to-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.round(scanProgress.progress * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-400">
              Proses OCR berjalan 100% di HP Anda secara aman & privat.
            </p>
          </div>
        ) : (
          /* Upload / Capture Buttons */
          <div className="space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-xs">
              <Upload className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-800">
                Ambil Foto atau Pilih Gambar Bukti
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Mendukung screenshot m-banking, struk foto, & e-wallet
              </p>
            </div>

            {/* Action Buttons: Camera & Gallery */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white font-semibold py-3 px-4 rounded-2xl shadow-sm hover:shadow transition active:scale-[0.98]"
              >
                <Camera className="w-4 h-4" />
                <span className="text-xs">Buka Kamera</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 font-semibold py-3 px-4 rounded-2xl transition active:scale-[0.98]"
              >
                <Image className="w-4 h-4" />
                <span className="text-xs">Pilih Galeri</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onManualInput}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-sky-600 font-medium py-1 transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Atau input data manual tanpa foto</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Preset Test Receipts (1-Tap instant try) */}
      <div className="bg-white rounded-3xl p-5 border border-sky-100 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Zap className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Uji Coba Cepat (1-Klik)</h4>
              <p className="text-[10px] text-slate-400">Pilih contoh struk untuk tes cetak langsung</p>
            </div>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
            Sampel
          </span>
        </div>

        <div className="space-y-2">
          {SAMPLE_RECEIPTS.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => onSelectSample(sample.data)}
              className="w-full flex items-center justify-between p-3 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-sky-50/80 hover:border-sky-200 text-left transition group active:scale-[0.99]"
            >
              <div>
                <p className="text-xs font-bold text-slate-800 group-hover:text-sky-700 transition">
                  {sample.title}
                </p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{sample.subtitle}</p>
              </div>
              <div className="w-7 h-7 rounded-xl bg-white text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-100 flex items-center justify-center transition shrink-0 shadow-2xs">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
