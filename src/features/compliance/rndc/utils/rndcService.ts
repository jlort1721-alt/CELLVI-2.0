
import { supabase } from "@/integrations/supabase/client";

export interface RndcResponse {
    radicado: string;
    fecha: string;
    estado: string;
    job_id?: string;
}

/**
 * Encola una solicitud de manifiesto para procesamiento asíncrono.
 * @param manifestPayload Datos del manifiesto XML o JSON.
 * @returns El Job creado en la cola.
 */
export const submitManifestToRNDC = async (manifestPayload: any): Promise<RndcResponse> => {
    console.log("Encolando manifiesto RNDC...", manifestPayload);

    // Insertar en la cola asíncrona
    const { data: job, error } = await supabase
        .from("integration_jobs") // Tabla creada en migración 20260212200000
        .insert({
            type: "RNDC_SEND_MANIFEST",
            payload: manifestPayload,
            status: "queued",
            attempts: 0,
            max_attempts: 5, // Reintentos robustos
            next_run_at: new Date().toISOString() // Ejecutar cuanto antes
        })
        .select()
        .single();

    if (error) {
        console.error("Error al encolar RNDC Job:", error);
        throw new Error("No se pudo encolar la transmisión al RNDC. Intente nuevamente.");
    }

    // Retornar respuesta preliminar (ACK)
    return {
        radicado: "PENDIENTE-" + job.id.slice(0, 8),
        fecha: new Date().toISOString(),
        estado: "ENCOLADO",
        job_id: job.id
    };
};

/**
 * Verifica el estado de un trabajo en background.
 */
export const checkJobStatus = async (jobId: string) => {
    const { data, error } = await supabase
        .from("integration_jobs")
        .select("status, last_error, attempts, response_payload") // Asumiendo que response_payload se actualiza al terminar
        .eq("id", jobId)
        .single();

    if (error) return null;
    return data;
};
