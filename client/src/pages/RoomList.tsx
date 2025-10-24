import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import type { RoomListItem } from "@shared/schema";
import { Lock, Users, Play, Plus, LogIn, Home, Shield } from "lucide-react";
import { useWebSocketContext } from "@/contexts/WebSocketContext";

export default function RoomList() {
  const [, setLocation] = useLocation();
  const { isConnected, send, gameState, roomsList } = useWebSocketContext();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const storedUsername = localStorage.getItem("katmannames_username");
    if (!storedUsername) {
      setLocation("/");
      return;
    }
    setUsername(storedUsername);
  }, [setLocation]);

  useEffect(() => {
    if (isConnected) {
      send("list_rooms", {});
      
      const pollInterval = setInterval(() => {
        send("list_rooms", {});
      }, 3000);

      return () => clearInterval(pollInterval);
    }
  }, [isConnected, send]);

  useEffect(() => {
    if (gameState && gameState.roomCode) {
      // Force reload to game page when gameState is available
      window.location.replace("/game");
    }
  }, [gameState]);

  const handleJoinRoom = (roomCode: string, hasPassword: boolean) => {
    if (hasPassword) {
      const password = prompt("Bu oda şifreli. Lütfen şifreyi girin:");
      if (!password) return;
      
      send("join_room", {
        roomCode,
        username,
        password,
        playerId: localStorage.getItem("katmannames_player_id") || undefined,
      });
    } else {
      send("join_room", {
        roomCode,
        username,
        playerId: localStorage.getItem("katmannames_player_id") || undefined,
      });
    }
  };

  const getPhaseText = (phase: string) => {
    switch (phase) {
      case "lobby":
        return "Beklemede";
      case "playing":
        return "Oynanıyor";
      case "ended":
        return "Bitti";
      default:
        return phase;
    }
  };

  return (
    <div className="h-screen bg-slate-900 relative overflow-hidden flex flex-col">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50" 
        style={{ backgroundImage: 'url(/arkaplan.png)' }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />

      {/* Codenames Theme - Corner Gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-red-900/30 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-900/30 to-transparent rounded-full blur-3xl" />

      {/* Minimal Particles */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1} opacity-50`} />
      ))}

      {/* Light Effects */}
      <div className="light-effect light-1" />
      <div className="light-effect light-2" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-5xl relative">
          {/* Main Card with Glassmorphism */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-xl blur-xl" />
          <div className="relative backdrop-blur-xl bg-black/40 rounded-xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 flex flex-col h-full">
              {/* Header with Animated Logo */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-3 mb-2">
                  <div className="w-2 h-12 bg-gradient-to-b from-blue-600 to-blue-400 rounded-full animate-pulse" />
                  <h1 className="katman-logo text-5xl font-black">
                    KATMANNAMES
                  </h1>
                  <div className="w-2 h-12 bg-gradient-to-b from-red-600 to-red-400 rounded-full animate-pulse" />
                </div>
                <p className="text-sm text-slate-400">
                  Bir odaya katıl veya yeni oda oluştur
                </p>
              </div>

              {/* Action Buttons with Team Colors */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="group relative px-6 py-4 rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  data-testid="button-create-room"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-800/80 to-blue-900/80 backdrop-blur-sm" />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-600/20 group-hover:from-blue-400/20" />
                  <div className="absolute inset-0 border border-blue-400/30 group-hover:border-blue-400/50 rounded-lg" />
                  <div className="relative flex items-center justify-center gap-2 text-white font-bold">
                    <Plus className="w-5 h-5" />
                    <span>Yeni Oda Oluştur</span>
                  </div>
                </button>

                <button 
                  onClick={() => setShowJoinModal(true)}
                  className="group relative px-6 py-4 rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  data-testid="button-join-room"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-800/80 to-red-900/80 backdrop-blur-sm" />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-red-600/20 group-hover:from-red-400/20" />
                  <div className="absolute inset-0 border border-red-400/30 group-hover:border-red-400/50 rounded-lg" />
                  <div className="relative flex items-center justify-center gap-2 text-white font-bold">
                    <LogIn className="w-5 h-5" />
                    <span>Oda Kodu ile Katıl</span>
                  </div>
                </button>
              </div>

              {/* Room List Section */}
              <div className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                {roomsList.length === 0 ? (
                  <div className="text-center py-16">
                    <Home className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                    <p className="text-slate-400 font-medium">Henüz aktif oda yok</p>
                    <p className="text-xs text-slate-500 mt-2">İlk odayı sen oluştur!</p>
                  </div>
                ) : (
                  roomsList.map((room: RoomListItem) => (
                    <div 
                      key={room.roomCode}
                      className="group relative backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:scale-[1.01] active:scale-[0.99]"
                      onClick={() => handleJoinRoom(room.roomCode, room.hasPassword)}
                      data-testid={`room-card-${room.roomCode}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Player Count */}
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" />
                            <span className="text-lg font-semibold text-white">{room.playerCount} Oyuncu</span>
                          </div>

                          {/* Password Badge */}
                          {room.hasPassword && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-400/30">
                              <Shield className="w-3 h-3 text-amber-400" />
                              <span className="text-xs text-amber-300 font-medium">Şifreli</span>
                            </div>
                          )}

                          {/* Phase Badge */}
                          <div className={`flex items-center gap-1 px-3 py-1 rounded-full ${
                            room.phase === "lobby" 
                              ? "bg-green-500/20 border border-green-400/30" 
                              : room.phase === "playing"
                              ? "bg-blue-500/20 border border-blue-400/30"
                              : "bg-gray-500/20 border border-gray-400/30"
                          }`}>
                            {room.phase === "playing" && <Play className="w-3 h-3 text-blue-300" />}
                            <span className={`text-xs font-medium ${
                              room.phase === "lobby" 
                                ? "text-green-300" 
                                : room.phase === "playing"
                                ? "text-blue-300"
                                : "text-gray-300"
                            }`}>
                              {getPhaseText(room.phase)}
                            </span>
                          </div>
                        </div>

                        {/* Join Button */}
                        <button 
                          className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-blue-600 text-white font-bold text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/30 active:scale-95"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinRoom(room.roomCode, room.hasPassword);
                          }}
                          data-testid={`button-join-${room.roomCode}`}
                        >
                          Katıl
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <CreateRoomModal 
          username={username}
          onClose={() => setShowCreateModal(false)}
          send={send}
        />
      )}

      {showJoinModal && (
        <JoinRoomModal 
          username={username}
          onClose={() => setShowJoinModal(false)}
          send={send}
        />
      )}
    </div>
  );
}

