// Vercel Serverless Function - API Proxy
// This keeps your API keys secure on the server side

// Allowed origins for CORS (add your production domain)
const ALLOWED_ORIGINS = [
  'https://sxmgo.vercel.app',
  'https://www.sxmgo.com',
  // Add localhost for development
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
];

// Whitelist allowed API endpoints to prevent SSRF attacks
const ALLOWED_ENDPOINTS = [
  'https://api.example.com',
  // Add your allowed API endpoints here
];

export default async function handler(req, res) {
  // Set CORS headers
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify origin to prevent CSRF
  if (origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  // Get the API key from environment variables (set in Vercel dashboard)
  const API_KEY = process.env.API_SECRET_KEY;

  if (!API_KEY) {
    console.error('API_SECRET_KEY not configured');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const { endpoint, data } = req.body;

    // Validate request body
    if (!endpoint || typeof endpoint !== 'string') {
      return res.status(400).json({ error: 'Invalid endpoint' });
    }

    // Validate endpoint against whitelist to prevent SSRF
    const isAllowed = ALLOWED_ENDPOINTS.some(url => endpoint.startsWith(url));
    if (!isAllowed) {
      return res.status(403).json({ error: 'Endpoint not allowed' });
    }

    // Make the API call server-side with the secret key
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(data || {}),
    });

    const result = await response.json();

    // Don't leak internal error details to client
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'API request failed',
        status: response.status
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Proxy error:', error.message);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
