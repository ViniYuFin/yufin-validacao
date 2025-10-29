# Dashboard de Validação - YüFin

Dashboard para análise de respostas de validação de mercado.

## 🚀 Deploy

Deploy automático no Vercel: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

Ou manualmente:

```bash
npm i -g vercel
vercel
```

## 📋 Requisitos

- Backend YüFin rodando em: `https://yufin-backend.vercel.app`
- Usuário admin criado no backend

## 🔐 Acesso

- **Login**: Use credenciais de administrador
- **URL**: Acesse o domínio configurado no Vercel

## 📁 Estrutura

```
Validação/
├── login.html          # Tela de login
├── dashboard.html      # Dashboard principal
├── dashboard.css       # Estilos
├── dashboard.js        # Lógica JavaScript
└── validacao-mercado.html  # Formulário de validação
```

## 🛠️ Desenvolvimento Local

Abra os arquivos HTML diretamente no navegador ou use um servidor local:

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server
```

Acesse: `http://localhost:8000/login.html`

