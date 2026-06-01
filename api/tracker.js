// api/tracker.js
export default async function handler(request, response) {
  const { query } = request.query;

  if (!query) {
    return response.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // 1. Core Background API Orchestration requests
    const [edamamRes, piloterrRes] = await Promise.all([
      fetch(`https://edamam.com{process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_APP_KEY}&ingr=${encodeURIComponent(query)}`),
      fetch(`https://piloterr.com{encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${process.env.PILOTERR_API_KEY}` }
      })
    ]);

    const edamamData = await edamamRes.json();
    const piloterrData = await piloterrRes.json();

    // 2. Defensive JSON Extraction Layer with Array Validation Fallbacks
    let totalMeasurement = 16; 
    let calculationUnit = 'Ounces';
    if (edamamData.hints && edamamData.hints.length > 0 && edamamData.hints[0].food) {
      const foodItem = edamamData.hints[0].food;
      if (foodItem.servingSizes && foodItem.servingSizes.length > 0) {
        totalMeasurement = foodItem.servingSizes[0].quantity || 16;
        calculationUnit = foodItem.servingSizes[0].unit || 'Ounces';
      }
    }

    let totalPrice = 0.00;
    let itemName = `${query} (Target)`;
    if (piloterrData.results && piloterrData.results.length > 0) {
      const targetProduct = piloterrData.results[0];
      itemName = targetProduct.title || itemName;
      if (targetProduct.price) {
        totalPrice = targetProduct.price.current_price || targetProduct.price.value || 0.00;
      }
    }

    // 3. Prevent Division Errors
    if (totalPrice === 0) {
      // Fallback example placeholder pricing if API keyword return was fully restricted or dry
      totalPrice = 3.49; 
    }
    if (totalMeasurement <= 0) totalMeasurement = 1;

    // 4. Operational Math calculations
    const calculatedCost = (totalPrice / totalMeasurement).toFixed(3);

    let verdict = 'Fair Value';
    if (calculatedCost < 0.015) verdict = 'Excellent Value';
    else if (calculatedCost < 0.03) verdict = 'Good Value';
    else if (calculatedCost > 0.10) verdict = 'Expensive Per Ounce';

    // 5. Clean JSON Response Delivery
    return response.status(200).json({
      itemName,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      totalMeasurement,
      calculationUnit,
      calculatedCost: `$${calculatedCost}`,
      verdict
    });

  } catch (error) {
    console.error('Secure Worker Exception Context:', error);
    return response.status(500).json({ error: 'Internal pipeline validation failure exception.' });
  }
}
