import cryptoData from '@/config/cryptocurrencies.json';

interface Cryptocurrency {
  id: string;
  symbol: string;
  name: string;
  logo: string;
}

export const CRYPTOCURRENCIES: Cryptocurrency[] = cryptoData;

// Map for quick lookup by CoinGecko ID
export const CRYPTO_BY_ID = CRYPTOCURRENCIES.reduce<Record<string, Cryptocurrency>>(
  (acc, crypto) => {
    acc[crypto.id] = crypto;
    return acc;
  },
  {}
);

// Map for quick lookup by symbol (uppercase)
export const CRYPTO_BY_SYMBOL = CRYPTOCURRENCIES.reduce<Record<string, Cryptocurrency>>(
  (acc, crypto) => {
    acc[crypto.symbol.toUpperCase()] = crypto;
    return acc;
  },
  {}
);

export function getCryptoById(id: string): Cryptocurrency | undefined {
  return CRYPTO_BY_ID[id];
}

export function getCryptoBySymbol(symbol: string): Cryptocurrency | undefined {
  return CRYPTO_BY_SYMBOL[symbol.toUpperCase()];
}

export function searchCryptos(query: string): Cryptocurrency[] {
  const lowerQuery = query.toLowerCase();
  return CRYPTOCURRENCIES.filter(
    (crypto) =>
      crypto.name.toLowerCase().includes(lowerQuery) ||
      crypto.symbol.toLowerCase().includes(lowerQuery) ||
      crypto.id.toLowerCase().includes(lowerQuery)
  );
}
