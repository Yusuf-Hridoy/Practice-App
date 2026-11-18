// Every piece of text people see lives here.

// The version this app says it is. The Changelog, the version link and
// GET /api/health all read it from here.
export const APP_VERSION = '1.6.0';


export const TEXT = Object.freeze({
  brand: 'Tradeloom',

  common: {
    backToMarket: 'Back to market',
    goToMarket: 'Go to market',
    seePortfolio: 'See portfolio',
    cancel: 'Cancel',
    login: 'Log in',
    tryAgain: 'Try again',
    upArrow: '▲',
    downArrow: '▼',
  },

  menu: {
    market: 'Market',
    portfolio: 'Portfolio',
    watchlist: 'Watchlist',
    news: 'News',
    wallet: 'Wallet',
    rules: 'Rules',
    marketOpen: 'Market open',
    marketClosed: 'Market closed',
    cash: 'Cash',
    logout: 'Log out',
    navLabel: 'Main menu',
  },

  login: {
    practicePill: 'Practice money only',
    heading: 'Learn to trade. Lose nothing.',
    blurb: 'Start with $10,000 of fake money. Buy and sell made-up stocks. Watch your gains go up and down.',
    cardTitle: 'Log in',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    submit: 'Log in',
    demoTitle: 'Demo accounts',
    demoPassword: 'Password: Play123!',
    use: 'Use',
    footer: 'A practice app for test automation. No real money, no real companies.',
    howItWorks: 'How it works',
    missingFields: 'Enter your email and password.',
    wrongPair: 'Wrong email or password. Try again.',
    checkFailed: "We couldn't check your details. Try again.",
    idleInfo: 'You were logged out after 15 minutes of no activity.',
  },

  market: {
    title: 'Market',
    statTotalWorth: 'Your total worth',
    statToday: 'Today',
    statTodayNote: 'Your stocks since the market opened',
    statCash: 'Cash to spend',
    searchLabel: 'Search stocks',
    searchPlaceholder: 'Search by name or symbol',
    filterAll: 'All stocks',
    filterUp: 'Going up',
    filterDown: 'Going down',
    filterOwned: 'I own',
    refreshNote: 'Prices update every 5 seconds',
    colWatch: 'Watch',
    colStock: 'Stock',
    colPrice: 'Price',
    colToday: 'Today',
    colLastHour: 'Last hour',
    colOwned: 'You own',
    colTrade: 'Trade',
    trade: 'Trade',
    noneOwned: '-',
    clearSearch: 'Clear search',
    emptyHint: 'Try a different name or symbol, like KRYL.',
    emptyOwned: 'You don\'t own any stocks yet.',
    errorTitle: 'Couldn\'t load prices',
    errorBody: 'The server had a problem. Your money is safe. Try again.',
    footer: 'All companies are made up. Prices are random but repeatable with a seed.',
  },

  stock: {
    notFoundTitle: 'Page not found',
    madeUp: 'Made-up company.',
    todaySuffix: 'today',
    rangeHour: '1 hour',
    rangeToday: 'Today',
    chartNote: 'Dashed line = price at the start of today.',
    chartKeysLabel: 'Price chart. Use the arrow keys to read the price at each point.',
    factsTitle: 'Today',
    factOpen: 'Opened today at',
    factHigh: 'Highest today',
    factLow: 'Lowest today',
    factOwned: 'You own',
    factAvgPaid: 'You paid on average',
    none: '-',
    tabBuy: 'Buy',
    tabSell: 'Sell',
    sharesLabel: 'How many shares?',
    oneLess: 'One less share',
    oneMore: 'One more share',
    wholeSharesOnly: 'Whole shares only',
    summaryPrice: 'Price per share',
    summaryShares: 'Shares',
    summaryTotalBuy: 'Total cost',
    summaryTotalSell: 'You get',
    summaryCashAfter: 'Cash after',
    tradeNote: 'No fees. Price may move a little before you confirm.',
    confirmPrice: 'Price',
    confirmPriceNow: 'Price now',
    confirmShares: 'Shares',
    confirmTotal: 'Total',
    confirmYouGet: 'You get',
    confirmGain: 'Gain on these',
    confirmBuy: 'Confirm buy',
    confirmSell: 'Confirm sell',
    makeAnotherTrade: 'Make another trade',
  },

  portfolio: {
    title: 'My portfolio',
    buyMore: 'Buy more stocks',
    statTotalWorth: 'Total worth',
    statTotalWorthNote: 'Cash + stocks',
    statCash: 'Cash',
    statStocksWorth: 'Stocks are worth',
    statTotalGain: 'Total gain',
    allocationTitle: 'Where your money is',
    cashLegend: 'Cash',
    holdingsTitle: 'Stocks you own',
    sortLabel: 'Sort holdings',
    sortGain: 'Sort by gain',
    sortValue: 'Sort by value',
    sortName: 'Sort by name',
    colStock: 'Stock',
    colShares: 'Shares',
    colAvg: 'Paid per share',
    colPrice: 'Price now',
    colWorth: 'Worth now',
    colGain: 'Gain',
    buy: 'Buy',
    sell: 'Sell',
    help: 'How gain works: worth now minus what you paid.',
    emptyTitle: 'You don\'t own any stocks yet',
  },

  wallet: {
    title: 'Wallet',
    cashTitle: 'Cash to spend',
    addTitle: 'Add practice money',
    choice1000: '$1,000',
    choice5000: '$5,000',
    choice10000: '$10,000',
    addNote: 'You can add up to $50,000 in total. It\'s all fake money.',
    startOverTitle: 'Start over',
    startOverBody: 'Puts your account back to how it started. This can\'t be undone.',
    startOverButton: 'Start over',
    startOverDialogTitle: 'Start over?',
    startOverDialogBody: 'Your trades and added money will be wiped.',
    startOverConfirm: 'Yes, start over',
    startOverDone: 'Your account is back to how it started.',
    historyTitle: 'History',
    colWhen: 'When',
    colWhat: 'What',
    colAmount: 'Amount',
    colCashAfter: 'Cash after',
    historyNote: 'Newest first. Every buy, sell and money top-up shows here.',
    download: 'Download CSV',
    historyStart: 'Starting money',
    historyAdd: 'Added practice money',
    colReceipt: 'Receipt',
    openReceipt: 'Open',
    filterTypeLabel: 'Type',
    filterAllTypes: 'All types',
    filterBuys: 'Buys',
    filterSells: 'Sells',
    filterTopUps: 'Top-ups',
    filterFromLabel: 'From',
    filterToLabel: 'To',
    clearFilters: 'Clear filters',
    datesBackwards: 'The From date must be on or before the To date.',
    historyEmpty: 'No history matches these filters.',
    previous: 'Previous',
    next: 'Next',
  },

  payment: {
    stepTitle: 'Pay by card',
    frameTitle: 'Card payment',
    testCardsTitle: 'Test cards',
    cardWorks: 'Payment works',
    declined: 'Your card was declined. Try another card.',
    noFunds: "Your card doesn't have enough funds.",
    unknownCard: "We don't know this test card. Use one from the list.",
    brand: 'PayDemo',
    brandNote: 'Practice payments. No real money.',
    nameLabel: 'Name on card',
    namePlaceholder: 'As printed on the card',
    numberLabel: 'Card number',
    expiryLabel: 'Expiry (MM/YY)',
    cvcLabel: 'CVC',
    processing: 'Processing…',
    nameMissing: 'Enter the name on the card.',
    numberBad: 'Enter a 16-digit card number.',
    expiryBad: 'Enter a valid expiry date.',
    expiryPast: 'This card has expired.',
    cvcBad: 'Enter the 3-digit code on the back.',
  },

  receipt: {
    title: 'Tradeloom receipt',
    print: 'Print',
    backToWallet: 'Back to wallet',
    practiceNote: 'Practice money only. Not a real receipt.',
    notFoundTitle: 'Receipt not found',
    notFoundBody: "We couldn't find this receipt in your history.",
    bought: 'Bought',
    sold: 'Sold',
    pricePerShare: 'Price per share',
    total: 'Total',
    added: 'Added',
    paidWith: 'Paid with',
    card: 'Card',
    startingMoney: 'Starting money',
    cashAfter: 'Cash after',
    dhakaTime: 'Dhaka time',
  },

  rules: {
    title: 'How Tradeloom works',
    intro: 'Every rule the app follows. If the app does something different, that\'s a bug.',
    cards: [
      { key: 'starting-money', title: 'Starting money', body: 'Every account starts with $10,000. You can add more, up to $50,000 in total.' },
      { key: 'shares', title: 'Shares', body: 'Whole shares only. At least 1. No half shares.' },
      { key: 'buying', title: 'Buying', body: 'Cost = shares × price. You can\'t spend more cash than you have.' },
      { key: 'selling', title: 'Selling', body: 'You get shares × today\'s price. You can\'t sell more than you own.' },
      { key: 'gain', title: 'Gain', body: 'Worth now minus what you paid. ▲ is up, ▼ is down.' },
      { key: 'average-price', title: 'Average price', body: 'If you buy the same stock more than once, we use the average of what you paid.' },
      { key: 'fees', title: 'Fees', body: 'None. What you see is what you pay.' },
      { key: 'market-hours', title: 'Market hours', body: 'Open all day, every day. Add ?market=closed to any link to test the closed market.' },
      { key: 'prices', title: 'Prices', body: 'Move a little every 5 seconds. Made-up, but the same every time with the same seed.' },
      { key: 'your-data', title: 'Your data', body: 'Saved in your browser only. A new browser starts fresh.' },
      { key: 'watchlist', title: 'Watchlist', body: 'Up to 6 stocks. One alert per stock. An alert fires once when the price crosses it, then shows Hit.' },
      { key: 'profile', title: 'Profile', body: 'Photos must be PNG, JPG or WebP, up to 1 MB. You must be 18 or older. Your theme is saved for your account.' },
      { key: 'payments', title: 'Payments', body: 'Adding money needs a test card. Receipts open in a new tab. History shows 10 rows per page.' },
      { key: 'news-safety', title: 'News and safety', body: 'News is made up. When you go offline, buying stops. After 15 minutes with no activity, you\'re logged out.' },
    ],
    switchesTitle: 'Test switches',
    switchesLink: 'Test switches',
    switchesNote: 'Put any of these in a link. They are copied onto every link you follow from there.',
    switchList: [
      { name: '?seed=42', body: 'Same prices every time' },
      { name: '?market=closed', body: 'Closes the market. You can look at prices, but not buy or sell' },
      { name: '?slow=3000', body: 'Every data load waits that many milliseconds, 0 to 10000' },
      { name: '?api=500', body: 'Every data load fails like a server error' },
      { name: '?flaky=on', body: 'Some data loads fail or lag, decided by the seed' },
      { name: '?bug=cost,gain,limit,sort,search', body: 'Turns on those bugs. Pick one or more' },
      { name: '?drift=text,ids,layout,popup', body: 'Renames labels, changes test ids, moves parts, shows popups. drift=all turns on all four' },
    ],
  },

  watchlist: {
    title: 'Watchlist',
    intro: 'Stocks you want to keep an eye on. Drag to change the order. Up to 6 stocks.',
    browserAlertsButton: 'Turn on browser alerts',
    removeAll: 'Remove all',
    removeAllConfirm: 'Remove all stocks from your watchlist?',
    addLabel: 'Add a stock',
    add: 'Add',
    full: 'Your watchlist is full. Remove a stock to add another.',
    emptyTitle: 'Your watchlist is empty',
    emptyBody: 'Add a stock above, or tap the ☆ on the Market page.',
    colPrice: 'Price',
    colToday: 'Today',
    alertButton: 'Alert',
    noAlert: 'No alert',
    dragHandle: '⋮⋮',
    removeMark: '×',
    starOn: '★',
    starOff: '☆',
    keyHintPress: 'Press',
    keyHintSearch: 'to search',
    keyHintDot: '·',
    keyHintClose: 'to close',
    keySlash: '/',
    keyEsc: 'Esc',
  },

  browserAlerts: {
    granted: 'Browser alerts are on.',
    denied: "Your browser blocked alerts. You'll still see pop-ups in the app.",
    off: 'Browser alerts are off.',
    unsupported: "This browser can't show alerts.",
  },

  alertEditor: {
    closedHint: 'Press Alert on a stock to set a price alert.',
    legend: 'Alert me when the price goes',
    above: 'Above',
    below: 'Below',
    priceLabel: 'Alert price',
    priceInputLabel: 'Alert price in dollars',
    popupLabel: 'Show a pop-up message in the app',
    browserLabel: 'Also send a browser notification',
    browserHint: 'Turn on browser alerts first.',
    save: 'Save alert',
    delete: 'Delete alert',
    close: 'Close',
    deleted: 'Alert deleted.',
    noChannel: 'Pick at least one way to be told.',
    note: 'An alert fires once, then shows Hit. Prices are checked every 5 seconds.',
  },

  profile: {
    title: 'Profile',
    intro: 'Your details stay in this browser only.',

    photoTitle: 'Photo',
    photoLabel: 'Profile photo',
    dropHere: 'Drop a photo here, or choose a file',
    photoHint: 'PNG, JPG or WebP. Up to 1 MB.',
    removePhoto: 'Remove photo',
    photoSaved: 'Photo saved.',
    photoRemoved: 'Photo removed.',
    oneAtATime: 'Drop one photo at a time.',
    wrongType: 'Pick a PNG, JPG or WebP image.',
    tooBig: 'This photo is too big. Pick one under 1 MB.',
    photoSaveFailed: "Couldn't save this photo. Try a smaller one.",
    photoReadFailed: "Couldn't read this photo. Pick another one.",

    accountTitle: 'Account',
    accountIdLabel: 'Account ID',
    copyAccountId: 'Copy account ID',
    copied: 'Copied!',
    copyDone: 'Account ID copied.',
    copyFailed: "Couldn't copy. Select the ID and copy it yourself.",

    themeLegend: 'Theme',
    themeDark: 'Dark',
    themeLight: 'Light',
    themeDevice: 'Match my device',

    detailsTitle: 'Your details',
    displayNameLabel: 'Display name',
    displayNameError: 'Use 2 to 30 letters, numbers or spaces.',
    birthDateLabel: 'Date of birth',
    birthDateNotReal: 'Enter a real date of birth.',
    birthDateFuture: "Date of birth can't be in the future.",
    birthDateYoung: 'You must be 18 or older.',
    countryLabel: 'Country',
    chooseCountry: 'Choose a country',
    sectorsLabel: 'Favorite sectors',
    sectorsHint: 'Hold Ctrl (Cmd on a Mac) to pick more than one.',
    sectorsTooMany: 'Pick up to 3 sectors.',
    emailsLegend: 'Email me about',
    selectAll: 'Select all',
    emailAlerts: 'Price alerts',
    emailSummary: 'Weekly summary',
    emailNews: 'News and tips',

    save: 'Save changes',
    saved: 'Your changes are saved.',
    saveFailed: "Couldn't save your changes. Your browser's storage is full.",
    unsaved: 'You have unsaved changes.',
    undo: 'Undo changes',
  },

  news: {
    title: 'News',
    intro: 'Made-up headlines for practice. Not real news.',
    boxTitle: 'Market news',
    hide: 'Hide',
    show: 'Show',
    seeAll: 'See all news',
    filterAll: 'All',
    filterMarket: 'Market',
    marketTag: 'Market',
    filtersLabel: 'Filter news by stock',
    readMore: 'Read more',
    showLess: 'Show less',
    loading: 'Loading more news\u2026',
    end: 'You\'ve reached the end.',
    backToTop: 'Back to top',
    justNow: 'Just now',
  },

  connection: {
    offlineBanner: 'You\'re offline. Prices are paused and buying is turned off.',
    blocked: 'You\'re offline. Try again when you\'re back online.',
    backOnline: 'You\'re back online.',
  },

  idle: {
    dialogTitle: 'Are you still there?',
    bodyStart: 'You\'ll be logged out in ',
    bodyEnd: ' because nothing happened for 14 minutes.',
    logoutNow: 'Log out now',
    stay: 'Stay logged in',
  },

  toast: {
    close: 'Close message',
  },

  notFound: {
    title: 'Page not found',
    body: 'This page doesn\'t exist.',
  },

  switches: {
    barPrefix: 'Test switches on:',
    change: 'Change',
    title: 'Test switches',
    intro: 'Turn on switches to make the app slow, broken or different. For practice only.',
    speedLegend: 'Speed and errors',
    slowLabel: 'Slow loading',
    slowOff: 'Off',
    slow1000: '1 second',
    slow3000: '3 seconds',
    slow5000: '5 seconds',
    apiLabel: 'Data fails to load',
    flakyLabel: 'Flaky mode',
    bugsLegend: 'Bugs',
    bugCost: 'Wrong total cost',
    bugGain: 'Gain shows wrong sign',
    bugLimit: 'Limit lets you pass $50,000',
    bugSort: 'Sort goes the wrong way',
    bugSearch: 'Search is case-sensitive',
    driftLegend: 'Drift',
    driftText: 'Renamed buttons',
    driftIds: 'Changed test ids',
    driftLayout: 'Moved layout',
    driftPopup: 'Surprise popups',
    linkTitle: 'Your link',
    copy: 'Copy link',
    copied: 'Copied!',
    copyFailed: "Couldn't copy. Select the link and copy it yourself.",
    open: 'Open with these switches',
    turnOff: 'Turn all off',
  },

  popups: {
    cookieBody: 'We use cookies to remember your settings.',
    cookieAccept: 'Accept',
    cookieReject: 'Reject',
    proTitle: 'Try Tradeloom Pro',
    proBody: 'Get faster prices and more charts.',
    proNoThanks: 'No thanks',
    proLearnMore: 'Learn more',
  },

  changelog: {
    title: 'Changelog',
    intro: 'Every version of Tradeloom, newest first.',
    versionLabel: 'v1.6.0',
    versions: [
      {
        version: '1.6.0',
        title: 'Test switches, API and this page',
        lines: [
          'Switches in the link make the app slow, broken or different.',
          'A small API under /api, for API testing.',
          'A Test switches page that builds the link for you.',
          'This changelog.',
        ],
      },
      {
        version: '1.5.0',
        title: 'News, chart hover, offline and idle log out',
        lines: [
          '60 made-up headlines, with a news box on the Market page.',
          'Hover or use the arrow keys to read any point on a price chart.',
          'An offline banner pauses prices and turns off buying.',
          'You are logged out after 15 minutes of no activity.',
        ],
      },
      {
        version: '1.4.0',
        title: 'Card payments, receipts and history pages',
        lines: [
          'Adding practice money goes through a card form in a frame.',
          'Every history row has a printable receipt of its own.',
          'The history has type and date filters, and 10 rows per page.',
        ],
      },
      {
        version: '1.3.0',
        title: 'Profile',
        lines: [
          'A photo, display name, date of birth, country and favorite sectors.',
          'Dark, Light or Match my device, saved for your account.',
          'An account ID you can copy.',
        ],
      },
      {
        version: '1.2.0',
        title: 'Watchlist',
        lines: [
          'Up to 6 stocks, in the order you drag them into.',
          'One price alert per stock, above or below a price you pick.',
          'A pop-up message in the app, and a browser alert if you allow one.',
        ],
      },
      {
        version: '1.1.0',
        title: 'Market open all day',
        lines: [
          'The market is open all day, every day of the week.',
          'Add market=closed to any link to test the closed market.',
        ],
      },
      {
        version: '1.0.0',
        title: 'First release',
        lines: [
          'Log in with a demo account and $10,000 of practice money.',
          'Buy and sell 8 made-up stocks with prices that move every 5 seconds.',
          'A market page, a portfolio and a wallet with history.',
        ],
      },
    ],
  },

  api: {
    useGet: 'Use GET for this address.',
    usePost: 'Use POST for this address.',
    badAt: 'The at value must be a date and time.',
    badLimit: 'The limit must be a whole number from 1 to 60.',
    badOffset: 'The offset must be a whole number, 0 or more.',
    loginFields: 'Send an email and a password.',
    serverProblem: 'The server had a problem. Try again.',
  },
});

