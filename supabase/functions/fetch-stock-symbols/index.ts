import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exchange = 'US' } = await req.json();
    console.log('Fetching stock symbols for exchange:', exchange);

    const apiKey = Deno.env.get('FINNHUB_API_KEY');
    if (!apiKey) {
      throw new Error('FINNHUB_API_KEY not configured');
    }

    // Fetch stock symbols from Finnhub
    const symbolsUrl = `https://finnhub.io/api/v1/stock/symbol?exchange=${exchange}&token=${apiKey}`;
    const symbolsResponse = await fetch(symbolsUrl);
    const symbolsData = await symbolsResponse.json();

    console.log(`Found ${symbolsData.length} stocks for ${exchange} exchange`);

    // Get quotes for a batch of stocks (increased to 120 for more interactive display)
    const batchSize = 120;
    const symbols = symbolsData.slice(0, batchSize);
    
    const stocksWithPrices = await Promise.all(
      symbols.map(async (stock: any) => {
        try {
          const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${apiKey}`;
          const quoteResponse = await fetch(quoteUrl);
          const quoteData = await quoteResponse.json();

          // Only return stocks with valid price data
          if (quoteData.c && quoteData.c > 0) {
            return {
              symbol: stock.symbol,
              name: stock.description || stock.symbol,
              price: quoteData.c.toFixed(2),
              change: (quoteData.d || 0).toFixed(2),
              changePercent: (quoteData.dp || 0).toFixed(2),
              isPositive: (quoteData.d || 0) >= 0,
              exchange: exchange,
              currency: stock.currency || "USD",
              country: exchange,
              type: stock.type,
              volume: quoteData.v || 0
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching quote for ${stock.symbol}:`, error);
          return null;
        }
      })
    );

    // Filter out null values
    const validStocks = stocksWithPrices.filter(stock => stock !== null);

    return new Response(
      JSON.stringify({ stocks: validStocks }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
