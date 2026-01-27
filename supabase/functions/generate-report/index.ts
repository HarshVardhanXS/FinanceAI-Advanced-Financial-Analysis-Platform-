import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting config: 10 requests per minute (reports are expensive)
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_ENDPOINT = 'generate-report';

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
  includeMarketData: z.boolean().optional(),
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    
    // Use user ID for rate limiting
    const allowed = await checkRateLimit(userId);
    if (!allowed) {
      console.log('Rate limit exceeded for user:', userId);
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    const body = await req.json();
    const validation = symbolSchema.safeParse(body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid stock symbol format' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const { symbol, marketContext, includeMarketData } = validation.data;
    console.log("Generating report for:", symbol, "by user:", userId);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build comprehensive prompt with market data
    const marketSection = marketContext 
      ? `\n\nCURRENT MARKET DATA FROM DASHBOARD:\n${marketContext}`
      : '';

    // Generate comprehensive report using Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are a senior financial analyst at a top investment bank creating detailed, professional investment reports. Your reports are used by institutional investors and must be comprehensive, data-driven, and actionable. Format with clear sections and bullet points.",
          },
          {
            role: "user",
            content: `Generate a comprehensive financial analysis report for ${symbol}.${marketSection}

REQUIRED SECTIONS:

1. EXECUTIVE SUMMARY
   - Key findings in 3-4 bullet points
   - Overall recommendation (Buy/Hold/Sell with conviction level)

2. MARKET CONTEXT
   - How ${symbol} relates to current market conditions
   - Sector performance analysis
   ${includeMarketData ? '- Compare against the market indices data provided' : ''}

3. TECHNICAL ANALYSIS
   - Price trend analysis (short, medium, long-term)
   - Key support and resistance levels
   - Volume analysis and momentum indicators
   - Moving average analysis (50-day, 200-day)

4. FUNDAMENTAL OVERVIEW
   - Key valuation metrics
   - Growth prospects
   - Competitive positioning

5. RISK ASSESSMENT
   - Primary risk factors (3-5 key risks)
   - Risk mitigation considerations
   - Volatility analysis

6. INVESTMENT RECOMMENDATION
   - Clear action recommendation
   - Target price range
   - Time horizon
   - Position sizing suggestion

Format it as a professional report with clear sections using headers and bullet points.`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const report = aiData.choices[0].message.content;

    // Add report header with metadata
    const fullReport = `
FINANCIAL ANALYSIS REPORT
Symbol: ${symbol}
Generated: ${new Date().toLocaleString()}
Generated by: FinanceAI Platform

${report}

---
Disclaimer: This report is generated by AI for informational purposes only and should not be considered as financial advice.
Please consult with a qualified financial advisor before making investment decisions.
`;

    return new Response(JSON.stringify({ report: fullReport }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-report function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
