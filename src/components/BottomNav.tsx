import React from 'react';
import { Scan, FileText, History, Settings, Zap } from 'lucide-react';

export type TabType = 'scan' | 'preview' | 'history' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  hasActiveReceipt: boolean;
  historyCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  hasActiveReceipt,
  historyCount,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-sky-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1">
        {/* Tab 1: Pindai / Buat */}
        <button
          onClick={() => onChangeTab('scan')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition select-none ${
            activeTab === 'scan'
              ? 'text-sky-600 bg-sky-50 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className="relative">
            <Scan className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Pindai</span>
        </button>

        {/* Tab 2: Struk Preview */}
        <button
          onClick={() => onChangeTab('preview')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition select-none relative ${
            activeTab === 'preview'
              ? 'text-sky-600 bg-sky-50 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className="relative">
            <FileText className="w-5 h-5" />
            {hasActiveReceipt && activeTab !== 'preview' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-sky-500 rounded-full animate-ping" />
            )}
            {hasActiveReceipt && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-sky-500 rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Struk</span>
        </button>

        {/* Tab 3: Riwayat */}
        <button
          onClick={() => onChangeTab('history')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition select-none ${
            activeTab === 'history'
              ? 'text-sky-600 bg-sky-50 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className="relative">
            <History className="w-5 h-5" />
            {historyCount > 0 && (
              <span className="absolute -top-1 -right-2.5 text-[9px] bg-slate-200 text-slate-700 font-bold px-1.5 rounded-full">
                {historyCount > 99 ? '99+' : historyCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Riwayat</span>
        </button>

        {/* Tab 4: Pengaturan */}
        <button
          onClick={() => onChangeTab('settings')}
          className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-2xl transition select-none ${
            activeTab === 'settings'
              ? 'text-sky-600 bg-sky-50 font-bold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className="relative">
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Pengaturan</span>
        </button>
      </div>
    </nav>
  );
};
