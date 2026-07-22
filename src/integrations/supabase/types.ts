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
      offerwalls: {
        Row: {
          active: boolean
          config: Json
          created_at: string
          description: string | null
          display_name: string
          id: string
          logo_url: string | null
          provider: string
          updated_at: string
          url_template: string
        }
        Insert: {
          active?: boolean
          config?: Json
          created_at?: string
          description?: string | null
          display_name: string
          id?: string
          logo_url?: string | null
          provider: string
          updated_at?: string
          url_template: string
        }
        Update: {
          active?: boolean
          config?: Json
          created_at?: string
          description?: string | null
          display_name?: string
          id?: string
          logo_url?: string | null
          provider?: string
          updated_at?: string
          url_template?: string
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
      profiles: {
        Row: {
          banned: boolean
          cash_balance: number
          city: string | null
          country: string | null
          created_at: string
          currency: Database["public"]["Enums"]["currency_type"]
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
          currency?: Database["public"]["Enums"]["currency_type"]
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
          currency?: Database["public"]["Enums"]["currency_type"]
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
        Relationships: []
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
          id?: string
          method_code?: string
          payment_details?: Json
          points_used?: number
          processed_at?: string | null
          status?: Database["public"]["Enums"]["withdraw_status"]
          user_id?: string
        }
        Relationships: []
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
      release_locked_fund: { Args: { _id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
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
