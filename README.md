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

By default the dashboard uses the production Datasette at `https://psyarxivdb.vuorre.com`.

To point it at a local Datasette on `http://127.0.0.1:8001`, set:

```
DATASETTE_BASE_URL=http://127.0.0.1:8001 npm run dev
```

If you switch between Datasette endpoints, clear the Observable cache first:

```
npm run clean
```

Then visit <http://localhost:3000> to preview your app. For more, see <https://observablehq.com/framework/getting-started>.
