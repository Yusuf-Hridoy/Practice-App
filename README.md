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

The local server shows every page, but **not the API**: `/api` only runs on Vercel.

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

## Watchlist ++

The Watchlist page keeps up to **6 stocks** in whatever order you drag them into, with
**one price alert per stock**. Add a stock from the select on that page, or tap the start on
any Market row.

An alert is either **Above** or **Below** a price you pick, somewhere between 80% and 120%
of the price at the moment you open the alert editor. Prices are checked every 5 seconds on
every page. When the price crosses your alert it **fires once**: you get a pop-up message in
the app (and a browser notification, if you turned those on), and the alert then shows
**Hit** until you save a new one.

The `trader@tradeloom.test` account starts with NOVA, PIXEL, BRISK and OAKFIN on its
watchlist, and one alert set for NOVA above $55.00. `newbie@tradeloom.test` starts with an
empty watchlist. **Start over** on the Wallet page clears the watchlist back to that start.

## Payments and receipt

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

## News

The app carries **60 made-up headlines**. Nothing in them is real: no real company, person
or place. Which headline comes first, and the time on each one, both come from the
**seed**, so the same seed at the same time gives the same news on any computer. The newest
headline sits on the last 10 minute mark, and each next one is 15 to 90 minutes older, so
the list reaches back about two days. Times read *10 min ago*, *2 hours ago*,
*Yesterday 18:20* and then *12 Nov 18:20*.

The **Market news** box on the Market page is a web component, `<tradeloom-news>`, and
everything it shows lives inside an **open shadow root**, its own styles included. It shows
the newest 3 headlines with a stock tag and a time, and a **See all news** link. **Hide**
leaves only the heading and a **Show** button, and the choice is saved per account under
`tradeloom.newsbox.<email>` and remembered after a reload. On a wide screen the box sits in
a right column; on a phone it sits under the stock table.

The **News page** at `/news` starts with **10 headlines** and adds **10 more** each time you
scroll to the end: a small marker below the list is watched with an `IntersectionObserver`,
**Loading more news…** shows for 1 second, and then the next 10 are **added** — the items
already on the page are never rebuilt. After all 60 it says **You've reached the end.**

Filter buttons pick **All**, one stock, or **Market** for general news. The choice lives in
the query, like `/news?stock=KRYL`, so Back walks through it, and the count line says
*Showing 20 of 60*. **Read more** opens a headline's two-sentence summary and turns into
**Show less**. A link like `/news?focus=n37` keeps loading, without the 1 second wait, until
that headline is on the page, opens it, scrolls to it and puts the keyboard on it; an id
nobody knows just leaves the normal list. Once the page is scrolled past 600px a **Back to
top** button appears, and it puts the keyboard back on the **News** heading.

## Chart hover

Moving the mouse over the chart on a stock page picks the nearest point and shows a dashed
line, a dot and a small box with the **time** and the **price** of that point. The box stays
inside the chart and flips to the left near the right edge. Moving off the chart hides it.

The chart is also reachable with the **keyboard**: Tab onto it, then **←** and **→** move one
point, **Home** and **End** jump to the first and last point, and **Esc** hides it. Every move
is read out in a hidden status line, like *14:25, $141.92*. It works on both **1 hour** and
**Today**, and the point you are reading survives the 5-second price refresh.

## Offline

When your browser goes offline a banner says
**You're offline. Prices are paused and buying is turned off.** The 5-second price refresh
stops, and buying, selling, adding money and saving a price alert all answer
**You're offline. Try again when you're back online.** in that page's own error line.

When you come back, the banner goes, prices start moving again, and a green pop-up says
**You're back online.** for 3 seconds.

## Idle log out

Idle log out is **always on**. A `pointerdown`, `keydown`, `wheel`, `scroll` or `touchstart`
counts as activity, and the time of the last one is saved in `tradeloom.lastActive`, so
**every open tab shares it**: moving in one tab resets the timer in all of them.

