/**
 * BLE transport: Web Bluetooth GATT implementation of the FediChess Room interface.
 * One GATT connection = one peer. Message format: 4-byte length (big-endian) + actionName + "\n" + JSON.
 * See documentation/protocol.md (Transports / BLE).
 */

const FEDICHESS_SERVICE_UUID = "f47b5e2d-4a9e-4c5a-9b3f-8e1d2c3a4b5c";
const FEDICHESS_CHAR_UUID = "a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d";

const BLE_MAX_CHUNK = 512;

export type BleRoom = {
  makeAction: (actionName: string) => [send: (payload: unknown, peerId?: string) => void, get: (cb: (data: unknown, peerId: string) => void) => void];
  getPeers: () => Record<string, unknown>;
  onPeerJoin: (cb: (peerId: string) => void) => void;
  onPeerLeave: (cb: (peerId?: string) => void) => void;
  leave: () => void;
};

export function isBleSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  return Boolean((navigator as Navigator & { bluetooth?: { getAvailability?: () => Promise<boolean> } }).bluetooth);
}

/** Request a FediChess BLE device. Must be called from a user gesture. */
export async function requestBleDevice(): Promise<BluetoothDevice> {
  if (!isBleSupported()) {
    throw new Error("Web Bluetooth is not supported. Use Chrome or Edge on HTTPS or localhost.");
  }
  const bluetooth = navigator.bluetooth;
  if (!bluetooth) throw new Error("Web Bluetooth is not supported.");
  const device = await bluetooth.requestDevice({
    filters: [{ services: [FEDICHESS_SERVICE_UUID] }],
    optionalServices: [FEDICHESS_SERVICE_UUID],
  });
  return device;
}

function generateSessionPeerId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "ble-" + Math.random().toString(36).slice(2) + "-" + Date.now();
}

function encodeMessage(actionName: string, payload: unknown): Uint8Array {
  const body = actionName + "\n" + JSON.stringify(payload);
  const encoder = new TextEncoder();
  const bodyBytes = encoder.encode(body);
  const len = bodyBytes.length;
  const out = new Uint8Array(4 + len);
  const view = new DataView(out.buffer);
  view.setUint32(0, len, false);
  out.set(bodyBytes, 4);
  return out;
}

function decodeMessage(bytes: Uint8Array): { actionName: string; payload: unknown } | null {
  if (bytes.length < 4) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const len = view.getUint32(0, false);
  if (bytes.length < 4 + len) return null;
  const body = new Uint8Array(bytes.buffer, bytes.byteOffset + 4, len);
  const decoder = new TextDecoder();
  const str = decoder.decode(body);
  const idx = str.indexOf("\n");
  if (idx === -1) return null;
  const actionName = str.slice(0, idx);
  const json = str.slice(idx + 1);
  try {
    const payload = JSON.parse(json) as unknown;
    return { actionName, payload };
  } catch {
    return null;
  }
}

export interface CreateBleRoomResult {
  room: BleRoom;
  selfPeerId: string;
}

