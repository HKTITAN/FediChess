#ifndef FEDICHESS_CLIENT_HPP
#define FEDICHESS_CLIENT_HPP

#include <nlohmann/json.hpp>
#include <memory>
#include <string>
#include <vector>

namespace fedichess {

class FediChessClient {
public:
  FediChessClient(const std::string& bridge_path,
                  const std::string& bridge_cwd = "");
  ~FediChessClient();

  bool start_bridge();
  nlohmann::json join_lobby();
  nlohmann::json leave_lobby();
  nlohmann::json join_game(const std::string& game_id);
  nlohmann::json leave_game();
  nlohmann::json send(const std::string& action,
                      const nlohmann::json& payload,
                      const std::string& peer_id = "");
  std::vector<std::string> get_peers();
  nlohmann::json poll_event(double timeout_sec = 0.0);
  void stop();

private:
  nlohmann::json send_cmd(const nlohmann::json& obj);
  std::string next_id();

  struct Impl;
  std::unique_ptr<Impl> impl_;
};

}

#endif
