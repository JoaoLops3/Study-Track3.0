-- Remover todas as políticas existentes da tabela boards
DROP POLICY IF EXISTS "boards_select" ON public.boards;
DROP POLICY IF EXISTS "boards_insert" ON public.boards;
DROP POLICY IF EXISTS "boards_update" ON public.boards;
DROP POLICY IF EXISTS "boards_delete" ON public.boards;
DROP POLICY IF EXISTS "boards_select_policy" ON public.boards;
DROP POLICY IF EXISTS "Users can view own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can view boards they are members of" ON public.boards;
DROP POLICY IF EXISTS "Users can view public boards" ON public.boards;
DROP POLICY IF EXISTS "Users can insert own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can update own boards" ON public.boards;
DROP POLICY IF EXISTS "Users can delete own boards" ON public.boards;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios boards favoritos" ON public.boards;
DROP POLICY IF EXISTS "Usuários podem atualizar is_favorite em seus próprios boards" ON public.boards;

-- Criar novas políticas simplificadas
CREATE POLICY "boards_select" ON public.boards
FOR SELECT
USING (
  owner_id = auth.uid() OR
  is_public = true
);

CREATE POLICY "boards_insert" ON public.boards
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "boards_update" ON public.boards
FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "boards_delete" ON public.boards
FOR DELETE
USING (auth.uid() = owner_id); 