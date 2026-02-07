/**
 * Transport abstraction: Room interface shared by WebRTC (Trystero) and BLE.
 * Same protocol (action names + JSON payloads); only the wire differs.
 * Used by lobby and game code so they work over either transport.
 */

/**
 * Room interface implemented by both WebRTC (Trystero) and BLE transports.
 * Action names must be ≤12 bytes (see documentation/protocol.md).
 */
export type Room = {
  /** Returns [send, get] for the given action name. send(payload, peerId?) broadcasts or targets one peer; get(cb) subscribes to incoming data. */
  makeAction: (actionName: string) => [
    send: (payload: unknown, peerId?: string) => void,
    get: (cb: (data: unknown, peerId: string) => void) => void,
  ];
  /** Current peers in the room (object or array of peer IDs). */
  getPeers: () => Record<string, unknown> | string[];
  onPeerJoin: (cb: (peerId: string) => void) => void;
  onPeerLeave: (cb: (peerId?: string) => void) => void;
  /** Leave the room and clean up. */
  leave: () => void;
};

/** Transport kind for tagging peers (e.g. "Online" vs "Nearby"). */
export type TransportType = "webrtc" | "ble";
