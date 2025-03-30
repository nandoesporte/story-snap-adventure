export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_admin: boolean | null
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_admin?: boolean | null
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_admin?: boolean | null
          name?: string
        }
        Relationships: []
      }
      characters: {
        Row: {
          age: string | null
          created_at: string | null
          creator_id: string | null
          description: string
          generation_prompt: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_premium: boolean | null
          name: string
          personality: string | null
          updated_at: string | null
        }
        Insert: {
          age?: string | null
          created_at?: string | null
          creator_id?: string | null
          description: string
          generation_prompt?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_premium?: boolean | null
          name: string
          personality?: string | null
          updated_at?: string | null
        }
        Update: {
          age?: string | null
          created_at?: string | null
          creator_id?: string | null
          description?: string
          generation_prompt?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_premium?: boolean | null
          name?: string
          personality?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      featured_stories: {
        Row: {
          created_at: string | null
          description: string
          excerpt: string | null
          id: string
          image_url: string
          story_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description: string
          excerpt?: string | null
          id?: string
          image_url: string
          story_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string
          excerpt?: string | null
          id?: string
          image_url?: string
          story_id?: string | null
          title?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category: string
          created_at?: string
          id: string
          name: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      list_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          list_id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          list_id: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          list_id?: string
          name?: string
        }
        Relationships: []
      }
      page_contents: {
        Row: {
          content: string
          content_type: string
          created_at: string | null
          id: string
          key: string
          page: string
          section: string
          updated_at: string | null
        }
        Insert: {
          content: string
          content_type?: string
          created_at?: string | null
          id?: string
          key: string
          page: string
          section: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          content_type?: string
          created_at?: string | null
          id?: string
          key?: string
          page?: string
          section?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_method: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_method: string
          status: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_method?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      shopping_lists: {
        Row: {
          created_at: string
          date: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          character_age: string | null
          character_name: string
          character_prompt: string | null
          cover_image_url: string | null
          created_at: string | null
          id: string
          is_public: boolean | null
          pages: Json
          setting: string | null
          style: string | null
          theme: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          voice_type: string | null
        }
        Insert: {
          character_age?: string | null
          character_name: string
          character_prompt?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          pages?: Json
          setting?: string | null
          style?: string | null
          theme?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          voice_type?: string | null
        }
        Update: {
          character_age?: string | null
          character_name?: string
          character_prompt?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          pages?: Json
          setting?: string | null
          style?: string | null
          theme?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          voice_type?: string | null
        }
        Relationships: []
      }
      story_credits_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          transaction_type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      story_likes: {
        Row: {
          created_at: string | null
          id: string
          story_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          story_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          story_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_likes_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_narrations: {
        Row: {
          audio_url: string
          created_at: string | null
          id: string
          page_index: number
          story_id: string
          updated_at: string | null
          voice_id: string
        }
        Insert: {
          audio_url: string
          created_at?: string | null
          id?: string
          page_index: number
          story_id: string
          updated_at?: string | null
          voice_id: string
        }
        Update: {
          audio_url?: string
          created_at?: string | null
          id?: string
          page_index?: number
          story_id?: string
          updated_at?: string | null
          voice_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_narrations_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_views: {
        Row: {
          created_at: string | null
          id: string
          story_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          story_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          story_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_views_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      storybot_prompts: {
        Row: {
          created_at: string | null
          id: string
          prompt: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          prompt: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          prompt?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_history: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          plan_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          plan_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          plan_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_history_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string | null
          currency: string
          description: string | null
          features: Json | null
          id: string
          interval: string
          is_active: boolean | null
          name: string
          price: number
          stories_limit: number
          stripe_price_id: string | null
          stripe_product_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          interval: string
          is_active?: boolean | null
          name: string
          price: number
          stories_limit: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          interval?: string
          is_active?: boolean | null
          name?: string
          price?: number
          stories_limit?: number
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_api_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          name: string
          service: string
          updated_at: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          name: string
          service: string
          updated_at?: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          name?: string
          service?: string
          updated_at?: string
        }
        Relationships: []
      }
      system_configurations: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      themes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          is_admin: boolean | null
          preferred_language: string | null
          stories_created_count: number | null
          story_credits: number | null
          subscription_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          is_admin?: boolean | null
          preferred_language?: string | null
          stories_created_count?: number | null
          story_credits?: number | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          is_admin?: boolean | null
          preferred_language?: string | null
          stories_created_count?: number | null
          story_credits?: number | null
          subscription_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_theme_preferences: {
        Row: {
          created_at: string | null
          id: string
          theme_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          theme_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          theme_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_theme_preferences_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_credits: {
        Args: {
          user_uuid: string
          amount: number
          description: string
        }
        Returns: boolean
      }
      check_column_exists: {
        Args: {
          p_table_name: string
          p_column_name: string
        }
        Returns: boolean
      }
      check_table_exists: {
        Args: {
          p_table_name: string
          p_schema_name?: string
        }
        Returns: boolean
      }
      check_user_credits: {
        Args: {
          user_uuid: string
          required_credits: number
        }
        Returns: boolean
      }
      create_characters_table_if_not_exists: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_page_contents_if_not_exists: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_storybot_prompt_if_not_exists: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_user_profile: {
        Args: {
          user_id: string
          user_email: string
          user_name: string
        }
        Returns: {
          created_at: string
          email: string
          id: string
          is_admin: boolean | null
          name: string
        }
      }
      create_user_profiles_if_not_exists: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      deduct_user_credits: {
        Args: {
          user_uuid: string
          amount: number
          description: string
        }
        Returns: boolean
      }
      exec: {
        Args: {
          sql: string
        }
        Returns: undefined
      }
      exec_sql: {
        Args: {
          sql_query: string
        }
        Returns: undefined
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
