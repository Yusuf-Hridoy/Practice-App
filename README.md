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

Password for all three: `Play123!`

| Email | What it starts with |
| --- | --- |
| `trader@tradeloom.test` | $8,808.40 cash, 20 LUMA and 5 KRYL |
| `newbie@tradeloom.test` | $10,000 cash, no stocks |
| `busy@tradeloom.test` | $28,084.50 cash, 7 stocks and 24 rows of history |

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

## Payments and receipts

Adding practice money on the Wallet page goes through a **card form in an iframe**. Pick an
amount, press **Add**, and a **Pay by card** step appears with the three test cards and the
form. The frame checks the fields, waits 2 seconds on **Processing…**, and then tells the
Wallet page what happened with a `postMessage`. The page only listens to messages from its
own origin.

| Card number | What happens |
| --- | --- |
| `4242 4242 4242 4242` | The payment works |
| `4000 0000 0000 0002` | Your card was declined. Try another card. |
| `4000 0000 0000 9995` | Your card doesn't have enough funds. |

The $50,000 limit is checked **before** the card form opens, and again before the money is
added. A top-up then shows in the history as *Added practice money · card ending 4242*.

Every history row has a **Receipt** link that opens `/receipt?id=<history id>` in a new tab:
a small printable card with the receipt number, the Dhaka date and time, the rows that fit
that kind of trade, and **Cash after**. **Print** uses your browser's print dialog, and the
buttons are hidden on paper. An id that isn't in your history shows **Receipt not found**.

The history has a **Type** filter (all, buys, sells, top-ups), a **From** and **To** date
(both counted on the Dhaka day of each row), and **10 rows per page**. The filters and the
page live in the query, like
`/wallet?type=buy&from=2026-11-01&to=2026-11-09&page=2`, so a view can be linked to and the
Back button walks back through it. Anything the app doesn't understand in the query quietly
falls back to the default. **Download CSV** holds every row that matches the filters, on all
pages.

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
| `busy@tradeloom.test` | `TL-5090-BU` |

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
- `/receipt?id=h3` one receipt from your history, printable, in its own tab
- `/profile` your photo, details, account ID and theme
- `/rules` every rule the app follows

Every rule the app follows is written on the [Rules page](/rules). If the app does
something different, that is a bug.
