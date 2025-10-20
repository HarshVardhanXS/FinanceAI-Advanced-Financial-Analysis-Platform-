import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const symbolSchema = z.object({
  symbol: z.string().trim().min(1).max(5).regex(/^[A-Z]+$/, 'Stock symbol must contain only uppercase letters')
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    console.log(`Analyzing stock: ${symbol}`);

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

    const prompt = stockContext 
      ? `${stockContext}\nBased on this real-time data, provide detailed analysis and insights for ${symbol}.`
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
