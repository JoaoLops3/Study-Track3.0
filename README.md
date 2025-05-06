# Study Track 3.0

<div align="center">
  <img src="apps/react-app/src/assets/logo-v1.png" alt="Study Track Logo" width="200"/>
  
  <p>Uma plataforma moderna para gerenciar seus estudos e tarefas</p>
</div>

## 🚀 Tecnologias

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase
- Google Calendar API
- GitHub OAuth

## ✨ Funcionalidades

- 📚 Gerenciamento de tarefas e estudos
- 📅 Integração com Google Calendar
- 👥 Trabalho em equipe
- 🔐 Autenticação com GitHub
- 🌙 Modo escuro
- 📱 Design responsivo

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone https://github.com/JoaoLops3/Study-Track3.0.git
```

2. Instale as dependências:
```bash
cd Study-Track3.0
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp apps/react-app/.env.example apps/react-app/.env
```

4. Inicie o projeto:
```bash
npm run dev
```

## 🔧 Configuração

1. Crie uma conta no [Supabase](https://supabase.com)
2. Configure o GitHub OAuth no [GitHub Developer Settings](https://github.com/settings/developers)
3. Configure o Google Calendar API no [Google Cloud Console](https://console.cloud.google.com)
4. Adicione as credenciais no arquivo `.env`:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
VITE_GOOGLE_API_KEY=sua_chave_api_do_google
VITE_GOOGLE_CLIENT_ID=seu_client_id_do_google
VITE_GOOGLE_CLIENT_SECRET=seu_client_secret_do_google
VITE_GITHUB_CLIENT_ID=seu_client_id_do_github
VITE_GITHUB_CLIENT_SECRET=seu_client_secret_do_github
```

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Autor

João Lopes

- GitHub: [@JoaoLops3](https://github.com/JoaoLops3)
- LinkedIn: [João Lopes](https://www.linkedin.com/in/joaolops3/)

---