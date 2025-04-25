# Study Track 🚀

![Study Track Logo](public/logo-Study-Track.png)

Uma plataforma moderna para gerenciamento de estudos e projetos, com foco em produtividade e colaboração.

## ✨ Funcionalidades Principais

- **Gerenciamento de Projetos**
  - Criação e organização de projetos
  - Sistema de tarefas e subtarefas
  - Favoritos e categorização
  - Visualização em diferentes layouts

- **Integração com GitHub**
  - Autenticação via OAuth
  - Visualização de repositórios
  - Acompanhamento de contribuições
  - Estatísticas detalhadas (estrelas, forks, visualizações)

- **Personalização**
  - Temas claro/escuro/sistema
  - Ajuste de tamanho de fonte
  - Configurações de notificações
  - Preferências de privacidade

- **Colaboração**
  - Gerenciamento de equipe
  - Compartilhamento de projetos
  - Controle de acesso
  - Sistema de comentários

## 🛠️ Tecnologias Utilizadas

- **Frontend**
  - React 18
  - TypeScript
  - Tailwind CSS
  - Vite

- **Backend & Infraestrutura**
  - Supabase
  - GitHub API
  - OAuth 2.0

- **Ferramentas**
  - ESLint
  - Prettier
  - React Hot Toast
  - Lucide Icons

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no Supabase
- Conta no GitHub (para integração)

## 🚀 Começando

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/study-track.git
   cd study-track
   ```

2. **Instale as dependências**
   ```bash
   npm install
   # ou
   yarn install
   ```

3. **Configure as variáveis de ambiente**
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   VITE_SUPABASE_URL=sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
   VITE_GITHUB_CLIENT_ID=seu_client_id_do_github
   VITE_GITHUB_CLIENT_SECRET=seu_client_secret_do_github
   ```

4. **Inicie o servidor de desenvolvimento**
   ```bash
   npm run dev
   # ou
   yarn dev
   ```

## 🔧 Configuração

### Supabase
1. Crie um novo projeto no Supabase
2. Configure a autenticação com GitHub
3. Crie as tabelas necessárias:
   - user_settings
   - boards
   - tasks
   - team_members

### GitHub OAuth
1. Crie um novo OAuth App no GitHub:
   - Vá para Settings > Developer settings > OAuth Apps
   - Clique em "New OAuth App"
   - Preencha os campos:
     - Application name: Study Track
     - Homepage URL: http://localhost:5173 (desenvolvimento)
     - Authorization callback URL: http://localhost:5173/auth/github/callback

## 📱 Telas

### Dashboard
![Dashboard](public/screenshots/dashboard.png)

### Gerenciamento de Projetos
![Projetos](public/screenshots/projects.png)

### Integração GitHub
![GitHub](public/screenshots/github.png)

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

Para suporte, envie um email para seu-email@exemplo.com ou abra uma issue no GitHub.

---