export const TIME_TEXT = Object.freeze({
  today: 'Today',
  yesterday: 'Yesterday',
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
});

// --- text that needs values filled in ---

// The accessible name of the profile circle in the top menu. The visible text
// comes first so that what a person reads is part of what a screen reader says.
export function profileCircleLabel(visibleName) {
  return `${visibleName}, your profile`;
}

export function sharesWord(count) {
  return count === 1 ? '1 share' : `${count} shares`;
}

export function marketClosedMessage() {
  return `Market is closed. You can look at prices, but you can\'t buy or sell right now. Remove market=closed from the link to open it.`;
}

export function badSharesMessage() {
  return 'Enter a whole number of shares, 1 or more.';
}

export function notEnoughCashMessage(shares, symbol, costText, cashText, maxShares) {
  return `Not enough cash. ${shares} ${symbol} costs ${costText} and you have ${cashText}. You can buy up to ${maxShares} shares.`;
}

export function cannotAffordOneMessage(symbol) {
  return `You don\'t have enough cash to buy 1 share of ${symbol}.`;
}

export function ownNoneMessage(symbol) {
  return `You don\'t own any ${symbol}.`;
}

export function ownFewerMessage(owned, symbol) {
  return `You only own ${owned} ${symbol}. Enter ${owned} or less.`;
}

