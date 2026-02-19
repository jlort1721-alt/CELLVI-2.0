import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, RefreshCw, CheckCircle2, AlertCircle, Clock, ExternalLink, Download, Search, Filter, ShieldCheck, Database, Zap, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const rndcLogs = [
    { id: "RNDC-7821", plate: "SXO-123", status: "success", radicado: "MT-882711", date: "2026-02-13 14:20", type: "MANIFIESTO", weight: "24.5t" },
    { id: "RNDC-7822", plate: "KLT-992", status: "error", error: "Error de firma digital (DIAN)", date: "2026-02-13 13:45", type: "REMESA", weight: "12.0t" },
    { id: "RNDC-7823", plate: "PLM-001", status: "pending", date: "2026-02-13 13:10", type: "MANIFIESTO", weight: "0t" },
    { id: "RNDC-7824", plate: "XYZ-789", status: "success", radicado: "MT-882830", date: "2026-02-13 12:55", type: "CUMPLIDO", weight: "28.1t" },
    { id: "RNDC-7825", plate: "FRT-442", status: "success", radicado: "MT-882831", date: "2026-02-13 12:30", type: "MANIFIESTO", weight: "15.5t" },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
};

const DashboardRNDC = () => {
    const [syncing, setSyncing] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLive, setIsLive] = useState(true);

    const handleSync = (id: string) => {
        setSyncing(id);
        setTimeout(() => setSyncing(null), 2000);
    };

    return (
        <motion.div
            className="space-y-6"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
        >
            {/* ── Header ──────────────────────────────────── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h2 className="font-heading font-bold text-sidebar-foreground text-2xl flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gold/10">
                                <FileText className="w-7 h-7 text-gold" />
                            </div>
                            Registro Nacional de Despachos (RNDC)
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                        <p className="text-sm text-sidebar-foreground/50">Conexión cifrada directa con el Ministerio de Transporte de Colombia.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="text-xs h-10 bg-sidebar border-white/5 hover:bg-white/5 rounded-xl px-4 text-sidebar-foreground/80">
                        <Download className="w-3.5 h-3.5 mr-2" /> Reporte DIAN
                    </Button>
                    <Button className="text-xs h-10 bg-gold hover:bg-gold/80 text-black font-bold rounded-xl px-4 shadow-lg shadow-gold/10">
                        <RefreshCw className={`w-3.5 h-3.5 mr-2 ${syncing ? 'animate-spin' : ''}`} /> Forzar Sincronización
                    </Button>
                </div>
            </div>

            {/* ── Stats ───────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Sincronizados", value: "1,248", icon: Database, color: "text-blue-400" },
                    { label: "Tasa de Éxito", value: "99.2%", icon: ShieldCheck, color: "text-green-500" },
                    { label: "Radicados Hoy", value: "42", icon: Zap, color: "text-gold" },
                    { label: "Errores Pendientes", value: "1", icon: AlertCircle, color: "text-red-500" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        variants={itemVariants}
                        whileHover={{ y: -4, backgroundColor: "rgba(255,255,255,0.05)" }}
                        className="rounded-2xl border bg-sidebar/40 backdrop-blur-md border-white/5 p-5 transition-colors"
                    >
                        <div className="text-[10px] uppercase font-bold text-sidebar-foreground/30 mb-2 flex items-center justify-between">
                            {stat.label}
                            <stat.icon className={`w-4 h-4 ${stat.color} opacity-40`} />
                        </div>
                        <div className="text-3xl font-bold font-heading text-sidebar-foreground tracking-tighter">{stat.value}</div>
                    </motion.div>
                ))}
            </div>

            {/* ── Filter Bar ──────────────────────────────── */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-sidebar/20 border border-white/5">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-foreground/30" />
                    <Input
                        placeholder="Buscar por radicado o placa..."
                        className="pl-10 h-10 bg-transparent border-white/10 focus:border-gold/50 rounded-xl text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button variant="ghost" size="sm" className="text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-white/5">
                        <Filter className="w-3.5 h-3.5 mr-2" /> Filtros Avanzados
                    </Button>
                    <div className="h-4 w-px bg-white/10 mx-2 hidden md:block" />
                    <span className="text-[10px] text-sidebar-foreground/30 font-bold uppercase whitespace-nowrap">Auto-refresh cada 60s</span>
                </div>
            </div>

            {/* ── Table ───────────────────────────────────── */}
            <div className="rounded-3xl border border-white/5 bg-sidebar/20 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-4 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest">Vehículo</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest">Tipo</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest">Estado RNDC</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest">Radicado MT</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-sidebar-foreground/40 uppercase tracking-widest">Fecha/Hora</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {rndcLogs.map((log) => (
                                    <motion.tr
                                        key={log.id}
                                        layout
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="group hover:bg-white/[0.03] transition-colors border-b border-white/[0.02]"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-sidebar-foreground/5 flex items-center justify-center font-bold text-xs border border-white/5">
                                                    {log.plate.substring(0, 3)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-sidebar-foreground">{log.plate}</span>
                                                    <span className="text-[10px] text-sidebar-foreground/30 font-medium">Capacidad: {log.weight}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] bg-sidebar-foreground/5 text-sidebar-foreground/60 px-2.5 py-1 rounded-full font-bold uppercase border border-white/5">
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.status === "success" && (
                                                <div className="flex items-center gap-2 text-green-500 font-bold text-xs bg-green-500/5 px-3 py-1.5 rounded-xl border border-green-500/10 w-fit">
                                                    <CheckCircle2 className="w-3.5 h-3.5" /> Exitoso
                                                </div>
                                            )}
                                            {log.status === "error" && (
                                                <div className="flex items-center gap-2 text-red-500 font-bold text-xs bg-red-500/5 px-3 py-1.5 rounded-xl border border-red-500/10 w-fit">
                                                    <AlertCircle className="w-3.5 h-3.5" /> Error MT
                                                </div>
                                            )}
                                            {log.status === "pending" && (
                                                <div className="flex items-center gap-2 text-gold font-bold text-xs bg-gold/5 px-3 py-1.5 rounded-xl border border-gold/10 w-fit">
                                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Pendiente
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {log.radicado ? (
                                                <span className="text-xs font-bold text-gold tracking-wider underline underline-offset-4 decoration-gold/20 cursor-pointer hover:decoration-gold/100">
                                                    {log.radicado}
                                                </span>
                                            ) : log.error ? (
                                                <span className="text-[10px] text-red-400/80 font-medium max-w-[150px] inline-block truncate">{log.error}</span>
                                            ) : (
                                                <span className="text-xs text-sidebar-foreground/20 italic">Procesando...</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-bold text-sidebar-foreground/40">{log.date}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button size="icon" variant="ghost" aria-label="Abrir enlace externo" className="w-9 h-9 rounded-xl hover:bg-sidebar-foreground/5 text-sidebar-foreground/40 hover:text-sidebar-foreground">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className={`text-[10px] font-bold uppercase tracking-wider h-9 px-4 rounded-xl ${syncing === log.id ? 'text-gold' : 'text-gold/60 hover:text-gold hover:bg-gold/10'}`}
                                                    onClick={() => handleSync(log.id)}
                                                >
                                                    {syncing === log.id ? 'Sincronizando...' : log.status === 'error' ? 'Re-intentar' : 'Sincronizar'}
                                                </Button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {/* Footer info */}
                <div className="p-5 bg-white/[0.01] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-[10px] text-sidebar-foreground/30 font-medium flex items-center gap-2">
                        <Database className="w-3 h-3" /> Mostrando 5 de 1,248 transacciones | Cumplimiento RNDC v2.1
                    </div>
                    <div className="flex items-center gap-1.5">
                        {[1, 2, 3, '...', 12].map((p, i) => (
                            <button key={i} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${p === 1 ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'text-sidebar-foreground/40 hover:bg-white/5 hover:text-sidebar-foreground'}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Compliance Alert ────────────────────────── */}
            <motion.div
                variants={itemVariants}
                className="p-5 rounded-3xl border border-gold/20 bg-gold/5 flex items-start gap-5 shadow-inner"
            >
                <div className="p-3 rounded-2xl bg-gold/10 text-gold flex-shrink-0">
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-bold text-gold tracking-tight">Protocolo de Certificación Forense</p>
                    <p className="text-xs text-sidebar-foreground/60 leading-relaxed">
                        Toda sincronización con el **RNDC** genera automáticamente un **Hash de Evidencia Inmutable** sellado en la capa de auditoría de CellVi.
                        Este proceso cumple con la resolución 2433 de 2018 del Ministerio de Transporte.
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                        <Button variant="link" className="p-0 h-auto text-[10px] text-gold/80 font-bold uppercase tracking-wider">Ver certificado Técnico</Button>
                        <Button variant="link" className="p-0 h-auto text-[10px] text-sidebar-foreground/40 font-bold uppercase tracking-wider">Términos Legales</Button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default DashboardRNDC;
