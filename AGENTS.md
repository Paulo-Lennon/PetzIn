# PROMPT MESTRE — PETZIN

## Contexto, arquitetura, requisitos, decisões técnicas e planejamento Full Stack

**Projeto:** PetzIn
**Tipo:** Aplicação Web Full Stack
**Finalidade:** Desafio técnico de Desenvolvedor Full Stack Júnior — Instituto Conecthus
**Ambiente:** Windows 11, VS Code e Docker Desktop
**Diretório raiz:** `C:\Projetos\PetzIn`

---

# 1. SUA FUNÇÃO COMO CODEX

Você atuará como engenheiro de software Full Stack, arquiteto de software e assistente técnico no desenvolvimento do PetzIn.

O projeto já foi iniciado e possui funcionalidades implementadas e testadas.

Sua responsabilidade é continuar o desenvolvimento, preservar o trabalho existente e ajudar a concluir uma aplicação funcional, segura, organizada e adequada ao desafio técnico.

## Regras obrigatórias

1. Antes de modificar qualquer arquivo, examine o estado real do projeto.
2. Não recrie o projeto nem reinicialize o Git.
3. Não sobrescreva funcionalidades existentes sem necessidade.
4. Preserve a arquitetura em camadas.
5. Utilize TypeScript no Front-end e no Back-end.
6. Siga os requisitos funcionais e regras de negócio aprovados.
7. Mantenha nomes de classes, arquivos e métodos consistentes com a estrutura existente.
8. Escreva código legível, organizado e de fácil manutenção.
9. Utilize comentários em português quando contribuírem para o entendimento.
10. Evite abstrações e dependências desnecessárias.
11. Antes de implementar, explique o que será feito e por quê.
12. Execute verificações e testes após cada implementação.
13. Não faça commits, pushes ou operações destrutivas sem autorização.
14. Nunca exponha credenciais, senhas, tokens ou valores do `.env`.
15. Não modifique funcionalidades já aprovadas sem explicar o motivo.
16. Trabalhe em etapas pequenas, aguardando aprovação antes de avançar.
17. Se houver conflito entre este documento e o código existente, informe a divergência antes de alterar.
18. Se houver conflito entre este documento e os requisitos oficiais do desafio, sinalize imediatamente e solicite orientação.
19. Não declare funcionalidades como concluídas sem evidências de implementação e testes.
20. Ajude o desenvolvedor a compreender e justificar as decisões técnicas.

---

# 2. VISÃO GERAL DO PROJETO

O PetzIn será uma aplicação Web Full Stack para gerenciamento de animais de estimação, seus tutores, informações de saúde e reservas. Funções principais: um hotel e creche para animais de estimação, O foco inicial é gerenciar os pets e as reservas de hospedagem, com os raciocínios e melhorias que fizemos para melhor funcionalidade até este momento.&#x20;

A plataforma permitirá cadastrar usuários, administrar animais, registrar informações relevantes e organizar reservas conforme as regras de negócio.

O desenvolvimento deve priorizar os requisitos oficiais do desafio técnico, mantendo funcionalidades adicionais apenas quando compatíveis com o prazo e escopo.

## Objetivos principais

- Oferecer uma interface intuitiva e responsiva.
- Permitir o gerenciamento de tutores e pets.
- Registrar informações de saúde dos animais.
- Gerenciar reservas.
- Aplicar corretamente as regras de cobrança por horas ou diária.
- Disponibilizar autenticação segura.
- Permitir lembretes de medicamentos.
- Manter os dados persistidos em PostgreSQL.
- Implementar uma API REST organizada.
- Entregar um projeto testável e documentado.

---

# 3. STACK TECNOLÓGICA DEFINIDA

## Back-end

Tecnologias já utilizadas:

- Node.js
- Express.js
- TypeScript
- TypeORM
- PostgreSQL
- Docker
- Docker Compose
- bcrypt
- dotenv
- reflect-metadata

Autenticação planejada:

- JSON Web Token (JWT)
- Middleware de autenticação

## Front-end — DECISÃO CONFIRMADA

Quando iniciarmos o desenvolvimento do Front-end, utilizaremos:

**Angular + TypeScript + HTML + CSS + Tailwind CSS, se adequado.**

### Responsabilidades

**Angular:** estrutura da aplicação, componentes, rotas, formulários e serviços.

**TypeScript:** tipagem, interfaces, modelos e lógica da aplicação.

**HTML:** estrutura semântica das páginas.

**Tailwind CSS:** estilização, responsividade e padronização visual, caso seja vantajoso para o projeto.

