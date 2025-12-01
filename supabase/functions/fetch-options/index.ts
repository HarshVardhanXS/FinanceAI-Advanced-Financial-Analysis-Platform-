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
    console.log('Fetching options for symbol:', symbol);

    const apiKey = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    if (!apiKey) {
      throw new Error('ALPHA_VANTAGE_API_KEY not configured');
    }

    // Get current stock price for calculating ITM/OTM
    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${apiKey}`;
    const quoteResponse = await fetch(quoteUrl);
    const quoteData = await quoteResponse.json();
    
    const currentPrice = parseFloat(quoteData['Global Quote']?.['05. price'] || '0');
    console.log('Current price:', currentPrice);

    // Generate synthetic options data (in production, use real options API)
    const expirationDates = [
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 2 months
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 3 months
    ];

    const options = [];
    
    for (const expDate of expirationDates) {
      // Generate strike prices around current price
      const strikes = [
        currentPrice * 0.90,
        currentPrice * 0.95,
        currentPrice,
        currentPrice * 1.05,
        currentPrice * 1.10,
      ];

      for (const strike of strikes) {
        const daysToExpiry = Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        const isITM = strike < currentPrice;
        
        // Calculate premium (simplified Black-Scholes approximation)
        const intrinsicValue = Math.max(0, currentPrice - strike);
        const timeValue = (strike * 0.02 * Math.sqrt(daysToExpiry / 365));
        const callPremium = intrinsicValue + timeValue;
        const putPremium = Math.max(0, strike - currentPrice) + timeValue;

        // Call option
        options.push({
          contract_symbol: `${symbol}${expDate.toISOString().split('T')[0].replace(/-/g, '')}C${strike.toFixed(0)}`,
          underlying_symbol: symbol,
          option_type: 'call',
          strike_price: strike.toFixed(2),
          expiration_date: expDate.toISOString().split('T')[0],
          premium: callPremium.toFixed(2),
          implied_volatility: (0.20 + Math.random() * 0.15).toFixed(4),
          delta: (isITM ? 0.6 : 0.4).toFixed(4),
          gamma: (0.05).toFixed(4),
          theta: (-0.02).toFixed(4),
          vega: (0.15).toFixed(4),
        });

        // Put option
        options.push({
          contract_symbol: `${symbol}${expDate.toISOString().split('T')[0].replace(/-/g, '')}P${strike.toFixed(0)}`,
          underlying_symbol: symbol,
          option_type: 'put',
          strike_price: strike.toFixed(2),
          expiration_date: expDate.toISOString().split('T')[0],
          premium: putPremium.toFixed(2),
          implied_volatility: (0.20 + Math.random() * 0.15).toFixed(4),
          delta: (isITM ? -0.6 : -0.4).toFixed(4),
          gamma: (0.05).toFixed(4),
          theta: (-0.02).toFixed(4),
          vega: (0.15).toFixed(4),
        });
      }
    }

    console.log(`Generated ${options.length} options contracts`);

    return new Response(
      JSON.stringify({ options, currentPrice: currentPrice.toFixed(2) }),
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
