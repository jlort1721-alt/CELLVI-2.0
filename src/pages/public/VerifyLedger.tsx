
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, QrCode, ShieldCheck, ShieldAlert, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export default function PublicLedgerVerifier() {
    const [hash, setHash] = useState("");
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleVerify = async () => {
        if (!hash) return;
        setLoading(true);
        setResult(null);

        try {
            const { data, error } = await supabase.rpc('verify_ledger_hash' as any, {
                hash_to_verify: hash
            });

            if (error) throw error;

            // Handle potential single object or array return
            const rows = Array.isArray(data) ? data : (data ? [data] : []);

            if (rows.length > 0) {
                setResult({ valid: true, ...rows[0] });
                toast({
                    title: "Verificación Exitosa",
                    description: "El hash corresponde a un registro inmutable válido.",
                    className: "bg-green-500 text-white"
                });
            } else {
                setResult({ valid: false });
                toast({
                    title: "Hash No Encontrado",
                    description: "No existe ningún registro con este hash criptográfico.",
                    variant: "destructive"
                });
            }
        } catch (err: any) {
            console.error(err);
            toast({
                title: "Error de Verificación",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />

            <Card className="w-full max-w-lg border-white/10 bg-slate-900/50 backdrop-blur shadow-2xl">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-green-500/10 p-4 rounded-full w-fit mb-4 border border-green-500/20">
                        <ShieldCheck className="w-10 h-10 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white tracking-tight">CELLVI Trustless Verifier</CardTitle>
                    <CardDescription className="text-slate-400">
                        Validador público de integridad criptográfica. Ingrese el hash SHA-256 para auditar un evento.
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                            <Input
                                value={hash}
                                onChange={(e) => setHash(e.target.value)}
                                placeholder="Pegar Hash (ej: a3f8...)"
                                className="pl-9 bg-slate-800 border-slate-700 text-white font-mono text-xs h-10"
                            />
                        </div>
                        <Button onClick={handleVerify} disabled={loading || !hash} className="bg-green-600 hover:bg-green-700 text-white">
                            {loading ? "Verificando..." : "Auditar"}
                        </Button>
                    </div>

                    {result && (
                        <div className={`rounded-xl border p-4 animate-in fade-in zoom-in duration-300 ${result.valid ? "bg-green-950/30 border-green-500/30" : "bg-red-950/30 border-red-500/30"
                            }`}>
                            <div className="flex items-start gap-4">
                                <div className={`p-2 rounded-lg ${result.valid ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                    {result.valid ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <h4 className={`font-bold ${result.valid ? "text-green-400" : "text-red-400"}`}>
                                        {result.valid ? "Registro Auténtico" : "Registro Inválido / No Encontrado"}
                                    </h4>

                                    {result.valid && (
                                        <div className="text-xs text-slate-300 space-y-2 mt-2 font-mono">
                                            <div className="flex justify-between border-b border-white/5 pb-1">
                                                <span className="text-slate-500">Timestamp:</span>
                                                <span>{new Date(result.event_time).toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between border-b border-white/5 pb-1">
                                                <span className="text-slate-500">Tipo Evento:</span>
                                                <span className="bg-white/10 px-1 rounded">{result.event_type}</span>
                                            </div>
                                            <div className="pt-2">
                                                <span className="text-slate-500 block mb-1">Payload (Snapshot):</span>
                                                <pre className="bg-black/30 p-2 rounded overflow-x-auto text-[10px] text-green-300">
                                                    {JSON.stringify(result.payload, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    )}

                                    {!result.valid && (
                                        <p className="text-xs text-red-300 mt-1">
                                            El hash proporcionado no coincide con ningún bloque en la cadena inmutable. Es posible que el registro haya sido alterado o el hash sea incorrecto.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-slate-800/50 p-3 rounded-lg flex items-center gap-3 border border-white/5">
                        <QrCode className="w-8 h-8 text-slate-500" />
                        <div className="text-xs text-slate-400">
                            <span className="block font-bold text-slate-300">¿Cómo funciona?</span>
                            Cada evento crítico genera un hash único encadenado al anterior. Si se altera un byte, la verificación falla.
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="absolute bottom-4 text-center text-[10px] text-slate-600 font-mono">
                SECURED BY CELLVI CHAIN • SHA-256 PROOF OF INTEGRITY
            </div>
        </div>
    );
}
