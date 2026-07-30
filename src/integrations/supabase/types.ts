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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_domains: {
        Row: {
          admin_id: string
          created_at: string
          domain_id: string
          id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          domain_id: string
          id?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          domain_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_domains_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_domains_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
          last_login_at: string | null
          name: string
          notes: string | null
          revenue_share: number
          role_key: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          last_login_at?: string | null
          name: string
          notes?: string | null
          revenue_share?: number
          role_key?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          last_login_at?: string | null
          name?: string
          notes?: string | null
          revenue_share?: number
          role_key?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          active: boolean
          body: string
          created_at: string
          id: string
          title: string
        }
        Insert: {
          active?: boolean
          body: string
          created_at?: string
          id?: string
          title: string
        }
        Update: {
          active?: boolean
          body?: string
          created_at?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          active: boolean
          created_at: string
          environment: string
          id: string
          key_value: string
          last_used_at: string | null
          name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          environment?: string
          id?: string
          key_value: string
          last_used_at?: string | null
          name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          environment?: string
          id?: string
          key_value?: string
          last_used_at?: string | null
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          admin_email: string
          id: number
          lock_days: number
          lock_percentage: number
          points_per_inr: number
          points_per_usd: number
          referral_commission_points: number
          signup_bonus_points: number
          updated_at: string
        }
        Insert: {
          admin_email?: string
          id?: number
          lock_days?: number
          lock_percentage?: number
          points_per_inr?: number
          points_per_usd?: number
          referral_commission_points?: number
          signup_bonus_points?: number
          updated_at?: string
        }
        Update: {
          admin_email?: string
          id?: number
          lock_days?: number
          lock_percentage?: number
          points_per_inr?: number
          points_per_usd?: number
          referral_commission_points?: number
          signup_bonus_points?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          domain: string | null
          entity: string
          entity_id: string | null
          id: string
          ip_address: string | null
          new_value: Json | null
          old_value: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          domain?: string | null
          entity: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          domain?: string | null
          entity?: string
          entity_id?: string | null
          id?: string
          ip_address?: string | null
          new_value?: Json | null
          old_value?: Json | null
          user_agent?: string | null
        }
        Relationships: []
      }
      backups: {
        Row: {
          error: string | null
          finished_at: string | null
          id: string
          kind: string
          location: string | null
          size_bytes: number | null
          started_at: string
          status: string
          trigger_type: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: string
          kind?: string
          location?: string | null
          size_bytes?: number | null
          started_at?: string
          status?: string
          trigger_type?: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: string
          kind?: string
          location?: string | null
          size_bytes?: number | null
          started_at?: string
          status?: string
          trigger_type?: string
        }
        Relationships: []
      }
      chat_feed: {
        Row: {
          created_at: string
          display_name: string | null
          event_type: Database["public"]["Enums"]["chat_event_type"]
          id: string
          message: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          event_type: Database["public"]["Enums"]["chat_event_type"]
          id?: string
          message: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          event_type?: Database["public"]["Enums"]["chat_event_type"]
          id?: string
          message?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contests: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          end_at: string
          id: string
          name: string
          prize: string
          start_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          end_at: string
          id?: string
          name: string
          prize: string
          start_at: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          end_at?: string
          id?: string
          name?: string
          prize?: string
          start_at?: string
        }
        Relationships: []
      }
      cron_jobs: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          last_duration_ms: number | null
          last_error: string | null
          last_run_at: string | null
          last_status: string
          name: string
          queued: number
          schedule: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          last_duration_ms?: number | null
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string
          name: string
          queued?: number
          schedule?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          last_duration_ms?: number | null
          last_error?: string | null
          last_run_at?: string | null
          last_status?: string
          name?: string
          queued?: number
          schedule?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      domains: {
        Row: {
          created_at: string
          currency: string
          domain: string
          id: string
          language: string
          notes: string | null
          owner_id: string | null
          ssl_status: string
          status: string
          theme: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          domain: string
          id?: string
          language?: string
          notes?: string | null
          owner_id?: string | null
          ssl_status?: string
          status?: string
          theme?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          domain?: string
          id?: string
          language?: string
          notes?: string | null
          owner_id?: string | null
          ssl_status?: string
          status?: string
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      generated_postbacks: {
        Row: {
          admin_id: string | null
          created_at: string
          id: string
          network_name: string
          secret: string
          url: string
        }
        Insert: {
          admin_id?: string | null
          created_at?: string
          id?: string
          network_name: string
          secret: string
          url: string
        }
        Update: {
          admin_id?: string | null
          created_at?: string
          id?: string
          network_name?: string
          secret?: string
          url?: string
        }
        Relationships: []
      }
      locked_funds: {
        Row: {
          amount: number
          id: string
          locked_at: string
          offer_source: string
          points: number
          release_at: string
          released_at: string | null
          status: Database["public"]["Enums"]["lock_status"]
          user_id: string
        }
        Insert: {
          amount: number
          id?: string
          locked_at?: string
          offer_source: string
          points?: number
          release_at: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["lock_status"]
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          locked_at?: string
          offer_source?: string
          points?: number
          release_at?: string
          released_at?: string | null
          status?: Database["public"]["Enums"]["lock_status"]
          user_id?: string
        }
        Relationships: []
      }
      network_request_history: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          request_id: string
          to_status: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          request_id: string
          to_status?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          request_id?: string
          to_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_request_history_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "network_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      network_requests: {
        Row: {
          admin_name: string | null
          callback_url: string | null
          created_at: string
          domain_id: string | null
          id: string
          network_name: string
          notes: string | null
          offer_id: string | null
          offer_name: string | null
          payout_variable: string
          points: number
          requested_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          status_variable: string
          tracking_url: string
          transaction_variable: string
          updated_at: string
          user_variable: string
        }
        Insert: {
          admin_name?: string | null
          callback_url?: string | null
          created_at?: string
          domain_id?: string | null
          id?: string
          network_name: string
          notes?: string | null
          offer_id?: string | null
          offer_name?: string | null
          payout_variable?: string
          points?: number
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          status_variable?: string
          tracking_url: string
          transaction_variable?: string
          updated_at?: string
          user_variable?: string
        }
        Update: {
          admin_name?: string | null
          callback_url?: string | null
          created_at?: string
          domain_id?: string | null
          id?: string
          network_name?: string
          notes?: string | null
          offer_id?: string | null
          offer_name?: string | null
          payout_variable?: string
          points?: number
          requested_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          status_variable?: string
          tracking_url?: string
          transaction_variable?: string
          updated_at?: string
          user_variable?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_requests_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      networks: {
        Row: {
          category: string | null
          conversions: number
          created_at: string
          id: string
          name: string
          revenue: number
          status: string
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          conversions?: number
          created_at?: string
          id?: string
          name: string
          revenue?: number
          status?: string
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          conversions?: number
          created_at?: string
          id?: string
          name?: string
          revenue?: number
          status?: string
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          severity: string
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          severity?: string
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          severity?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          active: boolean
          category: string | null
          countries: string[]
          created_at: string
          currency: string
          description: string | null
          device: string | null
          expiry_date: string | null
          id: string
          image_url: string | null
          is_public: boolean
          offer_id: string
          payout: number
          payout_model: string
          percent: number
          platform: string | null
          points: number
          title: string
          tracking_url: string | null
          traffic_sources: string | null
          updated_at: string
          url: string
          user_variable: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          countries?: string[]
          created_at?: string
          currency?: string
          description?: string | null
          device?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          offer_id: string
          payout?: number
          payout_model?: string
          percent?: number
          platform?: string | null
          points?: number
          title: string
          tracking_url?: string | null
          traffic_sources?: string | null
          updated_at?: string
          url: string
          user_variable?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          countries?: string[]
          created_at?: string
          currency?: string
          description?: string | null
          device?: string | null
          expiry_date?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          offer_id?: string
          payout?: number
          payout_model?: string
          percent?: number
          platform?: string | null
          points?: number
          title?: string
          tracking_url?: string | null
          traffic_sources?: string | null
          updated_at?: string
          url?: string
          user_variable?: string
        }
        Relationships: []
      }
      offerwalls: {
        Row: {
          active: boolean
          api_key: string | null
          api_url: string | null
          category: string | null
          config: Json
          created_at: string
          description: string | null
          display_name: string
          domain_id: string | null
          id: string
          iframe_url: string | null
          last_error: string | null
          last_postback_at: string | null
          logo_url: string | null
          postback_url: string | null
          priority: number
          provider: string
          revenue: number
          revenue_share: number
          secret_key: string | null
          updated_at: string
          url_template: string
        }
        Insert: {
          active?: boolean
          api_key?: string | null
          api_url?: string | null
          category?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          display_name: string
          domain_id?: string | null
          id?: string
          iframe_url?: string | null
          last_error?: string | null
          last_postback_at?: string | null
          logo_url?: string | null
          postback_url?: string | null
          priority?: number
          provider: string
          revenue?: number
          revenue_share?: number
          secret_key?: string | null
          updated_at?: string
          url_template: string
        }
        Update: {
          active?: boolean
          api_key?: string | null
          api_url?: string | null
          category?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          display_name?: string
          domain_id?: string | null
          id?: string
          iframe_url?: string | null
          last_error?: string | null
          last_postback_at?: string | null
          logo_url?: string | null
          postback_url?: string | null
          priority?: number
          provider?: string
          revenue?: number
          revenue_share?: number
          secret_key?: string | null
          updated_at?: string
          url_template?: string
        }
        Relationships: [
          {
            foreignKeyName: "offerwalls_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string
          id: string
          label: string
          resource: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          label: string
          resource: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          label?: string
          resource?: string
        }
        Relationships: []
      }
      points_ledger: {
        Row: {
          cash_delta: number
          created_at: string
          description: string | null
          id: string
          points: number
          reference_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          cash_delta?: number
          created_at?: string
          description?: string | null
          id?: string
          points: number
          reference_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          cash_delta?: number
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          reference_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      postback_logs: {
        Row: {
          amount: number | null
          created_at: string
          created_by_admin_id: string | null
          error: string | null
          id: string
          ip_address: string | null
          points: number | null
          processed: boolean
          provider: string
          raw_payload: Json
          signature_valid: boolean
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string
          created_by_admin_id?: string | null
          error?: string | null
          id?: string
          ip_address?: string | null
          points?: number | null
          processed?: boolean
          provider: string
          raw_payload: Json
          signature_valid?: boolean
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string
          created_by_admin_id?: string | null
          error?: string | null
          id?: string
          ip_address?: string | null
          points?: number | null
          processed?: boolean
          provider?: string
          raw_payload?: Json
          signature_valid?: boolean
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      postbacks: {
        Row: {
          created_at: string
          domain_id: string | null
          error: string | null
          id: string
          network: string | null
          offer_id: string | null
          offerwall_id: string | null
          payout: number | null
          points: number | null
          processed: boolean
          raw: Json | null
          signature_valid: boolean
          status: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          domain_id?: string | null
          error?: string | null
          id?: string
          network?: string | null
          offer_id?: string | null
          offerwall_id?: string | null
          payout?: number | null
          points?: number | null
          processed?: boolean
          raw?: Json | null
          signature_valid?: boolean
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          domain_id?: string | null
          error?: string | null
          id?: string
          network?: string | null
          offer_id?: string | null
          offerwall_id?: string | null
          payout?: number | null
          points?: number | null
          processed?: boolean
          raw?: Json | null
          signature_valid?: boolean
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "postbacks_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postbacks_offerwall_id_fkey"
            columns: ["offerwall_id"]
            isOneToOne: false
            referencedRelation: "offerwalls"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          banned: boolean
          cash_balance: number
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          domain_id: string | null
          email: string
          id: string
          ip_address: string | null
          locked_balance: number
          name: string | null
          phone: string | null
          points_balance: number
          referral_code: string
          referred_by: string | null
          state: string | null
          updated_at: string
          verified: boolean
        }
        Insert: {
          banned?: boolean
          cash_balance?: number
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          domain_id?: string | null
          email: string
          id: string
          ip_address?: string | null
          locked_balance?: number
          name?: string | null
          phone?: string | null
          points_balance?: number
          referral_code?: string
          referred_by?: string | null
          state?: string | null
          updated_at?: string
          verified?: boolean
        }
        Update: {
          banned?: boolean
          cash_balance?: number
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          domain_id?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          locked_balance?: number
          name?: string | null
          phone?: string | null
          points_balance?: number
          referral_code?: string
          referred_by?: string | null
          state?: string | null
          updated_at?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "profiles_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      promocode_redemptions: {
        Row: {
          created_at: string
          id: string
          promocode_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          promocode_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          promocode_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promocode_redemptions_promocode_id_fkey"
            columns: ["promocode_id"]
            isOneToOne: false
            referencedRelation: "promocodes"
            referencedColumns: ["id"]
          },
        ]
      }
      promocodes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          expires_at: string | null
          id: string
          points: number
          usage_limit: number
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          points: number
          usage_limit?: number
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          points?: number
          usage_limit?: number
          used_count?: number
        }
        Relationships: []
      }
      publishers: {
        Row: {
          country: string | null
          created_at: string
          domain_id: string | null
          email: string
          id: string
          iframe_status: string
          name: string
          postback_status: string
          revenue: number
          status: string
          total_clicks: number
          total_conversions: number
          updated_at: string
          website: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          domain_id?: string | null
          email: string
          id?: string
          iframe_status?: string
          name: string
          postback_status?: string
          revenue?: number
          status?: string
          total_clicks?: number
          total_conversions?: number
          updated_at?: string
          website?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          domain_id?: string | null
          email?: string
          id?: string
          iframe_status?: string
          name?: string
          postback_status?: string
          revenue?: number
          status?: string
          total_clicks?: number
          total_conversions?: number
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "publishers_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          commission_points: number
          created_at: string
          id: string
          referred_id: string
          referrer_id: string
        }
        Insert: {
          commission_points?: number
          created_at?: string
          id?: string
          referred_id: string
          referrer_id: string
        }
        Update: {
          commission_points?: number
          created_at?: string
          id?: string
          referred_id?: string
          referrer_id?: string
        }
        Relationships: []
      }
      revenue_reports: {
        Row: {
          admin_id: string | null
          conversions: number
          country: string | null
          created_at: string
          day: string
          domain_id: string | null
          id: string
          network_id: string | null
          offerwall_id: string | null
          payout: number
          publisher_id: string | null
          revenue: number
        }
        Insert: {
          admin_id?: string | null
          conversions?: number
          country?: string | null
          created_at?: string
          day: string
          domain_id?: string | null
          id?: string
          network_id?: string | null
          offerwall_id?: string | null
          payout?: number
          publisher_id?: string | null
          revenue?: number
        }
        Update: {
          admin_id?: string | null
          conversions?: number
          country?: string | null
          created_at?: string
          day?: string
          domain_id?: string | null
          id?: string
          network_id?: string | null
          offerwall_id?: string | null
          payout?: number
          publisher_id?: string | null
          revenue?: number
        }
        Relationships: [
          {
            foreignKeyName: "revenue_reports_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_reports_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_reports_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "networks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_reports_offerwall_id_fkey"
            columns: ["offerwall_id"]
            isOneToOne: false
            referencedRelation: "offerwalls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_reports_publisher_id_fkey"
            columns: ["publisher_id"]
            isOneToOne: false
            referencedRelation: "publishers"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      surveys: {
        Row: {
          active: boolean
          banner_url: string | null
          countries: string[] | null
          created_at: string
          description: string | null
          id: string
          network_name: string
          network_url: string
          offer_id: string | null
          points: number
          updated_at: string
          user_variable: string
        }
        Insert: {
          active?: boolean
          banner_url?: string | null
          countries?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          network_name: string
          network_url: string
          offer_id?: string | null
          points?: number
          updated_at?: string
          user_variable?: string
        }
        Update: {
          active?: boolean
          banner_url?: string | null
          countries?: string[] | null
          created_at?: string
          description?: string | null
          id?: string
          network_name?: string
          network_url?: string
          offer_id?: string | null
          points?: number
          updated_at?: string
          user_variable?: string
        }
        Relationships: []
      }
      system_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          category: string
          created_at: string
          detail: string | null
          domain: string | null
          id: string
          ip_address: string | null
          level: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          category?: string
          created_at?: string
          detail?: string | null
          domain?: string | null
          id?: string
          ip_address?: string | null
          level?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          category?: string
          created_at?: string
          detail?: string | null
          domain?: string | null
          id?: string
          ip_address?: string | null
          level?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          body: string
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdraw_methods: {
        Row: {
          active: boolean
          code: string
          created_at: string
          display_name: string
          fields: Json
          id: string
          min_amount: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          display_name: string
          fields?: Json
          id?: string
          min_amount?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          display_name?: string
          fields?: Json
          id?: string
          min_amount?: number
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
          domain_id: string | null
          id: string
          method_code: string
          payment_details: Json
          points_used: number
          processed_at: string | null
          status: Database["public"]["Enums"]["withdraw_status"]
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          currency: Database["public"]["Enums"]["currency_type"]
          domain_id?: string | null
          id?: string
          method_code: string
          payment_details: Json
          points_used: number
          processed_at?: string | null
          status?: Database["public"]["Enums"]["withdraw_status"]
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          currency?: Database["public"]["Enums"]["currency_type"]
          domain_id?: string | null
          id?: string
          method_code?: string
          payment_details?: Json
          points_used?: number
          processed_at?: string | null
          status?: Database["public"]["Enums"]["withdraw_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "domains"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_points: {
        Args: {
          _description: string
          _points: number
          _reference_id?: string
          _type: string
          _user_id: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      release_locked_fund: { Args: { _id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin"
      chat_event_type:
        | "user_joined"
        | "survey_completed"
        | "points_earned"
        | "withdrawal_requested"
        | "withdrawal_approved"
      currency_type: "INR" | "USD"
      lock_status: "locked" | "released"
      ticket_priority: "low" | "medium" | "high"
      ticket_status: "open" | "in_progress" | "closed"
      withdraw_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "user", "super_admin"],
      chat_event_type: [
        "user_joined",
        "survey_completed",
        "points_earned",
        "withdrawal_requested",
        "withdrawal_approved",
      ],
      currency_type: ["INR", "USD"],
      lock_status: ["locked", "released"],
      ticket_priority: ["low", "medium", "high"],
      ticket_status: ["open", "in_progress", "closed"],
      withdraw_status: ["pending", "approved", "rejected"],
    },
  },
} as const
