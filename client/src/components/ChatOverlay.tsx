import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, Users, Heart, ThumbsDown, X, ChevronUp, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  username: string;
  content: string;
  badges?: string[];
  color?: string;
  timestamp: number;
  isVote?: boolean;
  voteType?: 'like' | 'dislike';
}

interface ChatOverlayProps {
  isVisible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  messages?: ChatMessage[];
  voteStats?: {
    likes: number;
    dislikes: number;
  };
  maxMessages?: number;
  title?: string;
  showVoteInstructions?: boolean;
}

export default function ChatOverlay({
  isVisible = true,
  position = 'bottom-right',
  messages = [],
  voteStats = { likes: 0, dislikes: 0 },
  maxMessages = 50,
  title = 'Kick Chat',
  showVoteInstructions = false
}: ChatOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // Update local messages when prop messages change
  useEffect(() => {
    setLocalMessages(messages.slice(-maxMessages));
  }, [messages, maxMessages]);

  // Auto scroll to bottom when new message arrives
  useEffect(() => {
    if (lastMessageRef.current && isExpanded) {
      // Use scrollIntoView without smooth behavior to avoid animations
      lastMessageRef.current.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [localMessages, isExpanded]);

  // Position styles
  const positionStyles = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: 1,
          height: isMinimized ? 'auto' : isExpanded ? '400px' : '60px'
        }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className={cn(
          "fixed z-50 bg-black/90 backdrop-blur-sm border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden",
          positionStyles[position],
          "shadow-purple-500/20",
          !isMinimized && "w-80"
        )}
        style={{ contain: 'layout style paint' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/20 to-amber-600/20 border-b border-white/10 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              <span className="font-semibold text-white text-sm">{title}</span>
              {localMessages.length > 0 && (
                <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                  {localMessages.length}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setIsExpanded(!isExpanded)}
                size="icon"
                variant="ghost"
                className="h-6 w-6 hover:bg-white/10 text-gray-400 hover:text-white"
                data-testid="chat-toggle-expand"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronUp className="w-3 h-3" />
                )}
              </Button>
              <Button
                onClick={() => setIsMinimized(!isMinimized)}
                size="icon"
                variant="ghost"
                className="h-6 w-6 hover:bg-white/10 text-gray-400 hover:text-white"
                data-testid="chat-minimize"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>

        {/* Vote Stats Bar (if showing) */}
        {showVoteInstructions && !isMinimized && isExpanded && (
          <div className="bg-gradient-to-r from-green-500/10 to-red-500/10 border-b border-white/10 px-3 py-2">
            <div className="text-xs text-gray-300 mb-2">
              Chat'te <span className="text-green-400 font-bold">1</span> = Beğen, 
              <span className="text-red-400 font-bold ml-1">2</span> = Beğenme
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-bold text-sm">{voteStats.likes}</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsDown className="w-4 h-4 text-red-400" />
                <span className="text-red-400 font-bold text-sm">{voteStats.dislikes}</span>
              </div>
            </div>
          </div>
        )}

        {/* Messages Area */}
        {!isMinimized && isExpanded && (
          <ScrollArea className="flex-1 h-full p-3">
            <div className="space-y-2">
              {localMessages.length === 0 ? (
                <div className="text-center text-gray-400 text-sm py-8">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Henüz mesaj yok</p>
                  <p className="text-xs mt-1">Chat mesajları burada görünecek</p>
                </div>
              ) : (
                localMessages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "rounded-lg p-2 bg-white/5 border",
                      message.isVote 
                        ? message.voteType === 'like' 
                          ? "border-green-500/30 bg-green-500/10" 
                          : "border-red-500/30 bg-red-500/10"
                        : "border-white/10 hover:bg-white/10 transition-colors"
                    )}
                    ref={index === localMessages.length - 1 ? lastMessageRef : undefined}
                  >
                    <div className="flex items-start gap-2">
                      {/* Username with color */}
                      <div className="flex-1">
                        <div className="flex items-center gap-1 mb-1">
                          <span 
                            className="font-semibold text-xs"
                            style={{ color: message.color || '#FFFFFF' }}
                          >
                            {message.username}
                          </span>
                          {message.badges && message.badges.length > 0 && (
                            <div className="flex gap-1">
                              {message.badges.map((badge, i) => (
                                <Badge 
                                  key={i}
                                  className="px-1 py-0 text-[10px] bg-purple-500/20 text-purple-300 border-purple-400/30"
                                >
                                  {badge}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {message.isVote && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-auto"
                            >
                              {message.voteType === 'like' ? (
                                <Heart className="w-3 h-3 text-green-400 fill-green-400" />
                              ) : (
                                <ThumbsDown className="w-3 h-3 text-red-400 fill-red-400" />
                              )}
                            </motion.div>
                          )}
                        </div>
                        {/* Message content */}
                        <p className="text-xs text-gray-300 break-words">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </ScrollArea>
        )}

        {/* Minimized View */}
        {isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-2 cursor-pointer"
            onClick={() => setIsMinimized(false)}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-400" />
              {voteStats && (
                <div className="flex items-center gap-3">
                  <span className="text-green-400 text-xs font-bold">1: {voteStats.likes}</span>
                  <span className="text-red-400 text-xs font-bold">2: {voteStats.dislikes}</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

      </motion.div>
    </AnimatePresence>
  );
}