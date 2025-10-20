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
    const apiKey = Deno.env.get('FINNHUB_API_KEY');

    if (!apiKey) {
      throw new Error('FINNHUB_API_KEY not configured');
    }

    console.log(`Fetching data for symbol: ${symbol}`);

    // Fetch quote data from Finnhub
    const quoteUrl = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`;
    const quoteResponse = await fetch(quoteUrl);
    const quoteData = await quoteResponse.json();

    console.log('Quote data received:', quoteData);

    // Check for API errors
    if (quoteData.error) {
      console.error('Finnhub API error:', quoteData.error);
      
      // Return mock data as fallback when API error occurs
      const mockPrice = Math.random() * 100 + 100;
      const mockChange = (Math.random() - 0.5) * 5;
      const mockPercent = (mockChange / mockPrice * 100).toFixed(2);
      
      return new Response(
        JSON.stringify({
          symbol: symbol,
          price: mockPrice.toFixed(2),
          change: mockChange.toFixed(2),
          changePercent: mockPercent,
          isPositive: mockChange >= 0,
          high: (mockPrice * 1.02).toFixed(2),
          low: (mockPrice * 0.98).toFixed(2),
          volume: '1000000',
          chartData: [
            { time: '9:30', value: mockPrice * 0.99 },
            { time: '10:30', value: mockPrice * 1.01 },
            { time: '11:30', value: mockPrice * 0.995 },
            { time: '12:30', value: mockPrice }
          ],
          isDemo: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Check if valid data was returned
    if (!quoteData.c || quoteData.c === 0) {
      console.error('No quote data returned for symbol:', symbol);
      
      // Fallback to mock data
      const mockPrice = Math.random() * 100 + 100;
      const mockChange = (Math.random() - 0.5) * 5;
      const mockPercent = (mockChange / mockPrice * 100).toFixed(2);
      
      return new Response(
        JSON.stringify({
          symbol: symbol,
          price: mockPrice.toFixed(2),
          change: mockChange.toFixed(2),
          changePercent: mockPercent,
          isPositive: mockChange >= 0,
          high: (mockPrice * 1.02).toFixed(2),
          low: (mockPrice * 0.98).toFixed(2),
          volume: '1000000',
          chartData: [
            { time: '9:30', value: mockPrice * 0.99 },
            { time: '10:30', value: mockPrice * 1.01 },
            { time: '11:30', value: mockPrice * 0.995 },
            { time: '12:30', value: mockPrice }
          ],
          isDemo: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch candle data for chart (last 4 hours)
    const now = Math.floor(Date.now() / 1000);
    const from = now - (4 * 60 * 60); // 4 hours ago
    const candleUrl = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=60&from=${from}&to=${now}&token=${apiKey}`;
    const candleResponse = await fetch(candleUrl);
    const candleData = await candleResponse.json();

    console.log('Candle data received');

    // Process chart data
    let chartData = [];
    if (candleData.s === 'ok' && candleData.c && candleData.c.length > 0) {
      // Take last 4 data points
      const lastFour = candleData.c.slice(-4);
      const timestamps = candleData.t.slice(-4);
      
      chartData = lastFour.map((close: number, index: number) => ({
        time: new Date(timestamps[index] * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        value: close
      }));
    }

    // Finnhub quote data structure:
    // c: current price, d: change, dp: percent change, h: high, l: low, o: open, pc: previous close
    const price = quoteData.c;
    const change = quoteData.d;
    const changePercent = quoteData.dp.toFixed(2);

    return new Response(
      JSON.stringify({
        symbol: symbol,
        price: price.toFixed(2),
        change: change.toFixed(2),
        changePercent: changePercent,
        isPositive: change >= 0,
        high: quoteData.h.toFixed(2),
        low: quoteData.l.toFixed(2),
        volume: '0', // Finnhub doesn't provide volume in quote endpoint
        chartData: chartData.length > 0 ? chartData : [
          { time: '9:30', value: price },
          { time: '10:30', value: price },
          { time: '11:30', value: price },
          { time: '12:30', value: price }
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in fetch-stock-data:', error);
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
