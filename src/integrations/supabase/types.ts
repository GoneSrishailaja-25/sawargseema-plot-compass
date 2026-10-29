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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      enquiries: {
        Row: {
          created_at: string
          id: string
          kind: string
          message: string
          mobile: string
          name: string
          plot_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          mobile: string
          name: string
          plot_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          message?: string
          mobile?: string
          name?: string
          plot_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enquiries_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: false
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      ownership_cases: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          plot_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          plot_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          plot_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_cases_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ownership_cases_plot_id_fkey"
            columns: ["plot_id"]
            isOneToOne: true
            referencedRelation: "plots"
            referencedColumns: ["id"]
          },
        ]
      }
      ownership_documents: {
        Row: {
          case_id: string
          category: string
          created_at: string
          file_name: string
          id: string
          review_note: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          case_id: string
          category: string
          created_at?: string
          file_name: string
          id?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path: string
          uploaded_by?: string
        }
        Update: {
          case_id?: string
          category?: string
          created_at?: string
          file_name?: string
          id?: string
          review_note?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ownership_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      ownership_notifications: {
        Row: {
          case_id: string
          created_at: string
          id: string
          message: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          message: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          message?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_notifications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ownership_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      ownership_questions: {
        Row: {
          case_id: string
          created_at: string
          id: string
          question: string
          replied_at: string | null
          reply: string
          user_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          id?: string
          question: string
          replied_at?: string | null
          reply?: string
          user_id?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          id?: string
          question?: string
          replied_at?: string | null
          reply?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_questions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ownership_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      ownership_reviews: {
        Row: {
          case_id: string
          created_at: string
          document_id: string
          id: string
          note: string
          officer_id: string
          status: string
        }
        Insert: {
          case_id: string
          created_at?: string
          document_id: string
          id?: string
          note: string
          officer_id: string
          status: string
        }
        Update: {
          case_id?: string
          created_at?: string
          document_id?: string
          id?: string
          note?: string
          officer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_reviews_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ownership_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ownership_reviews_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ownership_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      phases: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      plot_history: {
        Row: {
          action: string
          after_data: Json | null
          before_data: Json | null
          changed_at: string
          changed_by: string | null
          id: string
          plot_id: string
          plot_number: number
        }
        Insert: {
          action: string
          after_data?: Json | null
          before_data?: Json | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          plot_id: string
          plot_number: number
        }
        Update: {
          action?: string
          after_data?: Json | null
          before_data?: Json | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          plot_id?: string
          plot_number?: number
        }
        Relationships: []
      }
      plots: {
        Row: {
          amenities: string
          created_at: string
          dimensions: string
          facing: Database["public"]["Enums"]["plot_facing"]
          id: string
          information_verified: boolean
          latitude: number | null
          location_note: string
          longitude: number | null
          phase_id: string | null
          plot_number: number
          price_per_sqyd: number
          size_sqyd: number
          sold_at: string | null
          status: Database["public"]["Enums"]["plot_status"]
          total_price: number | null
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amenities?: string
          created_at?: string
          dimensions?: string
          facing?: Database["public"]["Enums"]["plot_facing"]
          id?: string
          information_verified?: boolean
          latitude?: number | null
          location_note?: string
          longitude?: number | null
          phase_id?: string | null
          plot_number: number
          price_per_sqyd: number
          size_sqyd: number
          sold_at?: string | null
          status?: Database["public"]["Enums"]["plot_status"]
          total_price?: number | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amenities?: string
          created_at?: string
          dimensions?: string
          facing?: Database["public"]["Enums"]["plot_facing"]
          id?: string
          information_verified?: boolean
          latitude?: number | null
          location_note?: string
          longitude?: number | null
          phase_id?: string | null
          plot_number?: number
          price_per_sqyd?: number
          size_sqyd?: number
          sold_at?: string | null
          status?: Database["public"]["Enums"]["plot_status"]
          total_price?: number | null
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plots_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          mobile: string
        }
        Insert: {
          address?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          mobile?: string
        }
        Update: {
          address?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          mobile?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venture: {
        Row: {
          about: string
          address: string
          email: string
          id: number
          location: string
          map_embed_url: string
          name: string
          phone: string
          tagline: string
          total_area_sqyd: number
          updated_at: string
          whatsapp: string
        }
        Insert: {
          about?: string
          address?: string
          email?: string
          id?: number
          location?: string
          map_embed_url?: string
          name: string
          phone?: string
          tagline?: string
          total_area_sqyd?: number
          updated_at?: string
          whatsapp?: string
        }
        Update: {
          about?: string
          address?: string
          email?: string
          id?: number
          location?: string
          map_embed_url?: string
          name?: string
          phone?: string
          tagline?: string
          total_area_sqyd?: number
          updated_at?: string
          whatsapp?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_read_ownership: { Args: { _case: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_ownership_notices_read: { Args: never; Returns: undefined }
      reply_ownership_question: {
        Args: { _question: string; _reply: string }
        Returns: undefined
      }
      review_ownership_document: {
        Args: { _document: string; _note: string; _status: string }
        Returns: undefined
      }
      set_ownership_officer: {
        Args: { _enabled: boolean; _user: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "customer" | "officer"
      plot_facing: "north" | "south" | "east" | "west"
      plot_status: "available" | "reserved" | "sold"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "customer", "officer"],
      plot_facing: ["north", "south", "east", "west"],
      plot_status: ["available", "reserved", "sold"],
    },
  },
} as const
