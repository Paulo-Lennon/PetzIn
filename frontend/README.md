# Frontend PetzIn

Interface administrativa do PetzIn construída com Angular, TypeScript e CSS.

## Requisitos

- Node.js compatível com Angular 21
- npm
- Backend do PetzIn disponível em `http://localhost:3000`

## Execução

```bash
npm install
npm start
```

A aplicação ficará disponível em `http://localhost:4200`.

## Verificações

```bash
npm run build
npm test -- --watch=false
```

## Estrutura

```text
src/app/
├── core/
│   ├── config/         Configuração da API
│   ├── guards/         Proteção das rotas administrativas
│   ├── interceptors/   Inclusão e tratamento do JWT
│   ├── models/         Contratos TypeScript da API
│   └── services/       Comunicação HTTP com o backend
├── features/
│   ├── auth/           Login administrativo
│   ├── dashboard/      Visão geral
│   ├── financeiro/     Indicadores financeiros
│   ├── pets/           Gestão de pets
│   ├── reservas/       Listagem e criação de reservas
│   └── tutores/        Gestão de clientes/tutores
└── layout/             Estrutura visual da área administrativa
```

## Identidade visual

Os tokens de cor, superfícies, navegação lateral e composição responsiva seguem o mockup oficial fornecido para o projeto. Os ativos fotográficos definitivos serão adicionados na etapa de refinamento visual.
