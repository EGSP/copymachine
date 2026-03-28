---
name: Express + Axios migration
overview: Заменить Elysia на Express; фронт на axios; вынести queryFn/mutationFn и обёртки useQuery/useMutation в модули, сгруппированные по домену (планы, копирование, бэкенд).
todos:
  - id: backend-express
    content: Заменить Elysia на Express в app.ts + index.ts, обновить package.json и exports
    status: pending
  - id: frontend-axios
    content: "api.ts: axios instance, helper ошибок; убрать eden и copymachine-backend из package.json"
    status: pending
  - id: frontend-queries-hooks
    content: Вынести query/mutation функции и хуки по доменам; подключить в компонентах и routes
    status: pending
  - id: docs-lock
    content: Обновить guides/TanStack.md; npm install для lockfile
    status: pending
isProject: false
---

# Миграция backend на Express, клиент на axios, слой queries/hooks

## Текущее состояние

- Backend: [packages/backend/src/app.ts](packages/backend/src/app.ts) — Elysia, группа `/api`.
- Frontend: Eden/treaty в [packages/frontend/src/lib/api.ts](packages/frontend/src/lib/api.ts); ключ планов в [packages/frontend/src/lib/plansQuery.ts](packages/frontend/src/lib/plansQuery.ts).
- Запросы размазаны по компонентам и [packages/frontend/src/routes/index.tsx](packages/frontend/src/routes/index.tsx): health, copy analysis, plans list, мутации create/update/delete в формах и `PlanWindow`.

## Backend: Express

Как в прежней версии плана:

1. **package.json**: `express`, `cors`; dev — типы; убрать `elysia`, `@elysiajs/cors`.
2. **app.ts**: `express()` + `cors` + `express.json()`, те же маршруты под `/api`, async через try/catch или обёртку + простой error-middleware.
3. Убрать `export type App`; удалить `exports["./app"]` из backend `package.json`.
4. **index.ts**: `app.listen(port, hostname, …)` Express.

## Frontend: axios

1. Зависимости: `axios`; убрать `@elysiajs/eden`, `copymachine-backend`.
2. **api.ts**: `axios.create({ baseURL: …/api })`, helper для сообщений об ошибках (для Query/Mutation).

## Frontend: query-функции и хуки (по смыслу)

Цель: не держать `queryFn` / `mutationFn` и опции `useQuery` / `useMutation` внутри UI-компонентов и корневого роута — вынести в отдельные модули, **сгруппированные по домену**, с **хуками** как единственной точкой входа для экранов.

### Предлагаемая структура (можно слегка переименовать, логика важнее)

- `**src/lib/queries/backend.ts`** — подключение к API:
  - константа ключа, например `backendHealthQueryKey`;
  - чистая async-функция `fetchBackendHealth()` (вызывает axios);
  - хук `useBackendHealthQuery(options?)` с `useQuery`, внутри — тот же ключ и `queryFn`.
- `**src/lib/queries/copy.ts`** — анализ копирования:
  - фабрика ключа `copyAnalysisQueryKey(sourcePath, targetPath)` (как сейчас в index, перенести сюда);
  - `fetchCopyAnalysis(sourcePath, targetPath)`;
  - хук `useCopyAnalysisQuery({ sourcePath, targetPath, enabled })` (или отдельный объект-параметр), инкапсулирует `enabled` вместе с health при необходимости — передаётся снаружи из роута.
- `**src/lib/queries/plans.ts`** — планы:
  - перенести/объединить с текущим [plansQuery.ts](packages/frontend/src/lib/plansQuery.ts): `plansQueryKey`, `fetchPlans`;
  - чистые функции для мутаций: `createPlan`, `updatePlan`, `deletePlan` (или префикс `post`/`put` — как привычнее в проекте);
  - хуки: `usePlansQuery({ enabled })`, `useCreatePlanMutation()`, `useUpdatePlanMutation()`, `useDeletePlanMutation()` с `invalidateQueries` по `plansQueryKey` там, где это уже делается через `queryClient`.

Комментарии в коде — на русском ([AGENTS.md](AGENTS.md)).

### Интеграция в UI

- [packages/frontend/src/routes/index.tsx](packages/frontend/src/routes/index.tsx): только вызовы `useBackendHealthQuery`, `useCopyAnalysisQuery` и разметка; без локальных `queryFn`.
- [PlansList.tsx](packages/frontend/src/components/leafs/PlansList.tsx): `usePlansQuery`.
- [CreatePlanForm.tsx](packages/frontend/src/components/leafs/CreatePlanForm.tsx): `useCreatePlanMutation`.
- [PlanWindow.tsx](packages/frontend/src/components/leafs/PlanWindow.tsx): `useUpdatePlanMutation`, `useDeletePlanMutation`.
- [PathPicker.tsx](packages/frontend/src/components/PathPicker.tsx): остаётся вызов API по клику; либо тонкая обёртка `pickFolderPath()` / `pickFilePath()` в `src/lib/queries/pathPick.ts` (без хука, если это не server state), чтобы не дублировать URL — по желанию в рамках того же рефакторинга.

После миграции файл [plansQuery.ts](packages/frontend/src/lib/plansQuery.ts) либо удалить (ключ перенесён в `queries/plans.ts`), либо оставить реэкспорт на один релиз — предпочтительно один источник правды в `queries/plans.ts`.

## Документация

- [guides/TanStack.md](guides/TanStack.md): axios + **хуки/query-модули в `src/lib/queries/`** вместо Eden.

## Проверка

- `npm run dev`, сценарии health, планы, CRUD, анализ копирования, path-pick.
- `npm run check` во frontend.