After **14 minutes** with nothing happening, a dialog asks **Are you still there?** and
counts down from 0:59. Activity behind the dialog does not count; only **Stay logged in**
does. At **15 minutes**, or on **Log out now**, only the session is dropped — your cash,
shares, history, watchlist and profile all stay — and the log in page says
**You were logged out after 15 minutes of no activity.**

## Test switches

A test switch is a value you put in the page link. Every switch is **off** unless the link
turns it on, so a plain link behaves exactly as it always did. Switches are read once, when
the page loads, and they are **copied onto every link and redirect**, so a switch stays on
while you click around.

The [Test switches page](/switches) ticks whatever your link already says, builds the link
for you and copies it.

| Switch | Values | What it does |
| --- | --- | --- |
| `?seed=42` | any text | Same prices and same news every time |
| `?market=closed` | `closed` | Closes the market. You can look at prices, but not buy or sell |
| `?slow=3000` | 0 to 10000 | Every data load waits that many milliseconds before it starts |
| `?api=500` | `500` | Every data load fails as if the server answered 500 |
| `?flaky=on` | `on` | About 1 load in 3 fails; the rest wait 0 to 2 seconds. The seed decides |
| `?bug=cost,gain,limit,sort,search` | one or more | Turns on those bugs |
| `?drift=text,ids,layout,popup` | one or more, or `all` | Renames labels, changes test ids, moves parts, shows popups |

Anything else in the link is ignored, and so is a value the switch does not understand.

When any switch is on, a thin bar sits at the very top of every page: *Test switches on:
flaky, bug=cost.* with a **Change** link back to the Test switches page. With no switches
there is no bar in the page at all.

Prices move one step every 5 seconds, from 00:00 Dhaka time, 17,280 steps a day, every day
of the week. With the same seed, the same day and the same time, every computer shows the
same price. Without a seed the app uses `tradeloom`.

The market is open all day, every day. It is closed only while the link carries
`?market=closed`; then you can look at prices but you cannot buy or sell.

### Slow, broken and flaky loads

Every data load in the app — the stock list, the account list and the news templates — goes
through `js/data-loader.js`, so these three switches work everywhere. The waits use
`setTimeout`, so Playwright's Clock API controls them, and `slow` and `flaky` add up.

The loading states and the error boxes that are already in the app are what show: the
skeleton bars on the Market page, **Couldn't load prices** with **Try again**, and so on.
**Try again** counts as a new load, so with `flaky=on` it may work and with `api=500` it
fails again.

One load is left alone by `api` and `flaky`: the **account list** the page guard reads to
find out who is logged in. Without that one exception a broken server would bounce every
page back to the log in page and the error boxes could never be seen. `slow` still applies
to it, and logging in on the log in page fails like everything else.

### The 5 bugs

Each bug is small, realistic and changes nothing else. **No text changes**, so only a test
that checks the values catches it.

| Switch | Where | The bug |
| --- | --- | --- |
| `bug=cost` | Stock page, buying | For 2 or more shares the total cost and the money taken are one share too high. The summary, the confirm box, the success message and the cash all agree with the wrong number |
| `bug=gain` | Portfolio | Every holding's gain, and the total gain, show with the wrong sign |
| `bug=limit` | Wallet | The $50,000 top-up limit lets one more top-up through, up to $60,000 in total |
| `bug=sort` | Portfolio | **Sort by gain** puts the smallest gain first |
| `bug=search` | Market | The search box only matches when the letter case is exact, so `kryl` finds nothing |

### The 4 drifts

Drift makes the app look like a newer version where things were renamed or moved, for
practising self-healing tests. Messages and error texts never change, and `drift=all` turns
on all four.

`drift=text` renames eleven labels, and nothing else:

