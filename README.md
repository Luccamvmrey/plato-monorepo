# Plato 🛡️

Plato é uma aplicação de rastreamento de treinos focada em hipertrofia e progressão de carga. O sistema gerencia tanto a intenção (planos de treino) quanto a execução (logs de sessão em tempo real), fornecendo análises detalhadas de volume e estimativas de 1RM.

## 🏗️ Estrutura do Projeto

Este é um monorepo organizado da seguinte forma:

- **`apps/web`**: Frontend em React (Vite).
- **`apps/api`**: Backend Node.js (Express).
- **`packages/database`**: Camada de dados compartilhada (Prisma + PostgreSQL).

## 🚀 Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript
- **State Management:** React Query (Server State) & Zustand (Client State)
- **Routing:** Wouter
- **Styling:** Tailwind CSS + shadcn/ui
- **Charts:** Recharts

### Backend
- **Runtime:** Node.js
- **Framework:** Express
- **Validation:** Zod
- **ORM:** Prisma

## 🛠️ Configuração Local

### Pré-requisitos
- Node.js (v18+)
- PostgreSQL ativo

### Instalação

1. Instale as dependências na raiz:
   ```bash
   npm install
   ```

2. Configure as variáveis de ambiente:
   - Crie arquivos `.env` em `apps/api`, `apps/web` e `packages/database` seguindo os exemplos ou necessidades do projeto (DATABASE_URL, JWT_SECRET, etc).

3. Prepare o banco de dados:
   ```bash
   cd packages/database
   npx prisma generate
   npx prisma db push
   ```

### Execução

Para rodar o projeto em desenvolvimento (frontend e backend simultaneamente):

```bash
# Na raiz do projeto
npm run dev --workspaces
```

Ou individualmente:

```bash
# Apenas a API
npm run dev --workspace=api

# Apenas o Web
npm run dev --workspace=web
```

## 📊 Funcionalidades Principais

- **Editor de Treinos:** Criação e reordenação de exercícios com metas de séries/reps.
- **Sessão Ativa:** Timer em tempo real e log de carga/RPE durante o treino.
- **Analytics:** Gráficos de evolução de e1RM (estimativa de 1RM) e volume total (tonelagem) por exercício.
- **Resumo de Treino:** Distribuição de volume por grupamento muscular (em % e kg).
- **Soberania de Dados:** Exportação completa do histórico do usuário em formato JSON.

---
Desenvolvido com foco em performance e precisão técnica. 🏋️‍♂️
