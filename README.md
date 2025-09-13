# Splendor Monorepo

Dev:
- Backend: Splendor/backend (Node + Socket.IO)
- Frontend: Splendor/frontend (React + Vite + TS)

Scripts (run at repo root):
- `npm run dev` — runs backend server (port 3000) and Vite dev server (port 5173). Backend proxies `/socket.io`.
- `npm run build` — builds the frontend into `Splendor/frontend/dist`.
- `npm run start` — runs backend only. It serves the built frontend from `dist` if it exists, and falls back to `public` otherwise.

Images:
- Gem images are served from `Splendor/frontend/public/images/` and used by React components.
