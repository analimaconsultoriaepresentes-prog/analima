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
      accounts: {
        Row: {
          account_type: string
          amount: number
          created_at: string
          description: string
          due_date: string
          id: string
          person: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string
          amount?: number
          created_at?: string
          description: string
          due_date: string
          id?: string
          person: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string
          amount?: number
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          person?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      basket_extras: {
        Row: {
          basket_id: string
          created_at: string
          extra_product_id: string
          id: string
          quantity: number
          unit_cost: number
        }
        Insert: {
          basket_id: string
          created_at?: string
          extra_product_id: string
          id?: string
          quantity?: number
          unit_cost?: number
        }
        Update: {
          basket_id?: string
          created_at?: string
          extra_product_id?: string
          id?: string
          quantity?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "basket_extras_basket_id_fkey"
            columns: ["basket_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "basket_extras_extra_product_id_fkey"
            columns: ["extra_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      basket_items: {
        Row: {
          basket_id: string
          created_at: string
          id: string
          product_id: string
          quantity: number
        }
        Insert: {
          basket_id: string
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
        }
        Update: {
          basket_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "basket_items_basket_id_fkey"
            columns: ["basket_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "basket_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          birthday: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birthday?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birthday?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          description: string
          due_date: string
          expense_type: string
          id: string
          is_recurring: boolean
          parent_expense_id: string | null
          recurring_day: number | null
          recurring_end_date: string | null
          recurring_start_date: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category: string
          created_at?: string
          description: string
          due_date: string
          expense_type?: string
          id?: string
          is_recurring?: boolean
          parent_expense_id?: string | null
          recurring_day?: number | null
          recurring_end_date?: string | null
          recurring_start_date?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          description?: string
          due_date?: string
          expense_type?: string
          id?: string
          is_recurring?: boolean
          parent_expense_id?: string | null
          recurring_day?: number | null
          recurring_end_date?: string | null
          recurring_start_date?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_parent_expense_id_fkey"
            columns: ["parent_expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
        ]
      }
      getting_started_progress: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          step_key: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          step_key: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          step_key?: string
          user_id?: string
        }
        Relationships: []
      }
      getting_started_settings: {
        Row: {
          created_at: string
          hidden: boolean
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hidden?: boolean
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hidden?: boolean
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          brand: string | null
          category: string
          cost_price: number
          created_at: string
          cycle: number | null
          deleted_at: string | null
          expiry_date: string | null
          gift_type: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_basket: boolean
          name: string
          origin: string
          packaging_cost: number
          packaging_discount: number
          packaging_product_id: string | null
          packaging_qty: number
          price_card: number
          price_pix: number
          product_type: string
          prove_qty: number
          sale_price: number
          stock: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          brand?: string | null
          category: string
          cost_price?: number
          created_at?: string
          cycle?: number | null
          deleted_at?: string | null
          expiry_date?: string | null
          gift_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_basket?: boolean
          name: string
          origin?: string
          packaging_cost?: number
          packaging_discount?: number
          packaging_product_id?: string | null
          packaging_qty?: number
          price_card?: number
          price_pix?: number
          product_type?: string
          prove_qty?: number
          sale_price?: number
          stock?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          brand?: string | null
          category?: string
          cost_price?: number
          created_at?: string
          cycle?: number | null
          deleted_at?: string | null
          expiry_date?: string | null
          gift_type?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_basket?: boolean
          name?: string
          origin?: string
          packaging_cost?: number
          packaging_discount?: number
          packaging_product_id?: string | null
          packaging_qty?: number
          price_card?: number
          price_pix?: number
          product_type?: string
          prove_qty?: number
          sale_price?: number
          stock?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_packaging_product_id_fkey"
            columns: ["packaging_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      sale_basket_components: {
        Row: {
          component_product_id: string
          component_product_name: string
          created_at: string
          id: string
          quantity_deducted: number
          sale_id: string
          sale_item_id: string
        }
        Insert: {
          component_product_id: string
          component_product_name: string
          created_at?: string
          id?: string
          quantity_deducted?: number
          sale_id: string
          sale_item_id: string
        }
        Update: {
          component_product_id?: string
          component_product_name?: string
          created_at?: string
          id?: string
          quantity_deducted?: number
          sale_id?: string
          sale_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_basket_components_component_product_id_fkey"
            columns: ["component_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_basket_components_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_basket_components_sale_item_id_fkey"
            columns: ["sale_item_id"]
            isOneToOne: false
            referencedRelation: "sale_items"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          product_name: string
          quantity: number
          sale_id: string
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          product_name: string
          quantity?: number
          sale_id: string
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          product_name?: string
          quantity?: number
          sale_id?: string
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          amount_received: number | null
          change_amount: number | null
          channel: string
          cost_total: number | null
          created_at: string
          customer_id: string | null
          discount_reason: string | null
          discount_type: string | null
          discount_value: number | null
          estimated_profit: number | null
          id: string
          notes: string | null
          payment_method: string
          recipient: string | null
          record_type: string
          reference_value: number | null
          status: string
          subtotal: number
          total: number
          user_id: string | null
        }
        Insert: {
          amount_received?: number | null
          change_amount?: number | null
          channel?: string
          cost_total?: number | null
          created_at?: string
          customer_id?: string | null
          discount_reason?: string | null
          discount_type?: string | null
          discount_value?: number | null
          estimated_profit?: number | null
          id?: string
          notes?: string | null
          payment_method: string
          recipient?: string | null
          record_type?: string
          reference_value?: number | null
          status?: string
          subtotal?: number
          total?: number
          user_id?: string | null
        }
        Update: {
          amount_received?: number | null
          change_amount?: number | null
          channel?: string
          cost_total?: number | null
          created_at?: string
          customer_id?: string | null
          discount_reason?: string | null
          discount_type?: string | null
          discount_value?: number | null
          estimated_profit?: number | null
          id?: string
          notes?: string | null
          payment_method?: string
          recipient?: string | null
          record_type?: string
          reference_value?: number | null
          status?: string
          subtotal?: number
          total?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          bills_days_before: number
          bills_due_enabled: boolean
          birthday_message: string | null
          created_at: string
          daily_email_enabled: boolean
          expiry_alert_enabled: boolean
          expiry_days_before: number
          id: string
          logo_url: string | null
          low_stock_enabled: boolean
          low_stock_threshold: number
          maintenance_mode: boolean
          name: string
          packaging_cost_1_bag: number
          packaging_cost_2_bags: number
          primary_color: string | null
          show_photos_in_sales: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          bills_days_before?: number
          bills_due_enabled?: boolean
          birthday_message?: string | null
          created_at?: string
          daily_email_enabled?: boolean
          expiry_alert_enabled?: boolean
          expiry_days_before?: number
          id?: string
          logo_url?: string | null
          low_stock_enabled?: boolean
          low_stock_threshold?: number
          maintenance_mode?: boolean
          name?: string
          packaging_cost_1_bag?: number
          packaging_cost_2_bags?: number
          primary_color?: string | null
          show_photos_in_sales?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          bills_days_before?: number
          bills_due_enabled?: boolean
          birthday_message?: string | null
          created_at?: string
          daily_email_enabled?: boolean
          expiry_alert_enabled?: boolean
          expiry_days_before?: number
          id?: string
          logo_url?: string | null
          low_stock_enabled?: boolean
          low_stock_threshold?: number
          maintenance_mode?: boolean
          name?: string
          packaging_cost_1_bag?: number
          packaging_cost_2_bags?: number
          primary_color?: string | null
          show_photos_in_sales?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
