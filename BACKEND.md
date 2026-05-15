# Backend — Documentação Técnica

## Visão Geral

O backend é uma API REST construída em **Node.js + TypeScript + Express**, que serve como cérebro do sistema de escala de ministério. Ele gerencia membros, indisponibilidades, geração automática de escalas e persistência no banco de dados PostgreSQL.

---

## Stack

| Tecnologia | Versão | Papel |
|---|---|---|
| Node.js | 20 | Runtime |
| TypeScript | — | Tipagem estática |
| Express 5 | — | Framework HTTP |
| PostgreSQL | 16 | Banco de dados relacional |
| pg (node-postgres) | 8 | Driver de conexão com o banco |
| bcryptjs | 2.4 | Hash de senhas |
| jsonwebtoken | 9 | Geração e verificação de JWT |
| multer | 2 | Upload de arquivos (planilhas) |
| xlsx | 0.18 | Leitura de planilhas Excel |
| tsx | — | Execução de TypeScript em dev |
| vitest | — | Testes unitários |

---

## Docker e Infraestrutura

### O papel do Docker

O Docker é usado **exclusivamente para o PostgreSQL** em desenvolvimento. O backend roda diretamente na máquina via `yarn dev`.

```
┌─────────────────────────────────────────┐
│              Sua máquina                │
│                                         │
│  ┌──────────────┐    ┌───────────────┐  │
│  │   Backend    │───▶│  Docker       │  │
│  │  (Node.js)   │    │  (PostgreSQL) │  │
│  │  porta 3001  │    │  porta 5433   │  │
│  └──────────────┘    └───────────────┘  │
│                                         │
│  ┌──────────────┐                       │
│  │   Frontend   │───▶ porta 5173        │
│  │   (Vite)     │                       │
│  └──────────────┘                       │
└─────────────────────────────────────────┘
```

### docker-compose.yml

```yaml
services:
  postgres:
    image: postgres:16-alpine
    ports:
      - '5433:5432'      # porta local 5433 → porta interna 5432
    volumes:
      - postgres-data:/var/lib/postgresql/data   # dados persistidos
      - ./database/init:/docker-entrypoint-initdb.d:ro  # schema executado na criação
```

**Pontos importantes:**
- A porta é **5433** (não 5432) para evitar conflito com PostgreSQL local instalado na máquina
- O volume `postgres-data` persiste os dados entre reinicializações do container
- A pasta `database/init/` é montada como `docker-entrypoint-initdb.d` — o PostgreSQL executa automaticamente todos os `.sql` dessa pasta na **primeira vez** que o container é criado
- O schema (`001_schema.sql`) só roda uma vez na criação. Para recriar, é necessário destruir o volume: `docker compose down -v`

### Dockerfile do backend (produção)

O Dockerfile usa **multi-stage build**:

1. **Stage `build`**: instala todas as dependências e compila TypeScript → `dist/`
2. **Stage `runtime`**: copia apenas o `dist/` e instala só dependências de produção

Isso resulta em uma imagem final menor, sem TypeScript, tsx ou devDependencies.

---

## Banco de Dados — Tabelas e Relações

### Diagrama de Relações

```
users
  │
  ├──▶ service_types (user_id)
  │
  └──▶ ministries (user_id)
         │
         ├──▶ members (ministry_id)
         │       │
         │       ├──▶ member_monthly_unavailabilities (member_id)
         │       │
         │       └──▶ saved_schedule_assignments (member_id)
         │
         └──▶ saved_schedules (ministry_id)
                 │
                 └──▶ saved_schedule_services (saved_schedule_id)
                         │
                         ├──▶ service_types (service_type_id)
                         │
                         └──▶ saved_schedule_assignments (saved_schedule_service_id)
```

Todas as relações usam `ON DELETE CASCADE` — deletar um usuário remove tudo em cascata.

---

### Tabela: `users`