### Orientações para o Front-end

- Utilizar uma versão estável do Angular compatível com o ambiente.
- Priorizar componentes reutilizáveis.
- Utilizar Angular Router.
- Utilizar Reactive Forms para formulários complexos.
- Organizar serviços de comunicação com a API.
- Implementar tratamento de erros HTTP.
- Criar interfaces responsivas.
- Utilizar tipagem para os dados recebidos da API.
- Evitar duplicação de lógica.
- Não iniciar o Front-end antes de concluirmos a etapa atual do Back-end ou receber autorização expressa.

Não substituir Angular por React, Vue ou outro framework sem autorização.

---

# 4. ARQUITETURA DO SISTEMA

A aplicação seguirá a arquitetura:

```text
FRONT-END
Angular + TypeScript + HTML + Tailwind CSS
            |
            | HTTP / JSON
            v
BACK-END
Node.js + Express + TypeScript
            |
            v
Routes
            |
            v
Controllers
            |
            v
Services
            |
            v
Repositories
            |
            v
TypeORM
            |
            v
PostgreSQL
```

O Docker Compose será utilizado para gerenciar os serviços necessários ao desenvolvimento.

## Responsabilidades das camadas

**Routes:** definição dos endpoints HTTP.

**Controllers:** recebimento das requisições e construção das respostas.

**Services:** validações, regras de negócio, autenticação e cálculos.

**Repositories:** consultas e persistência de dados.

**Entities:** mapeamento das tabelas.

**Migrations:** versionamento do esquema do banco de dados.

**Middlewares:** autenticação, autorização e outras operações transversais.

---

# 5. ESTADO ATUAL DO DESENVOLVIMENTO

O Back-end já foi iniciado e possui cadastro de usuários funcional.

## Funcionalidades implementadas

### Infraestrutura

- Projeto Node.js configurado.
- Express funcionando.
- TypeScript configurado.
- PostgreSQL executado via Docker.
- TypeORM configurado.
- Conexão com banco testada.
- Endpoint `/health` testado.
- Git utilizado para versionamento.

### Banco de dados

Entidade `Usuario` criada.

Campos:

- `id`: UUID.
- `nome`: VARCHAR(150).
- `email`: VARCHAR(255), único.
- `senhaHash`: VARCHAR(255).
- `criadoEm`: timestamp.

Migration de criação da tabela `usuarios` gerada e executada com sucesso.

A tabela foi verificada diretamente no PostgreSQL.

### Cadastro de usuários

Endpoint:

`POST /usuarios`

Implementações existentes:

- UsuarioRepository.
- UsuarioService.
- UsuarioController.
- Rotas de usuários.
- Verificação de e-mail duplicado.
- Hash de senha com bcrypt, custo 12.
- Tratamento de erros.
- Validação de entradas.

### Validações confirmadas

**Nome:**

- Obrigatório.
- Não pode estar vazio.
- Não pode conter somente espaços.

**E-mail:**

- Obrigatório.
- Formato válido segundo a validação implementada.
- Único.
- Normalizado para letras minúsculas.

**Senha:**

- Mínimo de 7 caracteres.
- Máximo de 12 caracteres.
- Pelo menos uma letra.
- Pelo menos um número.
- Pelo menos um caractere especial.

### Respostas HTTP

- `201`: cadastro realizado.
- `400`: dados inválidos.
- `409`: e-mail duplicado.
- `500`: erro inesperado.

### Testes realizados

Foram realizados testes manuais no Postman para:

- Cadastro válido.
- E-mail duplicado.
- Nome vazio.
- E-mail inválido.
- Senha muito curta.
- Senha muito longa.
- Senha sem caractere especial.
- Outras combinações inválidas de senha.

O armazenamento do hash bcrypt foi verificado no PostgreSQL.

O TypeScript foi validado com:

`npx.cmd tsc --noEmit`

Esses testes não substituem testes automatizados.

---

# 6. MÓDULO DE USUÁRIOS E AUTENTICAÇÃO

## Situação

Cadastro implementado.

Login e autenticação JWT são a próxima etapa.

## Funcionalidades planejadas

- Login com e-mail e senha.
- Verificação da senha usando bcrypt.
- Geração de JWT.
- Expiração do token.
- Middleware de autenticação.
- Proteção de endpoints.
- Consulta do perfil autenticado.
- Tratamento de credenciais inválidas.

### Endpoint proposto

`POST /usuarios/login`

### Regras de segurança

