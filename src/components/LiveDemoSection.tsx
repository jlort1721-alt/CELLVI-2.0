import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { MapPin, Truck, Activity, Zap, Gauge, Fuel, Battery, Signal } from "lucide-react";
import { vehicles } from "@/lib/demoData";

const LiveDemoSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]);
  const [liveUpdate, setLiveUpdate] = useState(false);

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUpdate(true);
      setTimeout(() => setLiveUpdate(false), 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "activo":
        return "bg-green-500";
      case "detenido":
        return "bg-yellow-500";
      case "alerta":
        return "bg-red-500";
      case "apagado":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "activo":
        return "En Movimiento";
      case "detenido":
        return "Detenido";
      case "alerta":
        return "Alerta Activa";
      case "apagado":
        return "Apagado";
      default:
        return status;
    }
  };

  return (
    <section className="py-20 md:py-28 bg-section-gradient relative overflow-hidden" ref={ref}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-[20%] right-[10%] w-96 h-96 bg-blue-500 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] left-[10%] w-96 h-96 bg-gold rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-heading font-bold tracking-widest text-gold uppercase">
            Demo en Vivo
          </span>
          <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mt-3">
            Rastreo GPS en Tiempo Real
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-lg">
            Monitorea tu flota como lo hacen nuestros clientes. Datos reales actualizados cada 30 segundos.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {/* Vehicle List */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/30">
                <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
                  <Truck className="w-5 h-5 text-gold" />
                  Flota Demo ({vehicles.length} vehículos)
                </h3>
              </div>
              <div className="divide-y divide-border max-h-[600px] overflow-y-auto">
                {vehicles.map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle)}
                    className={`w-full p-4 text-left transition-all hover:bg-muted/50 ${
                      selectedVehicle.id === vehicle.id ? 'bg-gold/10 border-l-4 border-gold' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-foreground">{vehicle.plate}</span>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(vehicle.status)} ${liveUpdate ? 'animate-ping' : ''}`} />
                        <span className="text-xs text-muted-foreground">{vehicle.lastUpdate}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{vehicle.driver}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        vehicle.status === 'activo' ? 'bg-green-500/10 text-green-600' :
                        vehicle.status === 'alerta' ? 'bg-red-500/10 text-red-600' :
                        vehicle.status === 'detenido' ? 'bg-yellow-500/10 text-yellow-600' :
                        'bg-gray-500/10 text-gray-600'
                      }`}>
                        {getStatusText(vehicle.status)}
                      </span>
                      {vehicle.speed > 0 && (
                        <span className="text-xs text-muted-foreground">{vehicle.speed} km/h</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Vehicle Details */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-border bg-muted/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-2xl text-foreground mb-1">
                      {selectedVehicle.plate}
                    </h3>
                    <p className="text-sm text-muted-foreground">{selectedVehicle.driver}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${getStatusColor(selectedVehicle.status)} text-white text-sm font-bold flex items-center gap-2`}>
                    <Activity className="w-4 h-4" />
                    {getStatusText(selectedVehicle.status)}
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="relative h-64 bg-muted/20">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="w-12 h-12 text-gold mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Lat: {selectedVehicle.lat.toFixed(4)}, Lng: {selectedVehicle.lng.toFixed(4)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedVehicle.route}</p>
                  </div>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="bg-card rounded-lg px-3 py-2 shadow-lg border border-border flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-green-500 ${liveUpdate ? 'animate-pulse' : ''}`} />
                    <span className="text-xs font-medium text-foreground">Actualización en vivo</span>
                  </div>
                </div>
              </div>

              {/* Telemetry */}
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="w-4 h-4 text-blue-500" />
                      <span className="text-xs text-muted-foreground">Velocidad</span>
                    </div>
                    <p className="font-heading font-bold text-2xl text-foreground">
                      {selectedVehicle.speed}
                      <span className="text-sm text-muted-foreground ml-1">km/h</span>
                    </p>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Fuel className="w-4 h-4 text-orange-500" />
                      <span className="text-xs text-muted-foreground">Combustible</span>
                    </div>
                    <p className="font-heading font-bold text-2xl text-foreground">
                      {selectedVehicle.fuel}
                      <span className="text-sm text-muted-foreground ml-1">%</span>
                    </p>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                      <div
                        className={`h-1.5 rounded-full ${
                          selectedVehicle.fuel > 50 ? 'bg-green-500' :
                          selectedVehicle.fuel > 30 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${selectedVehicle.fuel}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Battery className="w-4 h-4 text-green-500" />
                      <span className="text-xs text-muted-foreground">Batería</span>
                    </div>
                    <p className="font-heading font-bold text-2xl text-foreground">
                      {selectedVehicle.battery}
                      <span className="text-sm text-muted-foreground ml-1">%</span>
                    </p>
                    <div className="w-full bg-muted rounded-full h-1.5 mt-2">
                      <div
                        className="h-1.5 rounded-full bg-green-500"
                        style={{ width: `${selectedVehicle.battery}%` }}
                      />
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Signal className="w-4 h-4 text-purple-500" />
                      <span className="text-xs text-muted-foreground">Señal</span>
                    </div>
                    <p className="font-heading font-bold text-2xl text-foreground">
                      {selectedVehicle.signal}
                      <span className="text-sm text-muted-foreground ml-1">/5</span>
                    </p>
                    <div className="flex gap-1 mt-2">
                      {[1, 2, 3, 4, 5].map((bar) => (
                        <div
                          key={bar}
                          className={`flex-1 h-1.5 rounded-full ${
                            bar <= selectedVehicle.signal ? 'bg-purple-500' : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 grid grid-cols-3 gap-4 pt-6 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Tipo</p>
                    <p className="text-sm font-medium text-foreground">{selectedVehicle.type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Kilometraje</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedVehicle.km.toLocaleString()} km
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Motor</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedVehicle.engineOn ? (
                        <span className="text-green-500">Encendido</span>
                      ) : (
                        <span className="text-gray-500">Apagado</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-4">
            ¿Quieres ver esto en acción con tu propia flota?
          </p>
          <a
            href="/demo"
            className="inline-flex items-center gap-2 bg-gold text-white px-8 py-3 rounded-lg font-heading font-bold hover:bg-gold/90 transition-colors"
          >
            <Zap className="w-5 h-5" />
            Solicitar Demo Personalizada
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default LiveDemoSection;
