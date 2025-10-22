import { type Player, type Team } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Crown, Eye, Target, Edit2, Check, X } from "lucide-react";
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
  onRemoveBot
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
      // Team names are mandatory - ensure there's always a name
      const finalName = editedName.trim() || (team === "dark" ? "Katman Koyu" : "Katman Açık");
      if (onTeamNameChange) {
        onTeamNameChange(team, finalName);
      }
      setIsEditing(false);
    };

    const hasSpymaster = teamPlayers.some(p => p.role === "spymaster");
    const needsSpymaster = teamPlayers.length > 0 && !hasSpymaster;
    
    return (
    <Card className={`p-2 space-y-2 border-2 transition-all bg-slate-800 ${
      team === "dark" 
        ? "border-blue-600/50 hover:border-blue-500/70" 
        : "border-red-600/50 hover:border-red-500/70"
    } ${needsSpymaster && isLobby ? "ring-2 ring-amber-500/20" : ""}`}>
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
                placeholder="Takım ismi"
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
              <h3 className="font-bold text-sm sm:text-base">{title}</h3>
              {isLobby && onTeamNameChange && (
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
      
      {/* Warning if team needs spymaster */}
      {needsSpymaster && isLobby && teamPlayers.length > 0 && (
        <div className="text-xs text-amber-500 bg-amber-500/10 p-2 rounded flex items-center gap-1">
          <Eye className="w-3 h-3" />
          Bu takıma bir İstihbarat Şefi gerekli!
        </div>
      )}
      
      <div className="grid grid-cols-3 gap-1">
        {teamPlayers.map(player => (
          <div 
            key={player.id}
            data-testid={`player-${player.id}`}
            className={`flex flex-col items-center p-1.5 rounded transition-all ${
              player.id === currentPlayerId 
                ? 'bg-accent/20 border border-accent/30 shadow-sm' 
                : 'bg-black/20 hover:bg-black/30'
            }`}
          >
            {/* Owner Crown */}
            {player.isRoomOwner && (
              <Crown className="w-3 h-3 text-yellow-500 mb-0.5" />
            )}
            
            {/* Username */}
            <span className="text-[10px] font-medium text-center truncate w-full">
              {player.username}
            </span>
            
            {/* Role Badge */}
            <div className="flex flex-col items-center gap-0.5">
              {player.role === "spymaster" ? (
                <Eye className="w-3 h-3 text-amber-500" />
              ) : (
                <Target className="w-3 h-3 text-muted-foreground" />
              )}
              
              {/* Role Toggle for Current Player */}
              {isLobby && player.id === currentPlayerId && onRoleToggle && (
                <button 
                  onClick={onRoleToggle}
                  className="text-[8px] text-muted-foreground hover:text-white underline"
                  data-testid="button-toggle-role"
                >
                  değiştir
                </button>
              )}
              
              {/* Remove Bot Button */}
              {isLobby && player.isBot && currentPlayer?.isRoomOwner && onRemoveBot && (
                <button 
                  onClick={() => onRemoveBot(player.id)}
                  className="text-[8px] text-red-500 hover:text-red-700"
                  data-testid={`button-remove-bot-${player.id}`}
                >
                  kaldır
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
    );
  };

  return (
    <div className="h-full flex flex-col gap-2">
      <div className="flex items-center gap-2 text-muted-foreground px-1">
        <Users className="w-3 h-3" />
        <span className="text-xs font-semibold">Oyuncular ({players.length})</span>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2">

      {noTeam.length > 0 && (
        <Card className="p-2 space-y-1 border-2 border-dashed border-amber-500/30 bg-slate-800">
          <h3 className="font-bold text-xs text-amber-600">Takım Seçilmemiş ({noTeam.length})</h3>
          <div className="space-y-1">
            {noTeam.map(player => (
              <div 
                key={player.id}
                data-testid={`player-${player.id}`}
                className="flex items-center gap-2 p-1 rounded bg-amber-500/10 border border-amber-500/20"
              >
                {player.isRoomOwner && <Crown className="w-3 h-3 text-yellow-500" />}
                <span className="text-sm font-medium">{player.username}</span>
                {player.id === currentPlayerId && (
                  <Badge variant="outline" className="text-xs px-2 h-5 ml-auto">
                    Sen
                  </Badge>
                )}
              </div>
            ))}
          </div>
          {noTeam.some(p => p.id === currentPlayerId) && onTeamSelect && (
            <div className="text-xs text-amber-600 font-medium">
              ⬇ Aşağıdaki takımlardan birini seç
            </div>
          )}
        </Card>
      )}

        <TeamSection 
          team="dark"
          title={darkTeamName}
          players={darkTeam}
          gradient="bg-gradient-to-r from-blue-600 to-blue-400"
        />
        
        <TeamSection 
          team="light"
          title={lightTeamName}
          players={lightTeam}
          gradient="bg-gradient-to-r from-red-600 to-red-400"
        />
      </div>
    </div>
  );
}
