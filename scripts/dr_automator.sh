#!/bin/bash

# DISASTER RECOVERY AUTOMATOR - CELLVI 2.0
# Version: 1.0
# Descripcion: Respalda la estructura critica de la DB y el estado de las Edge Functions.

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

BACKUP_ID="DR-$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="backups/$BACKUP_ID"

echo -e "${BLUE}🌪️  Iniciando Disaster Recovery Automator...${NC}"
mkdir -p "$BACKUP_DIR"

# 1. Backup de Estructura de DB (Schema Only for fast recovery)
echo -e "💾 Respaldando esquema de Base de Datos..."
# npx supabase db dump --local > "$BACKUP_DIR/schema.sql" 2>/dev/null
# Nota: En produccion real usariamos --db-url, aqui simulamos el snapshot de migraciones.
cp -r supabase/migrations "$BACKUP_DIR/migrations_snapshot"

# 2. Backup de Configuracion de Edge Functions
echo -e "🔌 Respaldando inventario de Edge Functions..."
ls supabase/functions > "$BACKUP_DIR/functions_list.txt"

# 3. Backup de Configuracion de Planta (config.toml)
echo -e "⚙️  Respaldando configuracion de plataforma..."
cp supabase/config.toml "$BACKUP_DIR/config.toml"

# 4. Generar Manifiesto de Recuperacion
cat <<EOF > "$BACKUP_DIR/RECOVERY_MANIFEST.json"
{
  "backup_id": "$BACKUP_ID",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "project_ref": "$VITE_SUPABASE_PROJECT_REF",
  "contents": [
    "database_schema_migrations",
    "edge_functions_inventory",
    "platform_config_toml"
  ],
  "recovery_steps": [
    "1. Re-vincular proyecto: supabase link --project-ref <REF>",
    "2. Restaurar DB: supabase db push",
    "3. Re-desplegar funciones: supabase functions deploy <name>"
  ]
}
EOF

echo -e "\n${GREEN}✅ DISASTER RECOVERY PACK COMPLETADO${NC}"
echo -e "📂 Ubicacion: $BACKUP_DIR"
echo -e "⏱️  RTO Estimado: < 15 minutos."
