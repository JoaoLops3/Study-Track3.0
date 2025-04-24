/*
  # Fix boards table RLS policies

  1. Changes
    - Update RLS policies for the boards table to properly handle board creation
    - Ensure authenticated users can create boards where they are the owner
    - Maintain existing policies for other operations

  2. Security
    - Modify INSERT policy to explicitly check owner_id matches authenticated user
    - Keep existing policies for SELECT, UPDATE, and DELETE operations
*/

-- Drop existing insert policy if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'boards' 
    AND policyname = 'boards_insert'
  ) THEN
    DROP POLICY boards_insert ON boards;
  END IF;
END $$;

-- Create new insert policy with correct owner_id check
CREATE POLICY "boards_insert" ON boards
FOR INSERT 
TO public
WITH CHECK (auth.uid() = owner_id);