
export interface ManifiestoData {
    numeroManifiesto: string;
    fechaExpedicion: string; // YYYY-MM-DD
    placaVehiculo: string;
    conductorId: string;
    ciudadOrigen: string; // Codigo DANE
    ciudadDestino: string; // Codigo DANE
    valorFlete: number;
    pesoCargaKg: number;
    remitenteNit: string;
    destinatarioNit: string;
    observaciones?: string;
}

export function generateManifiestoXml(data: ManifiestoData): string {
    // Basic XML Structure for RNDC / MinTransporte Colombia
    // This follows standard XML schemes for cargo manifests
    return `<?xml version="1.0" encoding="UTF-8"?>
<root>
    <encabezado>
        <usuario>CELLVI_INTEGRATION</usuario>
        <clave>********</clave>
        <ambiente>PRUEBAS</ambiente>
        <transaccion>303</transaccion> <!-- Codigo Manifiesto -->
    </encabezado>
    <cuerpo>
        <manifiestocarga>
            <consecutivo>${data.numeroManifiesto}</consecutivo>
            <fechaexpedicion>${data.fechaExpedicion}</fechaexpedicion>
            <placa>${data.placaVehiculo}</placa>
            <conductor>${data.conductorId}</conductor>
            <origenviaje>${data.ciudadOrigen}</origenviaje>
            <destinoviaje>${data.ciudadDestino}</destinoviaje>
            <valorflete>${data.valorFlete}</valorflete>
            <pesocarga>${data.pesoCargaKg}</pesocarga>
            <remitente>${data.remitenteNit}</remitente>
            <destinatario>${data.destinatarioNit}</destinatario>
            <observaciones>${data.observaciones || ''}</observaciones>
        </manifiestocarga>
    </cuerpo>
</root>`;
}
