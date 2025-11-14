import { useState, useEffect } from "react";
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
  Bot as BotIcon
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
  const [refreshKey, setRefreshKey] = useState(0);

  // Get token from localStorage
  const token = localStorage.getItem("adminToken");

  useEffect(() => {
    if (!token) {
      setLocation("/admin");
      return;
    }

    fetchAdminData();
  }, [token, refreshKey]);

  const fetchAdminData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all admin data in parallel
      const [overviewRes, roomsRes, playersRes] = await Promise.all([
        fetch("/api/admin/overview", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/admin/rooms", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/admin/players", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      // Check for auth errors
      if (overviewRes.status === 401 || roomsRes.status === 401 || playersRes.status === 401) {
        localStorage.removeItem("adminToken");
        setLocation("/admin");
        return;
      }

      if (!overviewRes.ok || !roomsRes.ok || !playersRes.ok) {
        throw new Error("Veri alınamadı");
      }

      const [overviewData, roomsData, playersData] = await Promise.all([
        overviewRes.json(),
        roomsRes.json(),
        playersRes.json()
      ]);

      setOverview(overviewData);
      setRooms(roomsData);
      setPlayers(playersData);
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    localStorage.removeItem("adminToken");
    setLocation("/admin");
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
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
            
            <div className="flex items-center gap-2">
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

        {/* Players Table */}
        <Card className="backdrop-blur-xl bg-black/40 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Aktif Oyuncular</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 text-slate-400 font-medium">İsim</th>
                      <th className="text-left py-2 text-slate-400 font-medium">Oda</th>
                      <th className="text-left py-2 text-slate-400 font-medium">Takım</th>
                      <th className="text-left py-2 text-slate-400 font-medium">Rol</th>
                      <th className="text-center py-2 text-slate-400 font-medium">Özellikler</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {players.map((player, index) => {
                        const team = getTeamDisplay(player.team);
                        return (
                          <motion.tr
                            key={player.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.02 }}
                            className="border-b border-white/5 hover:bg-white/5"
                            data-testid={`player-row-${player.id}`}
                          >
                            <td className="py-2 text-white flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              {player.name}
                            </td>
                            <td className="py-2 text-slate-300 font-mono">{player.roomCode}</td>
                            <td className={`py-2 ${team.color}`}>
                              {team.text}
                            </td>
                            <td className="py-2 text-slate-300">
                              {getRoleDisplay(player.role)}
                            </td>
                            <td className="py-2 text-center">
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
                    </AnimatePresence>
                  </tbody>
                </table>
                {players.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    Aktif oyuncu bulunmuyor
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}