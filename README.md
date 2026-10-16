# PetzIn — Gestão de hospedagem de pets

Aplicação web full stack desenvolvida para o desafio técnico de Desenvolvedor Full Stack Júnior do Instituto Conecthus. O PetzIn substitui controles em planilhas por uma solução centralizada para tutores, pets, reservas, hospedagens e pagamentos.

## Funcionalidades

- Autenticação administrativa com JWT e alteração de senha.
- Rotas protegidas e encerramento automático da sessão em respostas não autorizadas.
- Cadastro, edição, listagem e desativação de tutores.
- Cadastro, edição, listagem e desativação de pets.
- Uma reserva individual para cada pet.
- Criação, edição, consulta, cancelamento e alteração de status das reservas.
- Bloqueio de reservas em datas passadas e de períodos inválidos.
- Prevenção de reservas simultâneas para o mesmo pet ou canil.
- Cálculo automático por hora ou diária, com arredondamento de horas excedentes.
- Registro de pagamentos pendentes, parciais e integrais.
- Resumo financeiro por período.
- Dashboard administrativo responsivo.
- Deploy local completo com Docker Compose.

## Tecnologias e escolhas

| Camada | Tecnologias | Motivo |
| --- | --- | --- |
| Frontend | Angular 21, TypeScript, Reactive Forms e CSS | Componentização, tipagem, formulários robustos e rotas protegidas. |
| Backend | Node.js, Express 5 e TypeScript | API REST simples, tipada e organizada em camadas. |
| Persistência | PostgreSQL 17 e TypeORM | Integridade relacional, migrations e tipos adequados para valores financeiros. |
| Segurança | JWT e bcrypt | Autenticação sem estado e armazenamento seguro de senhas. |
| Testes | Vitest e Supertest | Testes unitários, de componentes e integração com a API e o banco. |
| Deploy | Docker, Docker Compose e Nginx | Ambiente reproduzível com frontend, backend e banco em contêineres. |

## Arquitetura

```text
Navegador
   │
   ▼
Angular servido pelo Nginx — http://localhost:8080
   │  /api
   ▼
API REST Node.js + Express — backend:3000
   │
   ▼
Services → Repositories → TypeORM
   │
   ▼
PostgreSQL — postgres:5432
```

O backend segue a separação `Routes → Controllers → Services → Repositories → Entities`. As regras de negócio permanecem nos serviços, enquanto controllers tratam requisições e respostas HTTP.

## Modelagem e integridade

```text
Usuario (administração)

Tutor 1 ───── N Pet 1 ───── N Reserva
```

O modelo inicial do desafio repetia nome e telefone do tutor e agrupava vários animais no mesmo campo da reserva. Isso provocaria inconsistências quando um telefone fosse alterado, duplicação de informações e impossibilidade de consultar individualmente o histórico de um pet.

No modelo corrigido:

- `Usuario` representa exclusivamente a pessoa que administra o hotel.
- `Tutor` concentra os dados do responsável pelo animal.
- Cada `Pet` pertence a um único tutor, enquanto um tutor pode possuir vários pets.
- Cada `Reserva` pertence a um único pet, permitindo histórico e cobrança individuais.
- Chaves estrangeiras preservam a integridade dos relacionamentos.
- Desativação lógica preserva os registros e históricos relevantes.
- Tarifas e valores aplicados são armazenados na reserva para preservar o histórico financeiro.

## Regras de cobrança

- Hora: **R$ 10,00**.
- Diária de 24 horas: **R$ 240,00**.
- Na modalidade por hora, qualquer fração é arredondada para a próxima hora completa.
- Na modalidade diária, são cobradas as diárias completas e as horas excedentes.
- Uma permanência de 25 horas e 1 minuto custa **1 diária + 2 horas = R$ 260,00**.
- O valor é calculado no backend; valores enviados pelo cliente não são aceitos como fonte da cobrança.

## Execução completa com Docker

### Pré-requisitos

- Git.
- Docker Desktop com Docker Compose.
- Portas `8080`, `3000` e `5433` disponíveis.

### 1. Clone e acesse o projeto

```bash
git clone <URL_DO_REPOSITORIO>
cd PetzIn
```

### 2. Crie o arquivo de ambiente

No PowerShell:

```powershell
Copy-Item .env.example .env
```

No Linux ou macOS:

