# PsyArXiv Dashboard

An [Observable Framework](https://observablehq.com/framework/) dashboard for [PsyArXiv](https://psyarxiv.com/) preprint metadata.

## Development

Install requirements:

```
npm install
```

Then, to start the local preview server, run:

```
npm run dev
```

`npm run dev` defaults to the local Datasette at `http://127.0.0.1:8001`.

`npm run build` and `npm run deploy` default to the production Datasette at `https://psyarxivdb.vuorre.com`.

To override the default Datasette endpoint for any command, set `DATASETTE_BASE_URL` explicitly:

```
DATASETTE_BASE_URL=https://psyarxivdb.vuorre.com npm run dev
```

For timeout and query-smoke testing, use the probe suite instead of clicking through pages manually:

```
npm run probe-queries
```

`npm run probe-queries` defaults to `http://127.0.0.1:8001` and prints `ok` / `warn` / `fail` for every dashboard query, including fixed fixtures for the tag and coauthorship network queries.

To target the live VPS Datasette instead, override the probe target:

```
DATASETTE_BASE_URL=https://psyarxivdb.vuorre.com npm run probe-queries
```

If you switch between Datasette endpoints, clear the Observable cache first:

```
npm run clean
```

Then visit <http://localhost:3000> to preview your app. For more, see <https://observablehq.com/framework/getting-started>.
