#!/bin/bash

# Script de Despliegue Backend a Supabase (Producción)
# Uso: ./scripts/deploy_backend.sh

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Verificaciones Previas
if [ -z "$VITE_SUPABASE_PROJECT_REF" ]; then
    echo -e "${RED}Error: Falta VITE_SUPABASE_PROJECT_REF en .env${NC}"
    echo "Agrega el ID de tu proyecto (ej: xydfk...). Usa '.env' como fuente."
    exit 1
fi

echo -e "${GREEN}Iniciando Despliegue a $VITE_SUPABASE_PROJECT_REF${NC}"

# 1. Aplicar Migraciones
echo "Aplicando Migraciones SQL..."
supabase db push --project-ref $VITE_SUPABASE_PROJECT_REF
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migraciones Aplicadas${NC}"
else
    echo -e "${RED}❌ Error al aplicar migraciones${NC}"
    exit 1
fi

# 2. Desplegar Edge Functions
echo "Desplegando Funciones..."
# telemetry-ingest
supabase functions deploy telemetry-ingest --project-ref $VITE_SUPABASE_PROJECT_REF --no-verify-jwt
# optimize-route (Requiere Verify JWT para proteger uso comercial)
supabase functions deploy optimize-route --project-ref $VITE_SUPABASE_PROJECT_REF

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Funciones Desplegadas${NC}"
else
    echo -e "${RED}❌ Error al desplegar funciones${NC}"
    exit 1
fi

# 3. Validar Salud (Health Check)
echo "Validando endpoint de telemetria..."
curl -I -X OPTIONS "https://$VITE_SUPABASE_PROJECT_REF.functions.supabase.co/telemetry-ingest"

echo -e "${GREEN}🚀 Despliegue Backend Completado.${NC}"
echo "Ahora puedes hacer git push para activar Vercel/Netlify en el Frontend."