interface ModalProps {
  username: string;
  onClose: () => void;
  send: (type: string, payload: any) => void;
}

function CreateRoomModal({ username, onClose, send }: ModalProps) {
  const [password, setPassword] = useState("");
  const [hasPassword, setHasPassword] = useState(false);

  const handleCreate = () => {
    send("create_room", {
      username,
      password: hasPassword ? password : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl">
      <div className="w-full max-w-md relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-400/20 rounded-xl blur-xl" />
        <div className="relative backdrop-blur-xl bg-black/60 rounded-xl border border-blue-400/30 shadow-2xl">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300 mb-4">
              Yeni Oda Oluştur
            </h2>
          
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  id="hasPassword"
                  checked={hasPassword}
                  onChange={(e) => setHasPassword(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-transparent text-blue-400 focus:ring-blue-400"
                  data-testid="checkbox-password"
                />
                <label htmlFor="hasPassword" className="text-slate-300 cursor-pointer">
                  Şifreli oda oluştur
                </label>
              </div>

              {hasPassword && (
                <div>
                  <label className="block text-sm font-medium text-blue-300 mb-2">
                    Oda Şifresi
                  </label>
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifre girin"
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    data-testid="input-room-password"
                  />
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={onClose}
                  className="group relative flex-1 px-4 py-3 rounded-lg overflow-hidden transition-all duration-300"
                  data-testid="button-cancel-create"
                >
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                  <div className="absolute inset-0 border border-white/20 group-hover:border-white/30 rounded-lg" />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 group-hover:from-white/10 group-hover:to-white/5" />
                  <span className="relative text-white font-medium">İptal</span>
                </button>
                <button 
                  onClick={handleCreate}
                  className="group relative flex-1 px-4 py-3 rounded-lg overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={hasPassword && !password}
                  data-testid="button-confirm-create"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-800/80 to-blue-900/80 backdrop-blur-sm" />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-blue-600/20 group-hover:from-blue-400/20" />
                  <div className="absolute inset-0 border border-blue-400/30 group-hover:border-blue-400/50 rounded-lg" />
                  <span className="relative text-white font-bold">Oluştur</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JoinRoomModal({ username, onClose, send }: ModalProps) {
  const [roomCode, setRoomCode] = useState("");
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);

  const handleJoin = () => {
    if (!roomCode.trim()) return;

    send("join_room", {
      roomCode: roomCode.toUpperCase(),
      username,
      password: needsPassword ? password : undefined,
      playerId: localStorage.getItem("katmannames_player_id") || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl">
      <div className="w-full max-w-md relative">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-400/20 rounded-xl blur-xl" />
        <div className="relative backdrop-blur-xl bg-black/60 rounded-xl border border-red-400/30 shadow-2xl">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-300 mb-4">
              Oda Kodu ile Katıl
            </h2>
          
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-red-300 mb-2">
                  Oda Kodu
                </label>
                <input 
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="Örn: ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg text-white text-center text-2xl font-bold placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  data-testid="input-room-code"
                />
              </div>

              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  id="needsPassword"
                  checked={needsPassword}
                  onChange={(e) => setNeedsPassword(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-transparent text-red-400 focus:ring-red-400"
                  data-testid="checkbox-needs-password"
                />
                <label htmlFor="needsPassword" className="text-slate-300 cursor-pointer">
                  Oda şifreli
                </label>
              </div>

              {needsPassword && (
                <div>
                  <label className="block text-sm font-medium text-red-300 mb-2">
                    Oda Şifresi
                  </label>
                  <input 
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifre girin"
                    className="w-full px-4 py-3 bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                    data-testid="input-join-password"
                  />
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button 
                  onClick={onClose}
                  className="group relative flex-1 px-4 py-3 rounded-lg overflow-hidden transition-all duration-300"
                  data-testid="button-cancel-join"
                >
                  <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
                  <div className="absolute inset-0 border border-white/20 group-hover:border-white/30 rounded-lg" />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-white/5 group-hover:from-white/10 group-hover:to-white/5" />
                  <span className="relative text-white font-medium">İptal</span>
                </button>
                <button 
                  onClick={handleJoin}
                  className="group relative flex-1 px-4 py-3 rounded-lg overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!roomCode.trim() || (needsPassword && !password)}
                  data-testid="button-confirm-join"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-800/80 to-red-900/80 backdrop-blur-sm" />
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-red-600/20 group-hover:from-red-400/20" />
                  <div className="absolute inset-0 border border-red-400/30 group-hover:border-red-400/50 rounded-lg" />
                  <span className="relative text-white font-bold">Katıl</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}