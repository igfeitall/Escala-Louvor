# Escala Louvor

Aplicação full-stack em TypeScript para cadastrar membros do ministério de louvor, importar indisponibilidades por planilha e gerar escalas mensais.

## Stack

- Frontend: React 18 + Vite + TailwindCSS
- Backend: Express + Mongoose + TypeScript
- Banco: MongoDB 7
- Infra: Docker Compose

## Decisões do v1

- Catálogo fixo de funções: `MINISTRO`, `APOIO`, `VIOLAO`, `GUITARRA`, `TECLADO`, `BAIXO`, `BATERIA`
- Cultos fixos por mês: domingo de manhã, domingo à noite e quarta-feira
- Indisponibilidade é temporária por sessão e não fica salva no banco
- Escalas são geradas sob demanda e não são persistidas
- Nomes importados que não existirem no banco aparecem como aviso e ficam fora do agendamento

## Scripts

- `yarn dev`: frontend e backend em modo de desenvolvimento
- `yarn build`: build dos dois pacotes
- `yarn lint`: ESLint no monorepo
- `yarn typecheck`: checagem de tipos
- `yarn test`: testes de frontend e backend
- `yarn docker:up`: sobe frontend, backend e MongoDB
- `yarn docker:down`: encerra os containers

## Desenvolvimento local

1. Instale dependências com `yarn install`
2. Suba o MongoDB com Docker ou configure `MONGODB_URI`
3. Rode `yarn dev`

O frontend abre em `http://localhost:5173` e o backend em `http://localhost:3001`.

## Importação

Formato esperado:

```csv
Nome,Funcoes,Indisponivel
João Silva,"Teclado, Apoio","05/04, 12/04"
Maria Santos,"Ministro, Violão","12/04"
```

## Docker

`docker compose up -d --build` sobe:

- frontend em `http://localhost:3000`
- backend em `http://localhost:3001`
- MongoDB em rede interna com volume nomeado