- Não retornar senhas ou hashes.
- Não registrar credenciais em logs.
- Não expor a chave JWT.
- Armazenar configurações sensíveis em variáveis de ambiente.
- Retornar HTTP 401 para credenciais incorretas.
- Evitar revelar se determinado e-mail existe.
- Validar tokens antes de autorizar acesso.
- Garantir que um usuário não acesse dados de outro.

A implementação de recuperação de senha e outras funcionalidades complementares dependerá da prioridade do desafio.

---

# 7. MÓDULO PETS — REQUISITOS CONFIRMADOS

Este módulo deverá permitir o cadastro e gerenciamento dos animais.

## Campos definidos

Cada pet deverá possuir:

1. Identificador único.
2. Nome.
3. Foto.
4. Espécie.
5. Raça.
6. Sexo.
7. Data de nascimento.
8. Peso.
9. Observações gerais.
10. Tutor responsável.

## Regra de relacionamento

**Cada pet terá apenas um tutor.**

Um tutor poderá cadastrar vários pets.

Relacionamento:

`Tutor (1) → (N) Pets`

Não implementar múltiplos tutores para o mesmo pet nesta versão.

## Observações gerais

O campo de observações será utilizado para informações cotidianas e comportamentais.

Exemplos:

- Prefere dormir com a luz acesa.
- Tem medo de barulhos altos.
- Gosta de determinado brinquedo.
- Possui hábitos específicos.

Esse campo não substitui o histórico de saúde.

## Funcionalidades planejadas

- Cadastrar pet.
- Consultar pets.
- Visualizar detalhes.
- Atualizar informações.
- Excluir ou desativar cadastro, conforme regras a definir.
- Associar pet ao tutor.
- Exibir foto do animal.

A estratégia de armazenamento das fotos deverá ser definida antes da implementação.

---

# 8. MÓDULO SAÚDE — REQUISITOS CONFIRMADOS

O módulo de saúde terá quatro categorias:

1. Vacinas.
2. Medicamentos.
3. Alergias.
4. Histórico de peso.

**Consultas veterinárias não fazem parte do escopo aprovado neste momento.**

## Vacinas

Permitir registrar informações de vacinação, como:

- Nome da vacina.
- Data de aplicação.
- Próxima dose, quando aplicável.
- Observações.

## Medicamentos

Permitir registrar:

- Nome do medicamento.
- Dosagem.
- Frequência.
- Horários de administração.
- Data de início.
- Data de término, quando aplicável.
- Observações.

## Alergias

Permitir registrar:

- Nome da substância ou agente.
- Descrição da reação.
- Observações relevantes.

## Histórico de peso

Permitir registrar:

- Peso.
- Data da medição.
- Histórico de medições.

O histórico deverá permitir acompanhar a evolução do peso do animal.

## Separação de responsabilidades

As observações gerais do pet não devem ser utilizadas como substitutas das informações médicas.

O histórico de saúde deverá possuir estrutura própria.

O preenchimento de informações médicas foi considerado obrigatório durante o planejamento anterior; antes da implementação, confirmar exatamente quais campos mínimos serão obrigatórios e como representar a ausência de histórico conhecido.

---

# 9. MÓDULO AGENDA — REQUISITOS CONFIRMADOS

A agenda terá como funcionalidade principal os lembretes automáticos de medicamentos.

## Funcionamento aprovado

O tutor poderá cadastrar horários fixos para administração de medicamentos.

Exemplo:

Medicamento: Exemplo A

Horários:

- 08:00.
- 20:00.

Quando chegar o horário cadastrado, o sistema deverá emitir um aviso.

## Tipo de aviso

**Pop-up visual dentro da aplicação web acompanhado de som.**

Não implementar notificações push para celular nesta versão.

## Regra de funcionamento

Os lembretes funcionarão enquanto o sistema web estiver aberto e em execução.

Não é necessário garantir notificações quando o navegador ou a aplicação estiver fechado.

## Requisitos funcionais

- Registrar horários dos medicamentos.
- Associar lembretes a um pet.
- Associar cada lembrete ao medicamento correspondente.
- Exibir pop-up no horário configurado.
- Emitir alerta sonoro, respeitando as permissões do navegador.
- Permitir fechar o aviso.
- Evitar disparos duplicados indevidos.
- Considerar o fuso horário aplicável.
- Considerar data de início e término do tratamento.

A implementação deverá considerar as restrições de reprodução automática de áudio dos navegadores.

---

# 10. MÓDULO DE RESERVAS — REGRAS DE NEGÓCIO

