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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      funding_programs: {
        Row: {
          agency: string
          created_at: string
          deadline: string | null
          description: string
          eligibility: string
          funder_type: string
          funding_type: string
          id: string
          last_verified_at: string
          level: string
          max_amount: number
          min_amount: number
          name: string
          province: string
          sectors: string[]
          status: string
          url: string | null
        }
        Insert: {
          agency: string
          created_at?: string
          deadline?: string | null
          description?: string
          eligibility?: string
          funder_type?: string
          funding_type?: string
          id?: string
          last_verified_at?: string
          level?: string
          max_amount?: number
          min_amount?: number
          name: string
          province?: string
          sectors?: string[]
          status?: string
          url?: string | null
        }
        Update: {
          agency?: string
          created_at?: string
          deadline?: string | null
          description?: string
          eligibility?: string
          funder_type?: string
          funding_type?: string
          id?: string
          last_verified_at?: string
          level?: string
          max_amount?: number
          min_amount?: number
          name?: string
          province?: string
          sectors?: string[]
          status?: string
          url?: string | null
        }
        Relationships: []
      }
      pipeline_items: {
        Row: {
          created_at: string
          generated_letter: string | null
          id: string
          match_reason: string | null
          match_score: number | null
          notes: string | null
          program_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_letter?: string | null
          id?: string
          match_reason?: string | null
          match_score?: number | null
          notes?: string | null
          program_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_letter?: string | null
          id?: string
          match_reason?: string | null
          match_score?: number | null
          notes?: string | null
          program_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_items_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "funding_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          annual_revenue: number | null
          business_name: string
          created_at: string
          description: string | null
          employees: number | null
          incorporation_date: string | null
          province: string | null
          sector: string | null
          stage: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          annual_revenue?: number | null
          business_name?: string
          created_at?: string
          description?: string | null
          employees?: number | null
          incorporation_date?: string | null
          province?: string | null
          sector?: string | null
          stage?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          annual_revenue?: number | null
          business_name?: string
          created_at?: string
          description?: string | null
          employees?: number | null
          incorporation_date?: string | null
          province?: string | null
          sector?: string | null
          stage?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          created_at: string
          hours: number
          id: string
          logged_on: string
          note: string | null
          pipeline_item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hours?: number
          id?: string
          logged_on?: string
          note?: string | null
          pipeline_item_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          hours?: number
          id?: string
          logged_on?: string
          note?: string | null
          pipeline_item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_pipeline_item_id_fkey"
            columns: ["pipeline_item_id"]
            isOneToOne: false
            referencedRelation: "pipeline_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