Representa a conta de uma igreja no sistema.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador único |
| `email` | text UNIQUE | Email de login |
| `password_hash` | text | Senha hasheada com bcrypt |
| `church_name` | text | Nome da igreja |
| `church_phone` | text NULL | Telefone opcional |
| `settings` | jsonb | Configurações futuras (padrão `{}`) |
| `created_at` | timestamptz | Data de criação |
| `updated_at` | timestamptz | Atualizado automaticamente por trigger |

**Seed:** `admin@igreja.com` / `admin123` com ID fixo `11111111-1111-1111-1111-111111111111`

---

### Tabela: `service_types`

Define os tipos de culto de uma igreja (domingo manhã, domingo noite, quarta etc.).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador único |
| `user_id` | uuid FK → users | Dono do tipo de culto |
| `name` | text | Nome exibido ("Culto Domingo Manhã") |
| `weekday` | smallint | Dia da semana: 0=domingo, 3=quarta, 6=sábado |
| `sort_order` | integer | Ordem de exibição |

**Constraint:** `UNIQUE (user_id, name)` — não pode ter dois cultos com o mesmo nome para o mesmo usuário.

**Seed:**
| Nome | Weekday | Sort |
|---|---|---|
| Culto Domingo Manhã | 0 | 1 |
| Culto Domingo Noite | 0 | 2 |
| Culto Quarta | 3 | 3 |

---

### Tabela: `ministries`

Representa um ministério dentro de uma igreja (ex: Louvor, Infantil).

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador único |
| `user_id` | uuid FK → users | Dono do ministério |
| `name` | text | Nome do ministério |
| `roles` | jsonb | Array de funções disponíveis |
| `rules` | jsonb | Regras de escala (uso futuro) |

**Exemplo de `roles`:**
```json
["Vocal", "Guitarra", "Baixo", "Bateria", "Teclado", "Violão"]
```

**Seed:** Ministério "Louvor" com ID fixo `33333333-3333-3333-3333-333333333333`

---

### Tabela: `members`

Representa um músico/membro do ministério.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador único |
| `ministry_id` | uuid FK → ministries | Ministério ao qual pertence |
| `name` | text | Nome original (com acentos) |
| `normalized_name` | text | Nome normalizado para busca (sem acentos, lowercase) |
| `email` | text | Email do membro |
| `phone` | text NULL | Telefone opcional |
| `notes` | text NULL | Observações opcionais |
| `roles` | jsonb | Array de funções que o membro exerce |
| `rules` | jsonb | Regras individuais (uso futuro) |

**Constraint:** `UNIQUE (ministry_id, normalized_name)` — não pode ter dois membros com o mesmo nome normalizado no mesmo ministério.

**Exemplo de `roles` com múltiplas funções:**
```json
["Violão", "Guitarra", "Teclado", "Baixo"]
```

**Funções válidas (enum interno):**
`MINISTRO` | `APOIO` | `VIOLAO` | `GUITARRA` | `TECLADO` | `BAIXO` | `BATERIA`

**Seed:** 16 membros reais do ministério.

---

### Tabela: `member_monthly_unavailabilities`

Registra os dias em que um membro **não pode** participar de um culto em determinado mês.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador único |
| `member_id` | uuid FK → members | Membro indisponível |
| `schedule_month` | date | Primeiro dia do mês (ex: `2025-04-01`) |
| `service_date` | date | Data exata do culto (ex: `2025-04-06`) |
| `service_type_id` | uuid FK → service_types | Qual culto naquele dia |

**Constraint:** `UNIQUE (member_id, service_date, service_type_id)` — evita duplicatas.

**Constraint:** `schedule_month` deve ser sempre o primeiro dia do mês (`date_trunc('month', ...)`).

**Seed:** 51 indisponibilidades de abril/2025 baseadas em dados reais.

---

### Tabela: `saved_schedules`

Cabeçalho de uma escala salva para um ministério em um mês.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador único |
| `ministry_id` | uuid FK → ministries | Ministério da escala |
| `schedule_month` | date | Mês da escala (ex: `2025-04-01`) |
| `generated_at` | timestamptz | Quando foi gerada/atualizada |

