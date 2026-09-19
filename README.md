# DBD Stats Desktop

Electron + React + TypeScript + Tailwind CSS.

## Запуск

```bash
npm install
npm run dev
```

## Идея

Локальное desktop-приложение для чтения DBD-статистики через Steam Web API. Интерфейс работает внутри Electron, внешний браузер для приложения не нужен.

## Архитектура

- Model: `src/main/steam.ts`
- ViewModel/application bridge: `src/main/preload.ts`
- View: `src/renderer/main.tsx`

## Важно

Этот архив — исходники проекта, а не готовый `.exe`. Steam Web API key не включён.
