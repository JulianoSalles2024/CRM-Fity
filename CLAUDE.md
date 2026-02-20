# Padrão Arquitetural — CRM-Fity

## Estrutura de pastas

```
src/
├── app/              # Orquestração central (App.tsx, useAppState, AppRouter, AppLayout)
├── features/         # Domínios funcionais da aplicação
│   └── {dominio}/    # ex: leads/, pipeline/, tasks/, ai/
├── shared/
│   └── components/   # Componentes reutilizáveis sem domínio específico
├── services/
│   ├── supabase/     # Cliente e operações de banco de dados
│   └── ai/           # Providers de IA (config, generator)
├── api/              # Funções de acesso a dados (index.ts)
├── data/             # Dados iniciais / seeds (index.ts)
└── shared/
    └── types.ts      # Tipos globais do projeto
```

## Regras obrigatórias

### 1. Novas features → `src/features/{dominio}/`
Toda feature nova deve ser criada dentro do domínio correspondente.
Criar novo domínio se necessário: `src/features/nome-do-dominio/`.

```
✅ src/features/leads/LeadTimeline.tsx
✅ src/features/pipeline/StageMetrics.tsx
❌ src/app/NewFeature.tsx
❌ components/NewFeature.tsx
```

### 2. Estado global → somente em `src/app/useAppState.ts`
Nenhum estado global (`useLocalStorage`, dados compartilhados entre features) deve ser criado fora de `useAppState`.
Estado local de componente (UI-only) pode viver no próprio componente.

```
✅ useState local para abrir/fechar dropdown dentro do componente
✅ Novo estado global adicionado em useAppState.ts e retornado no objeto
❌ useLocalStorage fora de useAppState.ts
❌ Context API criado fora de useAppState.ts sem alinhamento prévio
```

### 3. `src/app/` é zona fechada para lógica nova
Os arquivos `App.tsx`, `AppRouter.tsx`, `AppLayout.tsx` e `useAppState.ts` só devem ser editados para:
- Conectar uma nova feature já implementada em `src/features/`
- Adicionar nova rota no `AppRouter`
- Registrar novo estado em `useAppState` (retornando-o no objeto)

Não adicionar lógica de negócio diretamente em nenhum desses arquivos.

### 4. Componentes compartilhados → `src/shared/components/`
Componentes usados por mais de um domínio (modais genéricos, botões, inputs) vão para `src/shared/components/`.
Componentes exclusivos de um domínio ficam dentro de `src/features/{dominio}/`.

```
✅ src/shared/components/ConfirmDeleteModal.tsx   (usado por leads, groups, recovery...)
✅ src/features/leads/LeadStatusBadge.tsx         (exclusivo de leads)
❌ src/features/leads/ConfirmDeleteModal.tsx       (seria duplicata)
```

### 5. Chamadas externas → `src/services/`
Toda integração com APIs externas, banco de dados ou serviços de terceiros vai em `src/services/`.

```
✅ src/services/supabase/leads.ts    (CRUD de leads no Supabase)
✅ src/services/ai/generator.ts      (chamada a Gemini/OpenAI/Anthropic)
❌ fetch() dentro de um componente em src/features/
❌ supabase.from() diretamente em src/api/index.ts sem passar por services/
```

### 6. Imports — usar sempre alias `@/`
```
✅ import X from '@/features/leads/X'
✅ import type { Lead } from '@/shared/types'
❌ import X from '../../../features/leads/X'
```

## Checklist para nova feature

- [ ] Criar pasta `src/features/{dominio}/` se não existir
- [ ] Componente de UI → `src/features/{dominio}/NomeDoComponente.tsx`
- [ ] Chamada externa necessária → `src/services/{servico}/funcao.ts`
- [ ] Estado compartilhado → adicionar em `useAppState.ts` e retornar no objeto
- [ ] Componente reutilizável → `src/shared/components/`
- [ ] Nova rota/view → registrar no `AppRouter.tsx`
- [ ] Imports usando alias `@/`
