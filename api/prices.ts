import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { lan } = req.query;
  if (!lan || typeof lan !== 'string') {
    return res.status(400).json({ error: 'Missing lan parameter' });
  }

  try {
    const upstream = await fetch(`https://henrikhjelm.se/api/getdata.php?lan=${encodeURIComponent(lan)}`);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ error: 'Upstream error' });
    }
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (err) {
    console.error('Price proxy error:', err);
    return res.status(500).json({ error: 'Failed to fetch prices' });
  }
}
