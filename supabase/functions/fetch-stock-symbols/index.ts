import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

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

// Rate limiting config: 50 requests per minute
const RATE_LIMIT_MAX = 50;
const RATE_LIMIT_ENDPOINT = 'fetch-stock-symbols';

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
    return true;
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
        JSON.stringify({ error: 'Authentication required' }),
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
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    
    // Use user ID for rate limiting
    const allowed = await checkRateLimit(userId);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', stocks: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

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

    // Handle case where API doesn't return an array (error response or empty)
    if (!Array.isArray(symbolsData)) {
      console.log(`API returned non-array for ${exchange}:`, symbolsData);
      const errorMessage = symbolsData?.error?.includes('limit') 
        ? 'API rate limit reached. Please wait a moment and try again.'
        : 'No stocks found for this exchange';
      return new Response(
        JSON.stringify({ stocks: [], error: errorMessage, rateLimited: symbolsData?.error?.includes('limit') }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${symbolsData.length} stocks for ${exchange} exchange`);

    // Reduced batch size to avoid hitting API rate limits (Finnhub free tier: 60 calls/min)
    const batchSize = 30;
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
