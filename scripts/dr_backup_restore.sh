#!/bin/bash

# Configuration
PROD_REF="your-prod-project-ref"
STAGING_REF="your-staging-project-ref"
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

function backup_prod() {
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    FILE="$BACKUP_DIR/prod_backup_$TIMESTAMP.sql"
    
    echo "📦 Starting PROD Backup ($PROD_REF)..."
    npx supabase db dump --project-ref $PROD_REF -f $FILE
    
    if [ $? -eq 0 ]; then
        echo "✅ Backup Successful: $FILE"
        # Optional: Upload to S3 here
    else
        echo "❌ Backup Failed!"
        exit 1
    fi
}

function restore_staging() {
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/*.sql | head -1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        echo "❌ No backup files found to restore."
        exit 1
    fi
    
    echo "⚠️  WARNING: Using backup $LATEST_BACKUP"
    echo "🔥 RESTORING TO STAGING ($STAGING_REF). All data will be wiped!"
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi

    # Reset remote DB (This is destructive)
    npx supabase db reset --project-ref $STAGING_REF
    
    # Push Schema + Data
    # Note: supabase db dump includes data if configured, otherwise only schema.
    # Usually we want full dump for DR test.
    
    psql -h db.$STAGING_REF.supabase.co -U postgres -d postgres -f $LATEST_BACKUP
    
    echo "✅ Restore Completed."
}

case "$1" in
    backup)
        backup_prod
        ;;
    restore-test)
        restore_staging
        ;;
    *)
        echo "Usage: $0 {backup|restore-test}"
        exit 1
esac
