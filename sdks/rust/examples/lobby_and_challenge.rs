//! Example: join lobby, send heartbeat, list peers, optionally send a challenge.
//! Run from sdks/rust: cargo run --example lobby_and_challenge
//! Build the bridge first: cd ../../bridge && npm install && npm run build

use fedichess_sdk::{Event, FediChessClient};
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

fn main() -> std::io::Result<()> {
    let bridge_dir = Path::new(env!("CARGO_MANIFEST_DIR")).join("..").join("..").join("bridge");
    let bridge_path = bridge_dir.join("dist").join("index.js");
    let bridge_path_str = bridge_path.to_string_lossy();
    let (path, cwd) = if bridge_path.is_file() {
        (bridge_path_str.as_ref(), Some(bridge_dir.to_string_lossy().as_ref()))
    } else {
        (std::env::var("FEDICHESS_BRIDGE").as_deref().unwrap_or("node"), None)
    };

    let mut client = FediChessClient::new(path, cwd)?;

    let r = client.join_lobby()?;
    if !r.ok {
        eprintln!("join_lobby failed: {:?}", r.error);
        return Ok(());
    }

    let ts = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
    client.send(
        "heartbeat",
        serde_json::json!({
            "id": "sdk-rust-example",
            "elo": 1200,
            "name": "RustSDK",
            "ready": true,
            "timestamp": ts,
        }),
        None,
    )?;

    for _ in 0..3 {
        if let Some(ev) = client.poll_event() {
            println!("Event: {} {:?} {:?}", ev.event, ev.peer_id, ev.payload);
        }
    }

    let peers = client.get_peers()?;
    println!("Peers in lobby: {:?}", peers);

    if let Some(first_peer) = peers.first() {
        let game_id = uuid::Uuid::new_v4().to_string();
        let ts = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis() as u64;
        client.send(
            "challenge",
            serde_json::json!({
                "type": "challenge",
                "gameId": game_id,
                "challengerId": "sdk-rust-example",
                "challengerName": "RustSDK",
                "challengerElo": 1200,
                "color": "w",
                "timestamp": ts,
            }),
            Some(first_peer.as_str()),
        )?;
        println!("Sent challenge to {} gameId {}", first_peer, game_id);
        for _ in 0..10 {
            if let Some(ev) = client.poll_event() {
                if ev.event == "challResp" {
                    println!("challResp: {:?}", ev.payload);
                    break;
                }
            }
        }
    }

    client.leave_lobby()?;
    client.stop();
    println!("Done.");
    Ok(())
}
