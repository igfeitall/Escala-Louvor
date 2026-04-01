# Escala Louvor

Aplicacao full-stack em TypeScript para cadastrar membros do ministerio de louvor, importar indisponibilidades por planilha e gerar escalas mensais.

## Stack

- Frontend: React 18 + Vite + TailwindCSS
- Backend: Express + Mongoose + TypeScript
- Banco: MongoDB 7
- Infra: Docker Compose apenas para o MongoDB

## Scripts principais

- `yarn dev`: roda frontend e backend juntos com atualizacao automatica de codigo
- `yarn frontend`: sobe so o frontend em `http://localhost:5173`
- `yarn backend`: sobe so o backend em `http://localhost:3001`
- `yarn docker:up`: sobe so o MongoDB no Docker
- `yarn docker:db:reset`: apaga o volume do MongoDB e recria do zero
- `yarn docker:down`: encerra o MongoDB no Docker

## Como rodar

### 1. Instalar dependencias

```bash
yarn install
```

### 2. Subir o MongoDB no Docker

```bash
yarn docker:up
```

Isso sobe o MongoDB em `mongodb://127.0.0.1:27017/escala-louvor`.

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

Na maior parte das mudancas, basta deixar o MongoDB rodando e reiniciar o app local. Como o MongoDB e flexivel, muitos ajustes nao exigem migracao.

Se quiser limpar tudo e recriar o banco:

```bash
yarn docker:db:reset
```

Esse comando apaga todos os dados do MongoDB.

## Importacao

Formato esperado:

```csv
Nome,Funcoes,Indisponivel
Joao Silva,"Teclado, Apoio","05/04 (Domingo - manha), 12/04 (Domingo - noite)"
Maria Santos,"Ministro, Violao","12/04 (Domingo - manha)"
```
