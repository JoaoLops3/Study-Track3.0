-- Adicionar coluna is_favorite e tags para boards
ALTER TABLE boards
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Adicionar coluna is_favorite e tags para pages
ALTER TABLE pages
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Criar índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_boards_favorite ON boards(is_favorite);
CREATE INDEX IF NOT EXISTS idx_pages_favorite ON pages(is_favorite);
CREATE INDEX IF NOT EXISTS idx_boards_tags ON boards USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_pages_tags ON pages USING GIN(tags);

-- Adicionar políticas de acesso para is_favorite e tags
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;

-- Política para boards
CREATE POLICY "Usuários podem ver seus próprios boards favoritos"
ON boards FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Usuários podem atualizar is_favorite em seus próprios boards"
ON boards FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Política para pages
CREATE POLICY "Usuários podem ver suas próprias pages favoritas"
ON pages FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Usuários podem atualizar is_favorite em suas próprias pages"
ON pages FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid()); 