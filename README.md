# PsyArXiv Dashboard

An [Observable Framework](https://observablehq.com/framework/) dashboard for [PsyArXiv](https://psyarxiv.com/) preprint metadata from <https://psyarxivdb.vuorre.com>.

## Development

Install requirements:

```bash
npm install
```

Then, to start the local preview server, run:

```bash
npm run dev
```

`npm run dev` defaults to the local Datasette at `http://127.0.0.1:8001`.

`npm run build` and `npm run deploy` default to the production Datasette at `https://psyarxivdb.vuorre.com`.

To override the default Datasette endpoint for any command, set `DATASETTE_BASE_URL` explicitly:

```bash
DATASETTE_BASE_URL=https://psyarxivdb.vuorre.com npm run dev
```

Then visit <http://localhost:3000> to preview your app. For more, see <https://observablehq.com/framework/getting-started>.

### Testing

For timeout and query testing, use the probe suite instead of clicking through pages manually:

```bash
npm run probe-queries
```

`npm run probe-queries` defaults to `http://127.0.0.1:8001`.

To target the production Datasette instead, override the probe target:

```bash
DATASETTE_BASE_URL=https://psyarxivdb.vuorre.com npm run probe-queries
```

If you switch between Datasette endpoints, clear the Observable cache first:

```bash
npm run clean
```