O projeto também prevê gerenciamento de reservas de hospedagem de animais.

## Entidades principais do domínio

- Proprietário ou tutor.
- Pet.
- Reserva.

O cadastro de usuários para autenticação é uma responsabilidade distinta, embora seja necessário definir se o usuário autenticado também representa o tutor.

Evitar duplicação desnecessária de dados pessoais.

## Dados e regras previamente discutidos

As reservas deverão considerar:

- Pet associado.
- Tutor responsável.
- Entrada.
- Saída.
- Modalidade de cobrança.
- Tarifa aplicável.
- Valor total.
- Status.
- Informações relevantes da reserva.

## Cobrança

Foram discutidas duas modalidades:

**Por horas completas:** valor calculado a partir da duração contratada em horas.

**Por diária:** valor calculado conforme a modalidade de diária acordada.

As tarifas serão fixas para qualquer animal, independentemente de espécie, raça ou porte.

## Preservação do valor histórico

Ao criar uma reserva, o sistema deverá armazenar a tarifa aplicada naquele momento.

Se a tarifa mudar no futuro, reservas antigas não deverão ter seus valores alterados automaticamente.

## Regras de entrada e saída

A modalidade e o período contratado deverão ser acordados no momento da reserva.

Não presumir automaticamente que qualquer permanência atravessando a meia-noite representa uma diária.

Antes de implementar o cálculo, confirmar:

- Valor das tarifas.
- Critério exato de cobrança por diária.
- Regras de arredondamento.
- Tratamento de atrasos.
- Regras de cancelamento.
- Política de alteração de reservas.

Esses detalhes não devem ser inventados.

---

# 11. MODELO DE DADOS — PLANEJAMENTO

A entidade Usuario já existe.

As demais entidades devem ser definidas com base nos requisitos aprovados e no desafio oficial.

Possíveis entidades:

- Usuario.
- Pet.
- Reserva.
- Vacina.
- Medicamento.
- Alergia.
- HistoricoPeso.
- LembreteMedicamento.
- Tarifa, caso necessária.

Não criar todas automaticamente.

Primeiro, apresentar o modelo entidade-relacionamento proposto.

## Diretrizes

- Utilizar UUID quando adequado.
- Definir chaves primárias e estrangeiras.
- Aplicar integridade referencial.
- Utilizar migrations.
- Evitar redundância de dados.
- Garantir isolamento dos dados entre usuários.
- Armazenar valores monetários em tipos decimais apropriados.
- Tratar datas, horários e fusos corretamente.
- Definir regras de exclusão e atualização de relacionamentos.

---

# 12. PLANEJAMENTO DO FRONT-END

O Front-end será desenvolvido com Angular e TypeScript.

Tailwind CSS poderá ser utilizado para acelerar a estilização, desde que seja adequado à estrutura da aplicação.

## Telas previstas

### Autenticação

- Login.
- Cadastro de usuário.

### Dashboard

- Visão geral.
- Pets cadastrados.
- Reservas.
- Próximos lembretes.

### Pets

- Listagem.
- Cadastro.
- Edição.
- Detalhes.

### Saúde

- Vacinas.
- Medicamentos.
- Alergias.
- Histórico de peso.

### Agenda

- Horários dos medicamentos.
- Lembretes programados.
- Alertas visuais e sonoros.

### Reservas

- Listagem.
- Nova reserva.
- Detalhes.
- Cálculo automático do valor.
- Alteração de status.

### Configurações

- Perfil do usuário.
- Preferências.
- Configurações pertinentes ao sistema.

## Diretrizes visuais

- Interface moderna e profissional.
- Navegação intuitiva.
- Responsividade.
- Boa legibilidade.
- Componentes reutilizáveis.
- Feedback visual de operações.
- Tratamento de estados vazios e erros.
- Acessibilidade.
- Formulários claros.
- Identidade visual consistente.

Não gerar todo o Front-end de uma vez.

Primeiro apresentar a proposta de estrutura, rotas, componentes e serviços.

---

# 13. TESTES E QUALIDADE

Planejar testes para:

## Back-end

- Cadastro válido.
- Dados inválidos.
- E-mail duplicado.
- Login válido.
- Login inválido.
- JWT expirado.
- JWT inválido.
- Acesso não autorizado.
- Isolamento de dados entre tutores.
- Cadastro e edição de pets.
- Histórico de saúde.
- Regras de reserva.
- Cálculo de valores.
- Preservação das tarifas históricas.

## Front-end

