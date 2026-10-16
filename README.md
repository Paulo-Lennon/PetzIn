# PetzIn

Sistema web para administração de um hotel e creche de animais. A aplicação permite que a proprietária do estabelecimento gerencie tutores, pets, reservas, hospedagens e pagamentos em um único lugar.

## Sumário

1. [O que foi implementado](#o-que-foi-implementado)
2. [Tecnologias e motivos das escolhas](#tecnologias-e-motivos-das-escolhas)
3. [Arquitetura da aplicação](#arquitetura-da-aplicação)
4. [Documentação da análise](#documentação-da-análise)
5. [Como executar com Docker](#como-executar-com-docker)
6. [Como executar em modo de desenvolvimento](#como-executar-em-modo-de-desenvolvimento)
7. [Como executar os testes](#como-executar-os-testes)
8. [Documentação da API](#documentação-da-api)
9. [Solução de problemas](#solução-de-problemas)

## O que foi implementado

### Autenticação

- Cadastro da primeira conta administrativa.
- Login com e-mail e senha.
- Senha protegida com hash bcrypt.
- Autenticação por JSON Web Token (JWT).
- Proteção das rotas administrativas.
- Alteração de senha pela interface.
- Encerramento da sessão quando o token deixa de ser válido.

### Tutores

- Cadastro de tutor.
- Listagem dos tutores ativos.
- Consulta por identificador.
- Edição dos dados de contato.
- Desativação com validação de vínculos ativos.

### Pets

- Cadastro de pet associado a um tutor.
- Listagem e consulta individual.
- Edição cadastral.
- Foto por URL pública.
- Registro de espécie, raça, sexo, nascimento, peso e observações.
- Desativação com preservação do histórico.

### Reservas e hospedagens

- Uma reserva individual para cada pet.
- Criação, listagem, consulta e edição de reservas.
- Estados `AGENDADA`, `EM_ANDAMENTO`, `CONCLUIDA` e `CANCELADA`.
- Bloqueio de entrada em data passada.
- Validação de saída posterior à entrada.
- Bloqueio de sobreposição para o mesmo pet.
- Bloqueio de sobreposição para o mesmo canil.
- Cancelamento com preservação do registro histórico.

### Cobrança e financeiro

- Cálculo automático por hora ou diária.
- Hora no valor de **R$ 10,00**.
- Diária de 24 horas no valor de **R$ 240,00**.
- Arredondamento de qualquer fração para a hora seguinte.
- Combinação de múltiplas diárias com horas excedentes.
- Pagamentos pendentes, parciais e integrais.
- Resumo financeiro por período.
- Preservação das tarifas aplicadas no momento da reserva.

### Interface

- Login administrativo.
- Dashboard com dados reais da API.
- Formulários reativos para tutores, pets e reservas.
- Listagens e ações administrativas.
- Tela financeira.
- Mensagens de carregamento, sucesso e erro.
- Layout responsivo inspirado no protótipo do PetzIn.

## Tecnologias e motivos das escolhas

Angular 21 Frontend Escolhi o Angular porque facilita a organização das telas e dos componentes, além de oferecer recursos que ajudam no desenvolvimento e na manutenção da aplicação.

TypeScript Frontend e backend Utilizei TypeScript para ter mais segurança ao escrever o código, identificar possíveis erros durante o desenvolvimento e facilitar a manutenção.

Node.js Backend Optei pelo Node.js por já ter familiaridade com a tecnologia e pela facilidade de trabalhar com TypeScript também no backend.

Express 5 API HTTP Escolhi o Express por ser um framework simples e prático para criar as rotas da API e organizar as requisições do sistema.

PostgreSQL 17 Banco de dados Utilizei PostgreSQL por ser um banco de dados confiável, que permite organizar as informações e manter os relacionamentos entre as tabelas.

TypeORM Persistência de dados Escolhi o TypeORM para facilitar a comunicação entre o backend e o banco de dados, trabalhando com entidades e migrations.

JWT Autenticação Utilizei JWT para controlar a autenticação dos usuários e garantir que apenas pessoas autenticadas possam acessar as rotas protegidas.

bcrypt Segurança das senhas Escolhi bcrypt para proteger as senhas dos usuários, armazenando hashes em vez das senhas originais.

Vitest Testes Utilizei Vitest para criar testes automatizados e verificar se as funcionalidades estão funcionando conforme o esperado.

Supertest Testes da API Escolhi Supertest para testar as rotas da API e conferir se as requisições estão retornando as respostas corretas.

Docker Compose Execução e deploy Utilizei Docker Compose para facilitar a configuração e a execução dos serviços da aplicação, evitando precisar iniciar cada um manualmente.

Nginx Servidor do frontend Escolhi Nginx para disponibilizar os arquivos do frontend e direcionar as requisições da API para o backend.

Não foi adicionada uma biblioteca visual extensa. O CSS do projeto é próprio.

## Arquitetura da aplicação

```text
Navegador
    |
    | http://localhost:8080
    v
Frontend Angular servido pelo Nginx
    |
    | /api
    v
Backend Node.js + Express
    |
    v
Routes -> Controllers -> Services -> Repositories
    |
    v
TypeORM -> PostgreSQL
```

Responsabilidades no backend:

- **Routes:** definem os endpoints e aplicam o middleware de autenticação.
- **Controllers:** recebem as requisições e constroem as respostas HTTP.
- **Services:** concentram validações, regras de negócio e cálculos.
- **Repositories:** executam consultas e operações de persistência.
- **Entities:** representam as tabelas e seus relacionamentos.
- **Migrations:** versionam e reproduzem o schema do banco.
- **Middlewares:** validam o JWT e padronizam erros transversais.

Responsabilidades no frontend:

- **Core:** modelos, serviços HTTP, interceptor e guard de autenticação.
- **Features:** páginas agrupadas por funcionalidade.
- **Layout:** estrutura administrativa e navegação lateral.
- **Reactive Forms:** validações e envio seguro dos formulários.

## Documentação da análise

### Modelo recebido no desafio

O modelo inicial colocava informações do tutor, dos pets e da reserva em um único objeto:

```json
{
  "id_reserva": 901,
  "nome_do_dono": "Carlos Almeida",
  "telefone_dono": "11999999999",
  "nome_do_pet": "Rex e Bolinha",
  "raca_do_pet": "Labrador e Poodle",
  "data_entrada": "2023-11-10",
  "data_saida": "2023-11-15",
  "numero_do_canil": 5,
  "valor_total_pago": 350.0
}
```

Esse formato poderia até funcionar como uma linha de planilha, mas não é adequado como modelo relacional para uma aplicação.

### Problemas encontrados

Problema identificado & Impacto na aplicação
Dados do tutor repetidos em várias reservas-Se Carlos mudar de telefone, por exemplo, seria necessário alterar essa informação em todas as reservas dele. Isso aumenta o trabalho e pode gerar informações diferentes para a mesma pessoa.
Mais de um pet no mesmo campo - Quando armazenamos algo como "Rex e Bolinha" em um único campo, fica difícil consultar ou alterar as informações de cada animal separadamente.
Raças armazenadas juntas - Como as raças estão no mesmo campo, o sistema depende da ordem dos nomes para saber qual raça pertence a cada pet. Isso pode causar confusão e erros nos registros.
Falta de identificadores para tutores e pets - Sem um código único para identificar cada tutor e pet, fica mais difícil relacionar corretamente os dados e evitar registros inconsistentes.
Dados cadastrais misturados com informações da reserva - Misturar informações dos tutores e pets com os dados das reservas gera repetição e dificulta futuras alterações e melhorias no sistema.
Apenas um campo para o valor pago - Com apenas esse campo, não conseguimos identificar claramente o valor total da hospedagem, quanto já foi pago e se ainda existe algum valor pendente.
Datas sem horário e fuso horário - Sem essas informações, o sistema pode ter dificuldades para calcular corretamente o período da hospedagem, principalmente quando a cobrança envolve horas ou períodos incompletos.
Falta de status da reserva - Sem um status, não conseguimos saber facilmente se a reserva está agendada, se o pet já está hospedado, se a hospedagem terminou ou se houve cancelamento.
Falta de controle de disponibilidade - Sem verificar a disponibilidade antes de confirmar uma reserva, o sistema pode acabar permitindo duas hospedagens para o mesmo canil ou reservas conflitantes para o mesmo pet.

### O que acontece se Carlos mudar de telefone?

No modelo original, cada reserva manteria uma cópia do telefone. Seria necessário localizar e atualizar todas as reservas de Carlos, com risco de deixar registros divergentes.

No PetzIn, o telefone existe somente em `Tutor`. A alteração é feita uma única vez e todas as consultas passam a apresentar o dado atualizado por meio do relacionamento.

### Como consultar Rex individualmente?

No modelo original, Rex divide um campo textual com Bolinha. O banco não consegue identificar com segurança qual trecho pertence a cada animal.

No modelo corrigido, Rex possui um UUID próprio na entidade `Pet`. As reservas apontam para esse identificador, permitindo filtrar todo o histórico de hospedagens do animal. Um futuro registro clínico também deverá referenciar `petId`, mantendo vacinas, alergias ou medicamentos separados por pet. O módulo clínico detalhado não faz parte do núcleo implementado nesta entrega.

### Modelo corrigido

```text
Usuario
  - representa a administradora do sistema

Tutor 1 -------- N Pet 1 -------- N Reserva
```

Principais entidades:

| Entidade | Responsabilidade | Dados principais

| `Usuario` | Acesso administrativo | nome, e-mail, hash da senha e situação do acesso. |
| `Tutor` | Responsável pelo animal | nome, telefone, e-mail e observações. |
| `Pet` | Identidade individual do animal | tutor, nome, espécie, raça, sexo, nascimento, peso, foto e observações. |
| `Reserva` | Hospedagem individual | pet, entrada, saída, canil, modalidade, tarifas, valores, pagamento e status. |

Decisões de integridade:

- Cada pet possui exatamente um tutor nesta versão.
- Um tutor pode possuir vários pets.
- Cada reserva pertence a apenas um pet.
- UUIDs identificam as entidades sem depender de dados pessoais mutáveis.
- Chaves estrangeiras mantêm os relacionamentos válidos.
- Valores monetários usam colunas decimais.
- Reservas guardam as tarifas aplicadas para que mudanças futuras não alterem valores históricos.
- Tutores e pets são desativados em vez de terem seu histórico apagado.
- Reservas canceladas permanecem armazenadas, mas não entram nos totais financeiros ativos.

### Regra de cálculo

Na modalidade por hora, a duração é arredondada para cima. Uma permanência de 1 hora e 1 minuto custa 2 horas.

Na modalidade diária, o sistema cobra as diárias completas e depois calcula as horas excedentes, também arredondando a fração. Exemplos:

| Permanência         | Cálculo             | Total     |
| ------------------- | ------------------- | --------- |
| 2 horas exatas      | 2 × R$ 10,00        | R$ 20,00  |
| 2 horas e 1 minuto  | 3 × R$ 10,00        | R$ 30,00  |
| 24 horas            | 1 × R$ 240,00       | R$ 240,00 |
| 25 horas e 1 minuto | 1 diária + 2 horas  | R$ 260,00 |
| 49 horas e 1 minuto | 2 diárias + 2 horas | R$ 500,00 |

O frontend mostra uma prévia, mas o backend recalcula o valor e ignora tentativas do cliente de definir tarifas ou total manualmente.

## Como executar com Docker

Este é o procedimento recomendado para avaliação, pois instala dependências, compila as aplicações, prepara o banco e inicia todo o projeto de forma reproduzível.

### Pré-requisitos

Instale:

- [Git](https://git-scm.com/downloads)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

Confirme que o Docker Desktop está aberto e que as portas `8080`, `3000` e `5433` estão livres.

### 1. Clone o repositório

```bash
git clone https://github.com/Paulo-Lennon/PetzIn.git
cd PetzIn
```

### 2. Crie o arquivo de configuração

No Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

No Linux ou macOS:

```bash
cp .env.example .env
```

O `.env.example` possui a lista das variáveis exigidas. Os valores de exemplo servem apenas para desenvolvimento local. Não publique o `.env` real.

### 3. Construa e inicie todos os serviços

Na raiz do projeto, execute:

```bash
docker compose up --build -d
```

Não é necessário executar `npm install` neste modo. Os Dockerfiles usam `npm ci` e instalam automaticamente as versões registradas nos arquivos `package-lock.json`.

O Compose executará, nesta ordem:

1. PostgreSQL.
2. Health check do banco.
3. Backend e migrations.
4. Health check da API.
5. Frontend Angular servido pelo Nginx.

### 4. Confirme que os serviços estão saudáveis

```bash
docker compose ps
```

Os serviços `petzin-postgres`, `petzin-backend` e `petzin-frontend` deverão aparecer como `healthy`.

Também é possível verificar a API pelo navegador:

```text
http://localhost:8080/api/health
```

Resposta esperada:

```json
{
  "status": "ok",
  "message": "API PetzIn funcionando!"
}
```

### 5. Crie a primeira conta administrativa

Um banco novo não possui usuário. A API permite cadastrar a primeira conta administrativa e bloqueia cadastros administrativos adicionais.

Windows PowerShell:

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

A senha deve possuir entre 7 e 12 caracteres, incluindo pelo menos uma letra, um número e um caractere especial.

### 6. Entre na aplicação

Acesse:

```text
http://localhost:8080
```

Utilize o e-mail e a senha cadastrados no passo anterior.

### 7. Consulte os logs quando necessário

Todos os serviços:

```bash
docker compose logs -f
```

Somente o backend:

```bash
docker compose logs -f backend
```

Pressione `Ctrl+C` para sair da visualização dos logs. Isso não encerra os contêineres.

### 8. Encerre a aplicação

Sem apagar os dados:

```bash
docker compose down
```

Os registros continuam no volume `postgres_data` e reaparecem na próxima inicialização:

```bash
docker compose up -d
```

Para remover também todos os dados locais:

```bash
docker compose down -v
```

> Atenção: o parâmetro `-v` apaga permanentemente o volume local do PostgreSQL.

## Como executar em modo de desenvolvimento

Neste modo, somente o PostgreSQL fica no Docker. Backend e frontend são executados diretamente pelo Node.js, com atualização automática durante o desenvolvimento.

### Pré-requisitos

- Git.
- Node.js 22 LTS.
- npm 11 ou uma versão compatível com o `package-lock.json`.
- Docker Desktop.
- Portas `4200`, `3000` e `5433` livres.

### 1. Clone e configure o ambiente

```bash
git clone https://github.com/Paulo-Lennon/PetzIn.git
cd PetzIn
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Linux ou macOS:

```bash
cp .env.example .env
```

### 2. Inicie o PostgreSQL

Se o ambiente Docker completo estiver ativo, encerre-o primeiro para liberar as portas:

```bash
docker compose down
```

Inicie somente o banco:

```bash
docker compose up -d postgres
docker compose ps
```

Aguarde `petzin-postgres` aparecer como `healthy`.

### 3. Instale as dependências do backend

Abra um terminal na raiz do projeto:

```bash
cd backend
npm ci
```

`npm ci` instala as versões exatas do `backend/package-lock.json`.

### 4. Execute as migrations

Ainda dentro de `backend/`:

```bash
npm run migration:run
```

Na primeira execução, esse comando cria as tabelas. Nas seguintes, aplica somente migrations ainda pendentes.

### 5. Inicie o backend

```bash
npm run dev
```

Mantenha o terminal aberto. A mensagem esperada informa que o PostgreSQL foi conectado e que a API está na porta `3000`.

Verifique:

```text
http://localhost:3000/health
```

### 6. Crie o primeiro administrador

Em outro PowerShell, execute uma única vez para um banco novo:

```powershell
$corpo = @{
  nome = "Administrador PetzIn"
  email = "admin@petzin.local"
  senha = "PetzIn@123"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "http://localhost:3000/usuarios" `
  -ContentType "application/json" `
  -Body $corpo
```

Se a resposta informar que o usuário administrativo já existe, utilize a conta criada anteriormente. Esse bloqueio é intencional porque o sistema foi definido para uma única administradora.

### 7. Instale as dependências do frontend

Abra mais um terminal na raiz do projeto:

```bash
cd frontend
npm ci
```

`npm ci` instala as versões exatas do `frontend/package-lock.json`.

### 8. Inicie o frontend

Ainda dentro de `frontend/`:

```bash
npm start
```

O Angular ficará disponível em:

```text
http://localhost:4200
```

O arquivo `proxy.conf.json` encaminha chamadas iniciadas por `/api` para o backend em `http://localhost:3000`.

### 9. Finalize o ambiente local

1. Pressione `Ctrl+C` no terminal do frontend.
2. Pressione `Ctrl+C` no terminal do backend.
3. Na raiz do projeto, pare o PostgreSQL:

```bash
docker compose stop postgres
```

## Como executar os testes

Os testes de integração do backend utilizam o PostgreSQL configurado no `.env`. Antes de executá-los, confirme que o banco está saudável:

```bash
docker compose up -d postgres
docker compose ps
```

### Backend

```bash
cd backend
npm ci
npm run typecheck
npm test
npm run build
```

Resultados verificados nesta entrega:

- 7 arquivos de teste.
- 72 testes aprovados.
- Fluxo completo testado: login, tutor, pet, reserva, hospedagem, pagamento e persistência.

### Frontend

Em outro terminal, a partir da raiz:

```bash
cd frontend
npm ci
npm test -- --watch=false
npm run build
```

Resultados verificados nesta entrega:

- 8 arquivos de teste.
- 19 testes aprovados.
- Autenticação, guard, formulários, datas e cálculo de reservas cobertos.

## Estrutura do projeto

```text
PetzIn/
|-- backend/
|   |-- src/
|   |   |-- controllers/
|   |   |-- entities/
|   |   |-- middlewares/
|   |   |-- migrations/
|   |   |-- repositories/
|   |   |-- routes/
|   |   |-- services/
|   |   `-- tests/
|   |-- Dockerfile
|   |-- package.json
|   `-- tsconfig.json
|-- frontend/
|   |-- public/
|   |-- src/app/
|   |   |-- core/
|   |   |-- features/
|   |   `-- layout/
|   |-- Dockerfile
|   |-- nginx.conf
|   `-- package.json
|-- docs/
|   `-- API.md
|-- .env.example
|-- compose.yaml
`-- README.md
```

## Documentação da API

A referência completa dos endpoints, exemplos de requisições, respostas, filtros e códigos HTTP está em [docs/API.md](docs/API.md).

Resumo dos grupos disponíveis:

- `/health`
- `/usuarios`
- `/tutores`
- `/pets`
- `/reservas`
- `/financeiro`

Com exceção do health check, do cadastro inicial e do login, os endpoints administrativos exigem o cabeçalho:

```http
Authorization: Bearer <token>
```

## Solução de problemas

### Uma porta já está sendo utilizada

Confira se outra execução do Node.js ou outro contêiner está ocupando `4200`, `3000`, `5433` ou `8080`. Encerre a execução anterior antes de iniciar novamente.

### O PostgreSQL não fica saudável

```bash
docker compose logs postgres
```

Confirme se o `.env` existe na raiz e possui todas as variáveis listadas em `.env.example`.

### O backend não inicia

```bash
docker compose logs backend
```

Verifique a saúde do PostgreSQL e se a variável `JWT_SECRET` foi configurada.

### O login informa credenciais inválidas

Confirme que a primeira conta foi criada no banco atualmente em execução. Volumes Docker diferentes possuem dados independentes.

### O cadastro do administrador retorna HTTP 403

Isso significa que já existe uma conta administrativa. Por segurança, a API não cria uma segunda conta.

### Quero começar com um banco vazio

```bash
docker compose down -v
docker compose up --build -d
```

Depois, repita a criação do primeiro administrador.

> Atenção: esses comandos removem definitivamente todos os dados do banco local.

## Segurança e dados locais

- O arquivo `.env` não é versionado.
- Senhas nunca são retornadas pela API.
- O hash bcrypt também não aparece nas respostas.
- Credenciais inválidas retornam uma mensagem genérica.
- Tokens expirados ou inválidos retornam HTTP 401.
- O volume do PostgreSQL não é enviado ao GitHub.
- Criar um banco novo usando migrations e cadastra sua própria conta administrativa.

## Escopo da entrega

O escopo principal solicitado — modelagem de tutores, pets e reservas, API REST, interface integrada, consumo da API, tratamento de erros e Docker — está implementado. Um módulo clínico detalhado e lembretes de medicamentos são possibilidades de evolução.
