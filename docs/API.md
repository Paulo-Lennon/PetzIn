# API REST — PetzIn

Esta documentação descreve os endpoints atualmente implementados no backend do PetzIn.

## Visão geral

- URL local: `http://localhost:3000`
- Formato das requisições e respostas: JSON
- Autenticação: JWT no esquema Bearer
- Usuário do sistema: conta administrativa única da proprietária do hotel
- Tutores: clientes responsáveis pelos pets, sem acesso ao sistema

Exceto pelo health check, cadastro inicial e login, todos os endpoints exigem autenticação.

## Autenticação

Envie o token no cabeçalho:

```http
Authorization: Bearer <token>
```

O tempo padrão de validade do token é de duas horas. Ele pode ser configurado por meio de `JWT_EXPIRES_IN`.

Quando o token estiver ausente, expirado ou inválido, a API responderá:

```http
HTTP/1.1 401 Unauthorized
```

```json
{
  "mensagem": "Token inválido ou expirado"
}
```

## Convenções

### Datas e horários

Datas sem horário utilizam `AAAA-MM-DD`.

Datas e horários de reservas devem seguir ISO 8601 e incluir o fuso horário:

```text
2030-01-10T08:00:00-04:00
```

O PostgreSQL armazena os horários com fuso e as respostas JSON normalmente os representam em UTC.

### Erros

Os erros seguem o formato:

```json
{
  "mensagem": "Descrição do erro"
}
```

Principais códigos:

| Código | Significado                                    |
| ------ | ---------------------------------------------- |
| `200`  | Operação concluída                             |
| `201`  | Recurso criado                                 |
| `204`  | Operação concluída sem corpo de resposta       |
| `400`  | Dados ou identificador inválidos               |
| `401`  | Autenticação ausente, inválida ou expirada     |
| `403`  | Operação não permitida                         |
| `404`  | Recurso inexistente ou inativo                 |
| `409`  | Conflito com o estado ou integridade dos dados |
| `500`  | Erro interno inesperado                        |

Um corpo JSON malformado retorna `400` com a mensagem `JSON inválido`.

## Health check

### `GET /health`

Endpoint público para verificar se a aplicação está respondendo.

Resposta `200`:

```json
{
  "status": "ok",
  "message": "API PetzIn funcionando!"
}
```

## Usuário administrativo

### `POST /usuarios`

Cria a conta administrativa inicial. Como o sistema possui somente uma administradora, o endpoint deixa de aceitar novos cadastros depois que a primeira conta é criada.

Requisição:

```json
{
  "nome": "Proprietária PetzIn",
  "email": "admin@petzin.com",
  "senha": "PetzIn@123"
}
```

Regras da senha:

- Entre 7 e 12 caracteres.
- Pelo menos uma letra.
- Pelo menos um número.
- Pelo menos um caractere especial.

Resposta `201`:

```json
{
  "id": "6e035c73-ec86-44b4-ac0f-960851a23503",
  "nome": "Proprietária PetzIn",
  "email": "admin@petzin.com",
  "criadoEm": "2026-10-16T12:00:00.000Z"
}
```

Possíveis respostas: `400`, `403`, `409` e `500`.

### `POST /usuarios/login`

Autentica a administradora.

Requisição:

```json
{
  "email": "admin@petzin.com",
  "senha": "PetzIn@123"
}
```

Resposta `200`:

```json
{
  "token": "<jwt>",
  "usuario": {
    "id": "6e035c73-ec86-44b4-ac0f-960851a23503",
    "nome": "Proprietária PetzIn",
    "email": "admin@petzin.com",
    "criadoEm": "2026-10-16T12:00:00.000Z"
  }
}
```

Credenciais incorretas ou uma conta inativa retornam `401` sem revelar se o e-mail existe.

### `GET /usuarios/me`

Retorna o perfil público da administradora autenticada.

Resposta `200`:

```json
{
  "id": "6e035c73-ec86-44b4-ac0f-960851a23503",
  "nome": "Proprietária PetzIn",
  "email": "admin@petzin.com",
  "criadoEm": "2026-10-16T12:00:00.000Z"
}
```

### `PATCH /usuarios/me/senha`

Altera a senha da conta administrativa autenticada. Exige o token Bearer e a confirmação da senha atual.

```json
{
  "senhaAtual": "SenhaAtual@1",
  "novaSenha": "NovaSenha@2"
}
```

A nova senha deve seguir as mesmas regras do cadastro e ser diferente da senha atual. Retorna `204` em caso de sucesso, `400` para dados inválidos e `401` quando a senha atual estiver incorreta.

## Tutores

Tutores são clientes responsáveis pelos animais e não possuem credenciais de acesso.

### `POST /tutores`

Requisição:

```json
{
  "nome": "Carlos Almeida",
  "telefone": "(92) 99999-9999",
  "email": "carlos@example.com",
  "observacoes": "Prefere contato pelo WhatsApp."
}
```

Campos:

