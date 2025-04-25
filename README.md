# Study Track

Uma aplicação web para gerenciamento de estudos e projetos, com integração ao GitHub.

## Funcionalidades

- Gerenciamento de projetos e tarefas
- Integração com GitHub para visualização de repositórios
- Personalização de tema e tamanho de fonte
- Sistema de notificações
- Gerenciamento de equipe

## Tecnologias Utilizadas

- React
- TypeScript
- Tailwind CSS
- Supabase
- GitHub OAuth

## Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Conta no Supabase
- Conta no GitHub (para integração)

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/study-track.git
cd study-track
```

2. Instale as dependências:
```bash
npm install
# ou
yarn install
```

3. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:
```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_GITHUB_CLIENT_ID=seu_client_id_do_github
VITE_GITHUB_CLIENT_SECRET=seu_client_secret_do_github
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
# ou
yarn dev
```

## Configuração do Supabase

1. Crie um novo projeto no Supabase
2. Configure a autenticação com GitHub
3. Crie as tabelas necessárias:
   - user_settings
   - boards
   - tasks
   - team_members

## Configuração do GitHub OAuth

1. Crie um novo OAuth App no GitHub:
   - Vá para Settings > Developer settings > OAuth Apps
   - Clique em "New OAuth App"
   - Preencha os campos:
     - Application name: Study Track
     - Homepage URL: http://localhost:5173 (desenvolvimento)
     - Authorization callback URL: http://localhost:5173/auth/github/callback

2. Copie o Client ID e Client Secret para o arquivo `.env`

## Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes. 