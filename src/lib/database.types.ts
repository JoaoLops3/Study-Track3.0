export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      boards: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string | null
          owner_id: string
          is_public: boolean
          updated_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description?: string | null
          owner_id: string
          is_public?: boolean
          updated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string | null
          owner_id?: string
          is_public?: boolean
          updated_at?: string | null
        }
      }
      pages: {
        Row: {
          id: string
          created_at: string
          title: string
          content: Json
          owner_id: string
          is_public: boolean
          updated_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          content: Json
          owner_id: string
          is_public?: boolean
          updated_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          content?: Json
          owner_id?: string
          is_public?: boolean
          updated_at?: string | null
        }
      }
      user_settings: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          theme: string
          language: string
          notifications_enabled: boolean
          integrations: Json
          profile: Json
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string | null
          theme?: string
          language?: string
          notifications_enabled?: boolean
          integrations?: Json
          profile?: Json
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          theme?: string
          language?: string
          notifications_enabled?: boolean
          integrations?: Json
          profile?: Json
        }
      }
      user_integrations: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          user_id: string
          provider: string
          access_token: string
          refresh_token: string | null
          expires_at: number | null
          scope: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          user_id: string
          provider: string
          access_token: string
          refresh_token?: string | null
          expires_at?: number | null
          scope?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          user_id?: string
          provider?: string
          access_token?: string
          refresh_token?: string | null
          expires_at?: number | null
          scope?: string | null
        }
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
  }
} 