export function addLimitLeftMessage(leftText) {
  return `You can add up to ${leftText} more.`;
}

export function addLimitReachedMessage() {
  return 'You have reached the $50,000 limit.';
}

export function stockMissingMessage(symbol) {
  return `There\'s no stock called ${symbol}.`;
}

export function noMatchMessage(searchText) {
  return `No stocks match "${searchText}".`;
}

export function maxButtonText(count) {
  return `Max: ${count}`;
}

export function buyButtonText(shares, symbol) {
  return `Buy ${shares} ${symbol}`;
}

export function sellButtonText(shares, symbol) {
  return `Sell ${shares} ${symbol}`;
}

export function confirmBuyTitle(shares, symbol) {
  return `Buy ${shares} ${symbol}?`;
}

export function confirmSellTitle(shares, symbol) {
  return `Sell ${shares} ${symbol}?`;
}

export function boughtTitle(shares, symbol) {
  return `You bought ${shares} ${symbol}`;
}

export function soldTitle(shares, symbol) {
  return `You sold ${shares} ${symbol}`;
}

export function boughtDetail(paidText, cashLeftText) {
  return `Paid ${paidText}. Cash left: ${cashLeftText}.`;
}

export function soldDetail(gotText, cashNowText) {
  return `Got ${gotText}. Cash now: ${cashNowText}.`;
}

