
import { Canvas } from "@react-three/fiber";
import { Float, ContactShadows, PresentationControls } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Activity, Thermometer, Battery, Wifi, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/* 
  TRUCK MODEL COMPONENT 
  Renders a 3D primitive truck reflecting health state color-coded.
*/
function TruckModel({ health, ...props }: { health: any } & Record<string, any>) {
    // Determine subsystem colors based on health status
    // If health < 70 => yellow, < 40 => red
    const getStatusColor = (val: number) => val < 40 ? "#ef4444" : val < 70 ? "#eab308" : "#22c55e";

    const engineColor = getStatusColor(health.engine_health);
    const tiresColor = getStatusColor(health.tires_health);
    const coolingColor = getStatusColor(health.cooling_unit_health);

    return (
        <group dispose={null} {...props}>
            {/* Chassis */}
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[2, 0.5, 4]} />
                <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.8} />
            </mesh>

            {/* Container (Refrigerado - Cooling Unit) */}
            <mesh position={[0, 1.5, -0.5]} castShadow receiveShadow>
                <boxGeometry args={[1.9, 1.5, 3]} />
                {/* Changes color if cooling unit is failing */}
                <meshStandardMaterial color={health.anomaly_component === 'cooling' ? '#ef4444' : '#f8fafc'} roughness={0.2} metalness={0.1} />
            </mesh>

            {/* Cabina (Engine) */}
            <mesh position={[0, 1.25, 1.6]} castShadow receiveShadow>
                <boxGeometry args={[1.9, 1, 0.8]} />
                <meshStandardMaterial color={engineColor === '#ef4444' ? '#ef4444' : '#eab308'} roughness={0.3} metalness={0.6} />
            </mesh>

            {/* Llantas (Tires) */}
            <mesh position={[1, 0.25, 1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.25, 0.25, 0.2, 32]} />
                <meshStandardMaterial color={tiresColor} />
            </mesh>
            <mesh position={[-1, 0.25, 1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.25, 0.25, 0.2, 32]} />
                <meshStandardMaterial color={tiresColor} />
            </mesh>
            <mesh position={[1, 0.25, -1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.25, 0.25, 0.2, 32]} />
                <meshStandardMaterial color={tiresColor} />
            </mesh>
            <mesh position={[-1, 0.25, -1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.25, 0.25, 0.2, 32]} />
                <meshStandardMaterial color={tiresColor} />
            </mesh>
        </group>
    );
}

export function DigitalTwinViewer({ vehicleData }: { vehicleData?: any }) {
    const [twinState, setTwinState] = useState<any>({
        engine_health: 100,
        tires_health: 100,
        cooling_unit_health: 100,
        battery_level: 24.1,
        signal_strength: 92,
        temperature: -18.2,
        anomaly_detected: false
    });

    useEffect(() => {
        if (!vehicleData?.id) return;

        // 1. Initial Fetch
        const fetchState = async () => {
            const { data } = await (supabase
                .from('digital_twin_state' as any)
                .select('*')
                .eq('vehicle_id', vehicleData.id)
                .single() as any);

            if (data) setTwinState((prev: any) => ({ ...prev, ...data }));
        };
        fetchState();

        // 2. Realtime Subscription
        const channel = supabase
            .channel(`twin-${vehicleData.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'digital_twin_state', filter: `vehicle_id=eq.${vehicleData.id}` },
                (payload) => {
                    console.log('Twin Update:', payload);
                    setTwinState((prev: any) => ({ ...prev, ...(payload.new as any) }));
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [vehicleData?.id]);

    return (
        <div className="w-full h-full relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
            {/* HUD Overlay */}
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <Badge variant="outline" className="bg-white/80 backdrop-blur text-navy font-bold border-navy/20">
                    DIGITAL TWIN: {vehicleData?.plate || 'V-103'}
                </Badge>

                <div className="bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm border border-slate-200 text-xs text-slate-600 space-y-2 w-52">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                        <span className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-blue-500" /> Refrigeración</span>
                        <span className={`font-mono font-bold ${twinState.cooling_unit_health < 50 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
                            {twinState.temperature ? `${twinState.temperature}°C` : '-18.2°C'} ({twinState.cooling_unit_health}%)
                        </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-green-500" /> Motor</span>
                        <span className={`font-mono font-bold ${twinState.engine_health < 60 ? 'text-yellow-600' : 'text-green-600'}`}>
                            {twinState.engine_health}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1"><Battery className="w-3 h-3 text-yellow-500" /> Batería</span>
                        <span className="font-mono font-bold text-yellow-600">{twinState.battery_level || 24.1} V</span>
                    </div>
                </div>
            </div>

            {/* 3D Scene */}
            <Canvas shadows camera={{ position: [4, 2, 5], fov: 50 }}>
                <Suspense fallback={null}>
                    <ambientLight intensity={0.7} />
                    <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow shadow-mapSize={2048} />
                    <directionalLight position={[-3, 4, -2]} intensity={0.4} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={0.6} castShadow />

                    <PresentationControls
                        global
                        config={{ mass: 2, tension: 500 }}
                        snap={{ mass: 4, tension: 1500 }}
                        rotation={[0, 0.3, 0]}
                        polar={[-Math.PI / 3, Math.PI / 3]}
                        azimuth={[-Math.PI / 1.4, Math.PI / 2]}
                    >
                        <Float rotationIntensity={0.5} floatIntensity={0.5} speed={2}>
                            <TruckModel health={twinState} scale={1.2} />
                        </Float>
                    </PresentationControls>

                    <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
                </Suspense>
            </Canvas>

            {/* Status Footer */}
            <div className="absolute bottom-4 right-4 z-10">
                {twinState.anomaly_detected ? (
                    <Badge variant="destructive" className="bg-red-500 text-white animate-pulse flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> FALLA CRÍTICA EN {twinState.anomaly_component?.toUpperCase() || 'DESCONOCIDO'}
                    </Badge>
                ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                        SISTEMAS NOMINALES
                    </Badge>
                )}
            </div>
        </div>
    );
}
