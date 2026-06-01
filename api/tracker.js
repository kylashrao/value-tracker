export default async function handler(request, response) {
  // Grab the user's search item from the URL query strings
  const { query } = request.query;

  if (!query) {
    return response.status(400).json({ error: 'Query parameter is required' });
  }

  try {
    // Both APIs fetch safely in the background using hidden environment tokens
    const [edamamRes, piloterrRes] = await Promise.all([
      fetch(`https://edamam.com{process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_APP_KEY}&ingr=${encodeURIComponent(query)}`),
      fetch(`https://piloterr.com{encodeURIComponent(query)}`, {
        headers: { 'Authorization': `Bearer ${process.env.PILOTERR_API_KEY}` }
      })
    ]);

    const edamamData = await edamamRes.json();
    const piloterrData = await piloterrRes.json();

    // Parse items safely with fallbacks
    const foodItem = edamamData.hints?.[0]?.food;
    const totalMeasurement = foodItem?.servingSizes?.[0]?.quantity || 128;
    const calculationUnit = foodItem?.servingSizes?.[0]?.unit || 'Ounces';
    
    const targetProduct = piloterrData.results?.[0];
    const totalPrice = targetProduct?.price?.current_price || 0.00;
    const itemName = targetProduct?.title || `${query} (Target)`;

    if (totalPrice === 0) {
      return response.status(404).json({ error: 'Product price not found on Target' });
    }

    const calculatedCost = (totalPrice / totalMeasurement).toFixed(3);

    // Determine value health rating
    let verdict = 'Fair Value';
    if (calculatedCost < 0.015) verdict = 'Excellent Value';
    else if (calculatedCost < 0.03) verdict = 'Good Value';
    else if (calculatedCost > 0.10) verdict = 'Expensive Per Ounce';

    // Send data straight back to your index.html page
    return response.status(200).json({
      itemName,
      totalPrice,
      totalMeasurement,
      calculationUnit,
      calculatedCost: `$${calculatedCost}`,
      verdict
    });

  } catch (error) {
    return response.status(500).json({ error: 'Failed fetching secure retail components' });
  }
}
