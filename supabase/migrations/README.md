# Migrações do Banco de Dados

## Ordem de Execução

1. `20240424000000_create_boards_table.sql` - Criação da tabela de boards
2. `20240424000000_create_columns_table.sql` - Criação da tabela de columns
3. `20240424000000_create_cards_table.sql` - Criação da tabela de cards
4. `20240424000000_create_integrations_table.sql` - Criação da tabela de integrações
5. `20240321000000_add_favorites_columns.sql` - Adição de colunas de favoritos
6. `20240425000000_fix_search_path.sql` - Correção de search_path nas funções
7. `20240425000001_fix_auth_security.sql` - Correção de segurança de autenticação
8. `20240425000002_fix_boards_policies.sql` - Correção de políticas dos boards
9. `20240425000003_fix_boards_policies_final.sql` - Correção final das políticas dos boards

## Notas Importantes

- Todas as funções têm SECURITY DEFINER e search_path definido
- Todas as tabelas têm RLS habilitado
- Todas as tabelas têm triggers para updated_at
- As políticas seguem um padrão de nomenclatura consistente
- As queries de boards incluem tanto boards do usuário quanto boards públicos

## Estrutura das Tabelas

### Boards
- `id`: UUID (PK)
- `title`: TEXT (NOT NULL)
- `description`: TEXT
- `owner_id`: UUID (FK -> auth.users)
- `is_public`: BOOLEAN (DEFAULT false)
- `is_favorite`: BOOLEAN (DEFAULT false)
- `tags`: TEXT[] (DEFAULT '{}')
- `created_at`: TIMESTAMP WITH TIME ZONE
- `updated_at`: TIMESTAMP WITH TIME ZONE

### Columns
- `id`: UUID (PK)
- `title`: TEXT (NOT NULL)
- `board_id`: UUID (FK -> boards)
- `order`: INTEGER (NOT NULL)
- `created_at`: TIMESTAMP WITH TIME ZONE
- `updated_at`: TIMESTAMP WITH TIME ZONE

### Cards
- `id`: UUID (PK)
- `title`: TEXT (NOT NULL)
- `description`: TEXT
- `column_id`: UUID (FK -> columns)
- `position`: INTEGER (NOT NULL)
- `created_at`: TIMESTAMP WITH TIME ZONE
- `updated_at`: TIMESTAMP WITH TIME ZONE

### Integrations
- `id`: UUID (PK)
- `user_id`: UUID (FK -> auth.users)
- `provider`: TEXT (NOT NULL, CHECK IN ('figma', 'discord', 'github', 'google_calendar'))
- `access_token`: TEXT (NOT NULL)
- `refresh_token`: TEXT
- `expires_at`: TIMESTAMP WITH TIME ZONE
- `created_at`: TIMESTAMP WITH TIME ZONE
- `updated_at`: TIMESTAMP WITH TIME ZONE 