**Constraint:** `UNIQUE (ministry_id, schedule_month)` — um ministério tem no máximo uma escala por mês.

**Purge automático:** Um trigger apaga escalas com mais de 3 meses de idade a cada novo insert.

---

### Tabela: `saved_schedule_services`

Cada culto individual dentro de uma escala salva.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador único |
| `saved_schedule_id` | uuid FK → saved_schedules | Escala pai |
| `service_date` | date | Data do culto |
| `service_type_id` | uuid FK → service_types | Tipo do culto |
| `notes` | text NULL | Observações (ex: "Formação incompleta") |

---

### Tabela: `saved_schedule_assignments`

Cada atribuição de membro a uma função em um culto salvo.

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | uuid PK | Identificador único |
| `saved_schedule_service_id` | uuid FK → saved_schedule_services | Culto pai |
| `role_name` | text | Função (ex: `MINISTRO`, `BATERIA`) |
| `member_id` | uuid FK → members | Membro escalado |
| `slot_index` | integer | Posição (padrão 1, para suporte futuro a múltiplos por função) |

---

### Triggers e Funções SQL

**`set_updated_at()`** — trigger em `users`, `service_types`, `ministries` e `members`. Atualiza automaticamente `updated_at` a cada `UPDATE`.

**`purge_expired_saved_schedules()`** — função que deleta escalas com mais de 3 meses. Chamada automaticamente por trigger antes de cada `INSERT` ou `UPDATE` em `saved_schedules`.

---

## Como o PostgreSQL se Conecta ao Backend

### Pool de Conexões

O backend usa um **pool de conexões** (`pg.Pool`) em vez de uma conexão única. Isso significa que múltiplas requisições simultâneas podem usar conexões diferentes do pool sem esperar uma pela outra.

```typescript
// src/config/database.ts
export const pool = new Pool({
  connectionString: env.databaseUrl,
  // padrão: até 10 conexões simultâneas
});
```

**String de conexão padrão (desenvolvimento):**
```
postgresql://escala_louvor:escala_louvor@127.0.0.1:5433/escala_louvor
```

### Funções utilitárias do banco

```typescript
// Query simples — usa uma conexão do pool e devolve
query(sql, params)

// Transação — pega uma conexão, executa BEGIN/COMMIT/ROLLBACK
withTransaction(async (client) => { ... })
```

### Transações

Operações que envolvem múltiplas tabelas usam `withTransaction` para garantir atomicidade. Se qualquer passo falhar, tudo é revertido:

- `replaceAvailability` — deleta indisponibilidades antigas e insere novas
- `saveSchedule` — upsert da escala + delete dos serviços antigos + insert dos novos + assignments
- `seed` — todas as seeds rodam em uma única transação

---

## Autenticação (JWT)

### Fluxo

```
Frontend                    Backend                    Banco
   │                           │                          │
   │  POST /api/auth/login      │                          │
   │  { email, password }  ───▶│                          │
   │                           │  SELECT * FROM users ───▶│
   │                           │  WHERE email = $1        │
   │                           │◀─────────────────────────│
   │                           │  bcrypt.compare()        │
   │◀──────────────────────────│                          │
   │  { token, user }          │                          │
   │                           │                          │
   │  GET /api/members         │                          │
   │  Authorization: Bearer ──▶│                          │
   │                           │  verifyToken(jwt)        │
   │                           │  → userId                │
   │                           │  resolveWorkspace()  ───▶│
   │                           │  → ministryId            │
   │◀──────────────────────────│                          │
   │  [ membros ]              │                          │
```

### Token JWT

- Algoritmo: **HS256**
- Payload: `{ userId, email, iat, exp }`
- Expiração: **7 dias** (configurável via `JWT_EXPIRES_IN`)
- Secret: variável `JWT_SECRET` (padrão de dev definido em `env.ts`)

