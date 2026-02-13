import { useTranslation } from "react-i18next";
import { FileText, ArrowLeft, Shield, Users, Ban, CreditCard, Scale, AlertTriangle, Clock, Gavel } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Terminos = () => {
    const { t } = useTranslation();
    const lastUpdated = "11 de febrero de 2026";

    const sections = [
        {
            icon: FileText,
            title: "1. Objeto y Aceptación",
            content: `Los presentes Términos y Condiciones regulan el acceso y uso de la plataforma CELLVI 2.0, propiedad de ASEGURAR LTDA (NIT 814.006.622-1), dedicada al monitoreo GPS, gestión de flotas, y seguridad vehicular.

Al registrarse, acceder o utilizar cualquier funcionalidad de la plataforma, usted declara haber leído, comprendido y aceptado estos términos en su totalidad. Si no está de acuerdo, debe abstenerse de usar el servicio.`,
        },
        {
            icon: Users,
            title: "2. Registro y Cuentas de Usuario",
            content: `• El registro requiere información veraz, completa y actualizada.
• Cada usuario es responsable de la confidencialidad de sus credenciales.
• Las cuentas son personales e intransferibles.
• ASEGURAR LTDA asigna roles (super_admin, admin, manager, operator, driver, client, auditor) con permisos diferenciados.
• El usuario debe notificar inmediatamente cualquier uso no autorizado de su cuenta.
• Nos reservamos el derecho de suspender o cancelar cuentas que violen estos términos.`,
        },
        {
            icon: Shield,
            title: "3. Uso Aceptable del Servicio",
            content: `El usuario se compromete a:
• Utilizar la plataforma únicamente para fines lícitos relacionados con gestión de flotas y monitoreo.
• No intentar acceder a datos de otros tenants o usuarios no autorizados.
• No interferir con el funcionamiento normal de la plataforma (ataques DDoS, inyección de código, etc.).
• No reproducir, distribuir o comercializar el software sin autorización escrita.
• Cumplir con todas las leyes de tránsito y transporte aplicables.
• Respetar los límites de uso definidos en su plan (rate limits, eventos por día, etc.).`,
        },
        {
            icon: CreditCard,
            title: "4. Planes, Precios y Facturación",
            content: `• Los precios se establecen según el plan contratado (SMB, Professional, Business, Enterprise).
• La facturación puede ser mensual o anual con descuento del 20% anual.
• Los precios están expresados en la moneda local del país (COP para Colombia).
• Los precios no incluyen IVA (19% en Colombia) salvo indicación contraria.
• El impago por más de 30 días podrá resultar en suspensión del servicio.
• Los cambios de plan se aplican al inicio del siguiente ciclo de facturación.
• No hay reembolsos por periodos parciales, salvo en caso de fuerza mayor.`,
        },
        {
            icon: Scale,
            title: "5. Propiedad Intelectual",
            content: `• CELLVI 2.0, su código fuente, diseño, interfaces, algoritmos, documentación y marca son propiedad exclusiva de ASEGURAR LTDA.
• Se concede al usuario una licencia limitada, no exclusiva, no transferible y revocable para usar la plataforma durante la vigencia del contrato.
• Los datos ingresados por el usuario son propiedad del usuario.
• Las evidencias generadas por el Truth Layer son copropiedad y podrán ser utilizadas como material probatorio.
• Queda prohibida la ingeniería inversa, descompilación o cualquier intento de acceder al código fuente.`,
        },
        {
            icon: AlertTriangle,
            title: "6. Limitación de Responsabilidad",
            content: `• ASEGURAR LTDA no garantiza la disponibilidad ininterrumpida del servicio, aunque se compromete a un SLO del 99.9%.
• No somos responsables de la precisión de los datos de telemetría proporcionados por dispositivos de terceros.
• En caso de fallos de conectividad (GNSS, celular, satelital), los datos se almacenarán localmente en el dispositivo y se sincronizarán al restablecerse la conexión.
• La responsabilidad máxima de ASEGURAR LTDA se limita al monto total pagado por el usuario en los últimos 12 meses.
• No nos responsabilizamos por daños indirectos, lucro cesante o pérdida de datos causada por uso inadecuado.`,
        },
        {
            icon: Ban,
            title: "7. Suspensión y Terminación",
            content: `ASEGURAR LTDA podrá suspender o terminar el acceso al servicio en los siguientes casos:
• Violación de estos Términos y Condiciones.
• Uso fraudulento o actividad ilícita detectada.
• Impago prolongado (más de 60 días).
• Solicitud de autoridad judicial competente.
• Decisión unilateral con preaviso de 30 días.

En caso de terminación, el usuario tendrá 30 días para exportar sus datos. Transcurrido este plazo, los datos serán eliminados conforme a la política de retención.`,
        },
        {
            icon: Clock,
            title: "8. Niveles de Servicio (SLA)",
            content: `• **Disponibilidad:** 99.9% mensual (excluyendo mantenimiento programado).
• **Latencia:** < 500ms end-to-end para visualización en mapa.
• **Ingesta:** Capacidad de hasta 10,000 eventos por segundo.
• **Soporte:** Horario laboral (L-V 8:00-18:00 COT) para planes SMB/Professional; 24/7 para Business/Enterprise.
• **Tiempo de respuesta:** Incidentes críticos < 1 hora, altos < 4 horas, medios < 8 horas.
• **Mantenimiento programado:** Ventana de mantenimiento notificada con 72 horas de anticipación.`,
        },
        {
            icon: Gavel,
            title: "9. Legislación Aplicable y Resolución de Conflictos",
            content: `• Estos términos se rigen por las leyes de la República de Colombia.
• Las partes acuerdan someterse a la jurisdicción de los tribunales de la ciudad de San Juan de Pasto, Nariño.
• Antes de acudir a la vía judicial, las partes intentarán resolver cualquier controversia de manera amistosa durante un plazo de 30 días.
• Para controversias menores a 100 SMLMV, se aceptará arbitraje conforme a las reglas de la Cámara de Comercio de Pasto.
• El usuario podrá presentar quejas ante la Superintendencia de Industria y Comercio (SIC).`,
        },
    ];

    return (
        <div className="min-h-screen bg-navy">
            {/* Hero */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-gold/5 to-transparent" />
                <div className="max-w-4xl mx-auto px-4 pt-8 pb-12 relative">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-gold text-sm hover:text-gold/80 transition-colors mb-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al inicio
                    </Link>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 mb-4"
                    >
                        <div className="p-3 rounded-2xl bg-gold/10 border border-gold/20">
                            <FileText className="w-8 h-8 text-gold" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white font-heading">
                                Términos y Condiciones
                            </h1>
                            <p className="text-white/50 text-sm mt-1">
                                Condiciones generales de uso de la plataforma CELLVI 2.0
                            </p>
                        </div>
                    </motion.div>

                    <div className="flex items-center gap-4 text-xs text-white/40 mt-4">
                        <span>Última actualización: {lastUpdated}</span>
                        <span>•</span>
                        <span>ASEGURAR LTDA — NIT 814.006.622-1</span>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 pb-16">
                <div className="space-y-6">
                    {sections.map((section, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="rounded-2xl border bg-white/[0.02] border-white/10 p-6 hover:border-gold/20 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-xl bg-gold/10">
                                    <section.icon className="w-5 h-5 text-gold" />
                                </div>
                                <h2 className="text-lg font-bold text-white font-heading">{section.title}</h2>
                            </div>
                            <div className="text-white/60 text-sm leading-relaxed whitespace-pre-line">
                                {section.content.split("**").map((part, i) =>
                                    i % 2 === 1 ? (
                                        <strong key={i} className="text-white/80 font-medium">
                                            {part}
                                        </strong>
                                    ) : (
                                        <span key={i}>{part}</span>
                                    )
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Footer CTA */}
                <div className="mt-12 text-center">
                    <p className="text-white/40 text-xs">
                        Al utilizar la plataforma CELLVI 2.0, usted acepta estos Términos y Condiciones.
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-4">
                        <Link to="/privacidad" className="text-gold text-xs hover:underline">
                            Política de Privacidad
                        </Link>
                        <span className="text-white/20">•</span>
                        <Link to="/" className="text-gold text-xs hover:underline">
                            Volver al inicio
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Terminos;
