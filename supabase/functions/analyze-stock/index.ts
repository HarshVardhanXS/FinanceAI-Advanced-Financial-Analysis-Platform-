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
    const alphaVantageKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log(`Analyzing stock: ${symbol}`);

    // Fetch real stock data first if API key is available
    let stockContext = '';
    if (alphaVantageKey) {
      try {
        const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${alphaVantageKey}`;
        const quoteResponse = await fetch(quoteUrl);
        const quoteData = await quoteResponse.json();
        
        const quote = quoteData['Global Quote'];
        if (quote && Object.keys(quote).length > 0) {
          stockContext = `Current real-time data for ${symbol}:
- Price: $${quote['05. price']}
- Change: ${quote['09. change']} (${quote['10. change percent']})
- High: $${quote['03. high']}
- Low: $${quote['04. low']}
- Volume: ${quote['06. volume']}
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
