import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_MAX = 15;
const RATE_LIMIT_ENDPOINT = 'price-prediction';

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

const requestSchema = z.object({
  symbol: z.string().trim().min(1).max(5).regex(/^[A-Z]+$/, 'Stock symbol must contain only uppercase letters'),
  timeframe: z.enum(['1d', '1w', '1m', '3m']).optional().default('1w')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const allowed = await checkRateLimit(clientIP);
    if (!allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    const body = await req.json();
    const validation = requestSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { symbol, timeframe } = validation.data;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const finnhubKey = Deno.env.get('FINNHUB_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Generating price prediction for: ${symbol}, timeframe: ${timeframe}`);

    // Fetch current stock data
    let stockData = '';
    let currentPrice = 0;
    if (finnhubKey) {
      try {
        const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`;
        const quoteResponse = await fetch(quoteUrl);
        const quoteData = await quoteResponse.json();
        
        if (quoteData.c && quoteData.c !== 0) {
          currentPrice = quoteData.c;
          stockData = `Current data for ${symbol}:
- Current Price: $${quoteData.c.toFixed(2)}
- Today's Change: ${quoteData.dp > 0 ? '+' : ''}${quoteData.dp.toFixed(2)}%
- Day High: $${quoteData.h.toFixed(2)}
- Day Low: $${quoteData.l.toFixed(2)}
- Previous Close: $${quoteData.pc.toFixed(2)}`;
        }
      } catch (e) {
        console.error('Error fetching stock data:', e);
      }
    }

    const timeframeLabel = {
      '1d': 'next trading day',
      '1w': 'next week',
      '1m': 'next month',
      '3m': 'next 3 months'
    }[timeframe];

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
            content: 'You are an AI-powered price prediction system. Provide price predictions with confidence intervals and supporting analysis. Always include disclaimers about predictions being speculative.'
          },
          {
            role: 'user',
            content: `${stockData ? stockData + '\n\n' : ''}Generate a price prediction for ${symbol} for the ${timeframeLabel}. Return ONLY valid JSON:
{
  "currentPrice": number,
  "predictedPrice": number,
  "priceTarget": { "low": number, "mid": number, "high": number },
  "confidence": number 0-100,
  "direction": "up" | "down" | "sideways",
  "percentageChange": number,
  "supportLevel": number,
  "resistanceLevel": number,
  "keyFactors": ["string"],
  "riskLevel": "low" | "medium" | "high",
  "reasoning": "2-3 sentence explanation",
  "disclaimer": "brief disclaimer about prediction uncertainty"
}`
          }
        ],
        temperature: 0.4
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limits exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    let prediction;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      prediction = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      
      // Override with real current price if available
      if (currentPrice > 0 && prediction) {
        prediction.currentPrice = currentPrice;
      }
    } catch (e) {
      console.error('Failed to parse prediction JSON:', e);
      prediction = {
        currentPrice: currentPrice || 0,
        predictedPrice: 0,
        priceTarget: { low: 0, mid: 0, high: 0 },
        confidence: 0,
        direction: 'sideways',
        percentageChange: 0,
        supportLevel: 0,
        resistanceLevel: 0,
        keyFactors: [],
        riskLevel: 'medium',
        reasoning: 'Unable to generate prediction at this time.',
        disclaimer: 'This is for informational purposes only.'
      };
    }

    return new Response(
      JSON.stringify({ prediction, timeframe }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in price-prediction function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
