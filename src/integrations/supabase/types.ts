export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          data: Json
          id: string
          message: string
          policy_id: string | null
          severity: string
          tenant_id: string
          type: string
          vehicle_id: string | null
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          data?: Json
          id?: string
          message: string
          policy_id?: string | null
          severity?: string
          tenant_id: string
          type: string
          vehicle_id?: string | null
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          data?: Json
          id?: string
          message?: string
          policy_id?: string | null
          severity?: string
          tenant_id?: string
          type?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alerts_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      cold_chain_logs: {
        Row: {
          created_at: string
          extras: Json
          humidity: number | null
          id: string
          in_range: boolean
          latitude: number | null
          longitude: number | null
          sensor_id: string | null
          temperature: number
          tenant_id: string
          ts: string
          vehicle_id: string
        }
        Insert: {
          created_at?: string
          extras?: Json
          humidity?: number | null
          id?: string
          in_range?: boolean
          latitude?: number | null
          longitude?: number | null
          sensor_id?: string | null
          temperature: number
          tenant_id: string
          ts?: string
          vehicle_id: string
        }
        Update: {
          created_at?: string
          extras?: Json
          humidity?: number | null
          id?: string
          in_range?: boolean
          latitude?: number | null
          longitude?: number | null
          sensor_id?: string | null
          temperature?: number
          tenant_id?: string
          ts?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cold_chain_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cold_chain_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          module: string
          tenant_id: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          module: string
          tenant_id: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          module?: string
          tenant_id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_documents: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          document_url: string | null
          effective_date: string | null
          expiry_date: string | null
          id: string
          last_reviewed_at: string | null
          metadata: Json
          next_review_at: string | null
          related_driver_id: string | null
          related_vehicle_id: string | null
          responsible_role: string | null
          review_frequency_days: number | null
          status: string
          subcategory: string | null
          tenant_id: string
          title: string
          updated_at: string
          version: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_url?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          last_reviewed_at?: string | null
          metadata?: Json
          next_review_at?: string | null
          related_driver_id?: string | null
          related_vehicle_id?: string | null
          responsible_role?: string | null
          review_frequency_days?: number | null
          status?: string
          subcategory?: string | null
          tenant_id: string
          title: string
          updated_at?: string
          version?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          document_url?: string | null
          effective_date?: string | null
          expiry_date?: string | null
          id?: string
          last_reviewed_at?: string | null
          metadata?: Json
          next_review_at?: string | null
          related_driver_id?: string | null
          related_vehicle_id?: string | null
          responsible_role?: string | null
          review_frequency_days?: number | null
          status?: string
          subcategory?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_documents_related_driver_id_fkey"
            columns: ["related_driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_documents_related_vehicle_id_fkey"
            columns: ["related_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_records: {
        Row: {
          channel: string
          consent_type: string
          created_at: string
          created_by: string | null
          evidence_url: string | null
          expires_at: string | null
          granted: boolean
          granted_at: string
          id: string
          metadata: Json
          purpose: string
          retention_days: number
          revocation_reason: string | null
          revoked_at: string | null
          subject_email: string | null
          subject_id_number: string
          subject_id_type: string
          subject_name: string
          subject_phone: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          channel?: string
          consent_type?: string
          created_at?: string
          created_by?: string | null
          evidence_url?: string | null
          expires_at?: string | null
          granted?: boolean
          granted_at?: string
          id?: string
          metadata?: Json
          purpose: string
          retention_days?: number
          revocation_reason?: string | null
          revoked_at?: string | null
          subject_email?: string | null
          subject_id_number: string
          subject_id_type?: string
          subject_name: string
          subject_phone?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          channel?: string
          consent_type?: string
          created_at?: string
          created_by?: string | null
          evidence_url?: string | null
          expires_at?: string | null
          granted?: boolean
          granted_at?: string
          id?: string
          metadata?: Json
          purpose?: string
          retention_days?: number
          revocation_reason?: string | null
          revoked_at?: string | null
          subject_email?: string | null
          subject_id_number?: string
          subject_id_type?: string
          subject_name?: string
          subject_phone?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consent_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          honeypot: string | null
          id: string
          message: string
          name: string
          phone: string
        }
        Insert: {
          created_at?: string
          email: string
          honeypot?: string | null
          id?: string
          message: string
          name: string
          phone: string
        }
        Update: {
          created_at?: string
          email?: string
          honeypot?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string
        }
        Relationships: []
      }
      data_subject_requests: {
        Row: {
          assigned_to: string | null
          audit_trail: Json
          created_at: string
          description: string
          id: string
          radicado: string
          request_type: string
          responded_at: string | null
          response_deadline: string | null
          response_text: string | null
          status: string
          subject_email: string
          subject_id_number: string
          subject_name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          audit_trail?: Json
          created_at?: string
          description: string
          id?: string
          radicado?: string
          request_type: string
          responded_at?: string | null
          response_deadline?: string | null
          response_text?: string | null
          status?: string
          subject_email: string
          subject_id_number: string
          subject_name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          audit_trail?: Json
          created_at?: string
          description?: string
          id?: string
          radicado?: string
          request_type?: string
          responded_at?: string | null
          response_deadline?: string | null
          response_text?: string | null
          status?: string
          subject_email?: string
          subject_id_number?: string
          subject_name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_subject_requests_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      device_certificates: {
        Row: {
          algorithm: string
          created_at: string
          device_id: string
          expires_at: string
          fingerprint: string
          id: string
          issued_at: string
          predecessor_id: string | null
          public_key_pem: string
          revocation_reason: string | null
          revoked_at: string | null
          status: string
          tenant_id: string
        }
        Insert: {
          algorithm?: string
          created_at?: string
          device_id: string
          expires_at: string
          fingerprint: string
          id?: string
          issued_at?: string
          predecessor_id?: string | null
          public_key_pem: string
          revocation_reason?: string | null
          revoked_at?: string | null
          status?: string
          tenant_id: string
        }
        Update: {
          algorithm?: string
          created_at?: string
          device_id?: string
          expires_at?: string
          fingerprint?: string
          id?: string
          issued_at?: string
          predecessor_id?: string | null
          public_key_pem?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_certificates_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_certificates_predecessor_id_fkey"
            columns: ["predecessor_id"]
            isOneToOne: false
            referencedRelation: "device_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_certificates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      device_messages_raw: {
        Row: {
          attempts: number
          created_at: string
          device_id: string | null
          error_message: string | null
          event_count: number
          id: string
          idempotency_key: string
          imei: string
          max_attempts: number
          next_retry_at: string | null
          normalized_payload: Json | null
          processed_at: string | null
          protocol: string
          raw_payload: Json
          sequence_number: number | null
          status: string
          tenant_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          device_id?: string | null
          error_message?: string | null
          event_count?: number
          id?: string
          idempotency_key: string
          imei: string
          max_attempts?: number
          next_retry_at?: string | null
          normalized_payload?: Json | null
          processed_at?: string | null
          protocol?: string
          raw_payload: Json
          sequence_number?: number | null
          status?: string
          tenant_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          device_id?: string | null
          error_message?: string | null
          event_count?: number
          id?: string
          idempotency_key?: string
          imei?: string
          max_attempts?: number
          next_retry_at?: string | null
          normalized_payload?: Json | null
          processed_at?: string | null
          protocol?: string
          raw_payload?: Json
          sequence_number?: number | null
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_messages_raw_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_messages_raw_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          active: boolean
          config: Json
          connectivity: string
          created_at: string
          firmware_version: string | null
          id: string
          imei: string
          last_seen_at: string | null
          protocol: string
          protocol_version: string | null
          serial_number: string | null
          tenant_id: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          active?: boolean
          config?: Json
          connectivity?: string
          created_at?: string
          firmware_version?: string | null
          id?: string
          imei: string
          last_seen_at?: string | null
          protocol?: string
          protocol_version?: string | null
          serial_number?: string | null
          tenant_id: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          active?: boolean
          config?: Json
          connectivity?: string
          created_at?: string
          firmware_version?: string | null
          id?: string
          imei?: string
          last_seen_at?: string | null
          protocol?: string
          protocol_version?: string | null
          serial_number?: string | null
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          assigned_vehicle_id: string | null
          created_at: string
          email: string | null
          id: string
          license_expiry: string | null
          license_number: string | null
          metadata: Json
          name: string
          phone: string | null
          score: number
          status: string
          tenant_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_vehicle_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          metadata?: Json
          name: string
          phone?: string | null
          score?: number
          status?: string
          tenant_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_vehicle_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          license_expiry?: string | null
          license_number?: string | null
          metadata?: Json
          name?: string
          phone?: string | null
          score?: number
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_assigned_vehicle_id_fkey"
            columns: ["assigned_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      escalation_logs: {
        Row: {
          alert_id: string
          escalated_to_email: string
          escalation_level: number
          id: string
          tenant_id: string
          triggered_at: string
        }
        Insert: {
          alert_id: string
          escalated_to_email: string
          escalation_level?: number
          id?: string
          tenant_id: string
          triggered_at?: string
        }
        Update: {
          alert_id?: string
          escalated_to_email?: string
          escalation_level?: number
          id?: string
          tenant_id?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escalation_logs_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escalation_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_exports: {
        Row: {
          bundle_hash: string
          created_at: string
          exported_by: string | null
          format: string
          id: string
          merkle_root_ids: string[]
          record_count: number
          tenant_id: string
        }
        Insert: {
          bundle_hash: string
          created_at?: string
          exported_by?: string | null
          format?: string
          id?: string
          merkle_root_ids?: string[]
          record_count: number
          tenant_id: string
        }
        Update: {
          bundle_hash?: string
          created_at?: string
          exported_by?: string | null
          format?: string
          id?: string
          merkle_root_ids?: string[]
          record_count?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_exports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_records: {
        Row: {
          access_log: Json
          chain_index: number | null
          created_at: string
          data: Json
          description: string
          device_fingerprint: string | null
          device_signature: string | null
          event_id: string | null
          event_type: string
          id: string
          merkle_leaf_index: number | null
          merkle_root_id: string | null
          prev_hash: string | null
          sealed_at: string
          sha256_hash: string
          source: string
          tenant_id: string
          vehicle_id: string | null
          verified: boolean
        }
        Insert: {
          access_log?: Json
          chain_index?: number | null
          created_at?: string
          data?: Json
          description: string
          device_fingerprint?: string | null
          device_signature?: string | null
          event_id?: string | null
          event_type: string
          id?: string
          merkle_leaf_index?: number | null
          merkle_root_id?: string | null
          prev_hash?: string | null
          sealed_at?: string
          sha256_hash: string
          source?: string
          tenant_id: string
          vehicle_id?: string | null
          verified?: boolean
        }
        Update: {
          access_log?: Json
          chain_index?: number | null
          created_at?: string
          data?: Json
          description?: string
          device_fingerprint?: string | null
          device_signature?: string | null
          event_id?: string | null
          event_type?: string
          id?: string
          merkle_leaf_index?: number | null
          merkle_root_id?: string | null
          prev_hash?: string | null
          sealed_at?: string
          sha256_hash?: string
          source?: string
          tenant_id?: string
          vehicle_id?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "evidence_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_records_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      fuec_contracts: {
        Row: {
          client_name: string
          client_nit: string | null
          contract_number: string
          created_at: string
          id: string
          object_description: string | null
          pdf_url: string | null
          route_destination: string | null
          route_origin: string | null
          signed_by: string | null
          status: string
          tenant_id: string
          updated_at: string
          valid_from: string
          valid_until: string
        }
        Insert: {
          client_name: string
          client_nit?: string | null
          contract_number: string
          created_at?: string
          id?: string
          object_description?: string | null
          pdf_url?: string | null
          route_destination?: string | null
          route_origin?: string | null
          signed_by?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          valid_from: string
          valid_until: string
        }
        Update: {
          client_name?: string
          client_nit?: string | null
          contract_number?: string
          created_at?: string
          id?: string
          object_description?: string | null
          pdf_url?: string | null
          route_destination?: string | null
          route_origin?: string | null
          signed_by?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "fuec_contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      geofences: {
        Row: {
          active: boolean
          coordinates: Json
          created_at: string
          description: string | null
          id: string
          metadata: Json
          name: string
          radius: number | null
          tenant_id: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          coordinates?: Json
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name: string
          radius?: number | null
          tenant_id: string
          type?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          coordinates?: Json
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json
          name?: string
          radius?: number | null
          tenant_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      gnss_anomalies: {
        Row: {
          altitude: number | null
          altitude_delta: number | null
          anomaly_type: string
          confidence_score: number
          correlated_device_ids: string[] | null
          created_at: string
          device_id: string | null
          expected_max_m: number | null
          features_snapshot: Json
          fleet_anomaly_count: number | null
          hdop: number | null
          heading: number | null
          heading_delta: number | null
          id: string
          ml_model_version: string | null
          notes: string | null
          position_jump_m: number | null
          resolved_at: string | null
          resolved_by: string | null
          response_actions: string[] | null
          route_deviation_m: number | null
          rules_triggered: string[]
          satellites: number | null
          severity: string
          snr_avg: number | null
          snr_variance: number | null
          speed: number | null
          speed_delta: number | null
          status: string
          tenant_id: string
          ts: string
          vehicle_id: string
        }
        Insert: {
          altitude?: number | null
          altitude_delta?: number | null
          anomaly_type?: string
          confidence_score?: number
          correlated_device_ids?: string[] | null
          created_at?: string
          device_id?: string | null
          expected_max_m?: number | null
          features_snapshot?: Json
          fleet_anomaly_count?: number | null
          hdop?: number | null
          heading?: number | null
          heading_delta?: number | null
          id?: string
          ml_model_version?: string | null
          notes?: string | null
          position_jump_m?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          response_actions?: string[] | null
          route_deviation_m?: number | null
          rules_triggered?: string[]
          satellites?: number | null
          severity?: string
          snr_avg?: number | null
          snr_variance?: number | null
          speed?: number | null
          speed_delta?: number | null
          status?: string
          tenant_id: string
          ts?: string
          vehicle_id: string
        }
        Update: {
          altitude?: number | null
          altitude_delta?: number | null
          anomaly_type?: string
          confidence_score?: number
          correlated_device_ids?: string[] | null
          created_at?: string
          device_id?: string | null
          expected_max_m?: number | null
          features_snapshot?: Json
          fleet_anomaly_count?: number | null
          hdop?: number | null
          heading?: number | null
          heading_delta?: number | null
          id?: string
          ml_model_version?: string | null
          notes?: string | null
          position_jump_m?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          response_actions?: string[] | null
          route_deviation_m?: number | null
          rules_triggered?: string[]
          satellites?: number | null
          severity?: string
          snr_avg?: number | null
          snr_variance?: number | null
          speed?: number | null
          speed_delta?: number | null
          status?: string
          tenant_id?: string
          ts?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gnss_anomalies_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gnss_anomalies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gnss_anomalies_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_logs: {
        Row: {
          completed_by: string | null
          completed_date: string | null
          cost: number | null
          created_at: string
          description: string
          documents: string[] | null
          id: string
          maintenance_type: string
          next_service_date: string | null
          next_service_km: number | null
          observations: string | null
          odometer_at_service: number | null
          provider: string | null
          scheduled_date: string | null
          status: string
          tenant_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          completed_by?: string | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description: string
          documents?: string[] | null
          id?: string
          maintenance_type?: string
          next_service_date?: string | null
          next_service_km?: number | null
          observations?: string | null
          odometer_at_service?: number | null
          provider?: string | null
          scheduled_date?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          completed_by?: string | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string
          documents?: string[] | null
          id?: string
          maintenance_type?: string
          next_service_date?: string | null
          next_service_km?: number | null
          observations?: string | null
          odometer_at_service?: number | null
          provider?: string | null
          scheduled_date?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      merkle_roots: {
        Row: {
          algorithm: string
          created_at: string
          first_chain_index: number
          first_event_at: string
          id: string
          last_chain_index: number
          last_event_at: string
          leaf_count: number
          root_hash: string
          tenant_id: string
          tree_depth: number
        }
        Insert: {
          algorithm?: string
          created_at?: string
          first_chain_index: number
          first_event_at: string
          id?: string
          last_chain_index: number
          last_event_at: string
          leaf_count: number
          root_hash: string
          tenant_id: string
          tree_depth: number
        }
        Update: {
          algorithm?: string
          created_at?: string
          first_chain_index?: number
          first_event_at?: string
          id?: string
          last_chain_index?: number
          last_event_at?: string
          leaf_count?: number
          root_hash?: string
          tenant_id?: string
          tree_depth?: number
        }
        Relationships: [
          {
            foreignKeyName: "merkle_roots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pesv_inspections: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          checklist: Json
          created_at: string
          driver_id: string | null
          evidence_photos: string[] | null
          id: string
          inspection_date: string
          inspection_type: string
          metadata: Json
          observations: string | null
          overall_score: number | null
          status: string
          tenant_id: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          checklist?: Json
          created_at?: string
          driver_id?: string | null
          evidence_photos?: string[] | null
          id?: string
          inspection_date?: string
          inspection_type?: string
          metadata?: Json
          observations?: string | null
          overall_score?: number | null
          status?: string
          tenant_id: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          checklist?: Json
          created_at?: string
          driver_id?: string | null
          evidence_photos?: string[] | null
          id?: string
          inspection_date?: string
          inspection_type?: string
          metadata?: Json
          observations?: string | null
          overall_score?: number | null
          status?: string
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pesv_inspections_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pesv_inspections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pesv_inspections_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      policies: {
        Row: {
          actions: Json
          category: string
          conditions: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          last_triggered_at: string | null
          logic: string
          name: string
          status: string
          tenant_id: string
          trigger_count: number
          updated_at: string
        }
        Insert: {
          actions?: Json
          category?: string
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_triggered_at?: string | null
          logic?: string
          name: string
          status?: string
          tenant_id: string
          trigger_count?: number
          updated_at?: string
        }
        Update: {
          actions?: Json
          category?: string
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_triggered_at?: string | null
          logic?: string
          name?: string
          status?: string
          tenant_id?: string
          trigger_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pqr_submissions: {
        Row: {
          created_at: string
          description: string
          email: string
          honeypot: string | null
          id: string
          name: string
          phone: string | null
          radicado: string
          status: string
          subject: string
          type: string
        }
        Insert: {
          created_at?: string
          description: string
          email: string
          honeypot?: string | null
          id?: string
          name: string
          phone?: string | null
          radicado?: string
          status?: string
          subject: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string
          email?: string
          honeypot?: string | null
          id?: string
          name?: string
          phone?: string | null
          radicado?: string
          status?: string
          subject?: string
          type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          tenant_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          tenant_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      protocol_registry: {
        Row: {
          created_at: string
          devices_count: number
          display_name: string
          field_mapping: Json
          id: string
          last_message_at: string | null
          parser_config: Json
          protocol_name: string
          sample_payload: Json | null
          status: string
          updated_at: string
          version: string
        }
        Insert: {
          created_at?: string
          devices_count?: number
          display_name: string
          field_mapping?: Json
          id?: string
          last_message_at?: string | null
          parser_config?: Json
          protocol_name: string
          sample_payload?: Json | null
          status?: string
          updated_at?: string
          version?: string
        }
        Update: {
          created_at?: string
          devices_count?: number
          display_name?: string
          field_mapping?: Json
          id?: string
          last_message_at?: string | null
          parser_config?: Json
          protocol_name?: string
          sample_payload?: Json | null
          status?: string
          updated_at?: string
          version?: string
        }
        Relationships: []
      }
      telemetry_events: {
        Row: {
          altitude: number | null
          created_at: string
          device_id: string | null
          engine_on: boolean | null
          extras: Json
          fuel_level: number | null
          hdop: number | null
          heading: number | null
          id: string
          latitude: number | null
          longitude: number | null
          odometer: number | null
          satellites: number | null
          source: string
          speed: number | null
          tenant_id: string
          ts: string
          vehicle_id: string
        }
        Insert: {
          altitude?: number | null
          created_at?: string
          device_id?: string | null
          engine_on?: boolean | null
          extras?: Json
          fuel_level?: number | null
          hdop?: number | null
          heading?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          odometer?: number | null
          satellites?: number | null
          source?: string
          speed?: number | null
          tenant_id: string
          ts?: string
          vehicle_id: string
        }
        Update: {
          altitude?: number | null
          created_at?: string
          device_id?: string | null
          engine_on?: boolean | null
          extras?: Json
          fuel_level?: number | null
          hdop?: number | null
          heading?: number | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          odometer?: number | null
          satellites?: number | null
          source?: string
          speed?: number | null
          tenant_id?: string
          ts?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "telemetry_events_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      rndc_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          operation_type: string
          radicado: string | null
          response_ministry: string | null
          status: string | null
          tenant_id: string | null
          trip_id: string | null
          updated_at: string
          xml_generated: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          operation_type: string
          radicado?: string | null
          response_ministry?: string | null
          status?: string | null
          tenant_id?: string | null
          trip_id?: string | null
          updated_at?: string
          xml_generated?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          operation_type?: string
          radicado?: string | null
          response_ministry?: string | null
          status?: string | null
          tenant_id?: string | null
          trip_id?: string | null
          updated_at?: string
          xml_generated?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rndc_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rndc_logs_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          active: boolean
          config: Json
          created_at: string
          features: Json
          id: string
          limits: Json
          name: string
          plan: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          config?: Json
          created_at?: string
          features?: Json
          id?: string
          limits?: Json
          name: string
          plan?: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          config?: Json
          created_at?: string
          features?: Json
          id?: string
          limits?: Json
          name?: string
          plan?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      trip_comments: {
        Row: {
          attachments: string[] | null
          created_at: string
          id: string
          is_internal: boolean | null
          message: string
          tenant_id: string
          trip_id: string
          user_id: string | null
        }
        Insert: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message: string
          tenant_id: string
          trip_id: string
          user_id?: string | null
        }
        Update: {
          attachments?: string[] | null
          created_at?: string
          id?: string
          is_internal?: boolean | null
          message?: string
          tenant_id?: string
          trip_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_comments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_events: {
        Row: {
          coords: unknown | null
          created_at: string
          evidence_urls: string[] | null
          id: string
          location_name: string | null
          notes: string | null
          occurred_at: string
          status: string
          tenant_id: string
          trip_id: string
          type: string
        }
        Insert: {
          coords?: unknown | null
          created_at?: string
          evidence_urls?: string[] | null
          id?: string
          location_name?: string | null
          notes?: string | null
          occurred_at?: string
          status?: string
          tenant_id: string
          trip_id: string
          type: string
        }
        Update: {
          coords?: unknown | null
          created_at?: string
          evidence_urls?: string[] | null
          id?: string
          location_name?: string | null
          notes?: string | null
          occurred_at?: string
          status?: string
          tenant_id?: string
          trip_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_events_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          actual_end_at: string | null
          actual_start_at: string | null
          cargo_type: string | null
          client_ref: string | null
          contract_id: string | null
          created_at: string
          destination_coords: unknown | null
          destination_name: string | null
          distance_actual_km: number | null
          distance_expected_km: number | null
          driver_id: string | null
          fuel_consumed_gal: number | null
          id: string
          manifest_ref: string | null
          metadata: Json
          origin_coords: unknown | null
          origin_name: string | null
          route_polyline: unknown | null
          scheduled_start_at: string | null
          status: string
          tenant_id: string
          updated_at: string
          vehicle_id: string
          weight_kg: number | null
        }
        Insert: {
          actual_end_at?: string | null
          actual_start_at?: string | null
          cargo_type?: string | null
          client_ref?: string | null
          contract_id?: string | null
          created_at?: string
          destination_coords?: unknown | null
          destination_name?: string | null
          distance_actual_km?: number | null
          distance_expected_km?: number | null
          driver_id?: string | null
          fuel_consumed_gal?: number | null
          id?: string
          manifest_ref?: string | null
          metadata?: Json
          origin_coords?: unknown | null
          origin_name?: string | null
          route_polyline?: unknown | null
          scheduled_start_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          vehicle_id: string
          weight_kg?: number | null
        }
        Update: {
          actual_end_at?: string | null
          actual_start_at?: string | null
          cargo_type?: string | null
          client_ref?: string | null
          contract_id?: string | null
          created_at?: string
          destination_coords?: unknown | null
          destination_name?: string | null
          distance_actual_km?: number | null
          distance_expected_km?: number | null
          driver_id?: string | null
          fuel_consumed_gal?: number | null
          id?: string
          manifest_ref?: string | null
          metadata?: Json
          origin_coords?: unknown | null
          origin_name?: string | null
          route_polyline?: unknown | null
          scheduled_start_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          vehicle_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "fuec_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          active: boolean
          brand: string | null
          created_at: string
          id: string
          metadata: Json
          model: string | null
          plate: string
          tenant_id: string
          type: string
          updated_at: string
          vin: string | null
          year: number | null
        }
        Insert: {
          active?: boolean
          brand?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          model?: string | null
          plate: string
          tenant_id: string
          type?: string
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Update: {
          active?: boolean
          brand?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          model?: string | null
          plate?: string
          tenant_id?: string
          type?: string
          updated_at?: string
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_items: {
        Row: {
          created_at: string
          description: string
          id: string
          quantity: number
          sku: string | null
          tenant_id: string
          total_cost: number
          type: string
          unit_cost: number
          work_order_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          quantity?: number
          sku?: string | null
          tenant_id: string
          total_cost?: number
          type?: string
          unit_cost?: number
          work_order_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          quantity?: number
          sku?: string | null
          tenant_id?: string
          total_cost?: number
          type?: string
          unit_cost?: number
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_items_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          invoice_ref: string | null
          odometer_reading: number | null
          priority: string
          provider_name: string | null
          scheduled_at: string | null
          status: string
          tenant_id: string
          total_cost: number | null
          type: string
          updated_at: string
          vehicle_id: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          invoice_ref?: string | null
          odometer_reading?: number | null
          priority?: string
          provider_name?: string | null
          scheduled_at?: string | null
          status?: string
          tenant_id: string
          total_cost?: number | null
          type?: string
          updated_at?: string
          vehicle_id: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          invoice_ref?: string | null
          odometer_reading?: number | null
          priority?: string
          provider_name?: string | null
          scheduled_at?: string | null
          status?: string
          tenant_id?: string
          total_cost?: number | null
          type?: string
          updated_at?: string
          vehicle_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_latest_chain_hash: { Args: { p_tenant_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_tenant_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      next_chain_index: { Args: { p_tenant_id: string }; Returns: number }
    }
    Enums: {
      app_role:
      | "super_admin"
      | "admin"
      | "manager"
      | "operator"
      | "driver"
      | "client"
      | "auditor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "manager",
        "operator",
        "driver",
        "client",
        "auditor",
      ],
    },
  },
} as const
