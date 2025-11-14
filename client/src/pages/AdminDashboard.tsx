import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shield, 
  Users, 
  Gamepad2, 
  Home,
  LogOut,
  RefreshCw,
  User,
  Crown,
  Bot as BotIcon,
  Wifi,
  WifiOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdminOverview {
  totalRooms: number;
  totalPlayers: number;
  activeGames: number;
  lobbyRooms: number;
}

interface AdminRoomSummary {
  roomCode: string;
  hasPassword: boolean;
  playerCount: number;
  gamePhase: string;
  darkScore: number;
  lightScore: number;
  currentTurn?: string;
  cardsRevealed: number;
  createdAt: string;
}

interface AdminPlayerInfo {
  id: string;
  name: string;
  roomCode: string;
  team?: string;
  role?: string;
  isRoomOwner: boolean;
  isBot: boolean;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [rooms, setRooms] = useState<AdminRoomSummary[]>([]);
  const [players, setPlayers] = useState<AdminPlayerInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Get token from localStorage
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      setLocation("/admin");
      return;
    }

    const connectWebSocket = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      ws.current = new WebSocket(wsUrl);
      
      ws.current.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        
        // Send admin authentication
        ws.current?.send(JSON.stringify({
          type: "admin_connect",
          payload: { token }
        }));
      };
      
      ws.current.onmessage = (event) => {
        const message = JSON.parse(event.data);
        
        if (message.type === "admin_data") {
          const { overview, rooms, players } = message.payload;
          setOverview(overview);
          setRooms(rooms);
          setPlayers(players);
          setLastUpdated(new Date());
          setIsLoading(false);
        } else if (message.type === "error") {
          setError(message.payload.message);
          if (message.payload.message === "Geçersiz admin oturumu") {
            localStorage.removeItem("adminToken");
            setLocation("/admin");
          }
        }
      };
      
      ws.current.onerror = () => {
        setError("WebSocket bağlantı hatası");
        setIsConnected(false);
      };
      
      ws.current.onclose = () => {
        setIsConnected(false);
        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          reconnectTimeout.current = setTimeout(() => {
            connectWebSocket();
          }, 2000 * reconnectAttempts.current);
        } else {
          setError("Bağlantı kurulamadı. Lütfen sayfayı yenileyin.");
        }
      };
    };
    
    connectWebSocket();
    
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [token]);


  const handleLogout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    localStorage.removeItem("adminToken");
    if (ws.current) {
      ws.current.close();
    }
    setLocation("/admin");
  };

  const handleRefresh = () => {
    // Send request for fresh data through WebSocket
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: "admin_connect",
        payload: { token }
      }));
    }
  };

  const getPhaseDisplay = (phase: string) => {
    switch (phase) {
      case "lobby": return { text: "Lobi", color: "bg-yellow-500" };
      case "introduction": return { text: "Tanışma", color: "bg-purple-500" };
      case "playing": return { text: "Oyunda", color: "bg-green-500" };
      case "ended": return { text: "Bitti", color: "bg-gray-500" };
      default: return { text: phase, color: "bg-gray-500" };
    }
  };

  const getTeamDisplay = (team?: string) => {
    if (!team || team === "none") return { text: "Seçilmedi", color: "text-gray-400" };
    if (team === "dark") return { text: "Koyu", color: "text-blue-400" };
    if (team === "light") return { text: "Açık", color: "text-red-400" };
    return { text: team, color: "text-gray-400" };
  };

  const getRoleDisplay = (role?: string) => {
    if (!role || role === "none") return "Seçilmedi";
    if (role === "spymaster") return "Şef";
    if (role === "guesser") return "Ajan";
    return role;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Shield className="w-12 h-12 text-purple-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Header */}
      <div className="backdrop-blur-xl bg-black/40 border-b border-white/10 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Admin Paneli</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <div className="flex items-center gap-1 text-xs text-green-400">
                    <Wifi className="w-3 h-3" />
                    <span>Bağlı</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-red-400">
                    <WifiOff className="w-3 h-3" />
                    <span>Bağlantı Yok</span>
                  </div>
                )}
                {lastUpdated && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Son güncelleme:</span>
                    <span className="text-slate-300">
                      {lastUpdated.toLocaleTimeString('tr-TR')}
                    </span>
                  </div>
                )}
              </div>
              
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="border-white/20 hover:bg-white/10"
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="border-white/20 hover:bg-white/10"
                data-testid="button-logout"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Çıkış
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {error && (
          <Card className="mb-6 backdrop-blur-xl bg-red-900/20 border-red-600/50">
            <CardContent className="p-4">
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Overview Cards */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="backdrop-blur-xl bg-black/40 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    Toplam Oda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Home className="w-8 h-8 text-purple-400" />
                    <span className="text-3xl font-bold text-white">
                      {overview.totalRooms}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="backdrop-blur-xl bg-black/40 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    Toplam Oyuncu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Users className="w-8 h-8 text-blue-400" />
                    <span className="text-3xl font-bold text-white">
                      {overview.totalPlayers}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="backdrop-blur-xl bg-black/40 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    Aktif Oyunlar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Gamepad2 className="w-8 h-8 text-green-400" />
                    <span className="text-3xl font-bold text-white">
                      {overview.activeGames}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="backdrop-blur-xl bg-black/40 border-white/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-slate-400">
                    Lobi Odaları
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Home className="w-8 h-8 text-yellow-400" />
                    <span className="text-3xl font-bold text-white">
                      {overview.lobbyRooms}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Rooms Table */}
        <Card className="backdrop-blur-xl bg-black/40 border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Aktif Odalar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 text-slate-400 font-medium">Kod</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Durum</th>
                    <th className="text-center py-2 text-slate-400 font-medium">Oyuncular</th>
                    <th className="text-center py-2 text-slate-400 font-medium">Skor</th>
                    <th className="text-center py-2 text-slate-400 font-medium">Açılan</th>
                    <th className="text-left py-2 text-slate-400 font-medium">Şifre</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {rooms.map((room, index) => {
                      const phase = getPhaseDisplay(room.gamePhase);
                      return (
                        <motion.tr
                          key={room.roomCode}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-white/5 hover:bg-white/5"
                          data-testid={`room-row-${room.roomCode}`}
                        >
                          <td className="py-2 text-white font-mono">{room.roomCode}</td>
                          <td className="py-2">
                            <Badge className={`${phase.color} text-white border-0`}>
                              {phase.text}
                            </Badge>
                          </td>
                          <td className="py-2 text-center text-slate-300">{room.playerCount}</td>
                          <td className="py-2 text-center">
                            {room.gamePhase === "playing" && (
                              <span className="text-slate-300">
                                <span className="text-blue-400">{room.darkScore}</span>
                                {" - "}
                                <span className="text-red-400">{room.lightScore}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-center text-slate-300">
                            {room.cardsRevealed > 0 ? room.cardsRevealed : "-"}
                          </td>
                          <td className="py-2">
                            {room.hasPassword && (
                              <Badge className="bg-emerald-500 text-white border-0">
                                Şifreli
                              </Badge>
                            )}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
              {rooms.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  Aktif oda bulunmuyor
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Players Table - Grouped by Room */}
        <Card className="backdrop-blur-xl bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Odalara Göre Aktif Oyuncular</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              {(() => {
                // Group players by room
                const playersByRoom = players.reduce((acc, player) => {
                  if (!acc[player.roomCode]) {
                    acc[player.roomCode] = [];
                  }
                  acc[player.roomCode].push(player);
                  return acc;
                }, {} as Record<string, typeof players>);
                
                const roomCodes = Object.keys(playersByRoom).sort();
                
                if (roomCodes.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-400">
                      Aktif oyuncu bulunmuyor
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-4">
                    <AnimatePresence>
                      {roomCodes.map((roomCode, roomIndex) => {
                        const room = rooms.find(r => r.roomCode === roomCode);
                        const phase = room ? getPhaseDisplay(room.gamePhase) : null;
                        
                        return (
                          <motion.div
                            key={roomCode}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ delay: roomIndex * 0.1 }}
                            className="border border-white/10 rounded-lg overflow-hidden"
                          >
                            {/* Room Header */}
                            <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 px-4 py-3 border-b border-white/10">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Home className="w-4 h-4 text-purple-400" />
                                    <span className="font-mono text-white font-semibold text-lg">
                                      {roomCode}
                                    </span>
                                  </div>
                                  {phase && (
                                    <Badge className={`${phase.color} text-white border-0`}>
                                      {phase.text}
                                    </Badge>
                                  )}
                                  {room?.hasPassword && (
                                    <Badge className="bg-emerald-500 text-white border-0">
                                      Şifreli
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                  {room && room.gamePhase === "playing" && (
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-400">Skor:</span>
                                      <span className="text-blue-400 font-semibold">{room.darkScore}</span>
                                      <span className="text-slate-400">-</span>
                                      <span className="text-red-400 font-semibold">{room.lightScore}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    <span className="text-slate-300">
                                      {playersByRoom[roomCode].length} Oyuncu
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Players in Room */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-white/5">
                                    <th className="text-left px-4 py-2 text-slate-400 font-medium">İsim</th>
                                    <th className="text-left px-4 py-2 text-slate-400 font-medium">Takım</th>
                                    <th className="text-left px-4 py-2 text-slate-400 font-medium">Rol</th>
                                    <th className="text-center px-4 py-2 text-slate-400 font-medium">Özellikler</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {playersByRoom[roomCode].map((player, index) => {
                                    const team = getTeamDisplay(player.team);
                                    return (
                                      <motion.tr
                                        key={player.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.02 }}
                                        className="border-b border-white/5 hover:bg-white/5"
                                        data-testid={`player-row-${player.id}`}
                                      >
                                        <td className="px-4 py-2 text-white">
                                          <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-slate-400" />
                                            {player.name}
                                          </div>
                                        </td>
                                        <td className={`px-4 py-2 ${team.color}`}>
                                          {team.text}
                                        </td>
                                        <td className="px-4 py-2 text-slate-300">
                                          {getRoleDisplay(player.role)}
                                        </td>
                                        <td className="px-4 py-2">
                                          <div className="flex items-center justify-center gap-1">
                                            {player.isRoomOwner && (
                                              <Badge className="bg-yellow-500 text-white border-0">
                                                <Crown className="w-3 h-3 mr-1" />
                                                Sahip
                                              </Badge>
                                            )}
                                            {player.isBot && (
                                              <Badge className="bg-gray-500 text-white border-0">
                                                <BotIcon className="w-3 h-3 mr-1" />
                                                Bot
                                              </Badge>
                                            )}
                                          </div>
                                        </td>
                                      </motion.tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                );
              })()}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}