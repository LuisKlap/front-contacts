# Configuração de Variáveis de Ambiente no Vercel

Este projeto utiliza variáveis de ambiente para configurações sensíveis como API Keys.

## Variáveis Necessárias

### 1. API_KEY
- **Descrição**: Google Maps API Key para Places API e Maps JavaScript API
- **Onde obter**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Restrições recomendadas**: 
  - HTTP referrers (seu domínio Vercel)
  - APIs permitidas: Maps JavaScript API, Places API, Geocoding API

### 2. API_URL
- **Descrição**: URL base da API backend
- **Exemplo**: `https://backend-uex-contacts-production.up.railway.app/api`

## Como Configurar no Vercel

1. Acesse o projeto no [Vercel Dashboard](https://vercel.com/dashboard)
2. Vá em **Settings** → **Environment Variables**
3. Adicione as variáveis:

```
API_KEY = sua_google_maps_api_key
API_URL = https://seu-backend.railway.app/api
```

4. Faça um novo deploy ou execute:
```bash
vercel --prod
```

## Como Funciona

1. Durante o build, o Angular compila o projeto
2. O script `replace-env.js` substitui os placeholders `{{API_KEY}}` e `{{API_URL}}` no `index.html`
3. As variáveis são injetadas no `window.ENV` e lidas pelos arquivos de environment do Angular

## Desenvolvimento Local

Para desenvolvimento local, você pode:

1. Copiar `.env.example` para `.env`
2. Preencher com suas credenciais
3. As chaves hardcoded em `environment.ts` serão usadas como fallback
