import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import type { RoomListItem } from "@shared/schema";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Lock, Users, Play } from "lucide-react";

export default function RoomList() {
  const [, setLocation] = useLocation();
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [username, setUsername] = useState("");
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem("username");
    if (!storedUsername) {
      setLocation("/");
      return;
    }
    setUsername(storedUsername);
  }, [setLocation]);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      websocket.send(JSON.stringify({ type: "list_rooms", payload: {} }));
      setWs(websocket);
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === "rooms_list") {
          setRooms(message.payload.rooms);
        } else if (message.type === "room_created") {
          localStorage.setItem("roomCode", message.payload.roomCode);
          localStorage.setItem("playerId", message.payload.playerId);
          setLocation("/lobby");
        } else if (message.type === "room_joined") {
          const roomCode = message.payload.gameState.roomCode;
          localStorage.setItem("roomCode", roomCode);
          localStorage.setItem("playerId", message.payload.playerId);
          setLocation("/lobby");
        } else if (message.type === "error") {
          alert(message.payload.message);
        }
      } catch (error) {
        console.error("Message parse error:", error);
      }
    };

    const pollInterval = setInterval(() => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ type: "list_rooms", payload: {} }));
      }
    }, 3000);

    return () => {
      clearInterval(pollInterval);
      websocket.close();
    };
  }, [setLocation]);

  const handleJoinRoom = (roomCode: string, hasPassword: boolean) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    if (hasPassword) {
      const password = prompt("Bu oda şifreli. Lütfen şifreyi girin:");
      if (!password) return;
      
      ws.send(JSON.stringify({
        type: "join_room",
        payload: {
          roomCode,
          username,
          password,
          playerId: localStorage.getItem("playerId") || undefined,
        }
      }));
    } else {
      ws.send(JSON.stringify({
        type: "join_room",
        payload: {
          roomCode,
          username,
          playerId: localStorage.getItem("playerId") || undefined,
        }
      }));
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
    <div className="min-h-screen relative overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
        style={{ backgroundImage: 'url(/arkaplan.png)' }}
      />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 70 }).map((_, i) => {
          const colors = ['bg-orange-600', 'bg-blue-500', 'bg-blue-600', 'bg-amber-400'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          const size = Math.random() * 4 + 2;
          const left = Math.random() * 100;
          const top = Math.random() * 100;
          const animationPattern = Math.floor(Math.random() * 10) + 1;
          const delay = -(Math.random() * 16 + 5);
          
          return (
            <div
              key={i}
              className={`absolute ${color} rounded-full opacity-60`}
              style={{
                width: `${size}px`,
                height: `${size}px`,
                left: `${left}%`,
                top: `${top}%`,
                animation: `moveRandomly${animationPattern} ${Math.random() * 4 + 8}s infinite alternate`,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[800px] h-[800px] rounded-full bg-gradient-radial from-orange-600/40 to-transparent blur-[80px] -left-48 top-1/4 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-radial from-blue-600/30 to-transparent blur-[80px] right-0 top-0 animate-pulse" style={{ animationDuration: '10s' }} />
        <div className="absolute w-[700px] h-[700px] rounded-full bg-gradient-radial from-amber-400/20 to-transparent blur-[80px] left-1/3 bottom-0 animate-[pulse_12s_infinite]" />
        <div className="absolute w-[500px] h-[500px] rounded-full bg-gradient-radial from-orange-500/30 to-transparent blur-[80px] right-1/4 bottom-1/4 animate-[rotate_10s_linear_infinite]" />
        <div className="absolute w-[600px] h-[600px] rounded-full bg-gradient-radial from-blue-500/25 to-transparent blur-[80px] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '9s' }} />
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-8">
        <Card className="w-full max-w-4xl bg-slate-900/90 backdrop-blur-lg border-orange-900/30 shadow-2xl">
          <div className="p-8">
            <h1 className="text-4xl font-bold text-center mb-2 text-white">
              Odalar
            </h1>
            <p className="text-center text-slate-300 mb-6">
              Bir odaya katıl veya yeni oda oluştur
            </p>

            <div className="flex gap-4 mb-6">
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
              >
                Yeni Oda Oluştur
              </Button>
              <Button 
                onClick={() => setShowJoinModal(true)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3"
              >
                Oda Kodu ile Katıl
              </Button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {rooms.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  Henüz aktif oda yok. İlk odayı sen oluştur!
                </div>
              ) : (
                rooms.map((room) => (
                  <Card 
                    key={room.roomCode}
                    className="bg-slate-800/60 border-slate-700 hover:bg-slate-800/80 transition-all cursor-pointer"
                    onClick={() => handleJoinRoom(room.roomCode, room.hasPassword)}
                  >
                    <div className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-orange-400">
                          {room.roomCode}
                        </div>
                        <div className="flex items-center gap-2 text-slate-300">
                          <Users size={18} />
                          <span>{room.playerCount} oyuncu</span>
                        </div>
                        {room.hasPassword && (
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Lock size={16} />
                            <span className="text-sm">Şifreli</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          room.phase === "lobby" 
                            ? "bg-green-900/50 text-green-300" 
                            : "bg-blue-900/50 text-blue-300"
                        }`}>
                          {room.phase === "lobby" && <span className="mr-1">●</span>}
                          {room.phase === "playing" && <Play size={14} className="inline mr-1" />}
                          {getPhaseText(room.phase)}
                        </div>
                        <Button 
                          size="sm" 
                          className="bg-orange-600 hover:bg-orange-700"
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

      {showCreateModal && ws && (
        <CreateRoomModal 
          username={username}
          onClose={() => setShowCreateModal(false)}
          ws={ws}
        />
      )}

      {showJoinModal && ws && (
        <JoinRoomModal 
          username={username}
          onClose={() => setShowJoinModal(false)}
          ws={ws}
        />
      )}
    </div>
  );
}

function CreateRoomModal({ username, onClose, ws }: { 
  username: string; 
  onClose: () => void; 
  ws: WebSocket;
}) {
  const [password, setPassword] = useState("");
  const [hasPassword, setHasPassword] = useState(false);

  const handleCreate = () => {
    ws.send(JSON.stringify({
      type: "create_room",
      payload: {
        username,
        password: hasPassword ? password : undefined,
      }
    }));
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

function JoinRoomModal({ username, onClose, ws }: { 
  username: string; 
  onClose: () => void; 
  ws: WebSocket;
}) {
  const [roomCode, setRoomCode] = useState("");
  const [password, setPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);

  const handleJoin = () => {
    if (!roomCode.trim()) return;

    ws.send(JSON.stringify({
      type: "join_room",
      payload: {
        roomCode: roomCode.toUpperCase(),
        username,
        password: needsPassword ? password : undefined,
        playerId: localStorage.getItem("playerId") || undefined,
      }
    }));
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
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
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
