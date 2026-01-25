import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting config: 20 requests per minute (AI endpoints are expensive)
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_ENDPOINT = 'analyze-stock';

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

const symbolSchema = z.object({
  symbol: z.string().trim().min(1).max(5).regex(/^[A-Z]+$/, 'Stock symbol must contain only uppercase letters'),
  marketContext: z.string().optional(),
  requestType: z.string().optional(),
});

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
      console.log('Rate limit exceeded for user:', userId);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    const body = await req.json();
    const validation = symbolSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid stock symbol format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { symbol, marketContext, requestType } = validation.data;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const finnhubKey = Deno.env.get('FINNHUB_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Analyzing stock: ${symbol} for user: ${userId}`);

    // Fetch real stock data first if API key is available
    let stockContext = '';
    if (finnhubKey) {
      try {
        const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`;
        const quoteResponse = await fetch(quoteUrl);
        const quoteData = await quoteResponse.json();
        
        // Finnhub quote data: c=current, d=change, dp=percent change, h=high, l=low, pc=previous close
        if (quoteData.c && quoteData.c !== 0) {
          stockContext = `Current real-time data for ${symbol}:
- Price: $${quoteData.c.toFixed(2)}
- Change: $${quoteData.d.toFixed(2)} (${quoteData.dp.toFixed(2)}%)
- High: $${quoteData.h.toFixed(2)}
- Low: $${quoteData.l.toFixed(2)}
- Previous Close: $${quoteData.pc.toFixed(2)}
`;
        }
      } catch (e) {
        console.error('Error fetching real stock data:', e);
      }
    }

    // Include market context if provided from dashboard
    let fullContext = stockContext;
    if (marketContext) {
      fullContext += `\n\nCurrent Market Overview:\n${marketContext}`;
    }

    const prompt = requestType === 'dashboard-insights'
      ? `${fullContext}\n\nBased on the current market conditions and real-time data, provide a concise but insightful analysis for ${symbol}. Focus on:
1. How ${symbol} is performing relative to the overall market
2. Key technical signals (momentum, volume trends)
3. Potential catalysts or risks in the near term
Keep the response under 200 words but make it actionable.`
      : fullContext 
        ? `${fullContext}\nBased on this real-time data, provide detailed analysis and insights for ${symbol}.`
        : `Provide detailed analysis and insights for ${symbol} stock.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a financial analyst providing insights on stocks. Provide concise, actionable analysis based on real market data when available.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ analysis }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-stock function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