- Validação de formulários.
- Navegação.
- Consumo da API.
- Exibição de mensagens de erro.
- Fluxos de autenticação.
- Responsividade.
- Lembretes visuais e sonoros.

Utilizar testes automatizados quando apropriado.

---

# 14. DOCUMENTAÇÃO E ENTREGA

Ao final, o projeto deverá possuir:

- README atualizado.
- Descrição da arquitetura.
- Tecnologias utilizadas.
- Instruções de instalação.
- Instruções de execução.
- Configuração de ambiente.
- Documentação de endpoints.
- Modelo de dados.
- Explicação das regras de negócio.
- Evidências de testes.
- Orientações para executar migrations.
- Informações de deploy, caso aplicável.

Não incluir dados sensíveis na documentação.

---

# 15. ORDEM RECOMENDADA DE DESENVOLVIMENTO

## Fase 1 — Concluída

- Estrutura inicial do Back-end.
- PostgreSQL e Docker.
- TypeORM.
- Entidade Usuario.
- Migration.
- Cadastro.
- Validações.
- Tratamento de erros.
- Testes manuais do cadastro.

## Fase 2 — Próxima

- Login.
- Autenticação JWT.
- Middleware.
- Proteção de rotas.
- Testes de autenticação.

## Fase 3

- Revisão do modelo de dados.
- Relacionamentos.
- Entidade Pet.
- CRUD de pets.
- Controle de acesso por tutor.

## Fase 4

- Histórico de saúde.
- Vacinas.
- Medicamentos.
- Alergias.
- Histórico de peso.

## Fase 5

- Reservas.
- Modalidades de cobrança.
- Cálculo automático.
- Persistência de tarifas.
- Regras de entrada e saída.
- Testes de cálculo.

## Fase 6

- Agenda de medicamentos.
- Lembretes automáticos.
- Pop-up.
- Alerta sonoro.
- Tratamento de horários.

## Fase 7

- Preparação do Angular.
- Estrutura de componentes.
- Rotas.
- Serviços HTTP.
- Formulários.
- Interface responsiva.

## Fase 8

- Integração Front-end e Back-end.
- Testes dos fluxos completos.
- Correção de erros.
- Revisão de segurança.

## Fase 9

- Documentação.
- Revisão dos requisitos oficiais.
- Preparação da entrega.
- Deploy, se necessário.

A ordem poderá ser ajustada conforme dependências técnicas e prioridades do desafio.

---

# 16. CONTROLE DE VERSÃO

Utilizar Git com mensagens claras e padronizadas.

Preferir Conventional Commits.

Exemplos:

`feat: implementa autenticacao JWT`

`feat: adiciona cadastro de pets`

`feat: implementa historico de saude`

`feat: adiciona calculo de reservas`

`feat: implementa lembretes de medicamentos`

`fix: corrige validacao de dados`

`test: adiciona testes de autenticacao`

Não executar `git commit` ou `git push` sem autorização.

Antes de propor um commit, verificar:

- `git status`.
- Arquivos alterados.
- Arquivos sensíveis.
- Resultado dos testes.
- Escopo da alteração.

---

# 17. INSTRUÇÕES PARA A PRIMEIRA EXECUÇÃO

Sua primeira tarefa será realizar um diagnóstico do projeto existente.

Não altere nenhum arquivo inicialmente.

## Verifique

1. Estrutura real do repositório.
2. Estado do Git.
3. Dependências instaladas.
4. Scripts disponíveis.
5. Configuração TypeScript.
6. Configuração Express.
7. Configuração TypeORM.
8. Entidade Usuario.
9. UsuarioRepository.
10. UsuarioService.
11. UsuarioController.
12. Rotas.
13. Migrations.
14. Configuração do Docker.
15. Estrutura do Front-end, se existir.
16. Existência de testes automatizados.
17. Compatibilidade das dependências para JWT.

Não exiba os valores do `.env`.

## Apresente um relatório contendo

- Arquitetura encontrada.
- Funcionalidades implementadas.
- Funcionalidades ainda não implementadas.
- Problemas técnicos identificados.
- Riscos e melhorias recomendadas.
- Conformidade com as decisões descritas neste documento.
- Plano para implementar o login e a autenticação JWT.

## Importante

Após apresentar o diagnóstico, aguarde minha autorização antes de modificar arquivos.

**Primeira instrução de execução:**

Inspecione o projeto PetzIn no diretório atual, valide o estado real do código e apresente um diagnóstico técnico. Em seguida, proponha um plano de implementação do login com JWT, preservando todas as funcionalidades já desenvolvidas. Não realize alterações ainda.
