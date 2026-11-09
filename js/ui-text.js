// Every piece of text people see lives here.

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
    wallet: 'Wallet',
    rules: 'Rules',
    marketOpen: 'Market open',
    marketClosed: 'Market closed',
    cash: 'Cash',
    logout: 'Log out',
    navLabel: 'Main menu',
  },

  marketHours: {
    opensToday: 'Opens today at 9:00.',
    opensTomorrow: 'Opens tomorrow at 9:00.',
    opensMonday: 'Opens again Monday at 9:00.',
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
    chartNote: 'Dashed line = price when the market opened today.',
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
      { key: 'market-hours', title: 'Market hours', body: 'Open Monday to Friday, 9:00 to 17:00 Dhaka time. When closed, you can look but not trade.' },
      { key: 'prices', title: 'Prices', body: 'Move a little every 5 seconds. Made-up, but the same every time with the same seed.' },
      { key: 'your-data', title: 'Your data', body: 'Saved in your browser only. A new browser starts fresh.' },
    ],
    switchesTitle: 'Test switches',
    switchName: '?seed=42',
    switchBody: 'Same prices every time',
    switchesNote: 'More switches come in a later version.',
  },

  notFound: {
    title: 'Page not found',
    body: 'This page doesn\'t exist.',
  },
});

export const TIME_TEXT = Object.freeze({
  today: 'Today',
  yesterday: 'Yesterday',
  months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
});

// --- text that needs values filled in ---

export function sharesWord(count) {
  return count === 1 ? '1 share' : `${count} shares`;
}

export function marketClosedMessage(nextOpenSentence) {
  return `Market is closed. You can look at prices, but you can\'t buy or sell right now. ${nextOpenSentence}`;
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

export function addedSoFarText(totalAddedText) {
  return `Added so far ${totalAddedText} of $50,000`;
}

export function addedMessage(amountLabel, cashNowText) {
  return `Added ${amountLabel}. Cash now: ${cashNowText}.`;
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
