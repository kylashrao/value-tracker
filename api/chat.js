export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    const lowerMsg = message.toLowerCase();
    let reply = "";

    // Local heuristic response engine for ultra-fast, zero-cost execution
    if (lowerMsg.includes("shrinkflation")) {
        reply = "Shrinkflation is when brands keep prices the same while reducing net package volume. Use our Instant Custom Value Calculator to monitor changes in price per ounce over time!";
    } else if (lowerMsg.includes("formula") || lowerMsg.includes("calculate") || lowerMsg.includes("math")) {
        reply = "The core formula is: Unit Cost = Total Purchase Price ÷ Item Measurement Size (Ounces, Grams, or Units).";
    } else if (lowerMsg.includes("streaming") || lowerMsg.includes("netflix") || lowerMsg.includes("hulu")) {
        reply = "For streaming services, calculate cost efficiency with: Subscription Monthly Fee ÷ Estimated Hours Utilized Monthly.";
    } else if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
        reply = "Hello! I am your Value Assistant. How can I help you evaluate purchase value or navigate unit economics today?";
    } else {
        reply = "To get the best value, check the unit price (price per ounce or count) instead of the total sticker price. Try entering your item into our Live Scan tool above!";
    }

    // Optional: Connect to external API (e.g. Gemini / OpenAI) using process.env.API_KEY here if desired.

    return res.status(200).json({ reply });
}
