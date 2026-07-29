# corca-labs-temp

Multi-app GitHub Pages repository for temporary Corca Labs tools.

## Apps

- `open-ax-day-opening` → `/open-ax-day-opening/`
- `open-ax-day-board` → `/open-ax-day-board/`
- `workflow-viewer` → `/workflow-viewer/`

Each app builds independently under `apps/`. `apps.json` is the deploy manifest;
`npm run build` assembles every app into `site/` and generates the repository
homepage.

## Development

```sh
npm install
npm run dev:board
npm run dev:api
```

The board uses local browser storage by default. To use the Cloudflare backend,
create `apps/open-ax-day-board/.env.local`:

```sh
VITE_BOARD_API_URL=http://localhost:8787
```

Every board URL receives a cryptographically random `?board=<uuid>` identifier.
Anyone who knows that URL can read and update the board.

## Deployment

GitHub Pages deploys all apps from `.github/workflows/deploy-pages.yml`. Add the
deployed Worker URL as the repository variable `BOARD_API_URL`.

Deploy the Worker separately:

```sh
npm run deploy:api
```

The independent `deploy-worker.yml` workflow deploys it on backend changes.
Configure `CLOUDFLARE_API_TOKEN` as a repository secret and
`CLOUDFLARE_ACCOUNT_ID` as a repository variable. Until the token exists, the
workflow still runs backend checks but safely skips deployment. A Worker
deployment failure does not block GitHub Pages deployment, and an unavailable
Worker causes the board to fall back to its URL-scoped local adapter.
