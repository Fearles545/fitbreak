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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          category: string
          created_at: string | null
          default_duration_sec: number | null
          default_reps: number | null
          default_rest_sec: number | null
          default_sets: number | null
          exercise_type: string
          id: string
          is_active: boolean | null
          is_bilateral: boolean | null
          is_custom: boolean | null
          micro_break_rotation: string | null
          muscle_groups: string[]
          name: string
          name_en: string | null
          progression: Json | null
          short_description: string
          sort_order: number | null
          technique: Json
          tips: string[] | null
          updated_at: string | null
          user_id: string
          visuals: Json | null
          warnings: string[] | null
        }
        Insert: {
          category: string
          created_at?: string | null
          default_duration_sec?: number | null
          default_reps?: number | null
          default_rest_sec?: number | null
          default_sets?: number | null
          exercise_type: string
          id?: string
          is_active?: boolean | null
          is_bilateral?: boolean | null
          is_custom?: boolean | null
          micro_break_rotation?: string | null
          muscle_groups?: string[]
          name: string
          name_en?: string | null
          progression?: Json | null
          short_description: string
          sort_order?: number | null
          technique?: Json
          tips?: string[] | null
          updated_at?: string | null
          user_id: string
          visuals?: Json | null
          warnings?: string[] | null
        }
        Update: {
          category?: string
          created_at?: string | null
          default_duration_sec?: number | null
          default_reps?: number | null
          default_rest_sec?: number | null
          default_sets?: number | null
          exercise_type?: string
          id?: string
          is_active?: boolean | null
          is_bilateral?: boolean | null
          is_custom?: boolean | null
          micro_break_rotation?: string | null
          muscle_groups?: string[]
          name?: string
          name_en?: string | null
          progression?: Json | null
          short_description?: string
          sort_order?: number | null
          technique?: Json
          tips?: string[] | null
          updated_at?: string | null
          user_id?: string
          visuals?: Json | null
          warnings?: string[] | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          break_notification_sound: string | null
          created_at: string | null
          default_break_interval_min: number | null
          default_rest_between_sets_sec: number | null
          default_stepper_duration_min: number | null
          default_stepper_interval_min: number | null
          enable_break_tab_flash: boolean | null
          enabled_rotations: string[] | null
          id: string
          language: string | null
          rotation_order: string[] | null
          stepper_signal_type: string | null
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          break_notification_sound?: string | null
          created_at?: string | null
          default_break_interval_min?: number | null
          default_rest_between_sets_sec?: number | null
          default_stepper_duration_min?: number | null
          default_stepper_interval_min?: number | null
          enable_break_tab_flash?: boolean | null
          enabled_rotations?: string[] | null
          id?: string
          language?: string | null
          rotation_order?: string[] | null
          stepper_signal_type?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          break_notification_sound?: string | null
          created_at?: string | null
          default_break_interval_min?: number | null
          default_rest_between_sets_sec?: number | null
          default_stepper_duration_min?: number | null
          default_stepper_interval_min?: number | null
          enable_break_tab_flash?: boolean | null
          enabled_rotations?: string[] | null
          id?: string
          language?: string | null
          rotation_order?: string[] | null
          stepper_signal_type?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      work_sessions: {
        Row: {
          break_interval_min: number
          breaks: Json
          created_at: string | null
          current_rotation_index: number | null
          date: string
          ended_at: string | null
          id: string
          next_break_at: string | null
          paused_at: string | null
          pauses: Json
          started_at: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          break_interval_min?: number
          breaks?: Json
          created_at?: string | null
          current_rotation_index?: number | null
          date: string
          ended_at?: string | null
          id?: string
          next_break_at?: string | null
          paused_at?: string | null
          pauses?: Json
          started_at: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          break_interval_min?: number
          breaks?: Json
          created_at?: string | null
          current_rotation_index?: number | null
          date?: string
          ended_at?: string | null
          id?: string
          next_break_at?: string | null
          paused_at?: string | null
          pauses?: Json
          started_at?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          completed_at: string
          created_at: string | null
          date: string
          duration_min: number
          exercises: Json | null
          id: string
          mood: string | null
          notes: string | null
          started_at: string
          stepper_log: Json | null
          updated_at: string | null
          user_id: string
          workout_template_id: string | null
          workout_type: string
        }
        Insert: {
          completed_at: string
          created_at?: string | null
          date: string
          duration_min: number
          exercises?: Json | null
          id?: string
          mood?: string | null
          notes?: string | null
          started_at: string
          stepper_log?: Json | null
          updated_at?: string | null
          user_id: string
          workout_template_id?: string | null
          workout_type: string
        }
        Update: {
          completed_at?: string
          created_at?: string | null
          date?: string
          duration_min?: number
          exercises?: Json | null
          id?: string
          mood?: string | null
          notes?: string | null
          started_at?: string
          stepper_log?: Json | null
          updated_at?: string | null
          user_id?: string
          workout_template_id?: string | null
          workout_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_logs_workout_template_id_fkey"
            columns: ["workout_template_id"]
            isOneToOne: false
            referencedRelation: "workout_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_templates: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          estimated_duration_min: number
          exercises: Json
          icon: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          sort_order: number | null
          stepper_config: Json | null
          updated_at: string | null
          user_id: string
          workout_type: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          estimated_duration_min: number
          exercises?: Json
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          sort_order?: number | null
          stepper_config?: Json | null
          updated_at?: string | null
          user_id: string
          workout_type: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          estimated_duration_min?: number
          exercises?: Json
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          sort_order?: number | null
          stepper_config?: Json | null
          updated_at?: string | null
          user_id?: string
          workout_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_stale_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      streak_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_streak: number
          longest_streak: number
        }[]
      }
      weekly_break_stats: {
        Args: { weeks_back?: number }
        Returns: {
          completed_breaks: number
          completion_rate: number
          skipped_breaks: number
          total_breaks: number
          week_start: string
        }[]
      }
      weekly_workout_stats: {
        Args: { weeks_back?: number }
        Returns: {
          stepper_count: number
          strength_count: number
          total_duration_min: number
          week_start: string
        }[]
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
