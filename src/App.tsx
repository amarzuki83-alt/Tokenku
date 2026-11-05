/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AppSettings, DEFAULT_SETTINGS, PlnReceiptData } from './types/receipt';
import { Header } from './components/Header';
import { ReceiptScanner } from './components/ReceiptScanner';
import { ReceiptPreview } from './components/ReceiptPreview';
import { ReceiptHistory } from './components/ReceiptHistory';
import { SettingsView } from './components/SettingsView';
import { BottomNav, TabType } from './components/BottomNav';
import { EditReceiptModal } from './components/EditReceiptModal';
import { parseReceiptText, runLocalOcr, SAMPLE_RECEIPTS } from './utils/ocrParser';
import {
  loadReceiptHistory,
  loadSettings,
  saveReceiptToHistory,
  saveSettings,
  deleteReceiptFromHistory,
  clearReceiptHistory,
} from './utils/storage';
import { bluetoothPrinter } from './utils/bluetoothPrinter';
import { formatToken, generateRandomRef, getCurrentDateTimeFormatted, normalizeTarifDaya } from './utils/formatters';

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [history, setHistory] = useState<PlnReceiptData[]>(loadReceiptHistory);
  const [activeTab, setActiveTab] = useState<TabType>('scan');

  // Default receipt on start initialized with first sample or latest history item
  const [currentReceipt, setCurrentReceipt] = useState<PlnReceiptData>(() => {
    const hist = loadReceiptHistory();
    if (hist.length > 0) {
      return {
        ...hist[0],
        tarifDaya: normalizeTarifDaya(hist[0].tarifDaya),
      };
    }
    const sample = SAMPLE_RECEIPTS[0].data;
    const currentSettings = loadSettings();
    return {
      id: 'init-' + Date.now(),
      tanggal: sample.tanggal || getCurrentDateTimeFormatted(),
      noRef: sample.noRef || generateRandomRef(),
      noMeter: sample.noMeter || '14235678901',
      idpel: sample.idpel || '537210987654',
      namaPelanggan: sample.namaPelanggan || 'BUDI SANTOSO',
      tarifDaya: normalizeTarifDaya(sample.tarifDaya || 'R1M / 900VA'),
      kwh: sample.kwh || '33.2',
      token: sample.token || '4928-1934-8201-9482-1049',
      nominal: sample.nominal || 50000,
      adminBank: currentSettings.defaultAdminBank || 5000,
      totalBayar: (sample.nominal || 50000) + (currentSettings.defaultAdminBank || 5000),
      namaAgen: currentSettings.namaAgen || 'Loket PPOB Athar digital',
      alamatAgen: currentSettings.alamatAgen,
      catatanFooter: currentSettings.catatanFooter,
      createdAt: Date.now(),
    };
  });

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ status: '', progress: 0 });
  const [editingField, setEditingField] = useState<keyof PlnReceiptData | null>(null);
  const [printerConnected, setPrinterConnected] = useState(false);

  // Check saved printer status on mount
  useEffect(() => {
    const saved = bluetoothPrinter.getSavedPrinterInfo();
    if (saved) {
      setPrinterConnected(true);
    }
  }, []);

  // Android Web Share Target handler:
  // When an image is shared from Android Gallery / WhatsApp to tokenku,
  // service worker caches it and redirects to /?shared=1
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('shared') === '1' || searchParams.get('shared') === 'true') {
      window.history.replaceState({}, '', window.location.pathname);
      (async () => {
        try {
          if ('caches' in window) {
            const shareCache = await caches.open('pwa-share-target');
            const response = await shareCache.match('/shared-image');
            if (response) {
              const blob = await response.blob();
              await shareCache.delete('/shared-image');
              handleScanImage(blob);
            }
          }
        } catch (err) {
          console.error('Error retrieving shared image from PWA cache:', err);
        }
      })();
    }
  }, []);

  // Process OCR on image file or blob
  const handleScanImage = async (file: File | Blob) => {
    setIsScanning(true);
    setActiveTab('scan');
    try {
      const rawText = await runLocalOcr(file, (p) => {
        setScanProgress(p);
      });

      const parsed = parseReceiptText(rawText, settings.defaultAdminBank, settings.namaAgen);

      const newReceipt: PlnReceiptData = {
        id: 'rec-' + Date.now(),
        tanggal: parsed.tanggal || getCurrentDateTimeFormatted(),
        noRef: parsed.noRef || generateRandomRef(),
        noMeter: parsed.noMeter || '14235678901',
        idpel: parsed.idpel || '537210987654',
        namaPelanggan: parsed.namaPelanggan || 'PELANGGAN PLN',
        tarifDaya: normalizeTarifDaya(parsed.tarifDaya || 'R1 / 1300VA'),
        kwh: parsed.kwh || '33.2',
        token: parsed.token || '1839-4920-5819-2049-1193',
        nominal: parsed.nominal || 50000,
        adminBank: parsed.adminBank || settings.defaultAdminBank || 5000,
        totalBayar: (parsed.nominal || 50000) + (parsed.adminBank || settings.defaultAdminBank || 5000),
        namaAgen: settings.namaAgen,
        alamatAgen: settings.alamatAgen,
        catatanFooter: settings.catatanFooter,
        createdAt: Date.now(),
      };

      setCurrentReceipt(newReceipt);
      const updatedHistory = saveReceiptToHistory(newReceipt);
      setHistory(updatedHistory);

      // Switch smoothly to receipt preview
      setActiveTab('preview');
    } catch (err) {
      console.error('OCR processing failed:', err);
      alert('Gagal memproses gambar. Pastikan gambar cukup terang dan memuat teks bukti transaksi.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectSample = (sampleData: Partial<PlnReceiptData>) => {
    const newReceipt: PlnReceiptData = {
      id: 'sample-' + Date.now(),
      tanggal: sampleData.tanggal || getCurrentDateTimeFormatted(),
      noRef: sampleData.noRef || generateRandomRef(),
      noMeter: sampleData.noMeter || '14235678901',
      idpel: sampleData.idpel || '537210987654',
      namaPelanggan: sampleData.namaPelanggan || 'PELANGGAN PLN',
      tarifDaya: normalizeTarifDaya(sampleData.tarifDaya || 'R1 / 900VA'),
      kwh: sampleData.kwh || '33.2',
      token: sampleData.token || '4928-1934-8201-9482-1049',
      nominal: sampleData.nominal || 50000,
      adminBank: sampleData.adminBank || settings.defaultAdminBank || 5000,
      totalBayar:
        (sampleData.nominal || 50000) +
        (sampleData.adminBank || settings.defaultAdminBank || 5000),
      namaAgen: settings.namaAgen,
      alamatAgen: settings.alamatAgen,
      catatanFooter: settings.catatanFooter,
      createdAt: Date.now(),
    };

    setCurrentReceipt(newReceipt);
    const updatedHistory = saveReceiptToHistory(newReceipt);
    setHistory(updatedHistory);
    setActiveTab('preview');
  };

  const handleManualInput = () => {
    const template: PlnReceiptData = {
      id: 'manual-' + Date.now(),
      tanggal: getCurrentDateTimeFormatted(),
      noRef: generateRandomRef(),
      noMeter: '',
      idpel: '',
      namaPelanggan: '',
      tarifDaya: 'R1 / 900VA',
      kwh: '33.2',
      token: '',
      nominal: 50000,
      adminBank: settings.defaultAdminBank || 5000,
      totalBayar: 55000,
      namaAgen: settings.namaAgen,
      alamatAgen: settings.alamatAgen,
      catatanFooter: settings.catatanFooter,
      createdAt: Date.now(),
    };
    setCurrentReceipt(template);
    setEditingField('token');
  };

  const handleSaveReceiptEdit = (updated: PlnReceiptData) => {
    const cleaned: PlnReceiptData = {
      ...updated,
      tarifDaya: normalizeTarifDaya(updated.tarifDaya),
    };
    setCurrentReceipt(cleaned);
    const updatedHistory = saveReceiptToHistory(cleaned);
    setHistory(updatedHistory);
    setEditingField(null);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    // Update current receipt agent info
    setCurrentReceipt((prev) => ({
      ...prev,
      namaAgen: newSettings.namaAgen,
      alamatAgen: newSettings.alamatAgen,
      catatanFooter: newSettings.catatanFooter,
    }));
  };

  const handleDeleteReceipt = (id: string) => {
    const updated = deleteReceiptFromHistory(id);
    setHistory(updated);
  };

  const handleClearHistory = () => {
    clearReceiptHistory();
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-2xl overflow-x-hidden border-x border-slate-200/60">
      {/* Header with Branding, PWA Install & Bluetooth Status */}
      <Header
        printerConnected={printerConnected}
        printerName={settings.savedPrinterName}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Main View Area */}
      <main className="flex-1 p-4">
        {activeTab === 'scan' && (
          <ReceiptScanner
            onScanImage={handleScanImage}
            onSelectSample={handleSelectSample}
            onManualInput={handleManualInput}
            isScanning={isScanning}
            scanProgress={scanProgress}
          />
        )}

        {activeTab === 'preview' && (
          <ReceiptPreview
            receipt={currentReceipt}
            settings={settings}
            onEditField={(field) => setEditingField(field)}
            onBackToScan={() => setActiveTab('scan')}
            onOpenSettings={() => setActiveTab('settings')}
          />
        )}

        {activeTab === 'history' && (
          <ReceiptHistory
            history={history}
            onSelectReceipt={(rec) => {
              setCurrentReceipt(rec);
              setActiveTab('preview');
            }}
            onDeleteReceipt={handleDeleteReceipt}
            onClearHistory={handleClearHistory}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            onSaveSettings={handleSaveSettings}
            printerConnected={printerConnected}
            onRefreshPrinterStatus={() => {
              const saved = bluetoothPrinter.getSavedPrinterInfo();
              setPrinterConnected(!!saved);
            }}
          />
        )}
      </main>

      {/* Tap-to-Edit Modal Sheet */}
      {editingField && (
        <EditReceiptModal
          receipt={currentReceipt}
          initialField={editingField}
          onSave={handleSaveReceiptEdit}
          onClose={() => setEditingField(null)}
        />
      )}

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(t) => setActiveTab(t)}
        hasActiveReceipt={!!currentReceipt}
        historyCount={history.length}
      />
    </div>
  );
}
