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
    const { query } = await req.json();
    console.log('Searching stocks for query:', query);

    const apiKey = Deno.env.get('FINNHUB_API_KEY');
    if (!apiKey) {
      throw new Error('FINNHUB_API_KEY not configured');
    }

    // Search for stock symbols
    const searchUrl = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    console.log('Search results:', searchData);

    if (!searchData.result || searchData.result.length === 0) {
      return new Response(
        JSON.stringify({ stocks: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get detailed quotes for top 20 results to show more international listings
    const topResults = searchData.result.slice(0, 20);
    const stocksWithPrices = await Promise.all(
      topResults.map(async (result: any) => {
        try {
          const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${result.symbol}&token=${apiKey}`;
          const quoteResponse = await fetch(quoteUrl);
          const quoteData = await quoteResponse.json();

          // Extract exchange from displaySymbol (e.g., "HKEX:0700" -> "HKEX")
          const exchangeCode = result.displaySymbol?.includes(':') 
            ? result.displaySymbol.split(':')[0] 
            : result.type || 'US';

          return {
            symbol: result.symbol,
            name: result.description,
            displaySymbol: result.displaySymbol,
            price: quoteData.c?.toFixed(2) || "0.00",
            change: quoteData.d?.toFixed(2) || "0.00",
            changePercent: quoteData.dp?.toFixed(2) || "0.00",
            isPositive: (quoteData.d || 0) >= 0,
            exchange: exchangeCode,
            type: result.type,
            currency: "USD",
            country: exchangeCode
          };
        } catch (error) {
          console.error(`Error fetching quote for ${result.symbol}:`, error);
          return {
            symbol: result.symbol,
            name: result.description,
            displaySymbol: result.displaySymbol,
            price: "0.00",
            change: "0.00",
            changePercent: "0.00",
            isPositive: true,
            exchange: result.displaySymbol?.includes(':') ? result.displaySymbol.split(':')[0] : result.type,
            type: result.type,
            currency: "USD"
          };
        }
      })
    );

    return new Response(
      JSON.stringify({ stocks: stocksWithPrices }),
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
