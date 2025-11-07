import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import type { RoomListItem } from "@shared/schema";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Lock, Users, Play } from "lucide-react";
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

      {/* Reduced Particles for better performance */}
      {[...Array(15)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1}`} />
      ))}

      {/* Reduced Light Effects */}
      <div className="light-effect light-1" />
      <div className="light-effect light-2" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center p-4 sm:p-6">
        <Card className="w-full max-w-5xl bg-slate-900/90 backdrop-blur-lg border-orange-900/30 shadow-2xl flex flex-col max-h-[90vh]">
          <div className="p-4 sm:p-6 flex flex-col h-full">
            <h1 className="text-2xl sm:text-3xl font-bold text-center text-white mb-1">
              Odalar
            </h1>
            <p className="text-center text-xs sm:text-sm text-slate-300 mb-4">
              Bir odaya katıl veya yeni oda oluştur
            </p>

            <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4">
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold h-10 sm:h-12 text-sm sm:text-base"
              >
                Yeni Oda Oluştur
              </Button>
              <Button 
                onClick={() => setShowJoinModal(true)}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold h-10 sm:h-12 text-sm sm:text-base"
              >
                Oda Kodu ile Katıl
              </Button>
            </div>

            {/* Hata mesajları kaldırıldı
            {error && (
              <div className="bg-red-500/20 border border-red-500 rounded p-3 mb-4">
                <p className="text-red-500 text-sm font-medium">{error}</p>
              </div>
            )}
            */}

            <div className="flex-1 space-y-2 overflow-y-auto pr-1 min-h-0">
              {roomsList.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="text-5xl mb-4">🏠</div>
                  <p className="text-sm">Henüz aktif oda yok</p>
                  <p className="text-xs mt-2">İlk odayı sen oluştur!</p>
                </div>
              ) : (
                roomsList.map((room: RoomListItem & { ownerName?: string }) => (
                  <Card 
                    key={room.roomCode}
                    className="bg-slate-800/80 border-slate-700 hover:bg-slate-800 transition-all cursor-pointer group"
                    onClick={() => handleJoinRoom(room.roomCode, room.hasPassword)}
                  >
                    <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-bold text-white">
                            {room.ownerName ? `${room.ownerName}'in Odası` : "Oda"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Users className="w-4 h-4 text-orange-400" />
                          <span className="text-sm font-semibold text-white">{room.playerCount} Oyuncu</span>
                        </div>
                        {room.hasPassword && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Lock className="w-3 h-3" />
                            <span className="text-xs">Şifreli</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          room.phase === "lobby" 
                            ? "bg-green-900/50 text-green-300" 
                            : room.phase === "playing"
                            ? "bg-blue-900/50 text-blue-300"
                            : "bg-gray-900/50 text-gray-300"
                        }`}>
                          {room.phase === "lobby" && <span className="mr-1">●</span>}
                          {room.phase === "playing" && <Play className="w-3 h-3 inline mr-1" />}
                          {getPhaseText(room.phase)}
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-orange-600 hover:bg-orange-700 h-8 px-3 group-hover:scale-105 transition-transform"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleJoinRoom(room.roomCode, room.hasPassword);
                          }}
                        >
                          Katıl
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </Card>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-slate-900/95 border-orange-900/30">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Yeni Oda Oluştur</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="hasPassword"
                checked={hasPassword}
                onChange={(e) => setHasPassword(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="hasPassword" className="text-slate-300">
                Şifreli oda oluştur
              </label>
            </div>

            {hasPassword && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Oda Şifresi
                </label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifre girin"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button 
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                İptal
              </Button>
              <Button 
                onClick={handleCreate}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={hasPassword && !password}
              >
                Oluştur
              </Button>
            </div>
          </div>
        </div>
      </Card>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-slate-900/95 border-orange-900/30">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Oda Kodu ile Katıl</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Oda Kodu
              </label>
              <input 
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toLocaleUpperCase('tr-TR'))}
                placeholder="Örn: ABC123"
                maxLength={6}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="needsPassword"
                checked={needsPassword}
                onChange={(e) => setNeedsPassword(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="needsPassword" className="text-slate-300">
                Oda şifreli
              </label>
            </div>

            {needsPassword && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Oda Şifresi
                </label>
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifre girin"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button 
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                İptal
              </Button>
              <Button 
                onClick={handleJoin}
                className="flex-1 bg-red-600 hover:bg-red-700"
                disabled={!roomCode.trim() || (needsPassword && !password)}
              >
                Katıl
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
