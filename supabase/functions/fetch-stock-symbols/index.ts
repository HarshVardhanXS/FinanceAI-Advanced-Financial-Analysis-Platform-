import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const exchangeSchema = z.object({
  exchange: z.string()
    .trim()
    .min(1, 'Exchange code is required')
    .max(10, 'Exchange code must be 10 characters or less')
    .regex(/^[A-Z]+$/, 'Exchange code must contain only uppercase letters')
    .optional()
    .default('US')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const validation = exchangeSchema.safeParse(body);
    if (!validation.success) {
      console.log('Validation failed:', validation.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input: ' + validation.error.errors[0].message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { exchange } = validation.data;
    console.log('Fetching stock symbols for exchange:', exchange);

    const apiKey = Deno.env.get('FINNHUB_API_KEY');
    if (!apiKey) {
      throw new Error('FINNHUB_API_KEY not configured');
    }

    // Fetch stock symbols from Finnhub (using encodeURIComponent for safety)
    const symbolsUrl = `https://finnhub.io/api/v1/stock/symbol?exchange=${encodeURIComponent(exchange)}&token=${apiKey}`;
    const symbolsResponse = await fetch(symbolsUrl);
    const symbolsData = await symbolsResponse.json();

    console.log(`Found ${symbolsData.length} stocks for ${exchange} exchange`);

    // Get quotes for a batch of stocks (increased to 120 for more interactive display)
    const batchSize = 120;
    const symbols = symbolsData.slice(0, batchSize);
    
    const stocksWithPrices = await Promise.all(
      symbols.map(async (stock: any) => {
        try {
          const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(stock.symbol)}&token=${apiKey}`;
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
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
