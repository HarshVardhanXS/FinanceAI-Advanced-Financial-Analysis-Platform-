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

          // Fetch candle data for volume, profile for market cap, and metrics for 52-week range in parallel
          const now = Math.floor(Date.now() / 1000);
          const yesterday = now - 86400;
          let volume = null;
          let marketCap = null;
          let week52High = null;
          let week52Low = null;

          const [candleResult, profileResult, metricResult] = await Promise.allSettled([
            fetch(`https://finnhub.io/api/v1/stock/candle?symbol=${result.symbol}&resolution=D&from=${yesterday}&to=${now}&token=${apiKey}`).then(r => r.json()),
            fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${result.symbol}&token=${apiKey}`).then(r => r.json()),
            fetch(`https://finnhub.io/api/v1/stock/metric?symbol=${result.symbol}&metric=all&token=${apiKey}`).then(r => r.json())
          ]);

          if (candleResult.status === 'fulfilled' && candleResult.value.v?.length > 0) {
            volume = candleResult.value.v[candleResult.value.v.length - 1];
          }

          if (profileResult.status === 'fulfilled' && profileResult.value.marketCapitalization) {
            marketCap = profileResult.value.marketCapitalization;
          }

          let peRatio = null;
          let dividendYield = null;

          if (metricResult.status === 'fulfilled' && metricResult.value.metric) {
            week52High = metricResult.value.metric['52WeekHigh'];
            week52Low = metricResult.value.metric['52WeekLow'];
            peRatio = metricResult.value.metric['peBasicExclExtraTTM'] || metricResult.value.metric['peTTM'];
            dividendYield = metricResult.value.metric['dividendYieldIndicatedAnnual'];
          }

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
            country: exchangeCode,
            volume: volume,
            marketCap: marketCap,
            week52High: week52High,
            week52Low: week52Low,
            peRatio: peRatio,
            dividendYield: dividendYield
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
