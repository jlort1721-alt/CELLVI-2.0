
import { Canvas } from "@react-three/fiber";
import { Float, Environment, ContactShadows, PresentationControls, useGLTF } from "@react-three/drei";
import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Thermometer, Battery, Wifi } from "lucide-react";

// Componente para cargar el modelo 3D del camión
// Usaremos un modelo primitivo por ahora, luego se puede reemplazar con un GLB real
function TruckModel(props: any) {
    // En un entorno real usaríamos useGLTF('/models/truck.glb')
    return (
        <group {...props} dispose={null}>
            {/* Chassis */}
            <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
                <boxGeometry args={[2, 0.5, 4]} />
                <meshStandardMaterial color="#0f172a" roughness={0.5} metalness={0.8} />
            </mesh>

            {/* Container (Refrigerado) */}
            <mesh position={[0, 1.5, -0.5]} castShadow receiveShadow>
                <boxGeometry args={[1.9, 1.5, 3]} />
                <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.1} />
            </mesh>

            {/* Cabina */}
            <mesh position={[0, 1.25, 1.6]} castShadow receiveShadow>
                <boxGeometry args={[1.9, 1, 0.8]} />
                <meshStandardMaterial color="#eab308" roughness={0.3} metalness={0.6} />
            </mesh>

            {/* Llantas */}
            <mesh position={[1, 0.25, 1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.25, 0.25, 0.2, 32]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[-1, 0.25, 1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.25, 0.25, 0.2, 32]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[1, 0.25, -1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.25, 0.25, 0.2, 32]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[-1, 0.25, -1.5]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.25, 0.25, 0.2, 32]} />
                <meshStandardMaterial color="#1e293b" />
            </mesh>

            {/* Sensor de Temperatura (Indicador Visual) */}
            <mesh position={[0, 2.3, -0.5]}>
                <sphereGeometry args={[0.1, 16, 16]} />
                <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={2} />
            </mesh>
        </group>
    );
}

export function DigitalTwinViewer({ vehicleData }: { vehicleData?: any }) {
    return (
        <div className="w-full h-full relative bg-slate-100 rounded-xl overflow-hidden border border-slate-200">
            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                <Badge variant="outline" className="bg-white/80 backdrop-blur text-navy font-bold border-navy/20">
                    DIGITAL TWIN: V-103
                </Badge>
                <div className="bg-white/90 backdrop-blur p-3 rounded-lg shadow-sm border border-slate-200 text-xs text-slate-600 space-y-1 w-48">
                    <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1"><Thermometer className="w-3 h-3 text-blue-500" /> Refrigeración</span>
                        <span className="font-mono font-bold text-blue-600">-18.2°C</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-green-500" /> Motor</span>
                        <span className="font-mono font-bold text-green-600">850 RPM</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1"><Battery className="w-3 h-3 text-yellow-500" /> Batería</span>
                        <span className="font-mono font-bold text-yellow-600">24.1 V</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-slate-400" /> Señal 4G</span>
                        <span className="font-mono font-bold text-slate-600">92%</span>
                    </div>
                </div>
            </div>

            <Canvas shadows camera={{ position: [4, 2, 5], fov: 50 }}>
                <Suspense fallback={null}>
                    <Environment preset="city" />
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} shadow-mapSize={2048} castShadow />

                    <PresentationControls
                        global
                        config={{ mass: 2, tension: 500 }}
                        snap={{ mass: 4, tension: 1500 }}
                        rotation={[0, 0.3, 0]}
                        polar={[-Math.PI / 3, Math.PI / 3]}
                        azimuth={[-Math.PI / 1.4, Math.PI / 2]}
                    >
                        <Float rotationIntensity={0.5} floatIntensity={0.5} speed={2}>
                            <TruckModel scale={1.2} />
                        </Float>
                    </PresentationControls>

                    <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2.5} far={4} />
                </Suspense>
            </Canvas>

            <div className="absolute bottom-4 right-4 z-10">
                <Badge variant="secondary" className="bg-green-100 text-green-700 animate-pulse">
                    SISTEMAS NOMINALES
                </Badge>
            </div>
        </div>
    );
}