| Today | With drift |
| --- | --- |
| Log in | Sign in |
| Log out | Sign out |
| Market (menu link) | Stocks |
| Search stocks | Find a stock |
| How many shares? | Quantity |
| Buy 5 KRYL | Place buy order |
| Sell 5 KRYL | Place sell order |
| Confirm buy | Yes, buy |
| Confirm sell | Yes, sell |
| Add $5,000 | Top up $5,000 |
| Save changes | Update profile |

`drift=ids` turns every `data-testid` into `tl-` plus the old id with its hyphens changed to
underscores, so `login-submit` becomes `tl-login_submit`. It reaches the ids inside the news
box's shadow root and inside the payment frame too.

`drift=layout` moves three things: the trade box goes to the left of the chart on the Stock
page, **Wallet** goes in front of **Portfolio** in the top menu, and the three number cards
on the Market page come out in reverse order. Same elements, same text, same ids.

`drift=popup` shows two popups, each once per browser tab. Two seconds after the first
logged-in page, a **cookie banner** slides up and covers the lower part of the page
(*We use cookies to remember your settings.*, **Accept** and **Reject**). On the first visit
to a Stock page, a `<dialog>` opens on top (**Try Tradeloom Pro**, **No thanks** and
**Learn more**). Both really block clicks, which is what `page.addLocatorHandler` is for.

**The Test switches page is never drifted**, so there is always a way back.

## The API

`/api` is a small set of server functions, for API testing. The pages never use it. There is
still no database: the answers come from the same JSON files and the same price and news
engines the pages use, so the same seed and the same time give the same answer on both
sides. The root `package.json` only says `{ "private": true, "type": "module" }` — there are
no dependencies and no build step.

**The API only runs on Vercel.** `python -m http.server` serves the pages but not `/api`.

Every answer is JSON with `Content-Type: application/json`, `Cache-Control: no-store` and
`Access-Control-Allow-Origin: *`. Errors look like `{ "error": "<plain sentence>" }`. A
wrong method gives **405** with an `Allow` header. `?seed=` works like it does in the app,
`?at=` takes an ISO time or a number of milliseconds and defaults to now, and the `slow`,
`api` and `flaky` switches work here too.

| Method and address | Answer |
| --- | --- |
| `GET /api/health` | `200` `{ "status": "ok", "version": "1.6.0" }` |
| `GET /api/stocks` | `200` a list of `{ symbol, name, about }` for all 8 stocks |
| `GET /api/prices?seed=42&at=…` | `200` a list of `{ symbol, priceCents, openCents, changeCents, changePercent, at }` |
| `GET /api/prices/KRYL?seed=42&at=…` | `200` one of those. An unknown symbol gives `404` |
| `GET /api/news?seed=42&at=…&stock=KRYL&limit=10&offset=0` | `200` `{ total, items: [{ id, stock, headline, summary, time }] }`. `limit` is 1 to 60 and defaults to 10 |
| `POST /api/login` with `{ email, password }` | `200` `{ email, displayName, token }`. A wrong pair gives `401`, a missing field or broken JSON gives `400` |

The token is `demo-` plus a short made-up string, worked out from the seed and the email.
It is only for practice: nothing checks it.

## Changelog

[/changelog](/changelog) lists every version of Tradeloom, newest first. A small **v1.6.0**
link to it sits on the Rules page and the Test switches page, and nowhere else.

## Pages

- `/` log in
- `/market` all stocks
- `/stock?symbol=KRYL` one stock, with the chart and the trade box
- `/portfolio` what you own
- `/news` made-up market news, 10 at a time
- `/wallet` cash, adding practice money, start over and history
- `/receipt?id=h3` one receipt from your history, printable, in its own tab
- `/profile` your photo, details, account ID and theme
- `/rules` every rule the app follows
- `/switches` turn test switches on and off, and copy the link
- `/changelog` every version of Tradeloom, newest first

Every rule the app follows is written on the [Rules page](/rules). If the app does
something different, that is a bug.
