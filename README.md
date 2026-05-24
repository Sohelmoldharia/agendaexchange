# FANDX — The Fandom Exchange

A fictional, play-money stock market for fandoms. Trade your favorite **anime,
gaming, and movie characters** — every trade moves the market. Buying pumps a
character's price, selling dumps it.

The market is organized as a three-level hierarchy:

```
Category (Anime)  →  Series (Naruto)  →  Character / Stock (Naruto Uzumaki · NRTO)
```

## Features

- **Core trading loop** — buy & sell characters with fictional money. Prices
  move along a bonding curve, so demand visibly drives the price.
- **Live charts** — interactive price history with 1D / 1W / 1M / ALL ranges,
  hover tooltips, and an ambient market that ticks in real time.
- **Watchlists** — star characters and track them on your watchlist.
- **Portfolio** — net worth, holdings with live P&L, and full order history.
- **Accounts** — email/username sign-up with sessions; every new trader starts
  with $10,000 in play money.
- **Browse & search** — explore by fandom, drill into a series, or search any
  character instantly.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + TypeScript
- **Tailwind CSS v4**
- **Prisma 7** + **SQLite** (via the `better-sqlite3` driver adapter)
- **jose** (JWT sessions in httpOnly cookies) + **bcryptjs**

## Getting started

Requires Node.js 20.9+.

```bash
# 1. Install dependencies (also generates the Prisma client)
npm install

# 2. (optional) create a .env — defaults work out of the box
cp .env.example .env

# 3. Create the database and apply migrations
npx prisma migrate dev

# 4. Seed categories, series, characters, price history, and a demo user
npm run seed

# 5. Start the dev server
npm run dev
```

Then open <http://localhost:3000>.

**Demo account:** username `demo`, password `demo1234` (or use the "Try the
demo account" button on the login page).

## Scripts

| Script             | Description                                      |
| ------------------ | ------------------------------------------------ |
| `npm run dev`      | Start the dev server                             |
| `npm run build`    | Production build                                 |
| `npm run start`    | Run the production build                         |
| `npm run seed`     | Reset & seed the database with the full roster   |
| `npm run db:reset` | Drop, re-migrate, and re-seed the database       |
| `npm run lint`     | Lint                                             |

## How pricing works

Each character has a current `price`, an anchor `basePrice`, and a `liquidity`
parameter. A trade of `q` shares moves the price by a factor of `q / liquidity`:

- **Buy** → `price × (1 + q / liquidity)` — the price goes **up**.
- **Sell** → `price × (1 − q / liquidity)` — the price goes **down**.

The cash cost/proceeds use the average of the start and end price (the area
under the bonding curve), so larger orders get worse fills and a buy→sell round
trip pays a spread. Between trades, an ambient simulation nudges every price
with a small mean-reverting random walk so the market always feels alive.

## Project structure

```
prisma/
  schema.prisma        # data model
  seed.ts              # categories → series → characters + price history
src/
  app/                 # routes (pages + /api route handlers)
  components/          # UI (charts, trade panel, nav, cards, …)
  lib/
    pricing.ts         # bonding-curve math (pure, shared client/server)
    trade.ts           # transactional buy/sell engine
    market.ts          # ambient market tick + history helpers
    auth.ts            # sessions (JWT + bcrypt)
    queries.ts         # server-side data fetchers
  generated/prisma/    # generated Prisma client (git-ignored)
```

## Disclaimer

This is a fan-made parody for fun and learning. All characters belong to their
respective owners; all prices and money are entirely fictional. Not affiliated
with any franchise, and definitely not financial advice.
