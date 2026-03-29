import type { VercelRequest, VercelResponse } from '@vercel/node';

const VALID_LAN = [
  'stockholms-lan', 'uppsala-lan', 'sodermanlands-lan', 'ostergotlands-lan',
  'jonkopings-lan', 'kronobergs-lan', 'kalmar-lan', 'gotlands-lan', 
  'blekinge-lan', 'skane-lan', 'hallands-lan', 'vastra-gotalands-lan', 
  'varmlands-lan', 'orebro-lan', 'vastmanlands-lan', 'dalarnas-lan', 
  'gavleborgs-lan', 'vasternorrlands-lan', 'jamtlands-lan', 
  'vasterbottens-lan', 'norrbottens-lan'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { lan } = req.query;
  
  if (!lan || typeof lan !== 'string' || !VALID_LAN.includes(lan)) {
    return res.status(400).json({ error: 'Invalid or missing lan parameter' });
  }

  try {
    const upstream = await fetch(`https://henrikhjelm.se/api/getdata.php?lan=${encodeURIComponent(lan)}`);
    if (!upstream.ok) {
      return res.status(502).json({ error: 'Failed to fetch data from upstream source' });
    }
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (err) {
    console.error('Price proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
