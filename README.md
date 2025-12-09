# 📇 FrontContacts

Sistema completo de gerenciamento de contatos com autenticação, integração com Google Maps e busca avançada por CEP/endereço.

## 🚀 Tecnologias

- **Angular 21** - Framework principal
- **Angular Material** - Componentes UI
- **Google Maps API** - Mapas e geolocalização
- **ngx-mask** - Máscaras para inputs
- **RxJS** - Programação reativa
- **Vitest** - Testes unitários
- **TypeScript** - Tipagem estática

## ✨ Funcionalidades

### 🔐 Autenticação
- Cadastro de novos usuários
- Login com email e senha
- Guarda de rotas (AuthGuard)
- Interceptor HTTP para injeção de token JWT
- Gerenciamento de sessão

### 👤 Perfil de Usuário
- Visualização de perfil
- Edição de dados pessoais
- Exclusão de conta

### 📋 Gerenciamento de Contatos
- **CRUD completo** de contatos
- **Busca e filtros** avançados
- **Paginação** de resultados
- **Ordenação** personalizável
- **Visualização em lista** com detalhes

### 🗺️ Integração com Mapas
- **Google Maps** integrado
- **Busca por CEP** (ViaCEP)
- **Autocomplete de endereços** (Google Places API)
- **Geolocalização** de contatos
- **Busca por cidades brasileiras**

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── auth/                      # Módulo de autenticação
│   │   ├── components/
│   │   │   ├── login/            # Componente de login
│   │   │   └── signup/           # Componente de cadastro
│   │   ├── guards/
│   │   │   └── auth.guard.ts     # Guarda de rotas autenticadas
│   │   ├── interceptors/
│   │   │   └── auth.interceptor.ts # Interceptor JWT
│   │   ├── service/
│   │   │   ├── auth.service.ts   # Serviço de autenticação
│   │   │   └── account.service.ts # Serviço de conta
│   │   └── models/
│   │       └── user.model.ts     # Modelo de usuário
│   │
│   ├── home/                      # Módulo principal
│   │   ├── components/
│   │   │   ├── contact-filters/  # Filtros de busca
│   │   │   ├── contact-form/     # Formulário de contato
│   │   │   ├── contact-item/     # Item da lista
│   │   │   ├── contact-list/     # Lista de contatos
│   │   │   ├── header/           # Cabeçalho
│   │   │   └── map/              # Componente do mapa
│   │   ├── service/
│   │   │   ├── contact.service.ts          # CRUD de contatos
│   │   │   ├── address-lookup.service.ts   # Busca de endereços
│   │   │   ├── google-places.service.ts    # Google Places API
│   │   │   └── brazilian-data.service.ts   # Dados brasileiros
│   │   └── models/
│   │       ├── contact.model.ts  # Modelo de contato
│   │       └── address.model.ts  # Modelo de endereço
│   │
│   ├── profile/                   # Módulo de perfil
│   │   └── components/
│   │       ├── profile-view/     # Visualização do perfil
│   │       ├── profile-edit/     # Edição do perfil
│   │       ├── profile-delete/   # Exclusão da conta
│   │       └── confirm-dialog/   # Dialog de confirmação
│   │
│   ├── app.routes.ts             # Rotas da aplicação
│   └── app.config.ts             # Configuração global
│
├── environments/
│   ├── environment.ts            # Configuração desenvolvimento
│   └── environment.prod.ts       # Configuração produção
│
└── assets/                       # Recursos estáticos
```

## 🛠️ Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm 11.6.2+
- Angular CLI 21+

### 1. Clone o repositório
```bash
git clone https://github.com/LuisKlap/front-contacts.git
cd front-contacts
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente

Crie um arquivo `src/environments/environment.ts` com:

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  googleMapsApiKey: 'SUA_GOOGLE_MAPS_API_KEY'
};
```

### 4. Inicie o servidor de desenvolvimento
```bash
npm start
# ou
ng serve
```

Acesse `http://localhost:4200/`

## 🌐 Deploy (Vercel)

O projeto está configurado para deploy automático no Vercel.

### Variáveis de Ambiente Necessárias

Configure no painel do Vercel:

```
API_KEY=sua_google_maps_api_key
API_URL=https://seu-backend.railway.app/api
```

### Build e Deploy

```bash
npm run build
```

O script `replace-env.js` automaticamente injeta as variáveis de ambiente no `index.html` durante o build.

Para mais detalhes, consulte [VERCEL_ENV.md](./VERCEL_ENV.md)

## 🧪 Testes

Execute os testes unitários com Vitest:

```bash
npm test
```

## 📦 Scripts Disponíveis

```json
{
  "start": "ng serve",                    // Servidor de desenvolvimento
  "build": "ng build && node replace-env.js", // Build para produção
  "build:dev": "ng build",                // Build sem injeção de env
  "watch": "ng build --watch",            // Build em modo watch
  "test": "ng test"                       // Executa testes
}
```

## 🔑 Autenticação

O sistema utiliza **JWT (JSON Web Tokens)** para autenticação:

1. Usuário faz login/signup
2. Backend retorna um token JWT
3. Token é armazenado no `localStorage`
4. `AuthInterceptor` injeta o token em todas as requisições
5. `AuthGuard` protege rotas que exigem autenticação

## 🗺️ Integração com Google Maps

### APIs Utilizadas
- **Maps JavaScript API** - Renderização de mapas
- **Places API** - Autocomplete de endereços
- **Geocoding API** - Conversão de endereços em coordenadas

### Configuração
1. Obtenha uma API Key no [Google Cloud Console](https://console.cloud.google.com/)
2. Habilite as APIs necessárias
3. Configure restrições de domínio
4. Adicione a chave no `environment.ts`

## 📱 Funcionalidades por Rota

| Rota              | Descrição            | Proteção  |
| ----------------- | -------------------- | --------- |
| `/login`          | Login de usuários    | Pública   |
| `/signup`         | Cadastro de usuários | Pública   |
| `/home`           | Lista de contatos    | Protegida |
| `/profile`        | Visualizar perfil    | Protegida |
| `/profile/edit`   | Editar perfil        | Protegida |
| `/profile/delete` | Excluir conta        | Protegida |

## 🎨 Customização de Tema

O projeto utiliza Angular Material com tema customizado em `src/custom-theme.scss`.

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto é privado e de uso educacional.

## 👨‍💻 Autor

**Luis Klap**
- GitHub: [@LuisKlap](https://github.com/LuisKlap)

## 🔗 Links Úteis

- [Documentação do Angular](https://angular.dev)
- [Angular Material](https://material.angular.io)
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript)
- [ViaCEP API](https://viacep.com.br)

---
