-- Adicionar coluna is_favorite e tags para boards
ALTER TABLE boards
ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Adicionar coluna is_favorite e tags para pages
ALTER TABLE pages
ADD COLUMN is_favorite BOOLEAN DEFAULT FALSE,
ADD COLUMN tags TEXT[] DEFAULT '{}';

-- Criar índices para melhorar a performance
CREATE INDEX idx_boards_favorite ON boards(is_favorite);
CREATE INDEX idx_pages_favorite ON pages(is_favorite);
CREATE INDEX idx_boards_tags ON boards USING GIN(tags);
CREATE INDEX idx_pages_tags ON pages USING GIN(tags); 