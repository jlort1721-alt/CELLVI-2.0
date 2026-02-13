import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Smartphone, Download, Star } from "lucide-react";

const MobileAppSection = () => {
    const { t } = useTranslation();

    return (
        <section className="py-20 bg-background overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7 }}
                        className="lg:w-1/2 relative"
                    >
                        <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-foreground/5 max-w-sm mx-auto transform rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                            <img
                                src="/mobile-app-driver.jpg"
                                alt="App Conductor CELLVI"
                                className="w-full h-auto"
                            />
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gold/5 rounded-full blur-3xl -z-10" />
                        <div className="absolute -bottom-6 -right-6 lg:right-10 bg-card p-4 rounded-xl shadow-xl border border-border z-20 animate-bounce-slow">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="flex text-gold">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} className="w-3 h-3 fill-current" />
                                    ))}
                                </div>
                                <span className="text-xs font-bold">4.9/5</span>
                            </div>
                            <div className="text-xs text-muted-foreground">Driver Rating</div>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7 }}
                        className="lg:w-1/2 text-center lg:text-left"
                    >
                        <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 mb-6">
                            <Smartphone className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-primary">Mobile First Control</span>
                        </div>

                        <h2 className="font-heading font-extrabold text-3xl md:text-4xl lg:text-5xl text-foreground mb-6">
                            {t("app.title", "Control Total en la Palma de tu Mano")}
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                            {t("app.description", "Empodera a tus conductores y supervisores con nuestra App móvil nativa. Gestión de rutas, inspecciones pre-operacionales y comunicación en tiempo real, incluso sin conexión.")}
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                            <Button size="lg" className="h-14 px-8 bg-foreground text-background hover:bg-foreground/90 rounded-xl flex items-center gap-3">
                                <Download className="w-6 h-6" />
                                <div className="text-left">
                                    <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">Available on</div>
                                    <div className="text-sm font-bold">App Store</div>
                                </div>
                            </Button>
                            <Button size="lg" variant="outline" className="h-14 px-8 border-foreground/20 rounded-xl flex items-center gap-3 hover:bg-foreground/5">
                                <Download className="w-6 h-6" />
                                <div className="text-left">
                                    <div className="text-[10px] uppercase font-bold tracking-wider opacity-70">Get it on</div>
                                    <div className="text-sm font-bold">Google Play</div>
                                </div>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default MobileAppSection;