### Middleware de Auth

Todas as rotas (exceto `/api/health` e `/api/auth/login`) exigem o header:
```
Authorization: Bearer <token>
```

O middleware extrai o `userId` do token e injeta em `request.userId` para uso nas rotas.

---

## Estrutura de Arquivos

```
backend/src/
├── index.ts                    # Ponto de entrada — conecta banco e sobe Express
├── app.ts                      # Cria o app Express, registra rotas e middlewares
│
├── config/
│   ├── database.ts             # Pool pg, query(), withTransaction()
│   └── env.ts                  # Variáveis de ambiente com defaults
│
├── constants/
│   ├── roles.ts                # Enum de funções: MINISTRO, VIOLAO, etc.
│   └── services.ts             # Enum de cultos: SUNDAY_MORNING, etc.
│
├── middleware/
│   ├── auth.ts                 # Verifica JWT e injeta userId no request
│   └── errorHandler.ts         # Trata HttpError, erros do pg e erros genéricos
│
├── repositories/
│   ├── usersRepository.ts      # findUserByEmail, findUserById
│   ├── membersRepository.ts    # CRUD de membros
│   ├── availabilityRepository.ts # find/replace indisponibilidades
│   ├── savedSchedulesRepository.ts # save/find escalas salvas
│   ├── ministriesRepository.ts # Consultas de ministério
│   ├── workspaceRepository.ts  # Resolve ministério + service_types pelo userId
│   └── defaultWorkspaceRepository.ts # Workspace legado (não usado nas rotas)
│
├── routes/
│   ├── auth.ts                 # POST /api/auth/login
│   ├── health.ts               # GET /api/health
│   ├── members.ts              # CRUD /api/members
│   ├── availability.ts         # GET/PUT /api/availability
│   └── schedule.ts             # parse/generate/saved/export-csv
│
├── services/
│   ├── jwt.ts                  # signToken(), verifyToken()
│   ├── scheduler.ts            # Algoritmo de geração de escala
│   ├── parser.ts               # Leitura de planilhas Excel (Google Forms)
│   ├── csv.ts                  # Exportação de escala para CSV
│   ├── dateUtils.ts            # Enumeração de cultos do mês
│   ├── memberValidation.ts     # Validação de input de membro
│   └── memberSerializer.ts     # Serialização de membro
│
├── types/
│   └── index.ts                # Interfaces TypeScript compartilhadas
│
├── utils/
│   ├── asyncHandler.ts         # Wrapper para rotas async (captura erros)
│   ├── http.ts                 # Classe HttpError
│   └── normalize.ts            # normalizeName(), toTitleCase()
│
└── database/
    └── seed/
        ├── constants.ts        # UUIDs fixos de todos os registros seedados
        ├── helpers.ts          # normalizeName() para seeds
        ├── 01-users.ts         # Seed do admin
        ├── 02-service-types.ts # Seed dos tipos de culto
        ├── 03-ministries.ts    # Seed do ministério Louvor
        ├── 04-members.ts       # Seed dos 16 membros
        ├── 05-availability.ts  # Seed das 51 indisponibilidades de abril/2025
        └── index.ts            # Orquestrador + resetDatabase()
```

---

## API — Endpoints

### Autenticação

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/auth/login` | ❌ | Login com email/senha, retorna JWT |

**Request:**
```json
{ "email": "admin@igreja.com", "password": "admin123" }
```
**Response:**
```json
{
  "token": "eyJ...",
  "user": { "id": "...", "email": "...", "churchName": "Igreja Central" }
}
```

---

### Health

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/health` | ❌ | Status da API e conexão com banco |

---

