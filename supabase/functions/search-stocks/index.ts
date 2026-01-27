import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const searchSchema = z.object({
  query: z.string()
    .trim()
    .min(1, "Search query is required")
    .max(50, "Search query too long")
    .regex(/^[a-zA-Z0-9\s.\-&]+$/, "Invalid characters in search query")
});

// Rate limiting config: 60 requests per minute
const RATE_LIMIT_MAX = 60;
const RATE_LIMIT_ENDPOINT = 'search-stocks';

async function checkRateLimit(identifier: string): Promise<boolean> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: identifier,
    p_endpoint: RATE_LIMIT_ENDPOINT,
    p_max_requests: RATE_LIMIT_MAX,
    p_window_seconds: 60
  });
  
  if (error) {
    console.error('Rate limit check error:', error);
    return true; // Allow on error to prevent blocking legitimate requests
  }
  
  return data === true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required', stocks: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token', stocks: [] }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    
    // Use user ID for rate limiting
    const allowed = await checkRateLimit(userId);
    if (!allowed) {
      console.log('Rate limit exceeded for user:', userId);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', stocks: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    const body = await req.json();
    
    // Validate input
    const parseResult = searchSchema.safeParse(body);
    if (!parseResult.success) {
      console.log('Validation failed:', parseResult.error.issues);
      return new Response(
        JSON.stringify({ error: 'Invalid search query', stocks: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { query } = parseResult.data;
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
          let eps = null;
          let revenuePerShare = null;
          let profitMargin = null;

          if (metricResult.status === 'fulfilled' && metricResult.value.metric) {
            week52High = metricResult.value.metric['52WeekHigh'];
            week52Low = metricResult.value.metric['52WeekLow'];
            peRatio = metricResult.value.metric['peBasicExclExtraTTM'] || metricResult.value.metric['peTTM'];
            dividendYield = metricResult.value.metric['dividendYieldIndicatedAnnual'];
            eps = metricResult.value.metric['epsBasicExclExtraItemsTTM'] || metricResult.value.metric['epsTTM'];
            revenuePerShare = metricResult.value.metric['revenuePerShareTTM'];
            profitMargin = metricResult.value.metric['netProfitMarginTTM'];
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
            dividendYield: dividendYield,
            eps: eps,
            revenuePerShare: revenuePerShare,
            profitMargin: profitMargin
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
