import { useState, useEffect, useRef } from "react";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function LobbyChat() {
    const { chatMessages, send, playerId, gameState } = useWebSocketContext();
    const [message, setMessage] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [chatMessages]);

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!message.trim()) return;

        send("send_chat_message", { message: message.trim() });
        setMessage("");
    };

    return (
        <div className="h-full flex flex-col bg-slate-900/40 backdrop-blur-sm border border-slate-700/30 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-slate-700/30 bg-slate-900/40 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-semibold text-slate-200">Lobi Sohbeti</h3>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-3">
                    {chatMessages.length === 0 ? (
                        <div className="text-center text-slate-500 text-xs py-4 italic">
                            Henüz mesaj yok. Sohbeti başlat!
                        </div>
                    ) : (
                        chatMessages.map((msg) => {
                            const isMe = msg.senderId === playerId;
                            // Determine color based on team
                            const isDarkTeam = msg.team === "dark";
                            const isLightTeam = msg.team === "light";

                            let nameColor = "text-slate-400";
                            if (isDarkTeam) nameColor = "text-red-400";
                            if (isLightTeam) nameColor = "text-blue-400";

                            return (
                                <div
                                    key={msg.id}
                                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                                >
                                    <div className={`flex items-baseline gap-2 mb-1 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                                        <span className={`text-xs font-bold ${nameColor}`}>
                                            {msg.sender}
                                        </span>
                                        <span className="text-[10px] text-slate-600">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div
                                        className={`px-3 py-2 rounded-lg text-sm max-w-[90%] break-words ${isMe
                                                ? "bg-indigo-600/20 text-indigo-100 border border-indigo-500/30 rounded-tr-none"
                                                : "bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-tl-none"
                                            }`}
                                    >
                                        {msg.message}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={scrollRef} />
                </div>
            </ScrollArea>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-3 bg-slate-900/40 border-t border-slate-700/30">
                <div className="flex gap-2">
                    <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Mesaj yaz..."
                        className="bg-slate-800/50 border-slate-700/50 text-slate-200 placeholder:text-slate-500 focus-visible:ring-indigo-500/50 h-9 text-sm"
                    />
                    <Button
                        type="submit"
                        size="sm"
                        className="h-9 w-9 p-0 bg-indigo-600 hover:bg-indigo-500 text-white"
                        disabled={!message.trim()}
                    >
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </form>
        </div>
    );
}
