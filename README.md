# Study Track 3.0

<div align="center">
  <img src="apps/react-app/public/logo-v1.png" alt="Study Track Logo" width="200"/>
  
  <p>Uma plataforma moderna e intuitiva para gerenciar seus estudos e tarefas</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

</div>

## 📋 Sobre o Projeto

O Study Track 3.0 é uma aplicação web moderna desenvolvida para ajudar estudantes e profissionais a organizarem seus estudos e tarefas de forma eficiente. Com uma interface intuitiva e recursos avançados, a plataforma oferece uma experiência completa de gerenciamento de tempo e produtividade.

## ✨ Funcionalidades Principais

- 📚 **Gerenciamento de Tarefas**

  - Criação e organização de tarefas
  - Categorização por disciplinas
  - Sistema de prioridades
  - Status de progresso

- 📅 **Integração com Google Calendar**

  - Sincronização automática de eventos
  - Visualização em calendário
  - Lembretes personalizados

- 👥 **Trabalho em Equipe**

  - Compartilhamento de tarefas
  - Colaboração em tempo real
  - Sistema de comentários

- 🔐 **Autenticação Segura**

  - Login com GitHub
  - Proteção de dados
  - Perfis personalizáveis

- 🌙 **Interface Moderna**
  - Modo escuro/claro
  - Design responsivo
  - Animações suaves
  - UI/UX intuitiva

## 🚀 Tecnologias Utilizadas

- **Frontend**

  - React
  - TypeScript
  - Vite
  - Tailwind CSS
  - React Query
  - React Router

- **Backend**

  - Supabase
  - PostgreSQL
  - RESTful API

- **Integrações**
  - Google Calendar API
  - GitHub OAuth
  - Supabase Auth

## 🛠️ Instalação e Configuração

1. **Clone o repositório**

```bash
git clone https://github.com/JoaoLops3/Study-Track3.0.git
cd Study-Track3.0
```

2. **Instale as dependências**

```bash
npm install
```

3. **Configure as variáveis de ambiente**

```bash
cp apps/react-app/.env.example apps/react-app/.env
```

4. **Configure as credenciais**

- Crie uma conta no [Supabase](https://supabase.com)
- Configure o GitHub OAuth no [GitHub Developer Settings](https://github.com/settings/developers)
- Configure o Google Calendar API no [Google Cloud Console](https://console.cloud.google.com)

5. **Adicione as credenciais no arquivo `.env`**

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_GOOGLE_API_KEY=sua_chave_api_do_google
VITE_GOOGLE_CLIENT_ID=seu_client_id_do_google
VITE_GOOGLE_CLIENT_SECRET=seu_client_secret_do_google
VITE_GITHUB_CLIENT_ID=seu_client_id_do_github
VITE_GITHUB_CLIENT_SECRET=seu_client_secret_do_github
```

6. **Inicie o projeto**

```bash
npm run dev
```

## 📦 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera a build de produção
- `npm run preview` - Visualiza a build de produção localmente
- `npm run lint` - Executa o linter
- `npm run test` - Executa os testes

## 🤝 Contribuindo

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

**João Lopes**

- GitHub: [@JoaoLops3](https://github.com/JoaoLops3)
- LinkedIn: [João Lopes](https://www.linkedin.com/in/joaolops3/)

## 🙏 Agradecimentos

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/)
- [Vite](https://vitejs.dev/)

---

<div align="center">
  <p>Feito com ❤️ por João Lopes</p>
</div>
