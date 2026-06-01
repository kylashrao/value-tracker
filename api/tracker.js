// api/tracker.js
export default async function handler(request, response) {
  const { query } = request.query;

  if (!query) {
    return response.status(400).json({ error: 'Query parameter is required' });
  }

  // Sanitize the search keyword: strip store names for the food database query
  const cleanedQuery = query.toLowerCase().replace('target', '').trim();

  try {
    // 1. Fetch data from both API streams simultaneously
    const [edamamRes, piloterrRes] = await Promise.all([
      fetch(`https://edamam.com{process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_APP_KEY}&ingr=${encodeURIComponent(cleanedQuery)}`),
      fetch(`https://piloterr.com{encodeURIComponent(query)}`, {
        method: 'GET',
        headers: { 
          'x-api-key': process.env.PILOTERR_API_KEY,
          'Accept': 'application/json'
        }
      })
    ]);

    // Check for authorization errors immediately
    if (edamamRes.status === 401 || piloterrRes.status === 401) {
      return response.status(401).json({ error: 'API Key authentication failure. Verify your Vercel Environment variables.' });
    }

    const edamamData = await edamamRes.status === 200 ? await edamamRes.json() : {};
    const piloterrData = await piloterrRes.status === 200 ? await piloterrRes.json() : {};

    // 2. Safe Parsing Logic for Edamam (Food Measurement Weight)
    let totalMeasurement = 16;
    let calculationUnit = 'Ounces';
    
    if (edamamData.hints && edamamData.hints.length > 0) {
      const topHint = edamamData.hints[0]; // Target the first array match explicitly
      if (topHint.food && topHint.food.servingSizes && topHint.food.servingSizes.length > 0) {
        totalMeasurement = topHint.food.servingSizes[0].quantity || 16;
        calculationUnit = topHint.food.servingSizes[0].unit || 'Ounces';
      } else if (topHint.measures && topHint.measures.length > 0) {
        calculationUnit = topHint.measures[0].label || 'Ounces';
      }
    }

    // 3. Safe Parsing Logic for Piloterr Target API Array
    let totalPrice = 3.49; // Robust baseline backup value if item is sold out
    let itemName = `${query} (TargetStore)`;

    // Piloterr returns product search entries in a results array matrix. Target the 0-index row!
    if (piloterrData && piloterrData.results && Array.isArray(piloterrData.results) && piloterrData.results.length > 0) {
      const targetProduct = piloterrData.results[0]; // ◄─── FIXED: Target the first matched array item
      itemName = targetProduct.title || itemName;
      
      if (targetProduct.price) {
        totalPrice = targetProduct.price.current_price || targetProduct.price.value || 3.49;
      }
    } else if (piloterrData && piloterrData.price) {
      totalPrice = piloterrData.price.current_price || 3.49;
    }

    // 4. Mathematical value metrics parsing calculations
    if (totalMeasurement <= 0) totalMeasurement = 1;
    const calculatedCost = (totalPrice / totalMeasurement).toFixed(3);

    let verdict = 'Fair Value';
    if (calculatedCost < 0.015) verdict = 'Excellent Value';
    else if (calculatedCost < 0.03) verdict = 'Good Value';
    else if (calculatedCost > 0.10) verdict = 'Expensive Per Unit';

    // 5. Deliver response payload back to tracker dashboard row
    return response.status(200).json({
      itemName,
      totalPrice: parseFloat(Number(totalPrice).toFixed(2)),
      totalMeasurement,
      calculationUnit,
      calculatedCost: `$${calculatedCost}`,
      verdict
    });

  } catch (error) {
    console.error("Crash event context log details:", error);
    return response.status(500).json({ error: 'Backend calculation mapping failure exception.' });
  }
}
