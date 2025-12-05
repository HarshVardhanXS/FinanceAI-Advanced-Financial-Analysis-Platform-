import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();
    console.log('Fetching stock details for:', symbol);

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

    // Generate chart data (using current price with simulated historical variation)
    const currentPrice = quoteData.c || 0;
    const chartData = [];
    const times = ["9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"];
    
    for (let i = 0; i < times.length; i++) {
      const variation = (Math.random() - 0.5) * (currentPrice * 0.02); // ±1% variation
      const baseVariation = (i / times.length) * (quoteData.d || 0); // Trend towards current change
      chartData.push({
        time: times[i],
        value: Number((currentPrice - (quoteData.d || 0) + baseVariation + variation).toFixed(2))
      });
    }
    // Ensure last point is current price
    chartData[chartData.length - 1].value = currentPrice;

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