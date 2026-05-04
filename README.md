# 🎰 NX Raffle Party

![Dashboard](lottrey-ui/public/dashboard.png)

Hacker-style raffle draw app — green terminal UI, fair randomisation, one command to run.

---

## Running the App

> No coding knowledge needed. Just follow these steps.

**Step 1 — Install Node.js** (skip if already installed)

Download and install from **https://nodejs.org** (choose the "LTS" version).

**Step 2 — Open Terminal**

- **Mac**: Press `Cmd + Space`, type `Terminal`, hit Enter
- **Windows**: Press `Win + R`, type `cmd`, hit Enter

**Step 3 — Navigate to this folder**

```bash
cd path/to/HackathonXII
```

**Step 4 — Run**

```bash
./startRaffle.sh
```

The app will open automatically at **http://localhost:3000**.
Press `Ctrl+C` in the terminal to stop.

> First run installs dependencies automatically — this takes a minute. Subsequent runs are instant.

---

## How to Use

1. Click **"DRAW RAFFLES"** to reveal a batch of random numbers
2. Click individual numbers to add them to the winners list
3. Click **"ALL"** to pick the entire batch at once
4. Unclicked numbers are discarded when you draw the next batch
5. Once all winners are picked, the full list displays in celebration mode

---

## Configuration

All settings live in **`config.js`** at the project root. Open it in any text editor and change the values for your event.

| Setting                | What it does                                         |
|------------------------|------------------------------------------------------|
| `HACKATHON_VERSION`    | Edition shown in the header (e.g. `XII`)            |
| `HACKATHON_DATE_START` | Event start date shown in the header                 |
| `HACKATHON_DATE_END`   | Event end date shown in the header                   |
| `RAFFLE_START`         | First number in the raffle pool (inclusive)          |
| `RAFFLE_END`           | Upper bound of the pool (exclusive, last number + 1) |
| `RAFFLE_TOTAL_PICK`    | Total winners to pick across all draws               |
| `RAFFLE_BATCH_SIZE`    | Numbers revealed per draw click                      |
| `PORT`                 | Backend port (default `5000`)                        |

**Logo** — replace `lottery-ui/public/nutanix-hackathon-logo.png` with your event logo (transparent PNG, ~300×150 px recommended).

---

## How Randomisation Works

Uses the **Fisher-Yates Shuffle** (also known as the Knuth Shuffle) — the gold standard for unbiased random shuffles.

Each time you draw:
1. All remaining numbers are shuffled uniformly at random
2. The first `RAFFLE_BATCH_SIZE` numbers from the shuffle are shown
3. Shown numbers are immediately removed from the pool — no repeats ever

**Fairness guarantees:**

- No duplicates — picked numbers leave the pool permanently
- Equal probability — every remaining number has the same chance each draw
- No bias — Fisher-Yates produces a perfectly uniform distribution
- Transparent — all logic is in `server.js`, open for anyone to audit

---

## Tech Stack

- **Frontend**: React 19 + Tailwind CSS
- **Backend**: Node.js + Express
- **Randomisation**: Fisher-Yates Shuffle

---

## Project Structure

```
HackathonXII/
├── config.js              ← edit this for your event
├── server.js              # backend API
├── startRaffle.sh         # one-command launcher
├── package.json
└── lottery-ui/
    ├── public/
    │   └── nutanix-hackathon-logo.png  ← swap for your logo
    └── src/
        └── App.js         # frontend UI
```

---

(c) Nutanix INC
