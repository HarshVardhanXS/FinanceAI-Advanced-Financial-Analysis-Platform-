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
    const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');

    if (!apiKey) {
      throw new Error('ALPHA_VANTAGE_API_KEY not configured');
    }

    console.log(`Fetching data for symbol: ${symbol}`);

    // Fetch quote data
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const quoteResponse = await fetch(quoteUrl);
    const quoteData = await quoteResponse.json();

    console.log('Quote data received:', quoteData);

    if (quoteData['Note'] || quoteData['Error Message']) {
      return new Response(
        JSON.stringify({ 
          error: quoteData['Note'] || quoteData['Error Message'] || 'API limit reached'
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const quote = quoteData['Global Quote'];
    
    if (!quote || Object.keys(quote).length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid symbol or no data available' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch intraday data for chart
    const intradayUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=60min&apikey=${apiKey}`;
    const intradayResponse = await fetch(intradayUrl);
    const intradayData = await intradayResponse.json();

    console.log('Intraday data received');

    const timeSeries = intradayData['Time Series (60min)'] || {};
    const chartData = Object.entries(timeSeries)
      .slice(0, 4)
      .reverse()
      .map(([time, values]: [string, any]) => ({
        time: new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        value: parseFloat(values['4. close'])
      }));

    const price = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change']);
    const changePercent = quote['10. change percent'].replace('%', '');

    return new Response(
      JSON.stringify({
        symbol: quote['01. symbol'],
        price: price.toFixed(2),
        change: change.toFixed(2),
        changePercent: changePercent,
        isPositive: change >= 0,
        high: parseFloat(quote['03. high']).toFixed(2),
        low: parseFloat(quote['04. low']).toFixed(2),
        volume: quote['06. volume'],
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
