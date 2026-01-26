import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_ENDPOINT = 'technical-analysis';

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
  symbol: z.string().trim().min(1).max(5).regex(/^[A-Z]+$/, 'Stock symbol must contain only uppercase letters')
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

    // Extract token and explicitly pass to getUser() for proper validation
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

    const { symbol } = validation.data;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    const finnhubKey = Deno.env.get('FINNHUB_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Generating technical analysis for: ${symbol} by user: ${userId}`);

    // Fetch current and technical data
    let technicalContext = '';
    if (finnhubKey) {
      try {
        // Get quote
        const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${finnhubKey}`;
        const quoteResponse = await fetch(quoteUrl);
        const quoteData = await quoteResponse.json();
        
        // Get technical indicators
        const indicatorUrl = `https://finnhub.io/api/v1/scan/technical-indicator?symbol=${symbol}&resolution=D&token=${finnhubKey}`;
        const indicatorResponse = await fetch(indicatorUrl);
        const indicatorData = await indicatorResponse.json();
        
        if (quoteData.c && quoteData.c !== 0) {
          technicalContext = `Real-time data for ${symbol}:
- Current Price: $${quoteData.c.toFixed(2)}
- Change: ${quoteData.dp > 0 ? '+' : ''}${quoteData.dp.toFixed(2)}%
- High: $${quoteData.h.toFixed(2)}, Low: $${quoteData.l.toFixed(2)}
`;
        }
        
        if (indicatorData.technicalAnalysis) {
          technicalContext += `\nTechnical Signals:
- Count: Buy=${indicatorData.technicalAnalysis.count?.buy || 0}, Sell=${indicatorData.technicalAnalysis.count?.sell || 0}, Neutral=${indicatorData.technicalAnalysis.count?.neutral || 0}
- Signal: ${indicatorData.technicalAnalysis.signal || 'neutral'}`;
        }
      } catch (e) {
        console.error('Error fetching technical data:', e);
      }
    }

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
            content: 'You are a technical analysis expert. Provide comprehensive technical analysis with indicators, patterns, and actionable insights.'
          },
          {
            role: 'user',
            content: `${technicalContext ? technicalContext + '\n\n' : ''}Provide comprehensive technical analysis for ${symbol}. Return ONLY valid JSON:
{
  "trend": {
    "direction": "bullish" | "bearish" | "sideways",
    "strength": "strong" | "moderate" | "weak",
    "duration": "short-term" | "medium-term" | "long-term"
  },
  "indicators": {
    "rsi": { "value": number, "signal": "overbought" | "oversold" | "neutral" },
    "macd": { "signal": "bullish" | "bearish" | "neutral", "crossover": boolean },
    "movingAverages": {
      "sma20": number,
      "sma50": number,
      "sma200": number,
      "goldenCross": boolean,
      "deathCross": boolean
    },
    "bollingerBands": { "position": "upper" | "middle" | "lower", "squeeze": boolean }
  },
  "patterns": [
    { "name": "string", "type": "bullish" | "bearish", "reliability": "high" | "medium" | "low" }
  ],
  "supportResistance": {
    "support": [number],
    "resistance": [number],
    "pivotPoint": number
  },
  "volume": {
    "trend": "increasing" | "decreasing" | "stable",
    "signal": "accumulation" | "distribution" | "neutral"
  },
  "recommendation": "strong_buy" | "buy" | "hold" | "sell" | "strong_sell",
  "signals": {
    "buy": number,
    "sell": number,
    "neutral": number
  },
  "summary": "2-3 sentence technical summary"
}`
          }
        ],
        temperature: 0.3
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
    
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Failed to parse technical analysis JSON:', e);
      analysis = {
        trend: { direction: 'sideways', strength: 'moderate', duration: 'short-term' },
        indicators: {
          rsi: { value: 50, signal: 'neutral' },
          macd: { signal: 'neutral', crossover: false },
          movingAverages: { sma20: 0, sma50: 0, sma200: 0, goldenCross: false, deathCross: false },
          bollingerBands: { position: 'middle', squeeze: false }
        },
        patterns: [],
        supportResistance: { support: [], resistance: [], pivotPoint: 0 },
        volume: { trend: 'stable', signal: 'neutral' },
        recommendation: 'hold',
        signals: { buy: 0, sell: 0, neutral: 0 },
        summary: 'Unable to generate technical analysis at this time.'
      };
    }

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in technical-analysis function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
