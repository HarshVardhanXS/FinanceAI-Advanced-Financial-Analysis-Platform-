import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_ENDPOINT = 'sentiment-analysis';

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

    console.log(`Analyzing sentiment for: ${symbol}`);

    // Fetch company news for sentiment context
    let newsContext = '';
    if (finnhubKey) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const newsUrl = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${weekAgo}&to=${today}&token=${finnhubKey}`;
        const newsResponse = await fetch(newsUrl);
        const newsData = await newsResponse.json();
        
        if (Array.isArray(newsData) && newsData.length > 0) {
          const topNews = newsData.slice(0, 5).map((n: any) => `- ${n.headline}`).join('\n');
          newsContext = `Recent news headlines for ${symbol}:\n${topNews}\n\n`;
        }
      } catch (e) {
        console.error('Error fetching news:', e);
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
            content: 'You are a sentiment analysis expert. Analyze market sentiment and return structured JSON data.'
          },
          {
            role: 'user',
            content: `${newsContext}Analyze the current market sentiment for ${symbol}. Return ONLY valid JSON with this exact structure:
{
  "overallSentiment": "bullish" | "bearish" | "neutral",
  "sentimentScore": number between -100 and 100,
  "confidence": number between 0 and 100,
  "factors": [
    { "factor": "string", "impact": "positive" | "negative" | "neutral", "weight": number 1-10 }
  ],
  "socialMentions": { "positive": number, "negative": number, "neutral": number },
  "newsImpact": "high" | "medium" | "low",
  "summary": "brief 2-3 sentence summary"
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
    
    // Parse JSON from response
    let sentiment;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      sentiment = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    } catch (e) {
      console.error('Failed to parse sentiment JSON:', e);
      sentiment = {
        overallSentiment: 'neutral',
        sentimentScore: 0,
        confidence: 50,
        factors: [],
        socialMentions: { positive: 0, negative: 0, neutral: 0 },
        newsImpact: 'medium',
        summary: content
      };
    }

    return new Response(
      JSON.stringify({ sentiment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sentiment-analysis function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
