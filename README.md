# Escala Louvor

Aplicacao full-stack em TypeScript para cadastrar membros do ministerio de louvor, importar indisponibilidades por planilha e gerar escalas mensais.

## Stack

- Frontend: React 18 + Vite + TailwindCSS
- Backend: Express + PostgreSQL + TypeScript
- Banco: PostgreSQL 16
- Infra: Docker Compose para o PostgreSQL

## Scripts principais

- `yarn dev`: roda frontend e backend juntos com atualizacao automatica de codigo
- `yarn frontend`: sobe so o frontend em `http://localhost:5173`
- `yarn backend`: sobe so o backend em `http://localhost:3001`
- `yarn docker:up`: sobe o PostgreSQL no Docker
- `yarn docker:db:reset`: apaga o volume do PostgreSQL e recria do zero
- `yarn docker:down`: encerra o PostgreSQL no Docker
- `yarn db:psql`: abre o psql no banco PostgreSQL local

## Como rodar

### 1. Instalar dependencias

```bash
yarn install
```

### 2. Subir o PostgreSQL no Docker

```bash
yarn docker:up
```

Isso sobe o PostgreSQL em:

```text
postgresql://escala_louvor:escala_louvor@127.0.0.1:5433/escala_louvor
```

O schema inicial do PostgreSQL fica em `database/init/001_schema.sql` e roda automaticamente quando o volume `postgres-data` e criado pela primeira vez.

### 3. Rodar frontend e backend juntos

```bash
yarn dev
```

Esse e o comando ideal para desenvolvimento. Ele faz:

- frontend com Vite e hot reload em `http://localhost:5173`
- backend com `tsx watch` em `http://localhost:3001`

Ou seja, quando voce altera codigo do front ou do back, os dois atualizam automaticamente.

## Rodar separado

Se preferir abrir cada parte em um terminal:

```bash
yarn frontend
```

```bash
yarn backend
```

## Como atualizar o backend

Como o backend agora roda localmente em modo watch, normalmente voce nao precisa reiniciar manualmente. Basta salvar o arquivo e o `tsx watch` recarrega.

Se quiser reiniciar manualmente, pare o `yarn dev` e rode de novo:

```bash
yarn dev
```

## Como atualizar o banco

Na maior parte das mudancas do app atual, basta deixar o PostgreSQL rodando e reiniciar o app local.

Se quiser limpar tudo e recriar o banco:

```bash
yarn docker:db:reset
```

Esse comando apaga todos os dados do PostgreSQL. O arquivo `database/init/001_schema.sql` sera executado novamente na recriacao do volume.

Para acessar o PostgreSQL:

```bash
yarn db:psql
```

O schema tambem cria um trigger em `saved_schedules` que chama a limpeza de escalas antigas quando escalas forem inseridas ou atualizadas. Se quiser rodar a limpeza manualmente:

```sql
select purge_expired_saved_schedules();
```

## Importacao

Formato esperado:

```csv
Nome,Funcoes,Indisponivel
Joao Silva,"Teclado, Apoio","05/04 (Domingo - manha), 12/04 (Domingo - noite)"
Maria Santos,"Ministro, Violao","12/04 (Domingo - manha)"
```
