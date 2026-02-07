cmake_minimum_required(VERSION 3.14)
project(fedichess_sdk_cpp LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 14)

include(FetchContent)
FetchContent_Declare(
  json
  URL https://github.com/nlohmann/json/releases/download/v3.11.3/json.tar.xz
)
FetchContent_MakeAvailable(json)

add_library(fedichess_sdk fedichess_client.cpp)
target_include_directories(fedichess_sdk PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})
target_link_libraries(fedichess_sdk PUBLIC nlohmann_json::nlohmann_json)

add_executable(lobby_and_challenge examples/lobby_and_challenge.cpp)
target_compile_definitions(lobby_and_challenge PRIVATE
  FEDICHESS_BRIDGE_DIR="${CMAKE_CURRENT_SOURCE_DIR}/../bridge")
target_link_libraries(lobby_and_challenge PRIVATE fedichess_sdk)
