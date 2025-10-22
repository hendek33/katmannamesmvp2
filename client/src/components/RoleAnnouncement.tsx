import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface RoleAnnouncementProps {
  show: boolean;
  playerTeam: "dark" | "light" | null;
  playerRole: "spymaster" | "guesser";
  teamName: string;
  currentTurn: "dark" | "light" | null;
  currentTurnTeamName: string;
  onComplete: () => void;
  secretRole?: string | null;
}

export function RoleAnnouncement({ 
  show, 
  playerTeam, 
  playerRole,
  teamName,
  currentTurn,
  currentTurnTeamName,
  onComplete,
  secretRole
}: RoleAnnouncementProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 2500); // Reduced from 4000ms to 2500ms
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
      {/* Dark overlay */}
      <div 
        className="absolute inset-0 bg-black/95"
        style={{
          animation: 'fadeIn 0.5s ease-out'
        }}
      />
      
      {/* Content */}
      <div 
        className="relative text-center space-y-6"
        style={{
          animation: 'slideInScale 0.8s ease-out forwards'
        }}
      >
        {/* Turn announcement */}
        <div className="space-y-2">
          <p className="text-3xl text-gray-400 font-medium">
            Sıra
          </p>
          <div className={cn(
            "text-7xl font-black tracking-wide",
            currentTurn === "dark" ? "text-blue-400" : "text-red-400"
          )}
          style={{
            textShadow: currentTurn === "dark" 
              ? '0 0 30px rgba(59,130,246,0.5)' 
              : '0 0 30px rgba(239,68,68,0.5)'
          }}
          >
            {currentTurnTeamName}
          </div>
          <p className="text-3xl text-gray-400 font-medium">
            Takımından!
          </p>
        </div>

        {/* Player role announcement */}
        <div className="mt-8 space-y-3 p-6 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10">
          <p className="text-2xl text-gray-300">
            Sen
          </p>
          <div className={cn(
            "text-5xl font-bold",
            playerTeam === "dark" ? "text-blue-300" : "text-red-300"
          )}>
            {teamName}
          </div>
          <p className="text-xl text-gray-300">
            takımında
          </p>
          <div className="text-4xl font-bold text-amber-400">
            {playerRole === "spymaster" ? "İSTİHBARAT ŞEFİ" : "AJAN"}
          </div>
          <p className="text-xl text-gray-300">
            rolündesin!
          </p>
          
          {/* Secret role if exists */}
          {secretRole && (
            <div className="mt-4 pt-4 border-t border-purple-500/30">
              <p className="text-lg text-purple-400 font-medium">
                Gizli Rolün:
              </p>
              <div className="text-2xl font-bold text-purple-300">
                {secretRole === "prophet" ? "🔮 KAHİN" : 
                 secretRole === "double_agent" ? "🎭 ÇİFT AJAN" : ""}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInScale {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}