export function priceMovedDetail(priceText) {
  return `The price changed to ${priceText} before you confirmed.`;
}

export function changeLine(signedMoney, signedPercent, arrow) {
  return `${signedMoney} (${signedPercent}) ${arrow} today`;
}

export function gainOnLabel(symbol) {
  return `Your gain on ${symbol}`;
}

export function ownedSharesText(shares) {
  return sharesWord(shares);
}

export function portfolioEmptyBody(cashText) {
  return `You have ${cashText} to start. Pick a stock and buy your first share.`;
}

export function gainPercentNote(percentText) {
  return `${percentText} on what you paid`;
}

export function paidNote(totalPaidText) {
  return `You paid ${totalPaidText}`;
}

export function addButtonText(amountLabel) {
  return `Add ${amountLabel}`;
}

// --- the labels the drift=text switch swaps in ---
//
// Eleven labels, and nothing else. Messages and error texts never change.
// js/drift.js is the only file that reads this.

export const DRIFT_TEXT = Object.freeze({
  swaps: Object.freeze({
    'Log in': 'Sign in',
    'Log out': 'Sign out',
    Market: 'Stocks',
    'Search stocks': 'Find a stock',
    'How many shares?': 'Quantity',
    'Confirm buy': 'Yes, buy',
    'Confirm sell': 'Yes, sell',
    'Save changes': 'Update profile',
  }),
  buyMainButton: 'Place buy order',
  sellMainButton: 'Place sell order',
  addButtonWord: 'Top up',
});

