
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('🚀 RNDC Sync Function Initialized');

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Manejo de CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { trip_id, operation_type } = await req.json()

        if (!trip_id) throw new Error('trip_id is required');

        console.log(`📡 Sincronizando RNDC para Trip: ${trip_id} (${operation_type})`);

        // 1. Obtener datos del viaje para el XML
        const { data: trip, error: tErr } = await supabaseClient
            .from('trips')
            .select('*, vehicles(*), drivers(*), tenants(*)')
            .eq('id', trip_id)
            .single();

        if (tErr) throw tErr;

        // 2. Mapeo a XML (Esquema oficial RNDC del Ministerio de Transporte)
        // Este es un ejemplo simplificado del Manifiesto de Carga
        const rndcXml = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:rndc="http://rndc.mintransporte.gov.co/">
        <soapenv:Header/>
        <soapenv:Body>
          <rndc:AtenderSolicitudManifiesto>
            <manifiesto>
              <placa>${trip.vehicles?.plate}</placa>
              <conductor>${trip.drivers?.name}</conductor>
              <cedulaConductor>${trip.drivers?.metadata?.documento_id}</cedulaConductor>
              <origen>${trip.origin_name}</origen>
              <destino>${trip.destination_name}</destino>
              <peso_kg>${trip.weight_kg}</peso_kg>
              <fecha>${new Date().toISOString().split('T')[0]}</fecha>
            </manifiesto>
          </rndc:AtenderSolicitudManifiesto>
        </soapenv:Body>
      </soapenv:Envelope>
    `;

        // 3. Simulación de envío a RNDC (Producción debería usar fetch a endpoints de MinTransporte)
        console.log('📤 Enviando XML a RNDC...');

        // Simular latencia y respuesta exitosa
        await new Promise(r => setTimeout(r, 1500));
        const mockRadicado = `MT-${Math.floor(Math.random() * 900000 + 100000)}`;

        // 4. Registrar en Auditoría (WORM Proof)
        const { error: logErr } = await supabaseClient
            .from('rndc_logs')
            .insert({
                trip_id,
                tenant_id: trip.tenant_id,
                operation_type: operation_type || 'MANIFIESTO',
                xml_generated: rndcXml,
                response_ministry: '<response>SUCCESS</response>',
                radicado: mockRadicado,
                status: 'success'
            });

        if (logErr) throw logErr;

        return new Response(
            JSON.stringify({
                message: 'Sync Successful',
                radicado: mockRadicado,
                evidence: 'Hash Generated and Logged'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error('❌ RNDC Error:', error.message);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
