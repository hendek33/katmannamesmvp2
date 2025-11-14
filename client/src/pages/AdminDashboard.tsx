import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  WifiOff,
  Search,
  Filter,
  Activity,
  Clock,
  AlertCircle,
  TrendingUp,
  UserPlus,
  UserMinus,
  Copy,
  CheckCircle2,
  Eye,
  EyeOff,
  Award,
  UserCheck,
  Timer,
  Calendar,
  Trophy
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

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

interface RoomHistory {
  historyId: string;
  roomCode: string;
  createdAt: number;
  endedAt?: number;
  status: "active" | "ended" | "abandoned";
  maxPlayerCount: number;
  totalPlayers: string[];
  playerNames: Record<string, string>;
  gamePhases: string[];
  hasPassword: boolean;
  darkTeamName: string;
  lightTeamName: string;
  chaosMode: boolean;
  timedMode: boolean;
  finalScores?: { dark: number; light: number; winner?: string | null };
  gameDuration?: number;
}

interface HistoryStats {
  totalGamesPlayed: number;
  averageDuration: number;
  totalPlayersServed: number;
  gamesInLast24Hours: number;
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [rooms, setRooms] = useState<AdminRoomSummary[]>([]);
  const [players, setPlayers] = useState<AdminPlayerInfo[]>([]);
  const [roomHistory, setRoomHistory] = useState<RoomHistory[]>([]);
  const [historyStats, setHistoryStats] = useState<HistoryStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPhase, setFilterPhase] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("overview");
  const [copiedRoom, setCopiedRoom] = useState<string | null>(null);
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
        console.log("Admin WebSocket connected");
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
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === "admin_data") {
            setOverview(data.payload.overview);
            setRooms(data.payload.rooms);
            setPlayers(data.payload.players);
            setLastUpdated(new Date());
            setIsLoading(false);
          } else if (data.type === "error") {
            setError(data.payload.message);
            if (data.payload.message === "Geçersiz admin oturumu") {
              localStorage.removeItem("adminToken");
              setLocation("/admin");
            }
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };
      
      ws.current.onerror = (error) => {
        console.error("Admin WebSocket error:", error);
        setError("Bağlantı hatası");
        setIsConnected(false);
      };
      
      ws.current.onclose = () => {
        console.log("Admin WebSocket disconnected");
        setIsConnected(false);
        
        // Attempt reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            console.log(`Reconnection attempt ${reconnectAttempts.current}`);
            connectWebSocket();
          }, 3000);
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

  // Fetch history data when history tab is selected
  useEffect(() => {
    if (activeTab === 'history' && token) {
      // Fetch history data
      fetch('/api/admin/history?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setRoomHistory(data);
          }
        })
        .catch(err => {
          console.error('Failed to fetch room history:', err);
          toast({
            title: "Hata",
            description: "Oyun geçmişi yüklenemedi",
            variant: "destructive"
          });
        });

      // Fetch history stats
      fetch('/api/admin/history-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          setHistoryStats(data);
        })
        .catch(err => {
          console.error('Failed to fetch history stats:', err);
        });
    }
  }, [activeTab, token, toast]);

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
      case "lobby": return { text: "Lobi", color: "bg-yellow-500", icon: Clock };
      case "introduction": return { text: "Tanışma", color: "bg-purple-500", icon: UserPlus };
      case "playing": return { text: "Oyunda", color: "bg-green-500", icon: Activity };
      case "ended": return { text: "Bitti", color: "bg-gray-500", icon: CheckCircle2 };
      default: return { text: phase, color: "bg-gray-500", icon: AlertCircle };
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

  const copyRoomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedRoom(code);
    toast({
      title: "Kopyalandı!",
      description: `Oda kodu ${code} panoya kopyalandı.`,
    });
    setTimeout(() => setCopiedRoom(null), 2000);
  };

  // Filter rooms based on search and phase
  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.roomCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.playerCount.toString().includes(searchTerm);
    const matchesPhase = filterPhase === "all" || room.gamePhase === filterPhase;
    return matchesSearch && matchesPhase;
  });

  // Filter players based on search
  const filteredPlayers = players.filter(player =>
    player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.roomCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate statistics
  const stats = {
    avgPlayersPerRoom: rooms.length > 0 ? (players.length / rooms.length).toFixed(1) : "0",
    gamesInProgress: rooms.filter(r => r.gamePhase === "playing").length,
    totalBots: players.filter(p => p.isBot).length,
    recentActivity: rooms.filter(r => {
      const created = new Date(r.createdAt);
      const now = new Date();
      return (now.getTime() - created.getTime()) < 3600000; // Last hour
    }).length
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
      <div className="backdrop-blur-xl bg-black/40 border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Yönetim Merkezi</h1>
                  <p className="text-xs text-slate-400">Katmannames Admin Paneli</p>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Oda kodu veya oyuncu ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-black/40 border-white/20 text-white placeholder:text-slate-500 focus:border-purple-500 transition-colors"
                  data-testid="input-search"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <div className="flex items-center gap-1 text-xs text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span>Canlı Bağlantı</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-red-400">
                    <div className="w-2 h-2 bg-red-400 rounded-full" />
                    <span>Bağlantı Yok</span>
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
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6 backdrop-blur-xl bg-red-900/20 border-red-600/50">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-400">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Quick Stats - Always Visible */}
        {overview && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-900/20 to-purple-600/20 border-purple-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-purple-300 mb-1">Toplam Oda</p>
                      <p className="text-2xl font-bold text-white">{overview.totalRooms}</p>
                    </div>
                    <Home className="w-8 h-8 text-purple-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-900/20 to-blue-600/20 border-blue-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-300 mb-1">Toplam Oyuncu</p>
                      <p className="text-2xl font-bold text-white">{overview.totalPlayers}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="backdrop-blur-xl bg-gradient-to-br from-green-900/20 to-green-600/20 border-green-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-300 mb-1">Aktif Oyunlar</p>
                      <p className="text-2xl font-bold text-white">{stats.gamesInProgress}</p>
                    </div>
                    <Gamepad2 className="w-8 h-8 text-green-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="backdrop-blur-xl bg-gradient-to-br from-amber-900/20 to-amber-600/20 border-amber-500/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-amber-300 mb-1">Bot Sayısı</p>
                      <p className="text-2xl font-bold text-white">{stats.totalBots}</p>
                    </div>
                    <BotIcon className="w-8 h-8 text-amber-400 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto bg-black/40 backdrop-blur-xl p-1">
            <TabsTrigger value="rooms" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Home className="w-4 h-4 mr-2" />
              Odalar
            </TabsTrigger>
            <TabsTrigger value="players" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Users className="w-4 h-4 mr-2" />
              Oyuncular
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
              <Clock className="w-4 h-4 mr-2" />
              Geçmiş
            </TabsTrigger>
          </TabsList>

          {/* Rooms Tab */}
          <TabsContent value="rooms" className="space-y-6">
            {/* Filter Bar */}
            <div className="flex items-center gap-4">
              <Select value={filterPhase} onValueChange={setFilterPhase}>
                <SelectTrigger className="w-48 bg-black/40 border-white/20 text-white">
                  <SelectValue placeholder="Durum Filtresi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="lobby">Lobi</SelectItem>
                  <SelectItem value="introduction">Tanışma</SelectItem>
                  <SelectItem value="playing">Oyunda</SelectItem>
                  <SelectItem value="ended">Bitti</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-sm text-slate-400">
                {filteredRooms.length} oda gösteriliyor
              </div>
            </div>

            {/* Rooms Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredRooms.map((room, index) => {
                  const phase = getPhaseDisplay(room.gamePhase);
                  const PhaseIcon = phase.icon;
                  return (
                    <motion.div
                      key={room.roomCode}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="backdrop-blur-xl bg-black/40 border-white/10 hover:border-purple-500/50 transition-all">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-mono text-white font-bold">
                                {room.roomCode}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyRoomCode(room.roomCode)}
                                className="h-6 w-6 p-0"
                              >
                                {copiedRoom === room.roomCode ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4 text-slate-400" />
                                )}
                              </Button>
                            </div>
                            <Badge className={`${phase.color} text-white border-0 flex items-center gap-1`}>
                              <PhaseIcon className="w-3 h-3" />
                              {phase.text}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Oyuncular:</span>
                            <span className="text-white font-semibold">{room.playerCount}</span>
                          </div>
                          {room.gamePhase === "playing" && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Skor:</span>
                              <div>
                                <span className="text-blue-400 font-semibold">{room.darkScore}</span>
                                <span className="text-slate-400 mx-1">-</span>
                                <span className="text-red-400 font-semibold">{room.lightScore}</span>
                              </div>
                            </div>
                          )}
                          {room.cardsRevealed > 0 && (
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-400">Açılan Kart:</span>
                              <span className="text-white">{room.cardsRevealed}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 pt-2">
                            {room.hasPassword && (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/50">
                                <Eye className="w-3 h-3 mr-1" />
                                Şifreli
                              </Badge>
                            )}
                            <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/50 text-xs">
                              {new Date(room.createdAt).toLocaleTimeString('tr-TR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            
            {filteredRooms.length === 0 && (
              <Card className="backdrop-blur-xl bg-black/40 border-white/10">
                <CardContent className="p-12 text-center">
                  <Home className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400 text-lg">Aktif oda bulunmuyor</p>
                  <p className="text-slate-500 text-sm mt-2">Oyuncular oda oluşturduğunda burada görünecek</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Players Tab */}
          <TabsContent value="players" className="space-y-6">
            <div className="text-sm text-slate-400 mb-4">
              {filteredPlayers.length} oyuncu gösteriliyor
            </div>

            {/* Players by Room */}
            <div className="space-y-4">
              {(() => {
                // Group players by room
                const playersByRoom = filteredPlayers.reduce((acc, player) => {
                  if (!acc[player.roomCode]) {
                    acc[player.roomCode] = [];
                  }
                  acc[player.roomCode].push(player);
                  return acc;
                }, {} as Record<string, typeof players>);
                
                const roomCodes = Object.keys(playersByRoom).sort();
                
                if (roomCodes.length === 0) {
                  return (
                    <Card className="backdrop-blur-xl bg-black/40 border-white/10">
                      <CardContent className="p-12 text-center">
                        <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400 text-lg">Aktif oyuncu bulunmuyor</p>
                        <p className="text-slate-500 text-sm mt-2">Oyuncular oyuna katıldığında burada görünecek</p>
                      </CardContent>
                    </Card>
                  );
                }
                
                return (
                  <AnimatePresence>
                    {roomCodes.map((roomCode, roomIndex) => {
                      const room = rooms.find(r => r.roomCode === roomCode);
                      const phase = room ? getPhaseDisplay(room.gamePhase) : null;
                      const PhaseIcon = phase?.icon || AlertCircle;
                      
                      return (
                        <motion.div
                          key={roomCode}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ delay: roomIndex * 0.1 }}
                        >
                          <Card className="backdrop-blur-xl bg-black/40 border-white/10 overflow-hidden">
                            {/* Room Header */}
                            <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 px-4 py-3 border-b border-white/10">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <Home className="w-4 h-4 text-purple-400" />
                                    <span className="font-mono text-white font-semibold text-lg">
                                      {roomCode}
                                    </span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => copyRoomCode(roomCode)}
                                      className="h-6 w-6 p-0"
                                    >
                                      {copiedRoom === roomCode ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-400" />
                                      ) : (
                                        <Copy className="w-4 h-4 text-slate-400" />
                                      )}
                                    </Button>
                                  </div>
                                  {phase && (
                                    <Badge className={`${phase.color} text-white border-0 flex items-center gap-1`}>
                                      <PhaseIcon className="w-3 h-3" />
                                      {phase.text}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-slate-300">
                                  <Users className="w-4 h-4 text-slate-400" />
                                  {playersByRoom[roomCode].length} Oyuncu
                                </div>
                              </div>
                            </div>
                            
                            {/* Players Grid */}
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                              {playersByRoom[roomCode].map((player, index) => {
                                const team = getTeamDisplay(player.team);
                                return (
                                  <motion.div
                                    key={player.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.02 }}
                                    className="bg-black/30 rounded-lg p-3 border border-white/5"
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-slate-400" />
                                        <span className="text-white font-medium">{player.name}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {player.isRoomOwner && (
                                          <Crown className="w-4 h-4 text-yellow-400" />
                                        )}
                                        {player.isBot && (
                                          <BotIcon className="w-4 h-4 text-gray-400" />
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm">
                                      <span className={team.color}>
                                        {team.text}
                                      </span>
                                      <span className="text-slate-400">
                                        {getRoleDisplay(player.role)}
                                      </span>
                                    </div>
                                  </motion.div>
                                );
                              })}
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                );
              })()}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            {/* History Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="backdrop-blur-xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Oyun</CardTitle>
                    <Trophy className="h-4 w-4 text-yellow-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{historyStats?.totalGamesPlayed || 0}</div>
                    <p className="text-xs text-muted-foreground">Tüm zamanlar</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="backdrop-blur-xl bg-gradient-to-br from-green-900/20 to-cyan-900/20 border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Benzersiz Oyuncular</CardTitle>
                    <UserCheck className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{historyStats?.totalPlayersServed || 0}</div>
                    <p className="text-xs text-muted-foreground">Toplam katılım</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="backdrop-blur-xl bg-gradient-to-br from-blue-900/20 to-indigo-900/20 border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ortalama Süre</CardTitle>
                    <Timer className="h-4 w-4 text-blue-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {historyStats?.averageDuration 
                        ? `${Math.round(historyStats.averageDuration / 60000)} dk`
                        : "0 dk"}
                    </div>
                    <p className="text-xs text-muted-foreground">Oyun başına</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="backdrop-blur-xl bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-white/10">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Son 24 Saat</CardTitle>
                    <Activity className="h-4 w-4 text-amber-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{historyStats?.gamesInLast24Hours || 0}</div>
                    <p className="text-xs text-muted-foreground">Oyun sayısı</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* History List */}
            <Card className="backdrop-blur-xl bg-black/40 border-white/10">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-xl">Oyun Geçmişi</CardTitle>
                <p className="text-sm text-slate-400">Son 100 oyun kaydı</p>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {roomHistory.length === 0 ? (
                    <div className="p-12 text-center">
                      <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 text-lg">Henüz oyun geçmişi bulunmuyor</p>
                      <p className="text-slate-500 text-sm mt-2">Oynanan oyunlar burada görünecek</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5">
                      {roomHistory.map((history, index) => {
                        const duration = history.gameDuration 
                          ? Math.round(history.gameDuration / 60000) 
                          : 0;
                        const winnerTeam = history.finalScores?.winner === 'dark' 
                          ? history.darkTeamName
                          : history.finalScores?.winner === 'light'
                          ? history.lightTeamName
                          : null;
                        
                        return (
                          <motion.div
                            key={history.historyId}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="p-4 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                  <span className="text-lg font-bold text-purple-400">
                                    {history.roomCode}
                                  </span>
                                  {history.hasPassword && (
                                    <Badge variant="outline" className="text-xs">
                                      <Shield className="w-3 h-3 mr-1" />
                                      Şifreli
                                    </Badge>
                                  )}
                                  {history.chaosMode && (
                                    <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-xs">
                                      Kaos
                                    </Badge>
                                  )}
                                  {history.status === 'ended' ? (
                                    <Badge className="bg-green-600/20 text-green-400">
                                      Tamamlandı
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-yellow-600/20 text-yellow-400">
                                      Terk Edildi
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-slate-400">
                                    <Users className="w-4 h-4 inline mr-1" />
                                    {history.maxPlayerCount} oyuncu
                                  </span>
                                  <span className="text-slate-400">
                                    <Timer className="w-4 h-4 inline mr-1" />
                                    {duration} dakika
                                  </span>
                                  <span className="text-slate-400">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    {new Date(history.createdAt).toLocaleString('tr-TR', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                
                                {history.finalScores && (
                                  <div className="flex items-center gap-4">
                                    <span className="text-blue-400">
                                      {history.darkTeamName}: {history.finalScores.dark}
                                    </span>
                                    <span className="text-slate-400">-</span>
                                    <span className="text-red-400">
                                      {history.lightTeamName}: {history.finalScores.light}
                                    </span>
                                    {winnerTeam && (
                                      <Badge className="bg-yellow-600/20 text-yellow-400">
                                        <Trophy className="w-3 h-3 mr-1" />
                                        {winnerTeam} Kazandı
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}