export function driftAddButtonText(amountLabel) {
  return `${DRIFT_TEXT.addButtonWord} ${amountLabel}`;
}

export function addedSoFarText(totalAddedText) {
  return `Added so far ${totalAddedText} of $50,000`;
}

export function addedWithCardMessage(amountLabel, last4, cashNowText) {
  return `Added ${amountLabel} with card ending ${last4}. Cash now: ${cashNowText}.`;
}

// --- card payment ---

export function payingLine(amountLabel) {
  return `Paying ${amountLabel}`;
}

export function payButtonText(amountLabel) {
  return `Pay ${amountLabel}`;
}

export function cardEndingText(last4) {
  return `Card ending ${last4}`;
}

// --- history, receipts, filters and pages ---

export function historyAddWithCard(last4) {
  return `Added practice money · card ending ${last4}`;
}

export function shortBought(shares, symbol) {
  return `Bought ${shares} ${symbol}`;
}

export function shortSold(shares, symbol) {
  return `Sold ${shares} ${symbol}`;
}

export function receiptLinkLabel(whatText) {
  return `Open receipt for ${whatText}`;
}

export function showingText(first, last, total) {
  return `Showing ${first} to ${last} of ${total}`;
}

export function pageButtonLabel(page) {
  return `Page ${page}`;
}

