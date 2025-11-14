import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import type { RoomListItem } from "@shared/schema";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Lock, Users, Play, Home, Plus, LogIn, Sparkles, Crown, Shield, Gamepad2 } from "lucide-react";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { useToast } from "@/hooks/use-toast";

export default function RoomList() {
  const [, setLocation] = useLocation();
  const { isConnected, send, gameState, roomsList, error } = useWebSocketContext();
  const { toast } = useToast();
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
    
    // Check if this is first visit to rooms page
    const isFirstRoomsVisit = !sessionStorage.getItem("katmannames_rooms_visited");
    if (isFirstRoomsVisit) {
      sessionStorage.setItem("katmannames_rooms_visited", "true");
      window.location.reload();
    }
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
    if (gameState) {
      setLocation("/game");
    }
  }, [gameState, setLocation]);

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
    <div className="h-screen relative overflow-hidden flex flex-col">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
        style={{ backgroundImage: 'url(/arkaplan.webp)' }}
      />

      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-transparent to-amber-900/30 animate-gradient" />
      
      {/* Enhanced Particles */}
      {[...Array(25)].map((_, i) => (
        <div 
          key={i} 
          className={`particle particle-${i + 1}`}
          style={{
            animationDelay: `${i * 0.2}s`,
            left: `${Math.random() * 100}%`,
            animationDuration: `${20 + Math.random() * 20}s`
          }}
        />
      ))}

      {/* Enhanced Light Effects */}
      <div className="light-effect light-1" style={{ animationDuration: '8s' }} />
      <div className="light-effect light-2" style={{ animationDuration: '10s' }} />
      <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 sm:p-6">
        {/* Main glassmorphism container */}
        <div className="w-full max-w-5xl animate-fadeIn">
          {/* Header with glassmorphism */}
          <div className="backdrop-blur-xl bg-gradient-to-r from-purple-900/40 to-amber-900/40 rounded-t-2xl border border-white/20 p-6 shadow-2xl">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-gradient-to-br from-purple-600 to-amber-600 shadow-lg">
                <Home className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-200 to-amber-200">
                Oyun Odaları
              </h1>
              <div className="p-2 rounded-full bg-gradient-to-br from-amber-600 to-purple-600 shadow-lg">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-center text-sm text-white/80 backdrop-blur-sm">
              <Sparkles className="inline w-4 h-4 mr-1 text-amber-400" />
              Bir odaya katıl veya yeni oda oluştur
              <Sparkles className="inline w-4 h-4 ml-1 text-purple-400" />
            </p>
          </div>

          {/* Content area with glassmorphism */}
          <div className="backdrop-blur-xl bg-slate-900/50 border-x border-b border-white/10 rounded-b-2xl shadow-2xl">
            <div className="p-4 sm:p-6 flex flex-col h-full">
              {/* Action buttons with glassmorphism */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="group relative overflow-hidden rounded-xl p-4 backdrop-blur-md bg-gradient-to-br from-blue-600/30 to-purple-600/30 border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-2 text-white font-semibold">
                    <Plus className="w-5 h-5" />
                    <span>Yeni Oda Oluştur</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="group relative overflow-hidden rounded-xl p-4 backdrop-blur-md bg-gradient-to-br from-red-600/30 to-orange-600/30 border border-white/20 hover:border-white/40 transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-400/20 to-orange-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-2 text-white font-semibold">
                    <LogIn className="w-5 h-5" />
                    <span>Oda Kodu ile Katıl</span>
                  </div>
                </button>
              </div>

              {/* Room list with enhanced glassmorphism */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 min-h-0 max-h-[500px]">
                {roomsList.length === 0 ? (
                  <div className="backdrop-blur-md bg-white/5 rounded-xl border border-white/10 p-12 text-center">
                    <div className="animate-bounce mb-4">
                      <Home className="w-16 h-16 mx-auto text-purple-400" />
                    </div>
                    <p className="text-lg font-semibold text-white/90 mb-2">Henüz aktif oda yok</p>
                    <p className="text-sm text-white/60">İlk odayı sen oluştur ve arkadaşlarını davet et!</p>
                  </div>
                ) : (
                  roomsList.map((room: RoomListItem & { ownerName?: string }) => (
                    <div
                      key={room.roomCode}
                      className="group relative overflow-hidden backdrop-blur-md bg-gradient-to-r from-slate-800/40 to-slate-700/40 rounded-xl border border-white/10 hover:border-white/30 transition-all duration-300 transform hover:scale-[1.01] hover:shadow-xl cursor-pointer animate-slideInUp"
                      onClick={() => handleJoinRoom(room.roomCode, room.hasPassword)}
                    >
                      {/* Animated gradient background on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="relative p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        {/* Left side - Room info */}
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Room owner */}
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/30 to-amber-500/30 backdrop-blur-sm">
                              <Crown className="w-4 h-4 text-amber-300" />
                            </div>
                            <span className="text-base font-bold text-white">
                              {room.ownerName ? `${room.ownerName}'in Odası` : "Oda"}
                            </span>
                          </div>
                          
                          {/* Player count */}
                          <div className="flex items-center gap-2 px-3 py-1 rounded-lg backdrop-blur-sm bg-white/10">
                            <Users className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm font-semibold text-white">{room.playerCount} Oyuncu</span>
                          </div>
                          
                          {/* Password indicator */}
                          {room.hasPassword && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-sm bg-yellow-500/20 border border-yellow-500/30">
                              <Shield className="w-3 h-3 text-yellow-400" />
                              <span className="text-xs text-yellow-300 font-medium">Şifreli</span>
                            </div>
                          )}
                        </div>

                        {/* Right side - Status and join button */}
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          {/* Phase badge with glassmorphism */}
                          <div className={`
                            px-3 py-1.5 rounded-lg backdrop-blur-sm font-medium text-xs
                            ${room.phase === "lobby" 
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                              : room.phase === "playing"
                              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                              : "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                            }
                          `}>
                            <div className="flex items-center gap-1.5">
                              {room.phase === "lobby" && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                              {room.phase === "playing" && <Play className="w-3 h-3" />}
                              {getPhaseText(room.phase)}
                            </div>
                          </div>
                          
                          {/* Join button with glassmorphism */}
                          <button
                            className="px-4 py-2 rounded-lg backdrop-blur-sm bg-gradient-to-r from-orange-500/30 to-red-500/30 border border-orange-500/30 hover:border-orange-400/50 text-white font-semibold text-sm transition-all duration-300 transform group-hover:scale-105 hover:shadow-lg"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinRoom(room.roomCode, room.hasPassword);
                            }}
                          >
                            Katıl
                          </button>
                        </div>
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

function CreateRoomModal({ username, onClose, send }: { 
  username: string; 
  onClose: () => void; 
  send: (type: string, payload: any) => void;
}) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md transform animate-slideInUp">
        <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-white/20 shadow-2xl">
          {/* Modal header with gradient */}
          <div className="relative p-6 pb-0">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
            <div className="relative flex items-center justify-center gap-2 mb-4">
              <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg">
                <Plus className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
                Yeni Oda Oluştur
              </h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Password checkbox with glassmorphism */}
            <div className="flex items-center gap-3 p-3 rounded-lg backdrop-blur-sm bg-white/5 border border-white/10">
              <input 
                type="checkbox"
                id="hasPassword"
                checked={hasPassword}
                onChange={(e) => setHasPassword(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500"
              />
              <label htmlFor="hasPassword" className="text-white/80 font-medium flex items-center gap-2 cursor-pointer">
                <Shield className="w-4 h-4 text-yellow-400" />
                Şifreli oda oluştur
              </label>
            </div>

            {/* Password input with animation */}
            {hasPassword && (
              <div className="animate-slideInUp">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Oda Şifresi
                </label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Güvenli bir şifre girin"
                  className="w-full px-4 py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-purple-400 focus:bg-white/15 transition-all duration-300"
                />
              </div>
            )}

            {/* Action buttons with glassmorphism */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-lg backdrop-blur-sm bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all duration-300"
              >
                İptal
              </button>
              <button
                onClick={handleCreate}
                disabled={hasPassword && !password}
                className="flex-1 py-3 rounded-lg backdrop-blur-sm bg-gradient-to-r from-blue-500/50 to-purple-500/50 border border-white/20 text-white font-semibold hover:from-blue-500/70 hover:to-purple-500/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Oluştur
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function JoinRoomModal({ username, onClose, send }: { 
  username: string; 
  onClose: () => void; 
  send: (type: string, payload: any) => void;
}) {
  const [roomCode, setRoomCode] = useState("");
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);

  const handleJoin = () => {
    if (!roomCode.trim()) return;

    send("join_room", {
      roomCode: roomCode.toLocaleUpperCase('tr-TR'),
      username,
      password: needsPassword ? password : undefined,
      playerId: localStorage.getItem("katmannames_player_id") || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md transform animate-slideInUp">
        <div className="relative overflow-hidden rounded-2xl backdrop-blur-xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border border-white/20 shadow-2xl">
          {/* Modal header with gradient */}
          <div className="relative p-6 pb-0">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-orange-600/20" />
            <div className="relative flex items-center justify-center gap-2 mb-4">
              <div className="p-2 rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-lg">
                <LogIn className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-200 to-orange-200">
                Oda Kodu ile Katıl
              </h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Room code input with glassmorphism */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">
                Oda Kodu
              </label>
              <input 
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toLocaleUpperCase('tr-TR'))}
                placeholder="ABC123"
                maxLength={6}
                className="w-full px-4 py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg text-white text-center text-2xl font-bold tracking-wider placeholder-white/40 focus:outline-none focus:border-orange-400 focus:bg-white/15 transition-all duration-300"
              />
            </div>

            {/* Password checkbox with glassmorphism */}
            <div className="flex items-center gap-3 p-3 rounded-lg backdrop-blur-sm bg-white/5 border border-white/10">
              <input 
                type="checkbox"
                id="needsPassword"
                checked={needsPassword}
                onChange={(e) => setNeedsPassword(e.target.checked)}
                className="w-5 h-5 rounded border-white/20 bg-white/10 text-orange-500 focus:ring-orange-500"
              />
              <label htmlFor="needsPassword" className="text-white/80 font-medium flex items-center gap-2 cursor-pointer">
                <Shield className="w-4 h-4 text-yellow-400" />
                Oda şifreli
              </label>
            </div>

            {/* Password input with animation */}
            {needsPassword && (
              <div className="animate-slideInUp">
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Oda Şifresi
                </label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifre girin"
                  className="w-full px-4 py-3 backdrop-blur-sm bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-orange-400 focus:bg-white/15 transition-all duration-300"
                />
              </div>
            )}

            {/* Action buttons with glassmorphism */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-lg backdrop-blur-sm bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-all duration-300"
              >
                İptal
              </button>
              <button
                onClick={handleJoin}
                disabled={!roomCode.trim() || (needsPassword && !password)}
                className="flex-1 py-3 rounded-lg backdrop-blur-sm bg-gradient-to-r from-red-500/50 to-orange-500/50 border border-white/20 text-white font-semibold hover:from-red-500/70 hover:to-orange-500/70 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Katıl
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
