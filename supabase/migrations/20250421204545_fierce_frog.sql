/*
  # Fix boards table RLS policies

  1. Changes
    - Drop and recreate all board policies to ensure proper access control
    - Fix infinite recursion issue in policies
    - Ensure proper INSERT permissions for authenticated users

  2. Security
    - Maintain secure access control for all operations
    - Prevent unauthorized access while allowing intended operations
*/

-- Drop all existing policies for boards
DROP POLICY IF EXISTS "boards_select" ON boards;
DROP POLICY IF EXISTS "boards_insert" ON boards;
DROP POLICY IF EXISTS "boards_update" ON boards;
DROP POLICY IF EXISTS "boards_delete" ON boards;
DROP POLICY IF EXISTS "boards_select_policy" ON boards;
DROP POLICY IF EXISTS "Users can view own boards" ON boards;
DROP POLICY IF EXISTS "Users can view boards they are members of" ON boards;
DROP POLICY IF EXISTS "Users can view public boards" ON boards;
DROP POLICY IF EXISTS "Users can insert own boards" ON boards;
DROP POLICY IF EXISTS "Users can update own boards" ON boards;
DROP POLICY IF EXISTS "Users can delete own boards" ON boards;

-- Create new, simplified policies
CREATE POLICY "boards_select" ON boards
FOR SELECT
USING (
  owner_id = auth.uid() OR
  id IN (
    SELECT board_id 
    FROM board_members 
    WHERE user_id = auth.uid()
  ) OR
  is_public = true
);

CREATE POLICY "boards_insert" ON boards
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "boards_update" ON boards
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "boards_delete" ON boards
FOR DELETE
USING (auth.uid() = owner_id);