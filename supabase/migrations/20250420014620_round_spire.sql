/*
  # Fix infinite recursion in board policies
  
  1. Changes
    - Simplify board access policies to prevent recursion
    - Remove duplicate policy creation
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own boards" ON boards;
DROP POLICY IF EXISTS "Users can view boards they are members of" ON boards;
DROP POLICY IF EXISTS "Users can view public boards" ON boards;

-- Create new, simplified policy
CREATE POLICY "boards_select_policy"
  ON boards
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