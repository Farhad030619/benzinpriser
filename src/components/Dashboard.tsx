import { useState, useEffect } from 'react';
import { MapPin, Fuel, Navigation, TrendingUp, Info, CheckCircle, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, query as fsQuery, where, getDocs, Timestamp } from 'firebase/firestore';
import type { Station, FuelType } from '../types';
import ReportPriceModal from './ReportPriceModal';

const fuelNames: Record<FuelType, string> = {
  bensin: 'Bensin 95',
  diesel: 'Diesel',
  gas: 'Fordonsgas',
  bensin98: 'Bensin 98'
};

// Map county names to Henrik Hjelm API parameter format
const countyToLan: Record<string, string> = {
  'Stockholms': 'stockholms-lan',
  'Uppsala': 'uppsala-lan',
  'Södermanlands': 'sodermanlands-lan',
  'Östergötlands': 'ostergotlands-lan',
  'Jönköpings': 'jonkopings-lan',
  'Kronobergs': 'kronobergs-lan',
  'Kalmar': 'kalmar-lan',
  'Gotlands': 'gotlands-lan',
  'Blekinge': 'blekinge-lan',
  'Skåne': 'skane-lan',
  'Hallands': 'hallands-lan',
  'Västra Götalands': 'vastra-gotalands-lan',
  'Värmlands': 'varmlands-lan',
  'Örebro': 'orebro-lan',
  'Västmanlands': 'vastmanlands-lan',
  'Dalarnas': 'dalarnas-lan',
  'Gävleborgs': 'gavleborgs-lan',
  'Västernorrlands': 'vasternorrlands-lan',
  'Jämtlands': 'jamtlands-lan',
  'Västerbottens': 'vasterbottens-lan',
  'Norrbottens': 'norrbottens-lan',
};

// Fuel type key suffix for Henrik Hjelm API
const fuelApiKey: Record<FuelType, string> = {
  bensin: '95',
  diesel: 'diesel',
  gas: 'fordonsgas',
  bensin98: '98',
};

// Fuzzy-match station name against Henrik Hjelm API keys
function findPriceForStation(stationName: string, priceData: Record<string, string>, fuelKey: string): number | null {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-zåäö0-9]/gi, '');
  const nameCleaned = clean(stationName);
  for (const key of Object.keys(priceData)) {
    if (!key.endsWith(`__${fuelKey}`)) continue;
    const parts = key.split('_').filter(Boolean);
    // Parts[0] = lan, parts[1] = brand, rest = location
    const brand = parts[1] ? clean(parts[1]) : '';
    const location = parts.slice(2).join('').replace(new RegExp(`__${fuelKey}`, 'g'), '');
    if (
      clean(key).includes(nameCleaned) ||
      nameCleaned.includes(brand) ||
      clean(location).includes(nameCleaned)
    ) {
      const val = parseFloat(priceData[key]);
      if (val > 0) return val;
    }
  }
  return null;
}

