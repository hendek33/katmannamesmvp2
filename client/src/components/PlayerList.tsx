import { type Player, type Team } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Crown, Eye, Target, Edit2, Check, X, WifiOff, UserX } from "lucide-react";
import { useState } from "react";

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
  onTeamSelect?: (team: Team) => void;
  onRoleToggle?: () => void;
  isLobby?: boolean;
  darkTeamName?: string;
  lightTeamName?: string;
  onTeamNameChange?: (team: Team, name: string) => void;
  onRemoveBot?: (botId: string) => void;
  onKickPlayer?: (playerId: string) => void;
}

export function PlayerList({ 
  players, 
  currentPlayerId, 
  onTeamSelect, 
  onRoleToggle,
  isLobby = false,
  darkTeamName = "Mavi Takım",
  lightTeamName = "Kırmızı Takım",
  onTeamNameChange,
  onRemoveBot,
  onKickPlayer
}: PlayerListProps) {
  const darkTeam = players.filter(p => p.team === "dark");
  const lightTeam = players.filter(p => p.team === "light");
  const noTeam = players.filter(p => p.team === null);
  
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  
  // Check if teams have required roles for game start
  const darkHasSpymaster = darkTeam.some(p => p.role === "spymaster");
  const lightHasSpymaster = lightTeam.some(p => p.role === "spymaster");

  const TeamSection = ({ team, title, players: teamPlayers, gradient }: { 
    team: Team; 
    title: string; 
    players: Player[];
    gradient: string;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedName, setEditedName] = useState(title);

    const handleSaveName = () => {
      // Don't save if empty
      if (!editedName.trim()) {
        setIsEditing(false);
        return;
      }
      if (onTeamNameChange) {
        onTeamNameChange(team, editedName.trim());
      }
      setIsEditing(false);
    };

    const hasSpymaster = teamPlayers.some(p => p.role === "spymaster");
    const needsSpymaster = teamPlayers.length > 0 && !hasSpymaster;
    
    return (
    <div className="relative group">
      <div className={`absolute inset-0 rounded-xl blur-xl transition-all ${
        team === "dark" 
          ? "bg-blue-600/20 group-hover:bg-blue-600/30" 
          : "bg-red-600/20 group-hover:bg-red-600/30"
      }`} />
      <div className={`relative backdrop-blur-xl bg-black/40 rounded-xl border transition-all shadow-2xl ${
        team === "dark" 
          ? "border-blue-700/30 hover:border-blue-600/40" 
          : "border-red-700/30 hover:border-red-600/40"
      } p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <div className={`w-3 h-3 rounded-full ${gradient}`} />
          {isLobby && isEditing ? (
            <div className="flex items-center gap-1 flex-1">
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                onBlur={handleSaveName}
                maxLength={20}
                className="h-6 text-xs font-semibold max-w-[120px]"
                placeholder="Takım ismi belirle"
                autoFocus
              />
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={handleSaveName}
              >
                <Check className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <>
              {isLobby && onTeamNameChange && (title === "Mavi Takım" || title === "Kırmızı Takım") ? (
                <button
                  className="text-sm sm:text-base text-slate-400 italic hover:text-slate-200 transition-colors cursor-pointer"
                  onClick={() => {
                    setEditedName("");
                    setIsEditing(true);
                  }}
                >
                  Takım ismi belirle
                </button>
              ) : (
                <h3 className="font-bold text-sm sm:text-base text-slate-100">{title}</h3>
              )}
              {isLobby && onTeamNameChange && !(title === "Mavi Takım" || title === "Kırmızı Takım") && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 opacity-70 hover:opacity-100"
                  onClick={() => {
                    setEditedName(title);
                    setIsEditing(true);
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              )}
            </>
          )}
          <Badge variant={needsSpymaster ? "destructive" : "secondary"} className="text-xs px-2 h-5">
            {teamPlayers.length} oyuncu
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {/* Show "Ajan Ol" button for spymasters in this team */}
          {isLobby && currentPlayer?.team === team && currentPlayer?.role === "spymaster" && onRoleToggle && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRoleToggle}
              className="h-7 px-3 text-xs border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 hover:border-blue-400/60"
              data-testid="button-become-agent"
            >
              <Target className="w-3 h-3 mr-1" />
              Ajan Ol
            </Button>
          )}
          {isLobby && currentPlayer?.team !== team && onTeamSelect && (
            <Button 
              size="sm" 
              variant={team === "dark" ? "default" : "destructive"}
              onClick={() => onTeamSelect(team)}
              className="h-7 px-2 text-xs"
              data-testid={`button-join-${team}`}
            >
              Katıl
            </Button>
          )}
        </div>
      </div>
      
      {/* Warning if team needs spymaster */}
      
      <div className="grid grid-cols-4 gap-1">
        {/* First cell - Spymaster spot */}
        {(() => {
          const spymaster = teamPlayers.find(p => p.role === "spymaster");
          const agents = teamPlayers.filter(p => p.role === "guesser");
          const allSlots = [];
          
          // First slot is always for spymaster
          if (spymaster) {
            allSlots.push(
              <div 
                key={spymaster.id}
                data-testid={`player-${spymaster.id}`}
                className={`flex flex-col items-center p-2 rounded bg-gradient-to-b from-amber-900/40 to-amber-800/30 border border-amber-600/50 ${
                  spymaster.id === currentPlayerId ? 'ring-2 ring-accent' : ''
                } ${(spymaster as any).isDisconnected ? 'opacity-50' : ''}`}
              >
                <Eye className="w-4 h-4 text-amber-500 mb-0.5" />
                <div className="flex items-center gap-1 justify-center w-full">
                  {(spymaster as any).isDisconnected && (
                    <WifiOff className="w-3 h-3 text-red-400" />
                  )}
                  {spymaster.isRoomOwner && (
                    <Crown className="w-3 h-3 text-yellow-500" />
                  )}
                  <span className="text-sm font-bold text-center truncate text-amber-200">
                    {spymaster.username}
                  </span>
                </div>
                {isLobby && spymaster.isBot && currentPlayer?.isRoomOwner && onRemoveBot && (
                  <button 
                    onClick={() => onRemoveBot(spymaster.id)}
                    className="text-[9px] text-red-400 hover:text-red-300 mt-0.5"
                    data-testid={`button-remove-bot-${spymaster.id}`}
                  >
                    kaldır
                  </button>
                )}
                {isLobby && !spymaster.isBot && currentPlayer?.isRoomOwner && spymaster.id !== currentPlayerId && onKickPlayer && (
                  <button 
                    onClick={() => onKickPlayer(spymaster.id)}
                    className="text-[9px] text-red-400 hover:text-red-300 mt-0.5 flex items-center gap-0.5"
                    data-testid={`button-kick-${spymaster.id}`}
                    title="Oyuncuyu at"
                  >
                    <UserX className="w-3 h-3" />
                    at
                  </button>
                )}
              </div>
            );
          } else {
            // Empty spymaster slot - clickable for current player to become spymaster
            allSlots.push(
              <div 
                key="empty-spymaster"
                className="flex flex-col items-center p-2 rounded bg-gradient-to-b from-amber-900/20 to-amber-800/10 border-2 border-dashed border-amber-600/30 hover:border-amber-500/50 transition-all cursor-pointer"
                onClick={() => {
                  if (isLobby && onRoleToggle) {
                    // If player is not in this team, first join the team
                    if (currentPlayer?.team !== team && onTeamSelect) {
                      onTeamSelect(team);
                    }
                    // Then become spymaster
                    if (currentPlayer?.role !== "spymaster") {
                      setTimeout(() => onRoleToggle(), 100);
                    }
                  }
                }}
              >
                <Eye className="w-4 h-4 text-amber-600/50 mb-0.5" />
                <span className="text-[10px] text-amber-600/70 text-center">
                  İstihbarat
                  <br />
                  Şefi Ol
                </span>
              </div>
            );
          }
          
          // Add agents to remaining slots
          agents.forEach(agent => {
            allSlots.push(
              <div 
                key={agent.id}
                data-testid={`player-${agent.id}`}
                className={`flex flex-col items-center p-2 rounded transition-all ${
                  agent.id === currentPlayerId 
                    ? 'bg-accent/20 border border-accent/30 shadow-sm' 
                    : 'bg-black/20 hover:bg-black/30'
                } ${(agent as any).isDisconnected ? 'opacity-50' : ''}`}
              >
                <Target className="w-3.5 h-3.5 text-muted-foreground mb-0.5" />
                <div className="flex items-center gap-1 justify-center w-full">
                  {(agent as any).isDisconnected && (
                    <WifiOff className="w-3 h-3 text-red-400" />
                  )}
                  {agent.isRoomOwner && (
                    <Crown className="w-3 h-3 text-yellow-500" />
                  )}
                  <span className="text-sm font-medium text-center truncate">
                    {agent.username}
                  </span>
                </div>
                {isLobby && agent.isBot && currentPlayer?.isRoomOwner && onRemoveBot && (
                  <button 
                    onClick={() => onRemoveBot(agent.id)}
                    className="text-[9px] text-red-400 hover:text-red-300 mt-0.5"
                    data-testid={`button-remove-bot-${agent.id}`}
                  >
                    kaldır
                  </button>
                )}
                {isLobby && !agent.isBot && currentPlayer?.isRoomOwner && agent.id !== currentPlayerId && onKickPlayer && (
                  <button 
                    onClick={() => onKickPlayer(agent.id)}
                    className="text-[9px] text-red-400 hover:text-red-300 mt-0.5 flex items-center gap-0.5"
                    data-testid={`button-kick-${agent.id}`}
                    title="Oyuncuyu at"
                  >
                    <UserX className="w-3 h-3" />
                    at
                  </button>
                )}
              </div>
            );
          });
          
          return allSlots;
        })()}
      </div>
      </div>
    </div>
    );
  };

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center gap-2 text-slate-400 px-1">
        <Users className="w-3 h-3" />
        <span className="text-xs font-semibold">Oyuncular ({players.length})</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2">

      {noTeam.length > 0 && (
        <div className="relative group">
          <div className="absolute inset-0 bg-amber-600/20 rounded-xl blur-lg group-hover:blur-xl transition-all" />
          <div className="relative backdrop-blur-xl bg-black/40 rounded-xl border-2 border-dashed border-amber-600/50 p-3 space-y-2 shadow-2xl">
          <h3 className="font-bold text-sm text-amber-400">Takım Seçilmemiş ({noTeam.length})</h3>
          <div className="grid grid-cols-5 gap-1">
            {noTeam.map(player => (
              <div 
                key={player.id}
                data-testid={`player-${player.id}`}
                className="flex items-center justify-center gap-0.5 p-1 rounded bg-amber-900/20 border border-amber-700/30"
              >
                {player.isRoomOwner && <Crown className="w-2.5 h-2.5 text-yellow-400" />}
                <span className="text-xs font-medium text-slate-200 text-center truncate">{player.username}</span>
                {player.id === currentPlayerId && <span className="text-[10px] text-amber-300 ml-0.5">(Sen)</span>}
              </div>
            ))}
          </div>
          </div>
        </div>
      )}

        <TeamSection 
          team="light"
          title={lightTeamName}
          players={lightTeam}
          gradient="bg-gradient-to-r from-red-600 to-red-400"
        />
        
        <TeamSection 
          team="dark"
          title={darkTeamName}
          players={darkTeam}
          gradient="bg-gradient-to-r from-blue-600 to-blue-400"
        />
      </div>
    </div>
  );
}
