/*
  # Create initial schema for Study Track application

  1. New Tables
    - `boards` - Stores kanban boards
    - `columns` - Stores columns within boards
    - `cards` - Stores cards within columns
    - `pages` - Stores independent rich text pages
    - `board_members` - Manages board sharing and permissions
    - `attachments` - Manages file attachments for cards and pages
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper data access control
*/

-- Create the boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false
);

-- Create the columns table
CREATE TABLE IF NOT EXISTS columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL
);

-- Create the cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  content JSONB,
  column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  due_date TIMESTAMPTZ,
  tags TEXT[] DEFAULT '{}'::TEXT[]
);

-- Create the pages table
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  title TEXT NOT NULL,
  content JSONB NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT false
);

-- Create the board_members table for sharing
CREATE TABLE IF NOT EXISTS board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('viewer', 'editor', 'admin')),
  UNIQUE (board_id, user_id)
);

-- Create the attachments table
CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  page_id UUID REFERENCES pages(id) ON DELETE CASCADE,
  size INTEGER NOT NULL,
  type TEXT NOT NULL,
  CHECK ((card_id IS NULL AND page_id IS NOT NULL) OR (card_id IS NOT NULL AND page_id IS NULL))
);

-- Enable RLS on all tables
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- Boards policies
CREATE POLICY "Users can view own boards"
  ON boards
  FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can view boards they are members of"
  ON boards
  FOR SELECT
  USING (
    id IN (
      SELECT board_id 
      FROM board_members 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view public boards"
  ON boards
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert own boards"
  ON boards
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own boards"
  ON boards
  FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own boards"
  ON boards
  FOR DELETE
  USING (owner_id = auth.uid());

-- Columns policies
CREATE POLICY "Users can view columns of accessible boards"
  ON columns
  FOR SELECT
  USING (
    board_id IN (
      SELECT id FROM boards WHERE owner_id = auth.uid()
    )
    OR
    board_id IN (
      SELECT board_id FROM board_members WHERE user_id = auth.uid()
    )
    OR
    board_id IN (
      SELECT id FROM boards WHERE is_public = true
    )
  );

CREATE POLICY "Users can insert columns in own boards"
  ON columns
  FOR INSERT
  WITH CHECK (
    board_id IN (
      SELECT id FROM boards WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert columns in boards they can edit"
  ON columns
  FOR INSERT
  WITH CHECK (
    board_id IN (
      SELECT board_id FROM board_members 
      WHERE user_id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "Users can update columns in own boards"
  ON columns
  FOR UPDATE
  USING (
    board_id IN (
      SELECT id FROM boards WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update columns in boards they can edit"
  ON columns
  FOR UPDATE
  USING (
    board_id IN (
      SELECT board_id FROM board_members 
      WHERE user_id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

CREATE POLICY "Users can delete columns in own boards"
  ON columns
  FOR DELETE
  USING (
    board_id IN (
      SELECT id FROM boards WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete columns in boards they can edit"
  ON columns
  FOR DELETE
  USING (
    board_id IN (
      SELECT board_id FROM board_members 
      WHERE user_id = auth.uid() AND role IN ('editor', 'admin')
    )
  );

-- Cards policies
CREATE POLICY "Users can view cards in accessible columns"
  ON cards
  FOR SELECT
  USING (
    column_id IN (
      SELECT id FROM columns WHERE board_id IN (
        SELECT id FROM boards WHERE owner_id = auth.uid()
        UNION
        SELECT board_id FROM board_members WHERE user_id = auth.uid()
        UNION
        SELECT id FROM boards WHERE is_public = true
      )
    )
  );

CREATE POLICY "Users can insert cards in own columns"
  ON cards
  FOR INSERT
  WITH CHECK (
    column_id IN (
      SELECT id FROM columns WHERE board_id IN (
        SELECT id FROM boards WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert cards in columns they can edit"
  ON cards
  FOR INSERT
  WITH CHECK (
    column_id IN (
      SELECT id FROM columns WHERE board_id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = auth.uid() AND role IN ('editor', 'admin')
      )
    )
  );

CREATE POLICY "Users can update cards in own columns"
  ON cards
  FOR UPDATE
  USING (
    column_id IN (
      SELECT id FROM columns WHERE board_id IN (
        SELECT id FROM boards WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update cards in columns they can edit"
  ON cards
  FOR UPDATE
  USING (
    column_id IN (
      SELECT id FROM columns WHERE board_id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = auth.uid() AND role IN ('editor', 'admin')
      )
    )
  );

CREATE POLICY "Users can delete cards in own columns"
  ON cards
  FOR DELETE
  USING (
    column_id IN (
      SELECT id FROM columns WHERE board_id IN (
        SELECT id FROM boards WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete cards in columns they can edit"
  ON cards
  FOR DELETE
  USING (
    column_id IN (
      SELECT id FROM columns WHERE board_id IN (
        SELECT board_id FROM board_members 
        WHERE user_id = auth.uid() AND role IN ('editor', 'admin')
      )
    )
  );

-- Pages policies
CREATE POLICY "Users can view own pages"
  ON pages
  FOR SELECT
  USING (owner_id = auth.uid());

CREATE POLICY "Users can view public pages"
  ON pages
  FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert own pages"
  ON pages
  FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own pages"
  ON pages
  FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete own pages"
  ON pages
  FOR DELETE
  USING (owner_id = auth.uid());

-- Board members policies
CREATE POLICY "Users can view members of their boards"
  ON board_members
  FOR SELECT
  USING (
    board_id IN (
      SELECT id FROM boards WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own memberships"
  ON board_members
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can add members to their boards"
  ON board_members
  FOR INSERT
  WITH CHECK (
    board_id IN (
      SELECT id FROM boards WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update members of their boards"
  ON board_members
  FOR UPDATE
  USING (
    board_id IN (
      SELECT id FROM boards WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove members from their boards"
  ON board_members
  FOR DELETE
  USING (
    board_id IN (
      SELECT id FROM boards WHERE owner_id = auth.uid()
    )
  );

-- Attachments policies
CREATE POLICY "Users can view attachments of accessible cards"
  ON attachments
  FOR SELECT
  USING (
    (card_id IS NOT NULL AND
     card_id IN (
       SELECT id FROM cards WHERE column_id IN (
         SELECT id FROM columns WHERE board_id IN (
           SELECT id FROM boards WHERE owner_id = auth.uid()
           UNION
           SELECT board_id FROM board_members WHERE user_id = auth.uid()
           UNION
           SELECT id FROM boards WHERE is_public = true
         )
       )
     )
    ) OR
    (page_id IS NOT NULL AND
     page_id IN (
       SELECT id FROM pages WHERE owner_id = auth.uid() OR is_public = true
     )
    )
  );

CREATE POLICY "Users can insert attachments to own cards"
  ON attachments
  FOR INSERT
  WITH CHECK (
    (card_id IS NOT NULL AND
     card_id IN (
       SELECT id FROM cards WHERE column_id IN (
         SELECT id FROM columns WHERE board_id IN (
           SELECT id FROM boards WHERE owner_id = auth.uid()
         )
       )
     )
    ) OR
    (page_id IS NOT NULL AND
     page_id IN (
       SELECT id FROM pages WHERE owner_id = auth.uid()
     )
    )
  );

CREATE POLICY "Users can insert attachments to cards they can edit"
  ON attachments
  FOR INSERT
  WITH CHECK (
    card_id IS NOT NULL AND
    card_id IN (
      SELECT id FROM cards WHERE column_id IN (
        SELECT id FROM columns WHERE board_id IN (
          SELECT board_id FROM board_members 
          WHERE user_id = auth.uid() AND role IN ('editor', 'admin')
        )
      )
    )
  );

CREATE POLICY "Users can update attachments to own resources"
  ON attachments
  FOR UPDATE
  USING (
    (card_id IS NOT NULL AND
     card_id IN (
       SELECT id FROM cards WHERE column_id IN (
         SELECT id FROM columns WHERE board_id IN (
           SELECT id FROM boards WHERE owner_id = auth.uid()
         )
       )
     )
    ) OR
    (page_id IS NOT NULL AND
     page_id IN (
       SELECT id FROM pages WHERE owner_id = auth.uid()
     )
    )
  );

CREATE POLICY "Users can update attachments to resources they can edit"
  ON attachments
  FOR UPDATE
  USING (
    card_id IS NOT NULL AND
    card_id IN (
      SELECT id FROM cards WHERE column_id IN (
        SELECT id FROM columns WHERE board_id IN (
          SELECT board_id FROM board_members 
          WHERE user_id = auth.uid() AND role IN ('editor', 'admin')
        )
      )
    )
  );

CREATE POLICY "Users can delete attachments to own resources"
  ON attachments
  FOR DELETE
  USING (
    (card_id IS NOT NULL AND
     card_id IN (
       SELECT id FROM cards WHERE column_id IN (
         SELECT id FROM columns WHERE board_id IN (
           SELECT id FROM boards WHERE owner_id = auth.uid()
         )
       )
     )
    ) OR
    (page_id IS NOT NULL AND
     page_id IN (
       SELECT id FROM pages WHERE owner_id = auth.uid()
     )
    )
  );

CREATE POLICY "Users can delete attachments to resources they can edit"
  ON attachments
  FOR DELETE
  USING (
    card_id IS NOT NULL AND
    card_id IN (
      SELECT id FROM cards WHERE column_id IN (
        SELECT id FROM columns WHERE board_id IN (
          SELECT board_id FROM board_members 
          WHERE user_id = auth.uid() AND role IN ('editor', 'admin')
        )
      )
    )
  );