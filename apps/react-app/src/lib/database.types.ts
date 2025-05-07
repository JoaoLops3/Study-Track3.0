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
      columns: {
        Row: {
          id: string
          title: string
          board_id: string
          order: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          board_id: string
          order: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          board_id?: string
          order?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      cards: {
        Row: {
          id: string
          title: string
          description?: string
          column_id: string
          position: number
          due_date?: string
          tags?: string[]
          content?: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string
          column_id: string
          position: number
          due_date?: string
          tags?: string[]
          content?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          column_id?: string
          position?: number
          due_date?: string
          tags?: string[]
          content?: any
          created_at?: string
          updated_at?: string
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
          user_id: string
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          settings: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          settings?: Json
          created_at?: string
          updated_at?: string
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