```bash
cp .env.example .env
```

Os valores do `.env.example` são destinados somente ao desenvolvimento e à avaliação local. Em produção, substitua senhas e a chave JWT por valores fortes e privados.

### 3. Construa e inicie a aplicação

```bash
docker compose up --build -d
```

O processo aguarda o PostgreSQL, executa automaticamente as migrations, inicia a API e publica o Angular pelo Nginx.

Verifique os serviços:

```bash
docker compose ps
```

### 4. Crie o primeiro administrador

O banco criado pelo Docker começa vazio. A API permite cadastrar somente a primeira conta administrativa e bloqueia tentativas de criar uma segunda conta.

PowerShell:

```powershell
$corpo = @{
  nome = "Administrador PetzIn"
  email = "admin@petzin.local"
  senha = "PetzIn@123"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:8080/api/usuarios" `
  -ContentType "application/json" `
  -Body $corpo
```

Linux ou macOS:

```bash
curl -X POST http://localhost:8080/api/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nome":"Administrador PetzIn","email":"admin@petzin.local","senha":"PetzIn@123"}'
```

A senha deve ter de 7 a 12 caracteres, contendo ao menos uma letra, um número e um caractere especial. Troque a senha de exemplo após o primeiro acesso.

### 5. Acesse

- Aplicação: [http://localhost:8080](http://localhost:8080)
- Health check pelo proxy: [http://localhost:8080/api/health](http://localhost:8080/api/health)
- API direta para desenvolvimento: [http://localhost:3000/health](http://localhost:3000/health)

Para acompanhar os logs:

```bash
docker compose logs -f
```

Para encerrar sem apagar os dados:

```bash
docker compose down
```

Para reiniciar posteriormente:

```bash
docker compose up -d
```

> Atenção: `docker compose down -v` também remove o volume do PostgreSQL e apaga os dados locais.

## Execução local para desenvolvimento

É possível executar apenas o banco no Docker e manter frontend e backend com recarregamento automático.

### Banco

```bash
docker compose up -d postgres
```

### Backend

```bash
cd backend
npm ci
npm run migration:run
npm run dev
```

API disponível em `http://localhost:3000`.

### Frontend

Em outro terminal:

```bash
cd frontend
npm ci
npm start
```

Interface disponível em `http://localhost:4200`. O proxy de desenvolvimento encaminha `/api` para a API local.

## Testes e builds

O PostgreSQL deve estar ativo para executar os testes de integração do backend.

Backend:

```bash
cd backend
npm run typecheck
npm test
npm run build
```

Frontend:

```bash
cd frontend
npm test -- --watch=false
npm run build
```

Estado verificado antes da entrega:

- **72 testes do backend** aprovados.
- **19 testes do frontend** aprovados.
- Builds de produção aprovados.
- Fluxo integrado validado: login, tutor, pet, reserva, hospedagem e pagamento.

## Estrutura do repositório

```text
PetzIn/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── entities/
│   │   ├── middlewares/
│   │   ├── migrations/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   └── tests/
│   └── Dockerfile
├── frontend/
│   ├── public/
│   ├── src/app/
│   │   ├── core/
│   │   ├── features/
│   │   └── layout/
│   ├── Dockerfile
│   └── nginx.conf
├── docs/API.md
├── compose.yaml
└── README.md
```

## Documentação da API

A documentação completa dos 23 endpoints, incluindo exemplos, filtros, respostas, autenticação e regras de negócio, está em [docs/API.md](docs/API.md).

## Tratamento de erros

A aplicação trata, entre outros casos:

- Credenciais ou tokens inválidos.
- Dados obrigatórios ausentes ou inválidos.
- E-mails duplicados.
- IDs inexistentes.
- Datas passadas ou períodos invertidos.
- Conflitos de reserva por pet ou canil.
- Transições inválidas de status.
- Pagamentos maiores que o valor total.
- Tentativa de cancelar uma reserva com valor pago.

## Escopo

O projeto prioriza o núcleo solicitado no desafio: modelagem adequada de tutores, pets e reservas, API REST, interface integrada, tratamento de exceções e Docker. Histórico clínico detalhado e lembretes de medicamentos são evoluções possíveis, mas não fazem parte do fluxo principal desta entrega.

## Licença

Projeto desenvolvido exclusivamente para fins de avaliação técnica.
