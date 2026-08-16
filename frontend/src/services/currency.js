// Currency service for SplitStellar
// On-chain amounts are always stored in XLM (stroops).
// This service provides display-only conversion to other currencies
// using static approximate rates (configurable when live feeds available).

const CURRENCIES = [
  { id: 'XLM', name: 'Stellar Lumens', symbol: 'XLM', decimals: 7 },
  { id: 'USDC', name: 'USD Coin', symbol: 'USDC', decimals: 7 },
  { id: 'EURC', name: 'Euro Coin', symbol: 'EURC', decimals: 7 },
];

// Approximate static rates (1 XLM -> currency). Override with live feed when available.
const XLM_RATES = {
  XLM: 1,
  USDC: 0.12,
  EURC: 0.11,
};

export function getCurrencies() {
  return CURRENCIES;
}

export function getCurrencyById(id) {
  return CURRENCIES.find(c => c.id === id) || CURRENCIES[0];
}

// Convert an amount in stroops to a display string in the given currency.
export function formatStroops(amountStroops, currencyId = 'XLM') {
  const currency = getCurrencyById(currencyId);
  const xlmValue = amountStroops / 1e7;
  const converted = xlmValue * (XLM_RATES[currencyId] || 1);

  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(converted) + ' ' + currency.symbol;
}

// Convert an amount entered by the user (in the given currency) to XLM stroops.
// NOTE: amount is stored on-chain in XLM, so an XLM->currency conversion happens here.
export function toStroops(amountInput, currencyId = 'XLM') {
  const numericValue = parseFloat(amountInput);
  if (isNaN(numericValue) || numericValue <= 0) return 0;
  const rate = XLM_RATES[currencyId] || 1;
  const xlmValue = numericValue / rate;
  return Math.round(xlmValue * 1e7);
}

// Human readable conversion note e.g. "1 USDC ≈ 8.33 XLM"
export function getRateNote(currencyId) {
  if (currencyId === 'XLM') return null;
  const rate = XLM_RATES[currencyId] || 1;
  return `1 ${currencyId} ≈ ${(1 / rate).toFixed(2)} XLM`;
}
