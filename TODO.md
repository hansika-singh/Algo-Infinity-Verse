# TODO - Fix deployed Practice/Roadmap not visible

## Plan (approved by analysis)
- Root cause: `index.html` loads `/data/*.js`, but on deployed environment those files return 404 → Practice/Roadmap JS init never runs.
- Implement fix: ensure `data/` scripts are present in deployed static assets.

## Steps
1. Create `public/data/` directory.
2. Copy all `data/*.js` files into `public/data/`.
3. Confirm `server.js` / static hosting serves `public/` files at `/` paths (or adjust if it expects root `data/`).
4. (Optional but recommended) Verify `index.html` references `data/*.js` correctly after copying.
5. Run local smoke test: start server, fetch one missing script path, and ensure it serves with `text/javascript`.
6. Re-check leaderboard endpoint 500 separately (may require env/Firebase config), but it should not block Practice/Roadmap rendering.
7. (Optional) Add a short runtime guard: if `window.practiceProblems` is empty, show an on-page error indicating `/data/*.js` failed to load.


