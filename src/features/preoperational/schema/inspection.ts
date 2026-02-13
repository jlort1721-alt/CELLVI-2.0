import { z } from "zod";

export const inspectionItemSchema = z.object({
    id: z.string(),
    item: z.string(),
    checked: z.boolean(),
    observation: z.string().optional(),
    critical: z.boolean().default(false),
    photoUrl: z.string().optional(),
});

export const preoperationalSchema = z.object({
    vehicleId: z.string().uuid("Debe seleccionar un vehículo"),
    driverId: z.string().uuid("Conductor requerido").optional(),
    odometer: z.number().min(0, "Kilometraje no válido"),
    items: z.array(inspectionItemSchema),
    overallStatus: z.enum(["approved", "rejected", "pending"]),
    observations: z.string().optional(),
    coordinates: z.object({
        lat: z.number(),
        lng: z.number()
    }).optional(),
});

export type Inspection = z.infer<typeof preoperationalSchema>;