export function receiptNumberText(accountId, historyId) {
  return `#${accountId}-${String(historyId).toUpperCase()}`;
}

export function receiptDateText(stamp) {
  return `${stamp} Dhaka time`;
}

export function sharesOfText(shares, symbol) {
  return `${shares} ${symbol}`;
}

export function historyBought(shares, symbol, priceText) {
  return `Bought ${shares} ${symbol} at ${priceText}`;
}

export function historySold(shares, symbol, priceText) {
  return `Sold ${shares} ${symbol} at ${priceText}`;
}

export function chartLabelToday(symbol, fromText, toText) {
  return `${symbol} price today, from ${fromText} to ${toText}`;
}

export function chartLabelHour(symbol, fromText, toText) {
  return `${symbol} price over the last hour, from ${fromText} to ${toText}`;
}

export function allocationLegendItem(name, percentText) {
  return `${name} ${percentText}`;
}

// --- watchlist ---

export function watchlistOptionText(symbol, name) {
  return `${symbol} · ${name}`;
}

export function moveHandleLabel(symbol) {
  return `Move ${symbol}`;
}

export function removeFromWatchlistLabel(symbol) {
  return `Remove ${symbol}`;
}

export function setAlertLabel(symbol) {
  return `Set alert for ${symbol}`;
}

