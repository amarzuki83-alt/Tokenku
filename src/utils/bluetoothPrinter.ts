import { AppSettings, PlnReceiptData } from '../types/receipt';
import { formatRupiah, normalizeTarifDaya } from './formatters';

// Common Bluetooth Thermal Printer GATT Services & Characteristics
const PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard Printer Service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Posnet / Epson BLE
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Serial Port
  '0000ff00-0000-1000-8000-00805f9b34fb', // Custom ESC/POS BLE
  '00001101-0000-1000-8000-00805f9b34fb', // Serial Port Profile
];

const PRINTER_CHARACTERISTICS = [
  '00002af1-0000-1000-8000-00805f9b34fb',
  'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  '49535343-8841-43f4-a8d4-ecbe34729bb3',
  '0000ff02-0000-1000-8000-00805f9b34fb',
  '0000ff01-0000-1000-8000-00805f9b34fb',
];

export interface BluetoothPrinterState {
  isConnected: boolean;
  deviceName: string;
  deviceId: string;
  error?: string;
}

class BluetoothPrinterService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private isConnecting: boolean = false;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  public getSavedPrinterInfo(): { name: string; id: string } | null {
    try {
      const data = localStorage.getItem('tokenku_printer_device');
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Ignore JSON error
    }
    return null;
  }

  public savePrinterInfo(name: string, id: string): void {
    try {
      localStorage.setItem('tokenku_printer_device', JSON.stringify({ name, id }));
    } catch {
      // Ignore
    }
  }

  public clearSavedPrinter(): void {
    localStorage.removeItem('tokenku_printer_device');
    this.disconnect();
  }

  /**
   * Connects to a Bluetooth Thermal Printer using Web Bluetooth API.
   * If already connected to the same device, returns active characteristic.
   */
  public async connect(): Promise<BluetoothRemoteGATTCharacteristic> {
    if (!this.isSupported()) {
      throw new Error('Web Bluetooth tidak didukung di browser ini. Gunakan Google Chrome di Android.');
    }

    if (this.characteristic && this.device?.gatt?.connected) {
      return this.characteristic;
    }

    if (this.isConnecting) {
      throw new Error('Sedang mencoba menghubungkan ke printer...');
    }

    this.isConnecting = true;

    try {
      // Request device with printer filters or acceptAllDevices
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          ...PRINTER_SERVICES,
          'generic_access',
          '00001800-0000-1000-8000-00805f9b34fb',
          '00001801-0000-1000-8000-00805f9b34fb',
        ],
      });

      this.device = device;
      this.savePrinterInfo(device.name || 'Printer Bluetooth', device.id);

      device.addEventListener('gattserverdisconnected', () => {
        this.characteristic = null;
      });

      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Gagal terhubung ke server GATT printer.');
      }

      // Discover primary services and writable characteristic
      const services = await server.getPrimaryServices();
      let writeChar: BluetoothRemoteGATTCharacteristic | null = null;

      for (const service of services) {
        try {
          const chars = await service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              writeChar = char;
              break;
            }
          }
        } catch {
          continue;
        }
        if (writeChar) break;
      }

      if (!writeChar) {
        throw new Error('Tidak ditemukan karakteristik write pada printer thermal ini.');
      }

      this.characteristic = writeChar;
      return writeChar;
    } finally {
      this.isConnecting = false;
    }
  }

  public disconnect(): void {
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.device = null;
    this.characteristic = null;
  }

  /**
   * Sends ESC/POS raw command buffer in chunks to respect BLE MTU size.
   */
  private async sendChunks(characteristic: BluetoothRemoteGATTCharacteristic, data: Uint8Array): Promise<void> {
    const CHUNK_SIZE = 64; // Safe BLE MTU write size
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      if (characteristic.properties.writeWithoutResponse) {
        await characteristic.writeValueWithoutResponse(chunk);
      } else {
        await characteristic.writeValue(chunk);
      }
      // Small pause to prevent buffer overflow on low-cost thermal chips
      await new Promise((r) => setTimeout(r, 25));
    }
  }

  /**
   * Helper to format a 2-column receipt line (left aligned text, right aligned value).
   */
  private formatRow(left: string, right: string, width: number): string {
    const leftTrim = left.trim();
    const rightTrim = right.trim();
    const spacesNeeded = width - leftTrim.length - rightTrim.length;
    if (spacesNeeded <= 0) {
      return `${leftTrim}\n${''.padStart(width - rightTrim.length, ' ')}${rightTrim}\n`;
    }
    return `${leftTrim}${''.padStart(spacesNeeded, ' ')}${rightTrim}\n`;
  }

  /**
   * Builds ESC/POS byte sequence for PLN Prepaid Token Struk.
   */
  public buildEscPosReceipt(data: PlnReceiptData, settings: AppSettings): Uint8Array {
    const width = settings.printerWidth === '80mm' ? 48 : 32;
    const separator = '-'.repeat(width) + '\n';
    const doubleSeparator = '='.repeat(width) + '\n';

    const encoder = new TextEncoder();
    const parts: number[] = [];

    // Commands
    const ESC = 0x1b;
    const GS = 0x1d;

    // 1. Initialize Printer (ESC @)
    parts.push(ESC, 0x40);

    // 2. Select standard code table (CP437)
    parts.push(ESC, 0x74, 0x00);

    // 3. Header: Agen & Loket (Center & Bold)
    parts.push(ESC, 0x61, 0x01); // Center
    parts.push(ESC, 0x45, 0x01); // Bold ON
    parts.push(...encoder.encode(`${data.namaAgen || settings.namaAgen}\n`));
    parts.push(ESC, 0x45, 0x00); // Bold OFF

    if (settings.alamatAgen) {
      parts.push(...encoder.encode(`${settings.alamatAgen}\n`));
    }

    parts.push(ESC, 0x45, 0x01);
    parts.push(...encoder.encode(`STRUK PEMBELIAN LISTRIK PRABAYAR\n`));
    parts.push(ESC, 0x45, 0x00);

    parts.push(ESC, 0x61, 0x00); // Left align
    parts.push(...encoder.encode(separator));

    // 4. Metadata rows
    parts.push(...encoder.encode(this.formatRow('TGL/JAM', data.tanggal, width)));
    parts.push(...encoder.encode(this.formatRow('NO REF', data.noRef, width)));
    parts.push(...encoder.encode(this.formatRow('NO METER', data.noMeter, width)));
    parts.push(...encoder.encode(this.formatRow('IDPEL', data.idpel, width)));
    parts.push(...encoder.encode(this.formatRow('NAMA', data.namaPelanggan, width)));
    parts.push(...encoder.encode(this.formatRow('TARIF/DAYA', normalizeTarifDaya(data.tarifDaya), width)));
    parts.push(...encoder.encode(this.formatRow('JML KWH', `${data.kwh} kWh`, width)));

    parts.push(...encoder.encode(separator));

    // 5. STROOM / TOKEN (Extra Large, Bold, Centered)
    parts.push(ESC, 0x61, 0x01); // Center
    parts.push(ESC, 0x45, 0x01); // Bold ON
    parts.push(...encoder.encode(`STROOM / TOKEN PLN:\n`));

    // Double Height & Width for 20-digit Token
    parts.push(GS, 0x21, 0x11); // Double width & height
    // Split token in 2 lines for 58mm readability:
    // e.g. "1234-5678-9012" & "3456-7890" or 10-10
    const tokenDigits = data.token.replace(/\s+/g, '');
    if (tokenDigits.includes('-') && width === 32) {
      const partsArr = tokenDigits.split('-');
      if (partsArr.length === 5) {
        parts.push(...encoder.encode(`${partsArr[0]}-${partsArr[1]}-${partsArr[2]}\n`));
        parts.push(...encoder.encode(`${partsArr[3]}-${partsArr[4]}\n`));
      } else {
        parts.push(...encoder.encode(`${tokenDigits}\n`));
      }
    } else {
      parts.push(...encoder.encode(`${tokenDigits}\n`));
    }

    parts.push(GS, 0x21, 0x00); // Reset normal font size
    parts.push(ESC, 0x45, 0x00); // Bold OFF

    parts.push(ESC, 0x61, 0x00); // Left align
    parts.push(...encoder.encode(separator));

    // 6. Payment rows
    parts.push(...encoder.encode(this.formatRow('RP TOKEN', formatRupiah(data.nominal), width)));
    parts.push(...encoder.encode(this.formatRow('ADMIN BANK', formatRupiah(data.adminBank), width)));
    parts.push(...encoder.encode(doubleSeparator));

    // Total Bayar (Bold)
    parts.push(ESC, 0x45, 0x01); // Bold ON
    parts.push(...encoder.encode(this.formatRow('TOTAL BAYAR', formatRupiah(data.totalBayar), width)));
    parts.push(ESC, 0x45, 0x00); // Bold OFF

    parts.push(...encoder.encode(separator));

    // 7. Footer note (Center)
    parts.push(ESC, 0x61, 0x01); // Center
    const footerLines = (settings.catatanFooter || 'Terima kasih atas kepercayaan Anda.\nStruk ini bukti pembayaran yang sah.').split('\n');
    for (const fLine of footerLines) {
      parts.push(...encoder.encode(`${fLine.trim()}\n`));
    }

    // 8. Feed 4 lines and cut
    parts.push(ESC, 0x64, 0x04);
    parts.push(GS, 0x56, 0x41, 0x03); // Feed & partial cut

    return new Uint8Array(parts);
  }

  /**
   * Prints the given receipt to connected Bluetooth printer.
   */
  public async print(data: PlnReceiptData, settings: AppSettings): Promise<void> {
    const characteristic = await this.connect();
    const payload = this.buildEscPosReceipt(data, settings);
    await this.sendChunks(characteristic, payload);
  }

  /**
   * Prints a quick test receipt to verify Bluetooth alignment & font size.
   */
  public async printTest(settings: AppSettings): Promise<void> {
    const testData: PlnReceiptData = {
      id: 'test',
      tanggal: new Date().toLocaleString('id-ID'),
      noRef: 'TEST1234567890',
      noMeter: '14235678901',
      idpel: '537210987654',
      namaPelanggan: 'TES PRINTER BLUETOOTH',
      tarifDaya: 'R1 / 900 VA',
      kwh: '33.2',
      token: '1234-5678-9012-3456-7890',
      nominal: 50000,
      adminBank: settings.defaultAdminBank || 5000,
      totalBayar: 50000 + (settings.defaultAdminBank || 5000),
      namaAgen: settings.namaAgen || 'Loket PPOB Athar digital',
      createdAt: Date.now(),
    };

    await this.print(testData, settings);
  }
}

export const bluetoothPrinter = new BluetoothPrinterService();
