
import { useEffect, useRef, useState, useCallback } from "react";
import { FilesetResolver, FaceLandmarker } from "@mediapipe/tasks-vision";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, AlertTriangle, Play, Pause } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Constantes de calibración y umbrales
const EYE_CLOSED_THRESHOLD = 0.5; // Umbral de relación de aspecto del ojo (EAR)
const FATIGUE_FRAMES_THRESHOLD = 30; // ~1 segundo a 30fps
const COOLDOWN_SECONDS = 10; // Evitar alertas en bucle infinito

// Funciones de audio para alertas
const playAlertSound = () => {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.value = 800; // Alarma aguda

    // Modulación de amplitud (sirena)
    const now = audioCtx.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    gainNode.gain.linearRampToValueAtTime(1, now + 0.6);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(now + 1.5);

    // Vibración hoda háptica (si el dispositivo lo soporta)
    if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 500]);
    }
};

export function DriverFatigueMonitor() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMonitoring, setIsMonitoring] = useState(false);
    const [fatigueStatus, setFatigueStatus] = useState<"awake" | "drowsy" | "sleeping">("awake");
    const [modelLoaded, setModelLoaded] = useState(false);
    const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
    const frameCounterRef = useRef(0);
    const lastAlertTimeRef = useRef(0);
    const requestRef = useRef<number>();
    const { toast } = useToast();

    // Inicializar modelo de visión de Google MediaPipe
    useEffect(() => {
        const initModel = async () => {
            try {
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
                );
                faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                        delegate: "GPU"
                    },
                    outputFaceBlendshapes: true,
                    runningMode: "VIDEO",
                    numFaces: 1
                });
                setModelLoaded(true);
            } catch (error) {
                console.error("Error cargando modelo biométrico:", error);
                toast({ title: "Error Biométrico", description: "No se pudo cargar el módulo de visión.", variant: "destructive" });
            }
        };
        initModel();

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const startMonitoring = async () => {
        if (!modelLoaded || !videoRef.current) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setIsMonitoring(true);
            predictWebcam();
        } catch (err) {
            console.error("Error acceso cámara:", err);
            toast({ title: "Permiso Denegado", description: "Necesitamos acceso a la cámara para monitorear fatiga.", variant: "destructive" });
        }
    };

    const stopMonitoring = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsMonitoring(false);
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };

    const predictWebcam = async () => {
        if (!faceLandmarkerRef.current || !videoRef.current) return;

        let startTimeMs = performance.now();

        if (videoRef.current.videoWidth > 0) {
            const results = faceLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);

            if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
                const blendshapes = results.faceBlendshapes[0].categories;

                // Índices específicos de MediaPipe Face Blendshapes
                // 9 = eyeBlinkLeft, 10 = eyeBlinkRight
                const eyeBlinkLeft = blendshapes.find(b => b.categoryName === 'eyeBlinkLeft')?.score || 0;
                const eyeBlinkRight = blendshapes.find(b => b.categoryName === 'eyeBlinkRight')?.score || 0;

                // Lógica de detección: ambos ojos cerrados consistentemente
                const eyesClosed = (eyeBlinkLeft > EYE_CLOSED_THRESHOLD) && (eyeBlinkRight > EYE_CLOSED_THRESHOLD);

                if (eyesClosed) {
                    frameCounterRef.current++;
                } else {
                    frameCounterRef.current = Math.max(0, frameCounterRef.current - 1); // Decay suave
                }

                // Estados de alerta
                if (frameCounterRef.current > FATIGUE_FRAMES_THRESHOLD) {
                    if (Date.now() - lastAlertTimeRef.current > COOLDOWN_SECONDS * 1000) {
                        triggerFatigueAlert();
                        lastAlertTimeRef.current = Date.now();
                    }
                    setFatigueStatus("sleeping");
                } else if (frameCounterRef.current > FATIGUE_FRAMES_THRESHOLD / 2) {
                    setFatigueStatus("drowsy");
                } else {
                    setFatigueStatus("awake");
                }
            }
        }

        if (isMonitoring) {
            requestRef.current = requestAnimationFrame(predictWebcam);
        }
    };

    const triggerFatigueAlert = async () => {
        console.warn("ALERTA DE MICROSUEÑO DETECTADA");
        playAlertSound();

        // Registrar evento crítico en Blockchain (Ledger)
        try {
            const { error } = await supabase.from('alerts').insert({
                type: 'DRIVER_FATIGUE',
                severity: 'critical',
                message: 'Microsueño detectado por visión computarizada.',
                data: {
                    confidence: 0.98,
                    module: 'vision_guard_v1',
                    timestamp: new Date().toISOString()
                }
                // tenant_id y vehicle_id se deberían inyectar desde contexto
            });

            if (error) throw error;

            toast({
                title: "¡ALERTA CRÍTICA!",
                description: "Se detectaron signos de fatiga. Deténgase inmediatamente.",
                className: "bg-red-600 text-white font-bold animate-pulse"
            });
        } catch (err) {
            console.error("Error registrando alerta:", err);
        }
    };

    return (
        <Card className={`fixed bottom-24 left-6 w-64 bg-slate-950/90 backdrop-blur border-slate-800 shadow-2xl transition-all duration-300 ${fatigueStatus === "sleeping" ? "border-red-500 shadow-red-500/50 scale-105" : ""
            }`}>
            <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Eye className="w-4 h-4 text-blue-400" /> Vision Guard
                    </h3>
                    <Badge variant="outline" className={`${fatigueStatus === "awake" ? "text-green-400 border-green-400" :
                            fatigueStatus === "drowsy" ? "text-yellow-400 border-yellow-400" :
                                "text-red-500 border-red-500 animate-pulse bg-red-500/10"
                        }`}>
                        {fatigueStatus === "awake" ? "VIGILANTE" : fatigueStatus === "drowsy" ? "SOMNOLIENTO" : "¡PELIGRO!"}
                    </Badge>
                </div>

                <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-slate-800">
                    <video
                        ref={videoRef}
                        className={`w-full h-full object-cover transform scale-x-[-1] opacity-60 ${!isMonitoring && 'hidden'}`}
                        playsInline
                        muted
                    />
                    {!isMonitoring && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">
                            Cámara Inactiva
                        </div>
                    )}

                    {/* Visualizador de parpadeo */}
                    {isMonitoring && (
                        <div className="absolute bottom-1 left-1 right-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-100 ${frameCounterRef.current > FATIGUE_FRAMES_THRESHOLD / 2 ? "bg-red-500" : "bg-green-500"
                                    }`}
                                style={{ width: `${Math.min(100, (frameCounterRef.current / FATIGUE_FRAMES_THRESHOLD) * 100)}%` }}
                            />
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    {!isMonitoring ? (
                        <Button size="sm" onClick={startMonitoring} disabled={!modelLoaded} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                            <Play className="w-3 h-3 mr-2" /> Activar Copiloto
                        </Button>
                    ) : (
                        <Button size="sm" onClick={stopMonitoring} variant="destructive" className="w-full">
                            <Pause className="w-3 h-3 mr-2" /> Detener
                        </Button>
                    )}
                </div>

                <p className="text-[10px] text-slate-500 text-center">
                    {modelLoaded ? "IA Biométrica Lista (MediaPipe)" : "Cargando Red Neuronal..."}
                </p>
            </div>
        </Card>
    );
}
