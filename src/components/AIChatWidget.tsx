
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Bot, Send, X, Sparkles, FileText, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Message {
    role: 'user' | 'assistant';
    content: string;
    sources?: any[];
}

export function AsegurarAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: 'assistant', content: 'Hola. Soy el Asistente ASEGURAR. ¿En qué puedo ayudarte hoy? (Ej: "Estado de flota", "Normativa RNDC")' }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setIsLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke('neural-chat', {
                body: { query: userMsg, history: messages.slice(-5) }
            });

            if (error) throw error;

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.answer || "Lo siento, no pude procesar esa solicitud.",
                sources: data.sources
            }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: "Error de conexión con el asistente. Intente más tarde." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-gold to-yellow-600 hover:scale-105 transition-transform z-50 p-0"
            >
                <Bot className="w-8 h-8 text-black" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
            </Button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 w-[380px] h-[600px] z-50 flex flex-col shadow-2xl animate-in slide-in-from-bottom-10 fade-in duration-300">
            <Card className="flex-1 flex flex-col border-gold/20 shadow-2xl bg-slate-950/95 backdrop-blur-md">
                <CardHeader className="p-4 border-b border-white/10 flex flex-row items-center justify-between bg-gradient-to-r from-slate-900 to-slate-800">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gold/20 rounded-lg">
                            <Bot className="w-5 h-5 text-gold" />
                        </div>
                        <div>
                            <CardTitle className="text-sm font-bold text-white flex items-center gap-1">
                                Asistente ASEGURAR
                                <Sparkles className="w-3 h-3 text-gold animate-pulse" />
                            </CardTitle>
                            <p className="text-[10px] text-slate-400">Powered by RAG & Vector Search</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Cerrar chat" className="text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </Button>
                </CardHeader>

                <CardContent className="flex-1 p-0 overflow-hidden relative flex flex-col">
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                        <div className="space-y-4 pb-4">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-md ${msg.role === 'user'
                                        ? 'bg-gold text-slate-900 rounded-br-none font-medium'
                                        : 'bg-slate-800 text-slate-100 rounded-bl-none border border-white/5'
                                        }`}>
                                        {msg.content}
                                        {msg.sources && msg.sources.length > 0 && (
                                            <div className="mt-3 pt-2 border-t border-white/10 space-y-1">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                                    <FileText className="w-3 h-3" /> Fuentes:
                                                </p>
                                                {msg.sources.map((s, idx) => (
                                                    <div key={idx} className="text-[10px] text-slate-400 bg-black/20 px-2 py-1 rounded truncate">
                                                        {s.message || JSON.stringify(s).slice(0, 30)}...
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-800/50 rounded-2xl p-3 flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 text-gold animate-spin" />
                                        <span className="text-xs text-slate-400">Analizando base de conocimiento...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    <div className="p-3 border-t border-white/10 bg-slate-900/50">
                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="flex items-center gap-2"
                        >
                            <Input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder="Escribe tu consulta..."
                                className="bg-slate-800 border-white/10 text-white focus-visible:ring-gold/50"
                            />
                            <Button type="submit" size="icon" aria-label="Enviar mensaje" className="bg-gold hover:bg-yellow-500 text-black shadow-lg shadow-gold/20" disabled={isLoading}>
                                <Send className="w-4 h-4" />
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