| Campo         | Obrigatório | Regra                                |
| ------------- | ----------- | ------------------------------------ |
| `nome`        | Sim         | Texto com até 150 caracteres         |
| `telefone`    | Sim         | De 10 a 15 dígitos após normalização |
| `email`       | Não         | E-mail válido com até 255 caracteres |
| `observacoes` | Não         | Texto com até 2.000 caracteres       |

Resposta `201`: objeto do tutor cadastrado.

### `GET /tutores`

Lista somente tutores ativos, ordenados por nome.

Resposta `200`: array de tutores.

### `GET /tutores/:id`

Retorna o tutor e seus pets ativos.

Resposta `200`:

```json
{
  "id": "e5b82c87-1d0d-4af4-92f6-f86d0dac12bb",
  "nome": "Carlos Almeida",
  "telefone": "92999999999",
  "email": "carlos@example.com",
  "observacoes": null,
  "ativo": true,
  "criadoEm": "2026-10-16T12:00:00.000Z",
  "atualizadoEm": "2026-10-16T12:00:00.000Z",
  "pets": []
}
```

### `PUT /tutores/:id`

Atualiza somente os campos enviados. Campos aceitos: `nome`, `telefone`, `email` e `observacoes`.

Exemplo:

```json
{
  "telefone": "(92) 98888-7777",
  "email": null
}
```

É necessário enviar ao menos um campo permitido.

### `DELETE /tutores/:id`

Desativa o tutor sem apagar seu histórico. Um tutor com pets ativos não pode ser desativado.

Resposta de sucesso: `204` sem corpo.

## Pets

Cada pet pertence obrigatoriamente a um tutor.

### `POST /pets`

Requisição:

```json
{
  "tutorId": "e5b82c87-1d0d-4af4-92f6-f86d0dac12bb",
  "nome": "Luna",
  "especie": "Gato",
  "raca": "Siamês",
  "sexo": "FEMEA",
  "dataNascimento": "2022-08-15",
  "pesoAtual": 4.35,
  "fotoUrl": "https://example.com/luna.jpg",
  "observacoes": "Gosta de lugares altos."
}
```

Campos:

| Campo            | Obrigatório | Regra                                                      |
| ---------------- | ----------- | ---------------------------------------------------------- |
| `tutorId`        | Sim         | UUID de um tutor ativo                                     |
| `nome`           | Sim         | Texto com até 150 caracteres                               |
| `especie`        | Sim         | Texto com até 50 caracteres                                |
| `raca`           | Não         | Texto com até 100 caracteres                               |
| `sexo`           | Não         | `MACHO`, `FEMEA` ou `NAO_INFORMADO`                        |
| `dataNascimento` | Não         | `AAAA-MM-DD`, válida e não futura                          |
| `pesoAtual`      | Não         | Maior que zero, menor que 10.000 e até duas casas decimais |
| `fotoUrl`        | Não         | Texto com até 500 caracteres                               |
| `observacoes`    | Não         | Texto com até 2.000 caracteres                             |

Resposta `201`: objeto do pet cadastrado.

### `GET /pets`

Lista todos os pets ativos de tutores ativos.

Filtro opcional:

```http
GET /pets?tutorId=e5b82c87-1d0d-4af4-92f6-f86d0dac12bb
```

A resposta inclui o objeto `tutor` relacionado.

### `GET /pets/:id`

Retorna o pet ativo e seu tutor ativo.

### `PUT /pets/:id`

Atualiza somente os campos enviados. Aceita todos os campos do cadastro, incluindo `tutorId` para transferência a outro tutor ativo.

É necessário enviar ao menos um campo permitido.

### `DELETE /pets/:id`

Desativa o pet sem apagar o histórico. Não é possível desativar um pet com reserva `AGENDADA` ou `EM_ANDAMENTO`.

Resposta de sucesso: `204` sem corpo.

## Reservas

Cada reserva pertence a exatamente um pet. O tutor é obtido por meio do relacionamento do pet.

### Regras de cobrança

- Tarifa por hora: R$ 10,00.
- Tarifa por diária de 24 horas: R$ 240,00.
- Na modalidade por hora, qualquer fração é arredondada para a hora seguinte.
- Na modalidade diária, existe cobrança mínima de uma diária.
- Depois das diárias completas, o período excedente é cobrado por hora, com a mesma regra de arredondamento.
- As tarifas aplicadas são gravadas na reserva para preservar seu valor histórico.
- `25h30` na modalidade diária resulta em `R$ 260,00`.
- `49h01` na modalidade diária resulta em `R$ 500,00`.

### Valores enumerados

Modalidades:

- `HORA`
- `DIARIA`

Status da reserva:

- `AGENDADA`
- `EM_ANDAMENTO`
- `CONCLUIDA`
- `CANCELADA`

Status do pagamento:

- `PENDENTE`
- `PARCIAL`
- `PAGO`

### `POST /reservas`

O cliente não define tarifas, valor total, valor pago nem status. Esses campos são controlados pelo servidor.

Requisição:

```json
{
  "petId": "e43f25ea-f3fc-4651-897b-a323bc5434b3",
  "dataEntrada": "2030-01-01T08:00:00-04:00",
  "dataSaida": "2030-01-03T09:01:00-04:00",
  "numeroCanil": 5,
  "modalidade": "DIARIA",
  "observacoes": "Levar a caminha do pet."
}
```

