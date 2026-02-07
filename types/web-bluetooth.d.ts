/**
 * Minimal Web Bluetooth API types for FediChess BLE transport.
 * Full types: @types/web-bluetooth (if added).
 */
interface BluetoothDevice extends EventTarget {
  readonly id: string;
  readonly name?: string;
  readonly gatt?: BluetoothRemoteGATTServer;
  addEventListener(
    type: "gattserverdisconnected",
    listener: () => void,
    options?: boolean | AddEventListenerOptions
  ): void;
}

interface BluetoothRemoteGATTServer {
  readonly connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(uuid: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(uuid: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  readonly value?: DataView;
  readValue(): Promise<DataView>;
  writeValue(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
  addEventListener(
    type: "characteristicvaluechanged",
    listener: (event: Event) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
}

interface BluetoothRequestDeviceOptions {
  filters?: Array<{ services?: string[] }>;
  optionalServices?: string[];
}

interface Bluetooth {
  requestDevice(options?: BluetoothRequestDeviceOptions): Promise<BluetoothDevice>;
  getAvailability?(): Promise<boolean>;
}

interface Navigator {
  bluetooth?: Bluetooth;
}
