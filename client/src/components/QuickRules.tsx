import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, User, HelpCircle, BookOpen } from "lucide-react";

export function QuickRules() {
    return (
        <div className="h-full flex flex-col bg-slate-900/40 backdrop-blur-sm border border-slate-700/30 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-3 border-b border-slate-700/30 bg-slate-900/40 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-slate-200">Oyun Rehberi</h3>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-4">
                <div className="space-y-6">
                    {/* Goal */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <HelpCircle className="w-3 h-3" /> Amaç
                        </h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                            İstihbarat Şefinin ipuçlarını kullanarak rakip takımdan önce kendi ajanlarını (kelimelerini) bul.
                        </p>
                    </div>

                    {/* Roles */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <User className="w-3 h-3" /> Roller
                        </h4>

                        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                            <div className="flex items-center gap-2 mb-1">
                                <Shield className="w-3 h-3 text-purple-400" />
                                <span className="text-xs font-bold text-purple-300">İstihbarat Şefi</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Tüm kartların yerini görür. Takımına tek kelimelik ipuçları verir.
                            </p>
                        </div>

                        <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/30">
                            <div className="flex items-center gap-2 mb-1">
                                <User className="w-3 h-3 text-emerald-400" />
                                <span className="text-xs font-bold text-emerald-300">Operasyon Ajanı</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Şefin ipuçlarını yorumlayarak doğru kartları tahmin etmeye çalışır.
                            </p>
                        </div>
                    </div>

                    {/* Warnings */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Shield className="w-3 h-3" /> Dikkat
                        </h4>
                        <ul className="space-y-2">
                            <li className="flex gap-2 text-xs text-slate-300">
                                <span className="text-slate-500">•</span>
                                <span>Siyah kartı (Katil) seçerseniz oyun biter ve kaybedersiniz.</span>
                            </li>
                            <li className="flex gap-2 text-xs text-slate-300">
                                <span className="text-slate-500">•</span>
                                <span>Rakip takımın kartını seçerseniz sıranız biter ve onlara puan kazandırırsınız.</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
}
