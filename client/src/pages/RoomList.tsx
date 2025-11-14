import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import type { RoomListItem } from "@shared/schema";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Lock, Users, Play, Home, Plus, LogIn, Crown } from "lucide-react";
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

      <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 sm:p-6">
        {/* Main container - darker glassmorphism */}
        <div className="w-full max-w-5xl">
          {/* Darker header */}
          <div className="backdrop-blur-md bg-slate-900/60 rounded-t-2xl border border-slate-700/30 p-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Home className="w-6 h-6 text-slate-300" />
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-100">
                Oyun Odaları
              </h1>
            </div>
            <p className="text-center text-sm text-slate-400">
              Bir odaya katıl veya yeni oda oluştur
            </p>
          </div>

          {/* Content area - darker glass effect */}
          <div className="backdrop-blur bg-slate-900/40 border-x border-b border-slate-700/30 rounded-b-2xl">
            <div className="p-4 sm:p-6 flex flex-col h-full">
              {/* Darker action buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="rounded-lg p-4 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800/70 transition-colors duration-200 text-slate-200 font-semibold"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" />
                    <span>Yeni Oda Oluştur</span>
                  </div>
                </button>
                
                <button
                  onClick={() => setShowJoinModal(true)}
                  className="rounded-lg p-4 bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800/70 transition-colors duration-200 text-slate-200 font-semibold"
                >
                  <div className="flex items-center justify-center gap-2">
                    <LogIn className="w-5 h-5" />
                    <span>Oda Kodu ile Katıl</span>
                  </div>
                </button>
              </div>

              {/* Room list - darker */}
              <div className="flex-1 space-y-3 overflow-y-auto pr-2 min-h-0 max-h-[500px]">
                {roomsList.length === 0 ? (
                  <div className="bg-slate-800/30 rounded-lg border border-slate-700/40 p-12 text-center">
                    <Home className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                    <p className="text-lg font-semibold text-slate-300 mb-2">Henüz aktif oda yok</p>
                    <p className="text-sm text-slate-500">İlk odayı sen oluştur ve arkadaşlarını davet et!</p>
                  </div>
                ) : (
                  roomsList.map((room: RoomListItem & { ownerName?: string }) => (
                    <div
                      key={room.roomCode}
                      className="bg-slate-800/40 rounded-lg border border-slate-700/40 hover:bg-slate-800/60 transition-colors duration-200 cursor-pointer"
                      onClick={() => handleJoinRoom(room.roomCode, room.hasPassword)}
                    >
                      <div className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        {/* Left side - Room info */}
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Room owner */}
                          <div className="flex items-center gap-2">
                            <Crown className="w-4 h-4 text-amber-600" />
                            <span className="text-base font-bold text-slate-200">
                              {room.ownerName ? `${room.ownerName}'in Odası` : "Oda"}
                            </span>
                          </div>
                          
                          {/* Player count */}
                          <div className="flex items-center gap-1 text-sm text-slate-400">
                            <Users className="w-4 h-4" />
                            <span>{room.playerCount} Oyuncu</span>
                          </div>
                          
                          {/* Password indicator */}
                          {room.hasPassword && (
                            <div className="flex items-center gap-1 text-sm text-amber-600">
                              <Lock className="w-3 h-3" />
                              <span className="text-xs">Şifreli</span>
                            </div>
                          )}
                        </div>

                        {/* Right side - Status and join button */}
                        <div className="flex items-center gap-3 self-end sm:self-auto">
                          {/* Darker phase badge */}
                          <div className={`
                            px-3 py-1 rounded text-xs font-medium
                            ${room.phase === "lobby" 
                              ? "bg-emerald-900/40 text-emerald-400" 
                              : room.phase === "playing"
                              ? "bg-blue-900/40 text-blue-400"
                              : "bg-slate-800/50 text-slate-500"
                            }
                          `}>
                            {getPhaseText(room.phase)}
                          </div>
                          
                          {/* Darker join button */}
                          <button
                            className="px-4 py-2 rounded bg-slate-700/50 hover:bg-slate-700/70 text-slate-200 font-medium text-sm transition-colors duration-200"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-md">
        <div className="rounded-lg backdrop-blur bg-slate-900/95 border border-slate-700/50">
          {/* Darker modal header */}
          <div className="p-6 pb-0">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-slate-300" />
              <h2 className="text-xl font-semibold text-slate-100">
                Yeni Oda Oluştur
              </h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Darker password checkbox */}
            <div className="flex items-center gap-3">
              <input 
                type="checkbox"
                id="hasPassword"
                checked={hasPassword}
                onChange={(e) => setHasPassword(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="hasPassword" className="text-slate-300 flex items-center gap-2 cursor-pointer">
                <Lock className="w-4 h-4 text-slate-400" />
                Şifreli oda oluştur
              </label>
            </div>

            {/* Darker password input */}
            {hasPassword && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Oda Şifresi
                </label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Güvenli bir şifre girin"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
                />
              </div>
            )}

            {/* Darker action buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded bg-slate-800/50 text-slate-200 hover:bg-slate-800/70 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleCreate}
                disabled={hasPassword && !password}
                className="flex-1 py-2 rounded bg-blue-700/70 text-slate-100 hover:bg-blue-700/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div className="w-full max-w-md">
        <div className="rounded-lg backdrop-blur bg-slate-900/95 border border-slate-700/50">
          {/* Darker modal header */}
          <div className="p-6 pb-0">
            <div className="flex items-center justify-center gap-2 mb-4">
              <LogIn className="w-5 h-5 text-slate-300" />
              <h2 className="text-xl font-semibold text-slate-100">
                Oda Kodu ile Katıl
              </h2>
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Darker room code input */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Oda Kodu
              </label>
              <input 
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toLocaleUpperCase('tr-TR'))}
                placeholder="ABC123"
                maxLength={6}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded text-slate-100 text-center text-2xl font-bold tracking-wider placeholder-slate-500 focus:outline-none focus:border-slate-600"
              />
            </div>

            {/* Darker password checkbox */}
            <div className="flex items-center gap-3">
              <input 
                type="checkbox"
                id="needsPassword"
                checked={needsPassword}
                onChange={(e) => setNeedsPassword(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="needsPassword" className="text-slate-300 flex items-center gap-2 cursor-pointer">
                <Lock className="w-4 h-4 text-slate-400" />
                Oda şifreli
              </label>
            </div>

            {/* Darker password input */}
            {needsPassword && (
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  Oda Şifresi
                </label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifre girin"
                  className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-600"
                />
              </div>
            )}

            {/* Darker action buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded bg-slate-800/50 text-slate-200 hover:bg-slate-800/70 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleJoin}
                disabled={!roomCode.trim() || (needsPassword && !password)}
                className="flex-1 py-2 rounded bg-red-700/70 text-slate-100 hover:bg-red-700/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
