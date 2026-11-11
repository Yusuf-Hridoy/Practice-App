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

## Watchlist

The Watchlist page keeps up to **6 stocks** in whatever order you drag them into, with
**one price alert per stock**. Add a stock from the select on that page, or tap the star on
any Market row.

An alert is either **Above** or **Below** a price you pick, somewhere between 80% and 120%
of the price at the moment you open the alert editor. Prices are checked every 5 seconds on
every page. When the price crosses your alert it **fires once**: you get a pop-up message in
the app (and a browser notification, if you turned those on), and the alert then shows
**Hit** until you save a new one.

The `trader@tradeloom.test` account starts with NOVA, PIXEL, BRISK and OAKFIN on its
watchlist, and one alert set for NOVA above $55.00. `newbie@tradeloom.test` starts with an
empty watchlist. **Start over** on the Wallet page clears the watchlist back to that start.

## Profile

The Profile page is behind the circle at the right of the top menu. Each account can change
its **photo**, **display name**, **date of birth**, **country**, up to **3 favorite
sectors** and which **emails** it wants. Everything is saved in your browser, under your
account, like the rest of your data.

The **photo** must be a PNG, JPG or WebP of **1 MB or less**. Choose a file or drop one on
the box. A good photo is saved on its own, right away, without the Save button, and then
shows in the top menu circle on every page. With no photo the circle shows your initials:
the first letter of your first two words, or the first two letters of a one-word name, so
"Mira Khan" gives "MK".

Everything else is saved together with **Save changes**. The display name must be 2 to 30
letters, numbers or spaces. The date of birth is optional, but if you fill it in you must be
**18 or older**, counted on today's Dhaka date, and turning 18 today counts. While a field
is different from what is saved, the page says so and offers **Undo changes**, and your
browser asks before you leave the page.

The **theme** is Dark, Light or Match my device. It is saved for your account and applies to
**every page**, including the price chart, the pop-up messages and the dialogs. Match my
device follows your device setting and changes as soon as you change it. **Start over** on
the Wallet page puts the whole profile back, theme included.

| Email | Account ID |
| --- | --- |
| `trader@tradeloom.test` | `TL-4821-TR` |
| `newbie@tradeloom.test` | `TL-7730-NB` |

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
- `/profile` your photo, details, account ID and theme
- `/rules` every rule the app follows

Every rule the app follows is written on the [Rules page](/rules). If the app does
something different, that is a bug.
