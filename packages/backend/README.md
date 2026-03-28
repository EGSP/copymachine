# Backend (Express, Node)

Сервер API на **Express**, запуск под **Node.js** (TypeScript через [tsx](https://github.com/privatenumber/tsx)).

## Разработка

Из корня монорепы:

```bash
npm run dev:backend
```

Или из `packages/backend`:

```bash
npm run dev
```

Параметры слушания — в `.env` в каталоге `packages/backend` (подхватывает **dotenv** при старте; сам Node переменные из файла не читает). Без файла — дефолты `PORT=3001`, `HOSTNAME=0.0.0.0`.

## Однократный запуск (без watch)

```bash
npm run start
```

Требуется Node **20.6+** (флаг `--import tsx` для отладки в VS Code) или достаточно любой поддерживаемой LTS для `tsx` из npm.
