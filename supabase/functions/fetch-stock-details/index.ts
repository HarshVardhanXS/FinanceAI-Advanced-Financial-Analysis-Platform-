import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const stockDetailsSchema = z.object({
  symbol: z.string()
    .trim()
    .min(1, "Symbol is required")
    .max(15, "Symbol too long")
    .regex(/^[A-Z0-9.:\-]+$/i, "Invalid symbol format")
    .transform(s => s.toUpperCase()),
  period: z.enum(['1D', '1W', '1M', '3M', '1Y']).optional().default('1D')
});

// Get time range parameters for candle data
function getTimeRange(period: string): { from: number; to: number; resolution: string } {
  const now = Math.floor(Date.now() / 1000);
  const day = 86400;
  
  switch (period) {
    case '1D':
      return { from: now - day, to: now, resolution: '5' }; // 5 min intervals
    case '1W':
      return { from: now - (7 * day), to: now, resolution: '30' }; // 30 min intervals
    case '1M':
      return { from: now - (30 * day), to: now, resolution: 'D' }; // Daily
    case '3M':
      return { from: now - (90 * day), to: now, resolution: 'D' }; // Daily
    case '1Y':
      return { from: now - (365 * day), to: now, resolution: 'W' }; // Weekly
    default:
      return { from: now - day, to: now, resolution: '5' };
  }
}

// Format timestamp to readable time/date
function formatTimestamp(timestamp: number, period: string): string {
  const date = new Date(timestamp * 1000);
  
  if (period === '1D') {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  } else if (period === '1W') {
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
  } else if (period === '1M' || period === '3M') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const parseResult = stockDetailsSchema.safeParse(body);
    if (!parseResult.success) {
      console.log('Validation failed:', parseResult.error.issues);
      return new Response(
        JSON.stringify({ error: 'Invalid request parameters' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    const { symbol, period } = parseResult.data;
    console.log('Fetching stock details for:', symbol, 'period:', period);

    const apiKey = Deno.env.get('FINNHUB_API_KEY');
    if (!apiKey) {
      throw new Error('FINNHUB_API_KEY not configured');
    }

    // Fetch quote data
    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
    const quoteResponse = await fetch(quoteUrl);
    const quoteData = await quoteResponse.json();
    console.log('Quote data:', quoteData);

    // Fetch company profile
    const profileUrl = `https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`;
    const profileResponse = await fetch(profileUrl);
    const profileData = await profileResponse.json();
    console.log('Profile data:', profileData);

    // Fetch basic financials
    const metricsUrl = `https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`;
    const metricsResponse = await fetch(metricsUrl);
    const metricsData = await metricsResponse.json();
    console.log('Metrics data available:', !!metricsData.metric);

    const metrics = metricsData.metric || {};

    // Fetch candle data for chart
    const { from, to, resolution } = getTimeRange(period);
    const candleUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`;
    console.log('Fetching candles with resolution:', resolution);
    
    const candleResponse = await fetch(candleUrl);
    const candleData = await candleResponse.json();
    console.log('Candle data status:', candleData.s, 'points:', candleData.c?.length || 0);

    let chartData = [];
    
    if (candleData.s === 'ok' && candleData.c && candleData.t) {
      // Use real candle data - use closing prices
      chartData = candleData.t.map((timestamp: number, index: number) => ({
        time: formatTimestamp(timestamp, period),
        value: Number(candleData.c[index].toFixed(2)),
        open: candleData.o[index],
        high: candleData.h[index],
        low: candleData.l[index],
        volume: candleData.v[index]
      }));
    } else {
      // Fallback to simulated data if candle API fails
      console.log('Using fallback simulated data');
      const currentPrice = quoteData.c || 0;
      const times = ["9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"];
      
      for (let i = 0; i < times.length; i++) {
        const variation = (Math.random() - 0.5) * (currentPrice * 0.02);
        const baseVariation = (i / times.length) * (quoteData.d || 0);
        chartData.push({
          time: times[i],
          value: Number((currentPrice - (quoteData.d || 0) + baseVariation + variation).toFixed(2))
        });
      }
      chartData[chartData.length - 1].value = currentPrice;
    }

    const stockDetails = {
      symbol: symbol,
      name: profileData.name || symbol,
      price: quoteData.c || 0,
      change: quoteData.d || 0,
      changePercent: quoteData.dp || 0,
      isPositive: (quoteData.d || 0) >= 0,
      high: quoteData.h || 0,
      low: quoteData.l || 0,
      open: quoteData.o || 0,
      previousClose: quoteData.pc || 0,
      volume: quoteData.v || 0,
      marketCap: profileData.marketCapitalization ? profileData.marketCapitalization * 1e6 : undefined,
      peRatio: metrics.peBasicExclExtraTTM || metrics.peNormalizedAnnual,
      eps: metrics.epsBasicExclExtraItemsTTM || metrics.epsNormalizedAnnual,
      dividend: metrics.dividendYieldIndicatedAnnual,
      beta: metrics.beta,
      week52High: metrics['52WeekHigh'],
      week52Low: metrics['52WeekLow'],
      avgVolume: metrics['10DayAverageTradingVolume'] ? metrics['10DayAverageTradingVolume'] * 1e6 : undefined,
      industry: profileData.finnhubIndustry,
      sector: profileData.finnhubIndustry,
      description: profileData.description,
      website: profileData.weburl,
      employees: profileData.employeeTotal,
      country: profileData.country,
      exchange: profileData.exchange,
      ipo: profileData.ipo,
      chartData: chartData
    };

    return new Response(
      JSON.stringify(stockDetails),
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
