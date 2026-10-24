export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      payout_requests: {
        Row: {
          amount: number;
          artist_id: string;
          created_at: string;
          currency: string;
          id: string;
          method: string;
          notes: string | null;
          payment_details: string | null;
          status: string;
        };
        Insert: {
          amount: number;
          artist_id: string;
          created_at?: string;
          currency?: string;
          id?: string;
          method?: string;
          notes?: string | null;
          payment_details?: string | null;
          status?: string;
        };
        Update: {
          amount?: number;
          artist_id?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          method?: string;
          notes?: string | null;
          payment_details?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          account_status: string;
          artist_name: string;
          avatar_url: string | null;
          country: string;
          created_at: string;
          display_name: string;
          id: string;
        };
        Insert: {
          account_status?: string;
          artist_name?: string;
          avatar_url?: string | null;
          country?: string;
          created_at?: string;
          display_name?: string;
          id: string;
        };
        Update: {
          account_status?: string;
          artist_name?: string;
          avatar_url?: string | null;
          country?: string;
          created_at?: string;
          display_name?: string;
          id?: string;
        };
        Relationships: [];
      };
      releases: {
        Row: {
          artist_id: string;
          cover_url: string | null;
          created_at: string;
          description: string | null;
          distribution_reference: string | null;
          distributed_at: string | null;
          explicit: boolean;
          genre: string;
          id: string;
          language: string;
          platforms: string[];
          release_date: string;
          release_type: string;
          review_notes: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          artist_id: string;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          distribution_reference?: string | null;
          distributed_at?: string | null;
          explicit?: boolean;
          genre: string;
          id?: string;
          language?: string;
          platforms?: string[];
          release_date: string;
          release_type: string;
          review_notes?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          artist_id?: string;
          cover_url?: string | null;
          created_at?: string;
          description?: string | null;
          distribution_reference?: string | null;
          distributed_at?: string | null;
          explicit?: boolean;
          genre?: string;
          id?: string;
          language?: string;
          platforms?: string[];
          release_date?: string;
          release_type?: string;
          review_notes?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      royalty_transactions: {
        Row: {
          amount: number;
          artist_id: string;
          created_at: string;
          currency: string;
          id: string;
          period_end: string;
          period_start: string;
          platform: string;
          release_id: string | null;
        };
        Insert: {
          amount: number;
          artist_id: string;
          created_at?: string;
          currency?: string;
          id?: string;
          period_end: string;
          period_start: string;
          platform: string;
          release_id?: string | null;
        };
        Update: {
          amount?: number;
          artist_id?: string;
          created_at?: string;
          currency?: string;
          id?: string;
          period_end?: string;
          period_start?: string;
          platform?: string;
          release_id?: string | null;
        };
        Relationships: [];
      };
      tracks: {
        Row: {
          audio_url: string;
          created_at: string;
          explicit: boolean;
          id: string;
          isrc: string | null;
          release_id: string;
          title: string;
          track_number: number;
        };
        Insert: {
          audio_url: string;
          created_at?: string;
          explicit?: boolean;
          id?: string;
          isrc?: string | null;
          release_id: string;
          title: string;
          track_number?: number;
        };
        Update: {
          audio_url?: string;
          created_at?: string;
          explicit?: boolean;
          id?: string;
          isrc?: string | null;
          release_id?: string;
          title?: string;
          track_number?: number;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      rights_declarations: {
        Row: {
          admin_notes: string | null;
          artist_id: string;
          attested: boolean;
          composition_owner: string;
          created_at: string;
          id: string;
          master_owner: string;
          release_id: string;
          status: string;
        };
        Insert: {
          admin_notes?: string | null;
          artist_id: string;
          attested: boolean;
          composition_owner: string;
          created_at?: string;
          id?: string;
          master_owner: string;
          release_id: string;
          status?: string;
        };
        Update: {
          admin_notes?: string | null;
          artist_id?: string;
          attested?: boolean;
          composition_owner?: string;
          created_at?: string;
          id?: string;
          master_owner?: string;
          release_id?: string;
          status?: string;
        };
        Relationships: [];
      };
      track_credits: {
        Row: {
          contributor_name: string;
          created_at: string;
          id: string;
          ownership_share: number | null;
          role: string;
          track_id: string;
        };
        Insert: {
          contributor_name: string;
          created_at?: string;
          id?: string;
          ownership_share?: number | null;
          role: string;
          track_id: string;
        };
        Update: {
          contributor_name?: string;
          created_at?: string;
          id?: string;
          ownership_share?: number | null;
          role?: string;
          track_id?: string;
        };
        Relationships: [];
      };
      rights_documents: {
        Row: {
          artist_id: string;
          created_at: string;
          document_type: string;
          id: string;
          object_path: string;
          release_id: string;
        };
        Insert: {
          artist_id: string;
          created_at?: string;
          document_type: string;
          id?: string;
          object_path: string;
          release_id: string;
        };
        Update: {
          artist_id?: string;
          created_at?: string;
          document_type?: string;
          id?: string;
          object_path?: string;
          release_id?: string;
        };
        Relationships: [];
      };
      copyright_reports: {
        Row: {
          admin_notes: string | null;
          against_release_id: string | null;
          claimant_name: string;
          created_at: string;
          decided_at: string | null;
          decided_by: string | null;
          decision: string | null;
          evidence_path: string | null;
          external_reference: string | null;
          good_faith_attested: boolean;
          id: string;
          parent_report_id: string | null;
          report_type: string;
          reporter_id: string;
          status: string;
          work_description: string;
        };
        Insert: {
          admin_notes?: string | null;
          against_release_id?: string | null;
          claimant_name: string;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          decision?: string | null;
          evidence_path?: string | null;
          external_reference?: string | null;
          good_faith_attested: boolean;
          id?: string;
          parent_report_id?: string | null;
          report_type: string;
          reporter_id: string;
          status?: string;
          work_description: string;
        };
        Update: {
          admin_notes?: string | null;
          against_release_id?: string | null;
          claimant_name?: string;
          created_at?: string;
          decided_at?: string | null;
          decided_by?: string | null;
          decision?: string | null;
          evidence_path?: string | null;
          external_reference?: string | null;
          good_faith_attested?: boolean;
          id?: string;
          parent_report_id?: string | null;
          report_type?: string;
          reporter_id?: string;
          status?: string;
          work_description?: string;
        };
        Relationships: [];
      };
      copyright_case_notes: {
        Row: {
          author_id: string;
          body: string;
          created_at: string;
          id: string;
          report_id: string;
        };
        Insert: {
          author_id: string;
          body: string;
          created_at?: string;
          id?: string;
          report_id: string;
        };
        Update: {
          author_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          report_id?: string;
        };
        Relationships: [];
      };
      copyright_report_contacts: {
        Row: {
          created_at: string;
          email: string;
          report_id: string;
          reporter_id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          report_id: string;
          reporter_id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          report_id?: string;
          reporter_id?: string;
        };
        Relationships: [];
      };
      audit_events: {
        Row: {
          action: string;
          actor_id: string | null;
          after_data: Json | null;
          before_data: Json | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: number;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: never;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          after_data?: Json | null;
          before_data?: Json | null;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: never;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      decide_copyright_report: {
        Args: {
          p_decision: string;
          p_report_id: string;
        };
        Returns: undefined;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      has_active_account: {
        Args: { _user_id: string };
        Returns: boolean;
      };
      submit_copyright_report: {
        Args: {
          p_against_release_id: string | null;
          p_claimant_email: string;
          p_claimant_name: string;
          p_evidence_path: string | null;
          p_external_reference: string | null;
          p_good_faith_attested: boolean;
          p_parent_report_id: string | null;
          p_report_id: string;
          p_report_type: string;
          p_work_description: string;
        };
        Returns: string;
      };
      submit_release: {
        Args: {
          p_composition_owner: string;
          p_cover_path: string;
          p_description: string | null;
          p_explicit: boolean;
          p_genre: string;
          p_master_owner: string;
          p_platforms: string[];
          p_release_date: string;
          p_release_id: string;
          p_release_type: string;
          p_rights_attested: boolean;
          p_title: string;
          p_tracks: Json;
        };
        Returns: string;
      };
      submit_payout_request: {
        Args: {
          p_amount: number;
          p_currency: string;
          p_method: string;
          p_payment_details: string;
        };
        Returns: string;
      };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const;