### Membros

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/members` | ✅ | Lista todos os membros do ministério |
| POST | `/api/members` | ✅ | Cria novo membro |
| PUT | `/api/members/:id` | ✅ | Atualiza membro existente |
| DELETE | `/api/members/:id` | ✅ | Remove membro |

**Body (POST/PUT):**
```json
{
  "name": "João Silva",
  "email": "joao@igreja.com",
  "phone": "11999999999",
  "roles": ["VIOLAO", "BAIXO"],
  "notes": "Observação opcional"
}
```

---

### Indisponibilidades

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | `/api/availability?month=4&year=2025` | ✅ | Busca indisponibilidades do mês |
| PUT | `/api/availability?month=4&year=2025` | ✅ | Substitui todas as indisponibilidades do mês |

**Body (PUT):**
```json
{
  "overrides": [
    {
      "memberId": "44444444-...",
      "unavailableServiceKeys": ["2025-04-06|SUNDAY_MORNING", "2025-04-09|WEDNESDAY"]
    }
  ]
}
```

O formato da `serviceKey` é sempre `YYYY-MM-DD|TIPO_CULTO`.

---

### Escala

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/schedule/parse` | ✅ | Faz upload e lê planilha Excel do Google Forms |
| POST | `/api/schedule/generate` | ✅ | Gera escala automaticamente |
| GET | `/api/schedule/saved?month=4&year=2025` | ✅ | Busca escala salva |
| POST | `/api/schedule/saved` | ✅ | Salva escala no banco |
| POST | `/api/schedule/export-csv` | ✅ | Exporta escala como arquivo CSV |

---

## Algoritmo de Geração de Escala

O `scheduler.ts` implementa um algoritmo de pontuação para distribuir membros de forma equilibrada:

1. **Enumera** todos os cultos do mês (domingos manhã/noite + quartas)
2. Para cada culto, percorre as funções na ordem de prioridade: `MINISTRO → VIOLAO → TECLADO → BAIXO → BATERIA → GUITARRA → APOIO`
3. Para cada função, filtra candidatos que:
   - Têm aquela função no seu array de `roles`
   - Não estão marcados como indisponíveis naquele culto
   - Não foram escalados em outra função no mesmo culto
4. Calcula um **score** para cada candidato:
   - Base: 100 pontos
   - Bônus por função primária: até +40 (função principal tem mais peso)
   - Penalidade por escalas recentes: -15 por escala nos últimos 2 cultos
   - Penalidade por total de escalas: -5 por escala no mês
   - Penalidade por semana: -20 se já foi escalado na mesma semana
5. Seleciona o candidato com maior score
6. Se faltar ministro ou harmonia (violão/teclado), adiciona nota "Formação incompleta"

---

## Parser de Planilha (Google Forms)

O `parser.ts` lê planilhas `.xlsx` exportadas do Google Forms:

1. Percorre todas as abas da planilha procurando a que tem as colunas `Nome`, `Funções` e `Indisponibilidades`
2. Para cada linha, normaliza o nome e tenta fazer match com um membro cadastrado no banco (via `normalized_name`)
3. Parseia as datas de indisponibilidade no formato `DD/MM (Tipo do Culto)`
4. Retorna linhas parseadas, membros sem match e erros por linha

---

## Seeds

Para popular o banco com dados iniciais:

```bash
yarn db:seed
```

Para resetar o banco e rodar as seeds do zero:
```bash
# 1. Destruir o volume do Docker (apaga tudo)
docker compose down -v

# 2. Subir novamente (recria o schema)
docker compose up -d

# 3. Rodar as seeds
yarn db:seed
```

---

## Variáveis de Ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | `postgresql://escala_louvor:escala_louvor@127.0.0.1:5433/escala_louvor` | String de conexão com o banco |
| `PORT` | `3001` | Porta do servidor HTTP |
| `CLIENT_ORIGIN` | `http://localhost:5173` | Origem permitida pelo CORS |
| `JWT_SECRET` | `escala-louvor-dev-secret-change-in-production` | Secret para assinar tokens JWT |
| `JWT_EXPIRES_IN` | `7d` | Tempo de expiração do token |
| `NODE_ENV` | `development` | Ambiente de execução |

> ⚠️ Em produção, sempre defina `JWT_SECRET` com um valor longo e aleatório.
