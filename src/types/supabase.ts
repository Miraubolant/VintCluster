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
      activity_logs: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          site_id: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          site_id?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          site_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          content: string
          created_at: string | null
          faq: Json | null
          id: string
          image_alt: string | null
          image_url: string | null
          keyword_id: string | null
          published_at: string | null
          seo_improved: boolean | null
          seo_improved_at: string | null
          seo_model: string | null
          site_id: string
          slug: string
          status: string | null
          summary: string | null
          title: string
          updated_at: string | null
          // SEO optimization columns
          seo_score: number | null
          word_count: number | null
          heading_count: number | null
          internal_links: number | null
          external_links: number | null
          reading_time: number | null
        }
        Insert: {
          content: string
          created_at?: string | null
          faq?: Json | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          keyword_id?: string | null
          published_at?: string | null
          seo_improved?: boolean | null
          seo_improved_at?: string | null
          seo_model?: string | null
          site_id: string
          slug: string
          status?: string | null
          summary?: string | null
          title: string
          updated_at?: string | null
          // SEO optimization columns
          seo_score?: number | null
          word_count?: number | null
          heading_count?: number | null
          internal_links?: number | null
          external_links?: number | null
          reading_time?: number | null
        }
        Update: {
          content?: string
          created_at?: string | null
          faq?: Json | null
          id?: string
          image_alt?: string | null
          image_url?: string | null
          keyword_id?: string | null
          published_at?: string | null
          seo_improved?: boolean | null
          seo_improved_at?: string | null
          seo_model?: string | null
          site_id?: string
          slug?: string
          status?: string | null
          summary?: string | null
          title?: string
          updated_at?: string | null
          // SEO optimization columns
          seo_score?: number | null
          word_count?: number | null
          heading_count?: number | null
          internal_links?: number | null
          external_links?: number | null
          reading_time?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keywords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          created_at: string | null
          id: string
          keyword: string
          priority: number | null
          site_id: string | null
          status: string | null
          updated_at: string | null
          search_volume: number | null
          difficulty: number | null
          cluster: string | null
          site_key: string | null
          notes: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          keyword: string
          priority?: number | null
          site_id?: string | null
          status?: string | null
          updated_at?: string | null
          search_volume?: number | null
          difficulty?: number | null
          cluster?: string | null
          site_key?: string | null
          notes?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          keyword?: string
          priority?: number | null
          site_id?: string | null
          status?: string | null
          updated_at?: string | null
          search_volume?: number | null
          difficulty?: number | null
          cluster?: string | null
          site_key?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "keywords_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduler_config: {
        Row: {
          auto_publish: boolean | null
          created_at: string | null
          days_of_week: number[] | null
          enabled: boolean | null
          id: string
          keyword_ids: string[] | null
          max_per_day: number | null
          max_per_week: number | null
          publish_hours: number[] | null
          site_id: string
          updated_at: string | null
        }
        Insert: {
          auto_publish?: boolean | null
          created_at?: string | null
          days_of_week?: number[] | null
          enabled?: boolean | null
          id?: string
          keyword_ids?: string[] | null
          max_per_day?: number | null
          max_per_week?: number | null
          publish_hours?: number[] | null
          site_id: string
          updated_at?: string | null
        }
        Update: {
          auto_publish?: boolean | null
          created_at?: string | null
          days_of_week?: number[] | null
          enabled?: boolean | null
          id?: string
          keyword_ids?: string[] | null
          max_per_day?: number | null
          max_per_week?: number | null
          publish_hours?: number[] | null
          site_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduler_config_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: true
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      related_articles: {
        Row: {
          id: string
          article_id: string
          related_article_id: string
          score: number | null
          reason: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          article_id: string
          related_article_id: string
          score?: number | null
          reason?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          article_id?: string
          related_article_id?: string
          score?: number | null
          reason?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "related_articles_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "related_articles_related_article_id_fkey"
            columns: ["related_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_tracking: {
        Row: {
          id: string
          site_id: string
          article_id: string | null
          date: string
          clicks: number | null
          impressions: number | null
          ctr: number | null
          position: number | null
          top_query: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          site_id: string
          article_id?: string | null
          date: string
          clicks?: number | null
          impressions?: number | null
          ctr?: number | null
          position?: number | null
          top_query?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          site_id?: string
          article_id?: string | null
          date?: string
          clicks?: number | null
          impressions?: number | null
          ctr?: number | null
          position?: number | null
          top_query?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_tracking_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_tracking_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          created_at: string | null
          domain: string
          favicon_url: string | null
          id: string
          logo_url: string | null
          meta_description: string | null
          meta_title: string | null
          name: string
          primary_color: string | null
          secondary_color: string | null
          template: string | null
          updated_at: string | null
          webhook_url: string | null
          webhook_enabled: boolean | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          primary_color?: string | null
          secondary_color?: string | null
          template?: string | null
          updated_at?: string | null
          webhook_url?: string | null
          webhook_enabled?: boolean | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          primary_color?: string | null
          secondary_color?: string | null
          template?: string | null
          updated_at?: string | null
          webhook_url?: string | null
          webhook_enabled?: boolean | null
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