export default function Dashboard() {
  const [radius] = useState(20);
  const [fuelType, setFuelType] = useState<FuelType>('bensin');
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportingStation, setReportingStation] = useState<Station | null>(null);

  useEffect(() => {
    fetchStations();
  }, [radius, fuelType]);

  const fetchStations = async () => {
    setLoading(true);
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Overpass: get nearby fuel stations that HAVE an address
        const overpassQuery = `[out:json];node["amenity"="fuel"]["addr:street"](around:${radius * 1000},${latitude},${longitude});out 20;`;
        const [osmRes] = await Promise.all([
          fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(overpassQuery)}`),
        ]);
        const osmData = await osmRes.json();

        // Reverse geocode to get county (län)
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=sv`);
        const geoData = await geoRes.json();
        const county = geoData?.address?.county?.replace(' län', '') || geoData?.address?.state?.replace(' län', '') || 'Stockholms';
        const lanKey = Object.entries(countyToLan).find(([k]) => county.includes(k))?.[1] || 'stockholms-lan';

        // Fetch real prices from Henrik Hjelm API (with CORS proxy fallback)
        let apiPrices: Record<string, string> = {};
        try {
          const priceRes = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://henrikhjelm.se/api/getdata.php?lan=${lanKey}`)}`);
          if (priceRes.ok) apiPrices = await priceRes.json();
        } catch (e) {
          console.warn('Could not fetch real prices, using fallback');
        }

        // Firestore verified prices
        const pricesQuery = fsQuery(collection(db, 'prices'), where('fuelType', '==', fuelType));
        const priceSnap = await getDocs(pricesQuery);
        const verifiedPrices: Record<string, { price: number, updatedAt: Timestamp }> = {};
        priceSnap.forEach(docSnap => {
          const d = docSnap.data() as any;
          verifiedPrices[d.stationId] = { price: d.price, updatedAt: d.updatedAt };
        });

        const fuelKey = fuelApiKey[fuelType];
        const basePrice = fuelType === 'diesel' ? 18.20 : fuelType === 'bensin98' ? 18.95 : fuelType === 'gas' ? 12.50 : 17.70;

        const fetchedStations: Station[] = osmData.elements
          .filter((el: any) => el.tags?.['addr:street']) // only stations WITH an address
          .map((el: any) => {
            const dist = Math.sqrt(Math.pow(el.lat - latitude, 2) + Math.pow(el.lon - longitude, 2)) * 111.32;
            const sId = el.id.toString();
            const name = el.tags.name || el.tags.brand || 'Bensinstation';
            const address = `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}`.trim();

            // Priority: 1. Community verified 2. Real API price 3. Refined fallback
            const verified = verifiedPrices[sId];
            const isFresh = verified && (Date.now() - verified.updatedAt.toMillis() < 48 * 60 * 60 * 1000);
            const realPrice = !isFresh ? findPriceForStation(name, apiPrices, fuelKey) : null;
            const price = isFresh
              ? verified.price
              : realPrice ?? parseFloat((basePrice + (Math.random() * 0.6 - 0.3)).toFixed(2));

            return {
              id: sId,
              name,
              brand: el.tags.brand,
              address,
              price,
              distance: parseFloat(dist.toFixed(1)),
              fuelType,
              lat: el.lat,
              lon: el.lon,
              change: isFresh || realPrice ? 0 : parseFloat((Math.random() * 0.4 - 0.2).toFixed(2)),
              isVerified: isFresh || !!realPrice,
              lastUpdated: verified?.updatedAt.toDate()
            };
          });

        setStations(fetchedStations.sort((a, b) => a.distance - b.distance));
        setLoading(false);
      }, () => setLoading(false));
    } catch (error) {
      console.error('Error fetching stations:', error);
      setLoading(false);
    }
  };

  const sortedByPrice = [...stations].sort((a, b) => a.price - b.price);
  const bestStation = sortedByPrice.length > 0 ? sortedByPrice[0] : null;
  const nearestStation = stations.length > 0 ? stations[0] : null;

  const openInGoogleMaps = (station: Station) => {
    const query = encodeURIComponent(`${station.name} ${station.address}`);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };

  return (
    <div className="pt-2">
      <header className="mb-8 relative">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Hitta station</h1>
          <div className="flex items-center gap-2 text-sm text-zinc-500 mt-2 font-medium">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            Position hittad
          </div>
        </motion.div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => bestStation && openInGoogleMaps(bestStation)}
          className="col-span-1 row-span-2 glass-card bg-brand-orange text-white p-6 flex flex-col justify-between shadow-brand border-none cursor-pointer group"
        >
          <div className="relative">
            <Navigation className="w-6 h-6 absolute top-0 right-0 opacity-40 group-hover:opacity-100 transition-opacity" />
            <h3 className="text-xs font-black uppercase tracking-widest opacity-80 mb-2">Billigast</h3>
            <div className="text-4xl font-black tracking-tighter">
              {loading ? '--.--' : bestStation ? bestStation.price.toFixed(2) : '--.--'}
              <span className="text-lg ml-0.5 opacity-80">kr</span>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-0.5">Närmaste billiga</p>
            <p className="font-bold truncate text-sm">{loading ? 'Söker...' : bestStation ? bestStation.name : '...'}</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          onClick={() => nearestStation && openInGoogleMaps(nearestStation)}
          className="glass-card p-5 cursor-pointer hover:bg-white/90 group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-500"><MapPin size={18} /></div>
            <span className="text-[10px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-1 rounded-lg">Närmast</span>
          </div>
          <div className="text-xl font-black text-zinc-900 tracking-tighter">
            {loading ? '--.-' : nearestStation ? nearestStation.distance.toFixed(1) : '--.-'}
            <span className="text-xs ml-0.5 text-zinc-400 font-bold">km</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-bold mt-1 truncate">{nearestStation?.name || '...'}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500"><TrendingUp size={18} /></div>
            <span className="text-[10px] font-black text-blue-500 uppercase bg-blue-50 px-2 py-1 rounded-lg">Trend</span>
          </div>
          <div className={`text-xl font-black tracking-tighter flex items-center gap-1 ${nearestStation && (nearestStation.change ?? 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            {loading ? '--.--' : ((nearestStation?.change ?? 0) > 0 ? '+' : '') + (nearestStation?.change?.toFixed(2) || '0.00')}
            <TrendingUp size={14} className={nearestStation && (nearestStation.change ?? 0) < 0 ? 'rotate-180' : ''} />
          </div>
        </motion.div>
      </div>

      {/* Filters - fuel type only, no slider */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5 mb-8">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          {(Object.keys(fuelNames) as FuelType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFuelType(type)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                fuelType === type ? 'bg-zinc-900 text-white shadow-lg' : 'bg-zinc-50 text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {fuelNames[type]}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Station List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <h2 className="text-lg font-black text-zinc-900 tracking-tight">Stationer</h2>
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stations.length} hittade</span>
        </div>
        
        <AnimatePresence mode="popLayout">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-5 animate-pulse flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-100 rounded-2xl" />
                  <div className="flex-1 space-y-2"><div className="h-4 bg-zinc-100 rounded w-1/3" /><div className="h-3 bg-zinc-100 rounded w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : (
            stations.map((station, index) => (
              <motion.div
                layout key={station.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => openInGoogleMaps(station)}
                className="glass-card p-5 cursor-pointer active:scale-[0.98] flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 flex items-center justify-center text-brand-orange shrink-0 group-hover:bg-brand-orange group-hover:text-white transition-colors duration-300">
                    <Fuel size={24} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-zinc-900 truncate tracking-tight">{station.name}</h3>
                      {station.isVerified && (
                        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter shrink-0 border border-emerald-100">
                          <CheckCircle size={10} strokeWidth={3} />
                          <span>Verifierat</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-bold mt-0.5">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{station.address}</span>
                      <span className="shrink-0">• {station.distance} km</span>
                    </div>
                    
                    {/* Report Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setReportingStation(station);
                      }}
                      className="mt-2 text-[10px] font-black text-brand-orange uppercase tracking-widest hover:text-orange-600 transition-colors flex items-center gap-1"
                    >
                      <Plus size={10} strokeWidth={3} />
                      Rapportera pris
                    </button>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <div className={`text-xl font-black tracking-tighter leading-none mb-1 ${station.isVerified ? 'text-emerald-600' : 'text-zinc-900'}`}>
                    {station.price.toFixed(2)}
                    <span className="text-[10px] ml-0.5 text-zinc-400 font-bold tracking-normal uppercase">kr</span>
                  </div>
                  <div className={`text-[10px] font-black flex items-center justify-end gap-1 ${(station.change ?? 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {station.isVerified ? (
                      <span className="text-zinc-300 opacity-60">Just nu</span>
                    ) : (
                      <>
                        {(station.change ?? 0) > 0 ? '+' : ''}{(station.change ?? 0).toFixed(2)}
                        <TrendingUp size={10} className={(station.change ?? 0) < 0 ? 'rotate-180' : ''} />
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {reportingStation && (
          <ReportPriceModal 
            station={reportingStation}
            onClose={() => setReportingStation(null)}
            onSuccess={() => fetchStations()}
          />
        )}
      </AnimatePresence>

      {!loading && stations.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 glass-card border-dashed">
          <Info className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 font-bold">Inga stationer inom {radius} km.</p>
        </motion.div>
      )}
    </div>
  );
}
