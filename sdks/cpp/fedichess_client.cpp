#include "fedichess_client.hpp"
#include <chrono>
#include <cstdio>
#include <cstring>
#include <iostream>
#include <mutex>
#include <queue>
#include <sstream>
#include <thread>

#ifdef _WIN32
#include <windows.h>
#else
#include <fcntl.h>
#include <unistd.h>
#include <sys/wait.h>
#endif

namespace fedichess {

struct FediChessClient::Impl {
  std::string bridge_path;
  std::string bridge_cwd;
  uint32_t next_id = 1;
  std::queue<nlohmann::json> event_queue;
  std::mutex event_mutex;

#ifdef _WIN32
  HANDLE child_proc = nullptr;
  HANDLE child_stdin_w = nullptr;
  HANDLE child_stdout_r = nullptr;
  HANDLE thread_stdout = nullptr;
  bool running = false;
#else
  pid_t child_pid = -1;
  FILE* stdin_f = nullptr;
  FILE* stdout_f = nullptr;
  int stdout_fd = -1;
  std::thread reader_thread;
  bool running = false;
#endif

  ~Impl() {
    running = false;
#ifdef _WIN32
    if (thread_stdout) WaitForSingleObject(thread_stdout, 2000);
    if (child_stdin_w) CloseHandle(child_stdin_w);
    if (child_stdout_r) CloseHandle(child_stdout_r);
    if (child_proc) {
      TerminateProcess(child_proc, 0);
      CloseHandle(child_proc);
    }
#else
    if (reader_thread.joinable()) reader_thread.join();
    if (stdin_f) fclose(stdin_f);
    if (stdout_f) fclose(stdout_f);
    if (child_pid > 0) waitpid(child_pid, nullptr, WNOHANG);
#endif
  }
};

FediChessClient::FediChessClient(const std::string& bridge_path,
                                 const std::string& bridge_cwd)
    : impl_(std::make_unique<Impl>()) {
  impl_->bridge_path = bridge_path;
  impl_->bridge_cwd = bridge_cwd;
}

FediChessClient::~FediChessClient() { stop(); }

std::string FediChessClient::next_id() {
  return "req-" + std::to_string(impl_->next_id++);
}

nlohmann::json FediChessClient::send_cmd(const nlohmann::json& obj) {
  nlohmann::json req = obj;
  std::string req_id = next_id();
  req["id"] = req_id;

#ifdef _WIN32
  std::string line = req.dump() + "\n";
  DWORD written;
  if (!WriteFile(impl_->child_stdin_w, line.c_str(), (DWORD)line.size(), &written, nullptr))
    return {{"ok", false}, {"error", "write failed"}};
#else
  if (!impl_->stdin_f)
    return {{"ok", false}, {"error", "bridge not started"}};
  fprintf(impl_->stdin_f, "%s\n", req.dump().c_str());
  fflush(impl_->stdin_f);
#endif

  while (impl_->running) {
    nlohmann::json msg = poll_event(0.5);
    if (msg.is_null()) continue;
    if (msg.contains("id") && msg["id"] == req_id) return msg;
    if (msg.contains("event")) {
      std::lock_guard<std::mutex> lock(impl_->event_mutex);
      impl_->event_queue.push(msg);
    }
  }
  return {{"ok", false}, {"error", "no response"}};
}

nlohmann::json FediChessClient::poll_event(double timeout_sec) {
  auto deadline = std::chrono::steady_clock::now() +
                  std::chrono::duration<double>(timeout_sec);
  while (std::chrono::steady_clock::now() < deadline) {
    {
      std::lock_guard<std::mutex> lock(impl_->event_mutex);
      if (!impl_->event_queue.empty()) {
        nlohmann::json ev = impl_->event_queue.front();
        impl_->event_queue.pop();
        return ev;
      }
    }
#ifdef _WIN32
    if (impl_->child_stdout_r == nullptr) break;
    char buf[4096];
    DWORD n = 0;
    if (ReadFile(impl_->child_stdout_r, buf, sizeof(buf) - 1, &n, nullptr) && n > 0) {
      buf[n] = '\0';
      std::string line(buf);
      size_t pos = line.find('\n');
      if (pos != std::string::npos) {
        line = line.substr(0, pos);
        try {
          nlohmann::json j = nlohmann::json::parse(line);
          if (j.contains("event")) {
            std::lock_guard<std::mutex> lock(impl_->event_mutex);
            impl_->event_queue.push(j);
          } else
            return j;
        } catch (...) {}
      }
    }
#else
    if (!impl_->stdout_f) break;
    char buf[4096];
    if (fgets(buf, sizeof(buf), impl_->stdout_f)) {
      std::string line(buf);
      while (!line.empty() && (line.back() == '\n' || line.back() == '\r'))
        line.pop_back();
      try {
        nlohmann::json j = nlohmann::json::parse(line);
        if (j.contains("event")) {
          std::lock_guard<std::mutex> lock(impl_->event_mutex);
          impl_->event_queue.push(j);
        } else
          return j;
      } catch (...) {}
    } else if (feof(impl_->stdout_f))
      break;
#endif
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
  }
  return nullptr;
}

bool FediChessClient::start_bridge() {
#ifdef _WIN32
  SECURITY_ATTRIBUTES sa = {sizeof(sa), nullptr, TRUE};
  HANDLE stdin_r = nullptr, stdin_w = nullptr;
  HANDLE stdout_r = nullptr, stdout_w = nullptr;
  if (!CreatePipe(&stdin_r, &stdin_w, &sa, 0) ||
      !CreatePipe(&stdout_r, &stdout_w, &sa, 0))
    return false;
  SetHandleInformation(stdin_w, HANDLE_FLAG_INHERIT, 0);
  SetHandleInformation(stdout_r, HANDLE_FLAG_INHERIT, 0);

  std::string cmd = "node \"" + impl_->bridge_path + "\"";
  STARTUPINFOA si = {};
  si.cb = sizeof(si);
  si.dwFlags = STARTF_USESTDHANDLES;
  si.hStdInput = stdin_r;
  si.hStdOutput = stdout_w;
  si.hStdError = GetStdHandle(STD_ERROR_HANDLE);
  PROCESS_INFORMATION pi = {};
  if (!CreateProcessA(nullptr, (LPSTR)cmd.c_str(), nullptr, nullptr, TRUE, 0,
                     nullptr,
                     impl_->bridge_cwd.empty() ? nullptr : impl_->bridge_cwd.c_str(),
                     &si, &pi)) {
    CloseHandle(stdin_r); CloseHandle(stdin_w);
    CloseHandle(stdout_r); CloseHandle(stdout_w);
    return false;
  }
  CloseHandle(stdin_r);
  CloseHandle(stdout_w);
  CloseHandle(pi.hThread);
  impl_->child_proc = pi.hProcess;
  impl_->child_stdin_w = stdin_w;
  impl_->child_stdout_r = stdout_r;
  impl_->running = true;
  return true;
#else
  int in_fds[2], out_fds[2];
  if (pipe(in_fds) != 0 || pipe(out_fds) != 0) return false;
  pid_t pid = fork();
  if (pid < 0) {
    close(in_fds[0]); close(in_fds[1]);
    close(out_fds[0]); close(out_fds[1]);
    return false;
  }
  if (pid == 0) {
    dup2(in_fds[0], STDIN_FILENO);
    dup2(out_fds[1], STDOUT_FILENO);
    close(in_fds[0]); close(in_fds[1]);
    close(out_fds[0]); close(out_fds[1]);
    const char* argv[] = {"node", impl_->bridge_path.c_str(), nullptr};
    if (!impl_->bridge_cwd.empty()) chdir(impl_->bridge_cwd.c_str());
    execvp("node", (char* const*)argv);
    _exit(127);
  }
  close(in_fds[0]);
  close(out_fds[1]);
  impl_->child_pid = pid;
  impl_->stdin_f = fdopen(in_fds[1], "w");
  impl_->stdout_fd = out_fds[0];
  impl_->stdout_f = fdopen(out_fds[0], "r");
  impl_->running = true;
  return true;
#endif
}

nlohmann::json FediChessClient::join_lobby() { return send_cmd({{"cmd", "joinLobby"}}); }
nlohmann::json FediChessClient::leave_lobby() { return send_cmd({{"cmd", "leaveLobby"}}); }
nlohmann::json FediChessClient::join_game(const std::string& game_id) {
  return send_cmd({{"cmd", "joinGame"}, {"gameId", game_id}});
}
nlohmann::json FediChessClient::leave_game() { return send_cmd({{"cmd", "leaveGame"}}); }

nlohmann::json FediChessClient::send(const std::string& action,
                                     const nlohmann::json& payload,
                                     const std::string& peer_id) {
  nlohmann::json obj = {{"cmd", "send"}, {"action", action}, {"payload", payload}};
  if (!peer_id.empty()) obj["peerId"] = peer_id;
  return send_cmd(obj);
}

std::vector<std::string> FediChessClient::get_peers() {
  nlohmann::json r = send_cmd({{"cmd", "getPeers"}});
  std::vector<std::string> out;
  if (r.contains("peers") && r["peers"].is_array())
    for (const auto& p : r["peers"]) out.push_back(p.get<std::string>());
  return out;
}

void FediChessClient::stop() {
  impl_->running = false;
#ifdef _WIN32
  if (impl_->child_proc) {
    TerminateProcess(impl_->child_proc, 0);
    CloseHandle(impl_->child_proc);
    impl_->child_proc = nullptr;
  }
  if (impl_->child_stdin_w) { CloseHandle(impl_->child_stdin_w); impl_->child_stdin_w = nullptr; }
  if (impl_->child_stdout_r) { CloseHandle(impl_->child_stdout_r); impl_->child_stdout_r = nullptr; }
#else
  if (impl_->child_pid > 0) {
    kill(impl_->child_pid, SIGTERM);
    waitpid(impl_->child_pid, nullptr, 0);
    impl_->child_pid = -1;
  }
  if (impl_->stdin_f) { fclose(impl_->stdin_f); impl_->stdin_f = nullptr; }
  if (impl_->stdout_f) { fclose(impl_->stdout_f); impl_->stdout_f = nullptr; }
#endif
}

}  // namespace fedichess
