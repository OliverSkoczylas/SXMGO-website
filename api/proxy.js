// Vercel Serverless Function - API Proxy
// This keeps your API keys secure on the server side

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get the API key from environment variables (set in Vercel dashboard)
  const API_KEY = process.env.API_SECRET_KEY;

  if (!API_KEY) {
    console.error('API_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { endpoint, data } = req.body;

    // Whitelist allowed endpoints to prevent abuse
    const allowedEndpoints = [
      'https://api.example.com',
      // Add your allowed API endpoints here
    ];

    const isAllowed = allowedEndpoints.some(url => endpoint?.startsWith(url));
    if (!isAllowed) {
      return res.status(403).json({ error: 'Endpoint not allowed' });
    }

    // Make the API call server-side with the secret key
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        // Or use 'X-API-Key': API_KEY depending on the API
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    return res.status(response.status).json(result);
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ error: 'Failed to fetch from API' });
  }
}
