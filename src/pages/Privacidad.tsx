import { useTranslation } from "react-i18next";
import { Shield, ArrowLeft, FileText, User, Database, Lock, Eye, Globe, Mail, Phone, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Privacidad = () => {
    const { t } = useTranslation();
    const lastUpdated = "11 de febrero de 2026";

    const sections = [
        {
            icon: User,
            title: "1. Responsable del Tratamiento",
            content: `ASEGURAR LTDA, sociedad colombiana identificada con NIT 814.006.622-1, con domicilio en Calle 19 No 27-41 Piso 2, Oficina 202, Edificio Merlopa, San Juan de Pasto, Nariño, Colombia. Email: asegurar.limitada@asegurar.com.co, Teléfono: +57 315 587 0498.`,
        },
        {
            icon: Database,
            title: "2. Datos Recopilados",
            content: `Recopilamos los siguientes tipos de datos personales:
• **Datos de identificación:** nombre, documento de identidad, email, teléfono.
• **Datos de la cuenta:** credenciales de acceso (hash de contraseña), rol asignado, preferencias.
• **Datos de telemetría:** ubicación GPS de vehículos, velocidad, consumo de combustible, temperatura de carga.
• **Datos de navegación:** dirección IP, tipo de navegador, páginas visitadas, cookies.
• **Datos de conductores:** licencia, historial de rutas, score de conducción.
• **Datos de facturación:** información de pago (procesada por terceros certificados PCI DSS).`,
        },
        {
            icon: FileText,
            title: "3. Finalidad del Tratamiento",
            content: `Los datos personales serán tratados para:
• Prestar el servicio de monitoreo GPS y gestión de flotas.
• Generar alertas de seguridad y evidencia probatoria (Truth Layer).
• Administrar la relación contractual y facturación.
• Cumplir obligaciones legales (RUNT, RISTRA, PESV, SICE-TAC).
• Mejorar la plataforma mediante análisis agregados y anónimos.
• Enviar comunicaciones comerciales (solo con consentimiento previo).`,
        },
        {
            icon: Lock,
            title: "4. Seguridad de los Datos",
            content: `Implementamos medidas técnicas y organizativas conformes con estándares internacionales:
• **Cifrado:** TLS 1.3 en tránsito, AES-256 en reposo.
• **Hash Chaining:** Integridad criptográfica de eventos (SHA-256).
• **Autenticación:** JWT con rotación de tokens, OAuth 2.0, MFA disponible.
• **Control de acceso:** RBAC con 7 roles definidos (super_admin, admin, manager, operator, driver, client, auditor).
• **Auditoría:** Log inmutable de acceso a evidencias.
• **Infraestructura:** Supabase (PostgreSQL) con respaldos automáticos y alta disponibilidad.`,
        },
        {
            icon: Eye,
            title: "5. Derechos del Titular (ARCO)",
            content: `Conforme a la Ley 1581 de 2012, usted tiene derecho a:
• **Acceso:** Conocer qué datos personales tenemos sobre usted.
• **Rectificación:** Corregir datos inexactos o incompletos.
• **Cancelación:** Solicitar la eliminación de sus datos cuando no sean necesarios.
• **Oposición:** Oponerse al tratamiento para fines específicos.
• **Portabilidad:** Recibir sus datos en formato estructurado.

Para ejercer estos derechos, envíe su solicitud a: asegurar.limitada@asegurar.com.co indicando: nombre completo, documento de identidad, descripción de la solicitud y datos de contacto. Responderemos en un plazo máximo de 15 días hábiles.`,
        },
        {
            icon: Globe,
            title: "6. Transferencia Internacional",
            content: `Sus datos pueden ser transferidos a:
• **Supabase/AWS:** Servidores en us-east-1 (Virginia, EE.UU.) y us-west-2 (Oregon, EE.UU.) para prestación del servicio.
• **Proveedores de servicios:** Procesadores de pago, servicios de email, y analytics que cumplen con estándares equivalentes de protección de datos.

Todas las transferencias se realizan con cláusulas contractuales que garantizan un nivel adecuado de protección conforme a la normativa colombiana.`,
        },
        {
            icon: Shield,
            title: "7. Cookies y Tecnologías Similares",
            content: `Utilizamos cookies para:
• **Necesarias:** Funcionamiento de la plataforma, autenticación, preferencias de idioma.
• **Analíticas:** Análisis de uso agregado para mejorar el servicio.
• **Marketing:** Personalización de contenido (solo con consentimiento).

Puede gestionar sus preferencias de cookies en cualquier momento a través del banner de cookies disponible en la plataforma.`,
        },
        {
            icon: FileText,
            title: "8. Retención de Datos",
            content: `Los datos personales serán conservados durante:
• **Datos de cuenta:** Durante la vigencia de la relación contractual + 5 años.
• **Datos de telemetría:** Hot storage (0-3 meses), warm (3-12 meses), cold (>1 año) hasta eliminación por el cliente.
• **Evidencias probatorias:** 10 años (conforme a requisitos legales colombianos).
• **Logs de auditoría:** 5 años.
• **Datos de facturación:** 10 años (legislación tributaria).`,
        },
        {
            icon: Mail,
            title: "9. Contacto y Autoridad de Control",
            content: `Para cualquier consulta sobre esta política:
• **Email:** asegurar.limitada@asegurar.com.co
• **Teléfono:** +57 315 587 0498
• **Dirección:** Calle 19 No 27-41 Piso 2, Oficina 202, Edificio Merlopa, San Juan de Pasto, Nariño.

**Autoridad de Control:** Superintendencia de Industria y Comercio (SIC) — Delegatura para la Protección de Datos Personales.`,
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
                            <Shield className="w-8 h-8 text-gold" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white font-heading">
                                Política de Privacidad
                            </h1>
                            <p className="text-white/50 text-sm mt-1">
                                Ley 1581 de 2012 — Protección de Datos Personales
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
                        Al utilizar la plataforma CELLVI 2.0, usted acepta esta Política de Privacidad.
                    </p>
                    <div className="flex items-center justify-center gap-4 mt-4">
                        <Link to="/terminos" className="text-gold text-xs hover:underline">
                            Términos de Servicio
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

export default Privacidad;
