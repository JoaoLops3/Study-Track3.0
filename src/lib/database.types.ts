export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      integrations: {
        Row: {
          id: string;
          user_id: string;
          provider: 'figma' | 'discord' | 'google_calendar';
          access_token: string;
          refresh_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider: 'figma' | 'discord' | 'google_calendar';
          access_token: string;
          refresh_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: 'figma' | 'discord' | 'google_calendar';
          access_token?: string;
          refresh_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      boards: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          description: string | null;
          owner_id: string;
          is_public: boolean;
          is_favorite: boolean;
          tags: string[];
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          description?: string | null;
          owner_id: string;
          is_public?: boolean;
          is_favorite?: boolean;
          tags?: string[];
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          description?: string | null;
          owner_id?: string;
          is_public?: boolean;
          is_favorite?: boolean;
          tags?: string[];
        };
      };
      columns: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          board_id: string;
          order: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          board_id: string;
          order: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          board_id?: string;
          order?: number;
        };
      };
      cards: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          content: Json | null;
          column_id: string;
          order: number;
          due_date: string | null;
          tags: string[] | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          content?: Json | null;
          column_id: string;
          order: number;
          due_date?: string | null;
          tags?: string[] | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          content?: Json | null;
          column_id?: string;
          order?: number;
          due_date?: string | null;
          tags?: string[] | null;
        };
      };
      pages: {
        Row: {
          id: string;
          created_at: string;
          title: string;
          content: Json;
          owner_id: string;
          is_public: boolean;
          is_favorite: boolean;
          tags: string[];
        };
        Insert: {
          id?: string;
          created_at?: string;
          title: string;
          content: Json;
          owner_id: string;
          is_public?: boolean;
          is_favorite?: boolean;
          tags?: string[];
        };
        Update: {
          id?: string;
          created_at?: string;
          title?: string;
          content?: Json;
          owner_id?: string;
          is_public?: boolean;
          is_favorite?: boolean;
          tags?: string[];
        };
      };
      board_members: {
        Row: {
          id: string;
          created_at: string;
          board_id: string;
          user_id: string;
          role: 'viewer' | 'editor' | 'admin';
        };
        Insert: {
          id?: string;
          created_at?: string;
          board_id: string;
          user_id: string;
          role?: 'viewer' | 'editor' | 'admin';
        };
        Update: {
          id?: string;
          created_at?: string;
          board_id?: string;
          user_id?: string;
          role?: 'viewer' | 'editor' | 'admin';
        };
      };
      attachments: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          file_path: string;
          card_id: string | null;
          page_id: string | null;
          size: number;
          type: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          file_path: string;
          card_id?: string | null;
          page_id?: string | null;
          size: number;
          type: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          file_path?: string;
          card_id?: string | null;
          page_id?: string | null;
          size?: number;
          type?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_integrations_table: {
        Args: Record<PropertyKey, never>;
        Returns: undefined;
      };
      setup_integration_policies: {
        Args: {
          user_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
};