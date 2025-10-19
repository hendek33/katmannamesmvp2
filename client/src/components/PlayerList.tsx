import { type Player, type Team } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Crown, Eye, Target } from "lucide-react";

interface PlayerListProps {
  players: Player[];
  currentPlayerId?: string;
  onTeamSelect?: (team: Team) => void;
  onRoleToggle?: () => void;
  isLobby?: boolean;
}

export function PlayerList({ 
  players, 
  currentPlayerId, 
  onTeamSelect, 
  onRoleToggle,
  isLobby = false 
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
  }) => (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${gradient}`} />
          <h3 className="font-semibold text-sm">{title}</h3>
          <Badge variant="secondary" className="text-xs">
            {teamPlayers.length}
          </Badge>
        </div>
        {isLobby && currentPlayer?.team !== team && onTeamSelect && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onTeamSelect(team)}
            data-testid={`button-join-${team}`}
          >
            Katıl
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {teamPlayers.map(player => (
          <div 
            key={player.id}
            data-testid={`player-${player.id}`}
            className={`flex items-center gap-2 p-2 rounded-md ${
              player.id === currentPlayerId ? 'bg-accent/20 border border-accent/30' : 'bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {player.isRoomOwner && <Crown className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
              <span className="text-sm font-medium truncate">{player.username}</span>
            </div>
            
            <div className="flex items-center gap-1 flex-shrink-0">
              {player.role === "spymaster" ? (
                <Badge variant="default" className="text-xs gap-1">
                  <Eye className="w-3 h-3" />
                  İpucu Veren
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs gap-1">
                  <Target className="w-3 h-3" />
                  Tahminci
                </Badge>
              )}
              
              {isLobby && player.id === currentPlayerId && onRoleToggle && (
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 px-2 text-xs"
                  onClick={onRoleToggle}
                  data-testid="button-toggle-role"
                >
                  Değiştir
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Users className="w-4 h-4" />
        <span className="text-sm font-medium">Oyuncular ({players.length})</span>
      </div>

      {noTeam.length > 0 && (
        <Card className="p-4 space-y-2 border-dashed">
          <h3 className="font-semibold text-sm text-muted-foreground">Takım Seçilmemiş</h3>
          {noTeam.map(player => (
            <div 
              key={player.id}
              data-testid={`player-${player.id}`}
              className="flex items-center gap-2 p-2 rounded-md bg-muted/30"
            >
              {player.isRoomOwner && <Crown className="w-4 h-4 text-yellow-500" />}
              <span className="text-sm">{player.username}</span>
            </div>
          ))}
        </Card>
      )}

      <TeamSection 
        team="dark"
        title="Katman Koyu"
        players={darkTeam}
        gradient="bg-gradient-to-r from-blue-600 to-blue-400"
      />
      
      <TeamSection 
        team="light"
        title="Katman Açık"
        players={lightTeam}
        gradient="bg-gradient-to-r from-cyan-500 to-cyan-300"
      />
    </div>
  );
}