Resposta `201`:

```json
{
  "id": "8af6bbad-0bbe-40ee-a12f-5588ac6f5716",
  "petId": "e43f25ea-f3fc-4651-897b-a323bc5434b3",
  "dataEntrada": "2030-01-01T12:00:00.000Z",
  "dataSaida": "2030-01-03T13:01:00.000Z",
  "numeroCanil": 5,
  "modalidade": "DIARIA",
  "tarifaHora": 10,
  "tarifaDiaria": 240,
  "valorTotal": 500,
  "valorPago": 0,
  "statusPagamento": "PENDENTE",
  "pagoEm": null,
  "status": "AGENDADA",
  "observacoes": "Levar a caminha do pet.",
  "criadoEm": "2026-10-16T12:00:00.000Z",
  "atualizadoEm": "2026-10-16T12:00:00.000Z"
}
```

Conflitos que retornam `409`:

- O canil já possui uma reserva não cancelada no período.
- O pet já possui uma reserva não cancelada no período.

Reservas encostadas, nas quais uma começa exatamente quando a outra termina, são permitidas.

A entrada deve ocorrer no minuto atual ou no futuro. Datas de entrada passadas retornam `400` com a mensagem `Data passada. Escolha uma data atual ou futura.`

### `GET /reservas`

Lista as reservas, incluindo pet e tutor, ordenadas pela entrada mais recente.

Filtros opcionais:

```http
GET /reservas?petId=e43f25ea-f3fc-4651-897b-a323bc5434b3
GET /reservas?status=AGENDADA
GET /reservas?petId=e43f25ea-f3fc-4651-897b-a323bc5434b3&status=AGENDADA
```

### `GET /reservas/:id`

Retorna os detalhes da reserva, incluindo pet e tutor.

### `PUT /reservas/:id`

Atualiza somente os campos enviados. Campos permitidos:

- `petId`
- `dataEntrada`
- `dataSaida`
- `numeroCanil`
- `modalidade`
- `observacoes`

Somente reservas `AGENDADA` podem ser alteradas. O valor é recalculado usando as tarifas históricas armazenadas. O novo total não pode ficar abaixo do valor já pago.

### `PATCH /reservas/:id/status`

Altera o estado operacional da reserva.

Requisição:

```json
{
  "status": "EM_ANDAMENTO"
}
```

Transições permitidas:

```text
AGENDADA      -> EM_ANDAMENTO ou CANCELADA
EM_ANDAMENTO -> CONCLUIDA ou CANCELADA
CONCLUIDA    -> nenhuma
CANCELADA    -> nenhuma
```

Uma reserva com valor pago não pode ser cancelada.

### `PATCH /reservas/:id/pagamento`

Registra o valor total acumulado já pago. O endpoint é idempotente: enviar o mesmo valor não adiciona uma nova cobrança.

Pagamento parcial:

```json
{
  "valorPago": 100
}
```

Pagamento integral de uma reserva de R$ 500,00:

```json
{
  "valorPago": 500
}
```

Zerar o valor antes de um cancelamento ou para corrigir o registro:

```json
{
  "valorPago": 0
}
```

O valor deve ser não negativo, ter no máximo duas casas decimais e não ultrapassar `valorTotal`.

### `DELETE /reservas/:id`

Cancela a reserva sem apagar seu histórico. Reservas concluídas, já canceladas ou com valor pago não podem ser canceladas por esse endpoint.

Resposta de sucesso: `204` sem corpo.

## Financeiro

### `GET /financeiro/resumo`

Retorna os totais das reservas cuja data de entrada esteja no período informado. Reservas canceladas aparecem apenas em `quantidadeCanceladas` e não compõem os valores financeiros.

Os filtros são opcionais e inclusivos:

```http
GET /financeiro/resumo?dataInicio=2030-01-01T00:00:00-04:00&dataFim=2030-02-01T23:59:59-04:00
```

Resposta `200`:

```json
{
  "periodo": {
    "dataInicio": "2030-01-01T04:00:00.000Z",
    "dataFim": "2030-02-02T03:59:59.000Z"
  },
  "totalPrevisto": 730,
  "totalRecebido": 330,
  "totalPendente": 400,
  "quantidadeReservas": 3,
  "quantidadeCanceladas": 1,
  "pagamentos": {
    "pendentes": 1,
    "parciais": 1,
    "pagos": 1
  }
}
```

Sem filtros, o resumo considera todas as reservas existentes.

## Fluxo básico de uso

1. Criar a conta administrativa inicial em `POST /usuarios`.
2. Autenticar em `POST /usuarios/login`.
3. Enviar o token Bearer nas operações seguintes.
4. Cadastrar um tutor.
5. Cadastrar um pet associado ao tutor.
6. Criar uma reserva individual para o pet.
7. Atualizar o status durante a hospedagem.
8. Registrar o total já pago.
9. Consultar o resumo financeiro.
