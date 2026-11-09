# Tradeloom

Tradeloom is a small stock trading simulator. It is a practice app for Playwright test
automation. You log in with a demo account, see made-up stocks with moving prices, buy and
sell with fake money, and check your portfolio and wallet.

**All companies, prices and money in this app are made up. There is no real money and no
real company here.**

It is plain HTML, CSS and JavaScript. There is no framework, no build step and no server.
Stock and user data come from JSON files. Your own cash, shares and history are saved in
your browser's localStorage.

## Run it on your computer

From the repo root:

```
python -m http.server 8000
```

Then open <http://localhost:8000>.

Nothing to install. The local server has no clean URLs, so the app adds `.html` to its own
links when the host is `localhost` or `127.0.0.1`.

## Deploy on Vercel

1. Import the repo at <https://vercel.com/new>.
2. Set **Framework Preset** to **Other**.
3. Leave the build command and the output folder empty.
4. Deploy.

`vercel.json` turns on `cleanUrls`, so `market.html` is served at `/market`.

## Demo accounts

Password for both: `Play123!`

| Email | What it starts with |
| --- | --- |
| `trader@tradeloom.test` | $8,808.40 cash, 20 LUMA and 5 KRYL |
| `newbie@tradeloom.test` | $10,000 cash, no stocks |

## Test switches

| Switch | What it does |
| --- | --- |
| `?seed=42` | Same prices every time. The seed is copied onto every link, so it survives page changes. |

Prices move one step every 5 seconds of market time. With the same seed, the same day and
the same time, every computer shows the same price. Without a seed the app uses `tradeloom`.

The market is open Monday to Friday, 9:00 to 17:00 Dhaka time. When it is closed you can
look at prices but you cannot buy or sell.

## Pages

- `/` log in
- `/market` all stocks
- `/stock?symbol=KRYL` one stock, with the chart and the trade box
- `/portfolio` what you own
- `/wallet` cash, adding practice money, start over and history
- `/rules` every rule the app follows

Every rule the app follows is written on the [Rules page](/rules). If the app does
something different, that is a bug.
