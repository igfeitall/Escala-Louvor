# Escala Louvor

Aplicacao full-stack em TypeScript para cadastrar membros do ministerio de louvor, importar indisponibilidades por planilha e gerar escalas mensais.

## Stack

- Frontend: React 18 + Vite + TailwindCSS
- Backend: Express + Mongoose + TypeScript
- Banco: MongoDB 7
- Infra: Docker Compose

## Decisoes do v1

- Catalogo fixo de funcoes: `MINISTRO`, `APOIO`, `VIOLAO`, `GUITARRA`, `TECLADO`, `BAIXO`, `BATERIA`
- Cultos fixos por mes: domingo de manha, domingo a noite e quarta-feira
- Indisponibilidade fica salva por mes e por culto no banco
- Escalas sao geradas sob demanda e nao sao persistidas
- Nomes importados que nao existirem no banco aparecem como aviso e ficam fora do agendamento

## Scripts

- `yarn dev`: frontend e backend em modo de desenvolvimento
- `yarn build`: build dos dois pacotes
- `yarn lint`: ESLint no monorepo
- `yarn typecheck`: checagem de tipos
- `yarn test`: testes de frontend e backend
- `yarn docker:up`: sobe frontend, backend e MongoDB
- `yarn docker:down`: encerra os containers

## Desenvolvimento local

1. Instale dependencias com `yarn install`
2. Suba o MongoDB com Docker ou configure `MONGODB_URI`
3. Rode `yarn dev`

O frontend abre em `http://localhost:5173` e o backend em `http://localhost:3001`.

## Importacao

Formato esperado:

```csv
Nome,Funcoes,Indisponivel
Joao Silva,"Teclado, Apoio","05/04 (Domingo - manha), 12/04 (Domingo - noite)"
Maria Santos,"Ministro, Violao","12/04 (Domingo - manha)"
```

## Docker

`docker compose up -d --build` sobe:

- frontend em `http://localhost:3000`
- backend em `http://localhost:3001`
- MongoDB em rede interna com volume nomeado
