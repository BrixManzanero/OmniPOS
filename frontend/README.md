# OmniPOS Zero Frontend

React + TypeScript frontend for OmniPOS Zero.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

Copy `.env.example` to `.env` and set `VITE_API_URL` when the API is not running at `http://127.0.0.1:8000`.

The codebase follows a feature-first structure under `src/features` so each business domain owns its page, components, and hooks.
