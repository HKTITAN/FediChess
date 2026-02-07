//! FediChess Rust SDK: talks to the FediChess Node bridge over stdio (JSON lines).

use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};
use std::sync::mpsc::Receiver;
use std::sync::{mpsc, Arc, Mutex};
use std::thread;

#[derive(Debug, Serialize)]
#[serde(tag = "cmd", rename_all = "camelCase")]
pub enum Command {
    JoinLobby,
    LeaveLobby,
    JoinGame { game_id: String },
    LeaveGame,
    Send {
        action: String,
        payload: serde_json::Value,
        #[serde(skip_serializing_if = "Option::is_none")]
        peer_id: Option<String>,
    },
    GetPeers,
}

#[derive(Debug, Deserialize)]
pub struct Response {
    pub ok: bool,
    #[serde(default)]
    pub error: Option<String>,
    #[serde(default)]
    pub peers: Option<Vec<String>>,
    #[serde(default)]
    pub id: Option<String>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Event {
    pub event: String,
    #[serde(default, rename = "peerId")]
    pub peer_id: Option<String>,
    #[serde(default)]
    pub payload: Option<serde_json::Value>,
}

pub struct FediChessClient {
    child: Option<Child>,
    stdin: Option<ChildStdin>,
    response_receiver: Option<Receiver<serde_json::Value>>,
    event_queue: Arc<Mutex<VecDeque<Event>>>,
    next_id: Arc<Mutex<u32>>,
}

impl FediChessClient {
    pub fn new(bridge_path: &str, bridge_cwd: Option<&str>) -> std::io::Result<Self> {
        let is_js = bridge_path.ends_with(".js");
        let mut cmd = if is_js {
            let mut c = Command::new("node");
            c.arg(bridge_path);
            c
        } else {
            Command::new(bridge_path)
        };
        cmd.stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::null());
        if let Some(cwd) = bridge_cwd {
            cmd.current_dir(cwd);
        }
        let mut child = cmd.spawn()?;
        let stdin = child.stdin.take().ok_or_else(|| {
            std::io::Error::new(std::io::ErrorKind::Other, "no stdin")
        })?;
        let stdout = child.stdout.take().ok_or_else(|| {
            std::io::Error::new(std::io::ErrorKind::Other, "no stdout")
        })?;

        let event_queue = Arc::new(Mutex::new(VecDeque::new()));
        let eq = Arc::clone(&event_queue);
        let (tx, rx) = mpsc::channel();
        thread::spawn(move || {
            let reader = BufReader::new(stdout);
            for line in reader.lines().filter_map(Result::ok) {
                let line = line.trim();
                if line.is_empty() {
                    continue;
                }
                let value: serde_json::Value = match serde_json::from_str(line) {
                    Ok(v) => v,
                    Err(_) => continue,
                };
                if value.get("event").is_some() {
                    if let Ok(ev) = serde_json::from_str::<Event>(line) {
                        eq.lock().unwrap().push_back(ev);
                    }
                } else {
                    let _ = tx.send(value);
                }
            }
        });

        Ok(Self {
            child: Some(child),
            stdin: Some(stdin),
            response_receiver: Some(rx),
            event_queue,
            next_id: Arc::new(Mutex::new(0)),
        })
    }

    fn next_id(&self) -> String {
        let mut id = self.next_id.lock().unwrap();
        *id += 1;
        format!("req-{}", *id)
    }

    fn send_cmd(&mut self, mut obj: serde_json::Value) -> std::io::Result<serde_json::Value> {
        let req_id = self.next_id();
        obj["id"] = serde_json::Value::String(req_id.clone());
        let stdin = self.stdin.as_mut().ok_or_else(|| {
            std::io::Error::new(std::io::ErrorKind::Other, "bridge not started")
        })?;
        writeln!(stdin, "{}", obj)?;
        stdin.flush()?;

        let rx = self.response_receiver.as_ref().ok_or_else(|| {
            std::io::Error::new(std::io::ErrorKind::Other, "no receiver")
        })?;
        loop {
            match rx.recv() {
                Ok(resp) => {
                    if resp.get("id").and_then(|v| v.as_str()) == Some(&req_id) {
                        return Ok(resp);
                    }
                }
                Err(_) => return Err(std::io::Error::new(std::io::ErrorKind::UnexpectedEof, "bridge closed")),
            }
        }
    }

    pub fn join_lobby(&mut self) -> std::io::Result<Response> {
        let obj = serde_json::json!({"cmd": "joinLobby"});
        let v = self.send_cmd(obj)?;
        serde_json::from_value(v).map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))
    }

    pub fn leave_lobby(&mut self) -> std::io::Result<Response> {
        let obj = serde_json::json!({"cmd": "leaveLobby"});
        let v = self.send_cmd(obj)?;
        serde_json::from_value(v).map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))
    }

    pub fn join_game(&mut self, game_id: &str) -> std::io::Result<Response> {
        let obj = serde_json::json!({"cmd": "joinGame", "gameId": game_id});
        let v = self.send_cmd(obj)?;
        serde_json::from_value(v).map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))
    }

    pub fn leave_game(&mut self) -> std::io::Result<Response> {
        let obj = serde_json::json!({"cmd": "leaveGame"});
        let v = self.send_cmd(obj)?;
        serde_json::from_value(v).map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))
    }

    pub fn send(
        &mut self,
        action: &str,
        payload: serde_json::Value,
        peer_id: Option<&str>,
    ) -> std::io::Result<Response> {
        let mut obj = serde_json::json!({"cmd": "send", "action": action, "payload": payload});
        if let Some(pid) = peer_id {
            obj["peerId"] = serde_json::Value::String(pid.to_string());
        }
        let v = self.send_cmd(obj)?;
        serde_json::from_value(v).map_err(|e| std::io::Error::new(std::io::ErrorKind::InvalidData, e))
    }

    pub fn get_peers(&mut self) -> std::io::Result<Vec<String>> {
        let obj = serde_json::json!({"cmd": "getPeers"});
        let v = self.send_cmd(obj)?;
        let peers = v.get("peers").and_then(|p| p.as_array()).cloned().unwrap_or_default();
        Ok(peers
            .into_iter()
            .filter_map(|x| x.as_str().map(String::from))
            .collect())
    }

    pub fn poll_event(&self) -> Option<Event> {
        self.event_queue.lock().unwrap().pop_front()
    }

    pub fn stop(&mut self) {
        if let Some(mut child) = self.child.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
        self.stdin = None;
        self.response_receiver = None;
    }
}

impl Drop for FediChessClient {
    fn drop(&mut self) {
        self.stop();
    }
}
