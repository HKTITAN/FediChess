#include "../fedichess_client.hpp"
#include <chrono>
#include <iostream>
#include <string>
#include <cstdlib>

int main() {
  std::string bridge_dir = FEDICHESS_BRIDGE_DIR;
  std::string bridge_path = bridge_dir + "/dist/index.js";
  std::string bridge_cwd = bridge_dir;

  const char* env_bridge = std::getenv("FEDICHESS_BRIDGE");
  if (env_bridge) bridge_path = env_bridge;
  else if (bridge_dir.empty()) bridge_path = "node";

  fedichess::FediChessClient client(bridge_path, bridge_cwd);
  if (!client.start_bridge()) {
    std::cerr << "Failed to start bridge\n";
    return 1;
  }

  auto r = client.join_lobby();
  if (!r.value("ok", false)) {
    std::cerr << "join_lobby failed: " << r.dump() << "\n";
    return 1;
  }

  auto ts = std::chrono::duration_cast<std::chrono::milliseconds>(
                std::chrono::system_clock::now().time_since_epoch())
                .count();
  client.send("heartbeat",
              {{"id", "sdk-cpp-example"},
               {"elo", 1200},
               {"name", "CppSDK"},
               {"ready", true},
               {"timestamp", ts}});

  for (int i = 0; i < 3; ++i) {
    auto ev = client.poll_event(2.0);
    if (!ev.is_null())
      std::cout << "Event: " << ev.value("event", "") << " "
                << ev.value("peerId", "") << " " << ev.dump() << "\n";
  }

  auto peers = client.get_peers();
  std::cout << "Peers in lobby: ";
  for (const auto& p : peers) std::cout << p << " ";
  std::cout << "\n";

  if (!peers.empty()) {
    std::string game_id = "00000000-0000-0000-0000-000000000001";
    ts = std::chrono::duration_cast<std::chrono::milliseconds>(
             std::chrono::system_clock::now().time_since_epoch())
             .count();
    client.send("challenge",
                {{"type", "challenge"},
                 {"gameId", game_id},
                 {"challengerId", "sdk-cpp-example"},
                 {"challengerName", "CppSDK"},
                 {"challengerElo", 1200},
                 {"color", "w"},
                 {"timestamp", ts}},
                peers[0]);
    std::cout << "Sent challenge to " << peers[0] << " gameId " << game_id << "\n";
    for (int i = 0; i < 10; ++i) {
      auto ev = client.poll_event(2.0);
      if (!ev.is_null() && ev.value("event", "") == "challResp") {
        std::cout << "challResp: " << ev.dump() << "\n";
        break;
      }
    }
  }

  client.leave_lobby();
  client.stop();
  std::cout << "Done.\n";
  return 0;
}