export function addStarLabel(symbol) {
  return `Add ${symbol} to watchlist`;
}

export function removeStarLabel(symbol) {
  return `Remove ${symbol} from watchlist`;
}

export function movedMessage(symbol, position, total) {
  return `${symbol} moved to position ${position} of ${total}.`;
}

export function removedFromWatchlistMessage(symbol) {
  return `${symbol} removed from your watchlist.`;
}

export function alertPillText(directionWord, priceText) {
  return `${directionWord} ${priceText}`;
}

export function alertHitAtPill(clockText) {
  return `Hit at ${clockText}`;
}

export function alertHitOnPill(dateText) {
  return `Hit on ${dateText}`;
}

// --- alert editor ---

export function alertEditorTitle(symbol) {
  return `Price alert for ${symbol}`;
}

export function alertPriceNowLine(priceText) {
  return `Price now: ${priceText}`;
}

export function alertRangeEndLow(priceText) {
  return `${priceText} (-20%)`;
}

export function alertRangeEndHigh(priceText) {
  return `${priceText} (+20%)`;
}

export function alertRangeError(lowText, highText) {
  return `Enter a price between ${lowText} and ${highText}.`;
}

export function alertAboveError(priceText) {
  return `For an Above alert, pick a price higher than ${priceText}.`;
}

export function alertBelowError(priceText) {
  return `For a Below alert, pick a price lower than ${priceText}.`;
}

export function alertSavedMessage(symbol, directionWord, priceText) {
  return `Alert saved. We'll tell you when ${symbol} goes ${directionWord} ${priceText}.`;
}

// --- pop-up messages ---

export function toastTitle(symbol, directionWord, priceText) {
  return `${symbol} went ${directionWord} ${priceText}`;
}

export function toastDetail(priceText) {
  return `Now ${priceText}.`;
}

// --- chart hover ---

// What the hidden status line says on each move, like "14:25, $141.92".
export function chartPointText(timeText, priceText) {
  return `${timeText}, ${priceText}`;
}

// --- news ---

export function minutesAgoText(minutes) {
  return `${minutes} min ago`;
}

export function hoursAgoText(hours) {
  return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
}

export function yesterdayAtText(clockText) {
  return `${TIME_TEXT.yesterday} ${clockText}`;
}

export function dateAtText(dateText, clockText) {
  return `${dateText} ${clockText}`;
}

export function shortDateText(day, monthName) {
  return `${day} ${monthName}`;
}

export function newsCountText(shown, total) {
  return `Showing ${shown} of ${total}`;
}

// --- idle log out ---

// A countdown like "0:59".
export function idleCountdownText(secondsLeft) {
  const safe = Math.max(0, secondsLeft);
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

// --- profile ---

export function problemsMessage(count) {
  return count === 1 ? 'Fix the 1 problem below.' : `Fix the ${count} problems below.`;
}
