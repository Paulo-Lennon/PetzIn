# PetzIn — Sistema de Gestão de Hospedagem de Pets

Sistema web desenvolvido como parte do desafio técnico para Desenvolvedor Full Stack Júnior do Instituto Conecthus.

## Objetivo

Desenvolver uma aplicação para gerenciamento de proprietários, animais de estimação e reservas de hospedagem, substituindo o controle manual por planilhas.

## Tecnologias previstas

- Front-end: Angular
- Back-end: Node.js, TypeScript e Express
- Banco de dados: PostgreSQL
- ORM: TypeORM
- Conteinerização: Docker e Docker Compose
- Versionamento: Git e GitHub

## Estrutura do projeto

- `backend/` — API REST e regras de negócio
- `frontend/` — Interface web
- `README.md` — Documentação do projeto

## Funcionalidades implementadas

- Autenticação administrativa com JWT
- Cadastro e gerenciamento de tutores
- Cadastro e gerenciamento de pets
- Gerenciamento individual de reservas por pet
- Cálculo de hospedagem por diária ou hora, incluindo horas excedentes
- Controle de pagamentos pendentes, parciais e integrais
- Resumo financeiro por período
- Estrutura inicial do frontend Angular com login, rotas protegidas e painel administrativo
- Validação de dados e tratamento de erros

## Documentação da API

A referência completa dos endpoints, exemplos, filtros, respostas e regras de negócio está disponível em [docs/API.md](docs/API.md).

## Funcionalidades planejadas

- Formulários completos de tutores e pets no frontend
- Edição, detalhes e ações operacionais nas telas administrativas
- Refinamento visual e inclusão dos ativos definitivos do protótipo
- Registro de histórico de saúde individual
- Agenda e lembretes de medicamentos

## Status

Projeto em desenvolvimento.

O backend principal está em desenvolvimento ativo. As instruções completas de instalação e execução serão consolidadas antes da entrega.
