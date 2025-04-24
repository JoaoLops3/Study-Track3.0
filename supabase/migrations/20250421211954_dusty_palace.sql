/*
  # Add Column Management Policies

  1. Changes
    - Add INSERT, UPDATE, and DELETE policies for the columns table
    - Policies allow:
      - Board owners to manage columns
      - Board members with editor/admin roles to manage columns

  2. Security
    - Maintains existing SELECT policy
    - Adds policies for INSERT, UPDATE, DELETE operations
    - Ensures only authorized users can modify columns
*/

-- Allow board owners to manage columns
CREATE POLICY "Users can insert columns in own boards"
ON columns
FOR INSERT
WITH CHECK (
  board_id IN (
    SELECT id
    FROM boards
    WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update columns in own boards"
ON columns
FOR UPDATE
USING (
  board_id IN (
    SELECT id
    FROM boards
    WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete columns in own boards"
ON columns
FOR DELETE
USING (
  board_id IN (
    SELECT id
    FROM boards
    WHERE owner_id = auth.uid()
  )
);

-- Allow board members with editor/admin roles to manage columns
CREATE POLICY "Users can insert columns in boards they can edit"
ON columns
FOR INSERT
WITH CHECK (
  board_id IN (
    SELECT board_id
    FROM board_members
    WHERE user_id = auth.uid()
    AND role IN ('editor', 'admin')
  )
);

CREATE POLICY "Users can update columns in boards they can edit"
ON columns
FOR UPDATE
USING (
  board_id IN (
    SELECT board_id
    FROM board_members
    WHERE user_id = auth.uid()
    AND role IN ('editor', 'admin')
  )
);

CREATE POLICY "Users can delete columns in boards they can edit"
ON columns
FOR DELETE
USING (
  board_id IN (
    SELECT board_id
    FROM board_members
    WHERE user_id = auth.uid()
    AND role IN ('editor', 'admin')
  )
);