/** Create a BLE room from an already-selected device. Connects to GATT and sets up the characteristic. */
export async function createBleRoom(device: BluetoothDevice, selfPeerId?: string): Promise<CreateBleRoomResult> {
  const peerId = selfPeerId ?? generateSessionPeerId();
  let server: BluetoothRemoteGATTServer | null = null;
  let characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  const getCallbacks = new Map<string, Array<(data: unknown, fromPeerId: string) => void>>();
  const peerJoinCbs: Array<(peerId: string) => void> = [];
  const peerLeaveCbs: Array<(peerId?: string) => void> = [];
  let remotePeerId: string | null = null;
  let receiveBuffer = new Uint8Array(0);
  let left = false;

  const disconnect = () => {
    if (left) return;
    left = true;
    try {
      if (server?.connected) server.disconnect();
    } catch {
      /* ignore */
    }
    server = null;
    characteristic = null;
    const r = remotePeerId;
    remotePeerId = null;
    if (r) peerLeaveCbs.forEach((cb) => cb(r));
    else peerLeaveCbs.forEach((cb) => cb());
  };

  const ensureConnected = async (): Promise<BluetoothRemoteGATTCharacteristic> => {
    if (characteristic && server?.connected) return characteristic;
    if (!device.gatt) throw new Error("Device GATT not available");
    server = await device.gatt.connect();
    const service = await server.getPrimaryService(FEDICHESS_SERVICE_UUID);
    const char = await service.getCharacteristic(FEDICHESS_CHAR_UUID);
    characteristic = char;

    device.addEventListener("gattserverdisconnected", () => {
      disconnect();
    });

    await char.startNotifications();
    char.addEventListener("characteristicvaluechanged", (event: Event) => {
      const c = (event.target as BluetoothRemoteGATTCharacteristic).value;
      if (!c) return;
      const chunk = new Uint8Array(c.buffer, c.byteOffset, c.byteLength);
      const combined = new Uint8Array(receiveBuffer.length + chunk.length);
      combined.set(receiveBuffer);
      combined.set(chunk, receiveBuffer.length);
      receiveBuffer = combined;

      while (receiveBuffer.length >= 4) {
        const view = new DataView(receiveBuffer.buffer, receiveBuffer.byteOffset, receiveBuffer.byteLength);
        const len = view.getUint32(0, false);
        if (receiveBuffer.length < 4 + len) break;
        const message = receiveBuffer.slice(0, 4 + len);
        receiveBuffer = receiveBuffer.slice(4 + len);
        const decoded = decodeMessage(message);
        if (decoded) {
          const idFromPayload = (decoded.payload as { id?: string; peerId?: string })?.id ?? (decoded.payload as { peerId?: string })?.peerId;
          if (idFromPayload && !remotePeerId) {
            remotePeerId = idFromPayload;
            peerJoinCbs.forEach((cb) => cb(remotePeerId!));
          }
          const fromId = remotePeerId ?? "ble-unknown";
          const cbs = getCallbacks.get(decoded.actionName);
          if (cbs) cbs.forEach((cb) => cb(decoded.payload, fromId));
        }
      }
    });

    return characteristic;
  };

  const send = (actionName: string, payload: unknown) => {
    if (left) return;
    const msg = encodeMessage(actionName, payload);
    ensureConnected().then((char) => {
      if (left) return;
      if (msg.length <= BLE_MAX_CHUNK) {
        char.writeValue(msg as BufferSource).catch(() => disconnect());
      } else {
        for (let i = 0; i < msg.length; i += BLE_MAX_CHUNK) {
          char.writeValue(msg.subarray(i, i + BLE_MAX_CHUNK) as BufferSource).catch(() => disconnect());
        }
      }
    }).catch(() => disconnect());
  };

  const room: BleRoom = {
    makeAction(actionName: string) {
      const cbs: Array<(data: unknown, peerId: string) => void> = [];
      getCallbacks.set(actionName, cbs);
      return [
        (payload: unknown, _peerId?: string) => {
          send(actionName, payload);
        },
        (cb: (data: unknown, peerId: string) => void) => {
          cbs.push(cb);
        },
      ];
    },
    getPeers() {
      return remotePeerId ? { [remotePeerId]: true } : {};
    },
    onPeerJoin(cb: (peerId: string) => void) {
      peerJoinCbs.push(cb);
      if (remotePeerId) cb(remotePeerId);
    },
    onPeerLeave(cb: (peerId?: string) => void) {
      peerLeaveCbs.push(cb);
    },
    leave() {
      disconnect();
    },
  };

  await ensureConnected();
  return { room, selfPeerId: peerId };
}

/** Stored BLE room when navigating from lobby to game (same tab). Cleared when game ends or tab closes. */
let storedBleGame: { room: BleRoom; gameId: string; selfPeerId: string } | null = null;

export function setStoredBleGameRoom(room: BleRoom, gameId: string, selfPeerId: string): void {
  storedBleGame = { room, gameId, selfPeerId };
}

export function getStoredBleGameRoom(gameId: string): { room: BleRoom; selfPeerId: string } | null {
  if (!storedBleGame || storedBleGame.gameId !== gameId) return null;
  return { room: storedBleGame.room, selfPeerId: storedBleGame.selfPeerId };
}

export function clearStoredBleGameRoom(): void {
  const prev = storedBleGame;
  storedBleGame = null;
  if (prev) {
    try {
      prev.room.leave();
    } catch {
      /* ignore; connection may already be gone */
    }
  }
}
