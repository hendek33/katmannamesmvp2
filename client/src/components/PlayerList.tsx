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

    return (
    <Card className="p-2 sm:p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 flex-1">
          <div className={`w-2 h-2 rounded-full ${gradient}`} />
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
              <h3 className="font-semibold text-xs sm:text-sm">{title}</h3>
              {isLobby && onTeamNameChange && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0"
                  onClick={() => {
                    setEditedName(title);
                    setIsEditing(true);
                  }}
                >
                  <Edit2 className="w-2.5 h-2.5" />
                </Button>
              )}
            </>
          )}
          <Badge variant="secondary" className="text-[10px] px-1 h-4">
            {teamPlayers.length}
          </Badge>
        </div>
        {isLobby && currentPlayer?.team !== team && onTeamSelect && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onTeamSelect(team)}
            className="text-[10px] h-6 px-2"
            data-testid={`button-join-${team}`}
          >
            Katıl
          </Button>
        )}
      </div>
      
      <div className="space-y-1">
        {teamPlayers.map(player => (
          <div 
            key={player.id}
            data-testid={`player-${player.id}`}
            className={`flex items-center gap-1 p-1.5 rounded ${
              player.id === currentPlayerId ? 'bg-accent/20 border border-accent/30' : 'bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {player.isRoomOwner && <Crown className="w-3 h-3 text-yellow-500 flex-shrink-0" />}
              <span className="text-xs font-medium truncate">{player.username}</span>
            </div>
            
            <div className="flex items-center gap-0.5 flex-shrink-0">
              {player.role === "spymaster" ? (
                <Badge variant="default" className="text-[10px] gap-0.5 px-1 py-0 h-5">
                  <Eye className="w-2.5 h-2.5" />
                  <span className="hidden sm:inline">İstihbarat</span> Şefi
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-[10px] gap-0.5 px-1 py-0 h-5">
                  <Target className="w-2.5 h-2.5" />
                  Ajan
                </Badge>
              )}
              
              {isLobby && player.id === currentPlayerId && onRoleToggle && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-5 px-1 text-[10px]"
                  onClick={onRoleToggle}
                  data-testid="button-toggle-role"
                >
                  Değiştir
                </Button>
              )}
              
              {/* Remove button for bots */}
              {isLobby && player.isBot && currentPlayer?.isRoomOwner && onRemoveBot && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-5 w-5 p-0 text-red-500 hover:text-red-700"
                  onClick={() => onRemoveBot(player.id)}
                  data-testid={`button-remove-bot-${player.id}`}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
    );
  };

  return (
    <div className="space-y-2 h-full overflow-y-auto">
      <div className="flex items-center gap-1.5 text-muted-foreground px-2">
        <Users className="w-3 h-3" />
        <span className="text-xs font-medium">Oyuncular ({players.length})</span>
      </div>

      {noTeam.length > 0 && (
        <Card className="p-2 space-y-1 border-dashed">
          <h3 className="font-semibold text-xs text-muted-foreground">Takım Seçilmemiş</h3>
          {noTeam.map(player => (
            <div 
              key={player.id}
              data-testid={`player-${player.id}`}
              className="flex items-center gap-1 p-1.5 rounded bg-muted/30"
            >
              {player.isRoomOwner && <Crown className="w-3 h-3 text-yellow-500" />}
              <span className="text-xs">{player.username}</span>
            </div>
          ))}
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
  );
}
