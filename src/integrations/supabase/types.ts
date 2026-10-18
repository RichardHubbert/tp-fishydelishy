export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
      bookings: {
        Row: {
          booking_date: string
          business_id: string | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          end_time: string
          id: string
          party_size: number
          restaurant_id: string | null
          special_requests: string | null
          start_time: string
          status: string | null
          table_id: string | null
          updated_at: string | null
        }
        Insert: {
          booking_date: string
          business_id?: string | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          end_time: string
          id?: string
          party_size: number
          restaurant_id?: string | null
          special_requests?: string | null
          start_time: string
          status?: string | null
          table_id?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_date?: string
          business_id?: string | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          end_time?: string
          id?: string
          party_size?: number
          restaurant_id?: string | null
          special_requests?: string | null
          start_time?: string
          status?: string | null
          table_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          domain: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          business_id: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          external_id: string | null
          first_name: string | null
          id: string
          last_booking_date: string | null
          last_name: string | null
          phone: string | null
          preferences: Json | null
          total_bookings: number | null
          total_spent: number | null
          updated_at: string | null
        }
        Insert: {
          business_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          external_id?: string | null
          first_name?: string | null
          id?: string
          last_booking_date?: string | null
          last_name?: string | null
          phone?: string | null
          preferences?: Json | null
          total_bookings?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Update: {
          business_id?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          external_id?: string | null
          first_name?: string | null
          id?: string
          last_booking_date?: string | null
          last_name?: string | null
          phone?: string | null
          preferences?: Json | null
          total_bookings?: number | null
          total_spent?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "customers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          business_id: string | null
          company_name: string | null
          created_at: string | null
          full_name: string | null
          id: string
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          business_id?: string | null
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          business_id?: string | null
          company_name?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      restaurant_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string
          business_id: string | null
          category_id: string | null
          county: string | null
          created_at: string | null
          cuisine: string
          description: string | null
          email: string | null
          elevenlabs_agent_id: string | null
          elevenlabs_enabled: boolean
          hero_image_url: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_default: boolean
          name: string
          opening_hours: Json | null
          phone: string | null
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          address: string
          business_id?: string | null
          category_id?: string | null
          county?: string | null
          created_at?: string | null
          cuisine: string
          description?: string | null
          email?: string | null
          elevenlabs_agent_id?: string | null
          elevenlabs_enabled?: boolean
          hero_image_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_default?: boolean
          name: string
          opening_hours?: Json | null
          phone?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          business_id?: string | null
          category_id?: string | null
          county?: string | null
          created_at?: string | null
          cuisine?: string
          description?: string | null
          email?: string | null
          elevenlabs_agent_id?: string | null
          elevenlabs_enabled?: boolean
          hero_image_url?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_default?: boolean
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "restaurants_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_dashboard"
            referencedColumns: ["business_id"]
          },
          {
            foreignKeyName: "restaurants_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          capacity: number
          created_at: string | null
          id: string
          name: string
          section: string
          updated_at: string | null
        }
        Insert: {
          capacity: number
          created_at?: string | null
          id?: string
          name: string
          section: string
          updated_at?: string | null
        }
        Update: {
          capacity?: number
          created_at?: string | null
          id?: string
          name?: string
          section?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      business_customer_analytics: {
        Row: {
          avg_party_size: number | null
          business_id: string | null
          business_name: string | null
          cancelled_bookings: number | null
          completed_bookings: number | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          first_booking: string | null
          last_booking: string | null
          total_bookings: number | null
          total_guests: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      business_dashboard: {
        Row: {
          avg_party_size: number | null
          business_id: string | null
          business_name: string | null
          business_slug: string | null
          cancelled_bookings: number | null
          completed_bookings: number | null
          confirmed_bookings: number | null
          total_bookings: number | null
          total_customers: number | null
          total_restaurants: number | null
        }
        Relationships: []
      }
      customer_analytics: {
        Row: {
          avg_party_size: number | null
          business_id: string | null
          business_name: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          first_booking: string | null
          last_booking: string | null
          total_bookings: number | null
          total_guests: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      get_business_customers: {
        Args: { business_slug: string }
        Returns: {
          customer_id: string
          email: string
          first_name: string
          last_name: string
          phone: string
          total_bookings: number
          last_booking_date: string
          created_at: string
        }[]
      }
      get_business_from_domain: {
        Args: { domain_name: string }
        Returns: string
      }
      get_current_business_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_customer_history: {
        Args: { customer_email: string; business_id?: string }
        Returns: {
          booking_id: string
          booking_date: string
          start_time: string
          party_size: number
          status: string
          special_requests: string
          created_at: string
        }[]
      }
      set_business_context: {
        Args: { business_slug: string }
        Returns: undefined
      }
      sync_customer_from_external: {
        Args: {
          p_business_slug: string
          p_external_id: string
          p_email: string
          p_first_name?: string
          p_last_name?: string
          p_phone?: string
          p_date_of_birth?: string
          p_preferences?: Json
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

