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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          land_id: string | null
          production_id: string | null
          scheduled_date: string | null
          status: string
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          land_id?: string | null
          production_id?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          land_id?: string | null
          production_id?: string | null
          scheduled_date?: string | null
          status?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          changes: Json | null
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          changes?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          changes?: Json | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      connection_revoke_requests: {
        Row: {
          connection_id: string
          created_at: string | null
          id: string
          reason: string | null
          requested_by: string
          responded_at: string | null
          responded_by: string | null
          response_note: string | null
          status: string | null
        }
        Insert: {
          connection_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
          requested_by: string
          responded_at?: string | null
          responded_by?: string | null
          response_note?: string | null
          status?: string | null
        }
        Update: {
          connection_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          requested_by?: string
          responded_at?: string | null
          responded_by?: string | null
          response_note?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_revoke_requests_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "manager_farmer_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_revoke_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_revoke_requests_responded_by_fkey"
            columns: ["responded_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lands: {
        Row: {
          address: string | null
          area_m2: number
          commodities: string[]
          created_at: string
          created_by: string | null
          custom_commodity: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          photos: string[]
          status: string
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          area_m2: number
          commodities?: string[]
          created_at?: string
          created_by?: string | null
          custom_commodity?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          photos?: string[]
          status?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          area_m2?: number
          commodities?: string[]
          created_at?: string
          created_by?: string | null
          custom_commodity?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          photos?: string[]
          status?: string
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lands_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lands_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_farmer_connections: {
        Row: {
          connection_type: Database["public"]["Enums"]["connection_type"]
          created_at: string | null
          created_by: string
          farmer_id: string
          id: string
          manager_id: string
          request_note: string | null
          responded_at: string | null
          response_note: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: Database["public"]["Enums"]["connection_status"]
          updated_at: string | null
        }
        Insert: {
          connection_type: Database["public"]["Enums"]["connection_type"]
          created_at?: string | null
          created_by: string
          farmer_id: string
          id?: string
          manager_id: string
          request_note?: string | null
          responded_at?: string | null
          response_note?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string | null
        }
        Update: {
          connection_type?: Database["public"]["Enums"]["connection_type"]
          created_at?: string | null
          created_by?: string
          farmer_id?: string
          id?: string
          manager_id?: string
          request_note?: string | null
          responded_at?: string | null
          response_note?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: Database["public"]["Enums"]["connection_status"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manager_farmer_connections_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_farmer_connections_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_farmer_connections_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_farmer_connections_revoked_by_fkey"
            columns: ["revoked_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      productions: {
        Row: {
          commodity: string
          created_at: string
          created_by: string | null
          estimated_harvest_date: string | null
          harvest_date: string | null
          harvest_yield_kg: number | null
          id: string
          land_id: string
          notes: string | null
          planting_date: string
          seed_count: number
          selling_price_per_kg: number | null
          status: string
          total_cost: number | null
          updated_at: string
          updated_by: string | null
          user_id: string | null
        }
        Insert: {
          commodity: string
          created_at?: string
          created_by?: string | null
          estimated_harvest_date?: string | null
          harvest_date?: string | null
          harvest_yield_kg?: number | null
          id?: string
          land_id: string
          notes?: string | null
          planting_date: string
          seed_count: number
          selling_price_per_kg?: number | null
          status?: string
          total_cost?: number | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Update: {
          commodity?: string
          created_at?: string
          created_by?: string | null
          estimated_harvest_date?: string | null
          harvest_date?: string | null
          harvest_yield_kg?: number | null
          id?: string
          land_id?: string
          notes?: string | null
          planting_date?: string
          seed_count?: number
          selling_price_per_kg?: number | null
          status?: string
          total_cost?: number | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "productions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productions_land_id_fkey"
            columns: ["land_id"]
            isOneToOne: false
            referencedRelation: "lands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string | null
          district_code: string | null
          district_name: string | null
          full_name: string
          id: string
          must_change_password: boolean | null
          phone: string | null
          province_code: string | null
          province_name: string | null
          regency_code: string | null
          regency_name: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          village_code: string | null
          village_name: string | null
        }
        Insert: {
          created_at?: string | null
          district_code?: string | null
          district_name?: string | null
          full_name: string
          id: string
          must_change_password?: boolean | null
          phone?: string | null
          province_code?: string | null
          province_name?: string | null
          regency_code?: string | null
          regency_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          village_code?: string | null
          village_name?: string | null
        }
        Update: {
          created_at?: string | null
          district_code?: string | null
          district_name?: string | null
          full_name?: string
          id?: string
          must_change_password?: boolean | null
          phone?: string | null
          province_code?: string | null
          province_name?: string | null
          regency_code?: string | null
          regency_name?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          village_code?: string | null
          village_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_manager_crud_farmer: {
        Args: { farmer_uuid: string }
        Returns: boolean
      }
      get_farmer_manager: { Args: { farmer_uuid: string }; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_connected_manager: { Args: { farmer_uuid: string }; Returns: boolean }
      is_manager_admin_or_observer: { Args: never; Returns: boolean }
      is_manager_or_admin: { Args: never; Returns: boolean }
      is_observer: { Args: never; Returns: boolean }
      jsonb_diff: { Args: { new_data: Json; old_data: Json }; Returns: Json }
    }
    Enums: {
      audit_action: "create" | "update" | "delete"
      connection_status: "pending" | "active" | "rejected" | "revoked"
      connection_type: "admin_assigned" | "manager_requested"
      user_role: "farmer" | "manager" | "admin" | "observer"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      audit_action: ["create", "update", "delete"],
      connection_status: ["pending", "active", "rejected", "revoked"],
      connection_type: ["admin_assigned", "manager_requested"],
      user_role: ["farmer", "manager", "admin", "observer"],
    },
  },
} as const
