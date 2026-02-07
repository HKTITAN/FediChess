/**
 * Transport abstraction: Room interface shared by WebRTC (Trystero) and BLE.
 * Same protocol (action names + JSON payloads); only the wire differs.
 */

export type Room = {
  makeAction: (actionName: string) => [
    send: (payload: unknown, peerId?: string) => void,
    get: (cb: (data: unknown, peerId: string) => void) => void,
  ];
  getPeers: () => Record<string, unknown> | string[];
  onPeerJoin: (cb: (peerId: string) => void) => void;
  onPeerLeave: (cb: (peerId?: string) => void) => void;
  leave: () => void;
};

export type TransportType = "webrtc" | "ble";
