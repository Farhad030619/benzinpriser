import { useState, useEffect } from 'react';
import { Search, MapPin, Fuel, Navigation, TrendingUp, Info, CheckCircle, Plus, ArrowUpDown } from 'lucide-react';
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

const countyToLan: Record<string, string> = {
  'Stockholms': 'stockholms-lan', 'Uppsala': 'uppsala-lan',
  'Södermanlands': 'sodermanlands-lan', 'Östergötlands': 'ostergotlands-lan',
  'Jönköpings': 'jonkopings-lan', 'Kronobergs': 'kronobergs-lan',
  'Kalmar': 'kalmar-lan', 'Gotlands': 'gotlands-lan', 'Blekinge': 'blekinge-lan',
  'Skåne': 'skane-lan', 'Hallands': 'hallands-lan',
  'Västra Götalands': 'vastra-gotalands-lan', 'Värmlands': 'varmlands-lan',
  'Örebro': 'orebro-lan', 'Västmanlands': 'vastmanlands-lan',
  'Dalarnas': 'dalarnas-lan', 'Gävleborgs': 'gavleborgs-lan',
  'Västernorrlands': 'vasternorrlands-lan', 'Jämtlands': 'jamtlands-lan',
  'Västerbottens': 'vasterbottens-lan', 'Norrbottens': 'norrbottens-lan',
};

const fuelApiKey: Record<FuelType, string> = {
  bensin: '95', diesel: 'diesel', gas: 'fordonsgas', bensin98: '98',
};

const basePrices: Record<FuelType, number> = {
  bensin: 17.70, diesel: 18.20, gas: 12.50, bensin98: 18.95,
};

function findPriceForStation(stationName: string, priceData: Record<string, string>, fuelKey: string): number | null {
  const clean = (s: string) => s.toLowerCase().replace(/[^a-zåäö0-9]/gi, '');
  const nameCleaned = clean(stationName);
  for (const key of Object.keys(priceData)) {
    if (!key.endsWith(`__${fuelKey}`)) continue;
    const parts = key.split('_').filter(Boolean);
    const brand = parts[1] ? clean(parts[1]) : '';
    if (clean(key).includes(nameCleaned) || nameCleaned.includes(brand)) {
      const val = parseFloat(priceData[key]);
      if (val > 0) return val;
    }
  }
  return null;
}

// A raw station from Overpass before fuel-type pricing is applied
interface RawStation {
  id: string;
  name: string;
  brand?: string;
  address: string;
  lat: number;
  lon: number;
  distance: number;
  // prices per fuel type
  prices: Partial<Record<FuelType, { price: number; isVerified: boolean; change: number; lastUpdated?: Date }>>;
}

export default function Dashboard() {
  const [radius, setRadius] = useState(15);
  const [fuelType, setFuelType] = useState<FuelType>('bensin');
  const [sortBy, setSortBy] = useState<'distance' | 'price'>('distance');
  const [allStations, setAllStations] = useState<RawStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportingStation, setReportingStation] = useState<Station | null>(null);

  // Fetch ONCE on mount
  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    setLoading(true);
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;

        // Fetch ALL fuel stations nearby (no addr:street filter – we filter client-side)
        const overpassQuery = `[out:json][timeout:30];node["amenity"="fuel"](around:${radius * 1000},${latitude},${longitude});out 50;`;
        const overpassMirrors = [
          'https://overpass-api.de/api/interpreter',
          'https://overpass.kumi.systems/api/interpreter',
          'https://overpass.openstreetmap.fr/api/interpreter',
          'https://lz4.overpass-api.de/api/interpreter',
          'https://z.overpass-api.de/api/interpreter',
        ];
        
        let osmData: any = { elements: [] };
        let success = false;

        for (const mirror of overpassMirrors) {
          try {
            console.log(`Trying Overpass mirror: ${mirror}`);
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 15000); // 15s per mirror

            const osmRes = await fetch(`${mirror}?data=${encodeURIComponent(overpassQuery)}`, {
              signal: controller.signal
            });
            clearTimeout(id);

            if (osmRes.ok) { 
              osmData = await osmRes.json(); 
              success = true;
              break; 
            }
          } catch (e) {
            console.warn(`Mirror ${mirror} failed:`, e);
          }
        }

        if (!success) {
          throw new Error('Alla Overpass-servrar är upptagna. Prova igen om en stund.');
        }

        // Reverse geocode for county
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=sv`);
        const geoData = await geoRes.json();
        const county = geoData?.address?.county?.replace(' län', '') || geoData?.address?.state?.replace(' län', '') || 'Stockholms';
        const lanKey = Object.entries(countyToLan).find(([k]) => county.includes(k))?.[1] || 'stockholms-lan';

        // Fetch real prices via our own Vercel API proxy (no CORS issues)
        let apiPrices: Record<string, string> = {};
        try {
          const priceRes = await fetch(`/api/prices?lan=${lanKey}`);
          if (priceRes.ok) apiPrices = await priceRes.json();
        } catch (e) {
          console.warn('Could not fetch real prices:', e);
        }

        // Fetch ALL Firestore community prices
        const allVerified: Record<string, Record<string, { price: number; updatedAt: Timestamp }>> = {};
        for (const ft of Object.keys(fuelApiKey) as FuelType[]) {
          const snap = await getDocs(fsQuery(collection(db, 'prices'), where('fuelType', '==', ft)));
          snap.forEach(docSnap => {
            const d = docSnap.data() as any;
            if (!allVerified[d.stationId]) allVerified[d.stationId] = {};
            allVerified[d.stationId][ft] = { price: d.price, updatedAt: d.updatedAt };
          });
        }

        const raw: RawStation[] = osmData.elements
          .filter((el: any) => el.tags?.name || el.tags?.brand) // keep any station with a name/brand
          .map((el: any) => {
            const dist = Math.sqrt(Math.pow(el.lat - latitude, 2) + Math.pow(el.lon - longitude, 2)) * 111.32;
            const sId = el.id.toString();
            const name = el.tags.name || el.tags.brand || 'Bensinstation';
            const street = el.tags['addr:street'] || '';
            const housenumber = el.tags['addr:housenumber'] || '';
            const address = street ? `${street} ${housenumber}`.trim() : el.tags['addr:city'] || el.tags['addr:place'] || name;

            const prices: RawStation['prices'] = {};
            for (const ft of Object.keys(fuelApiKey) as FuelType[]) {
              const communityEntry = allVerified[sId]?.[ft];
              const isFresh = communityEntry && (Date.now() - communityEntry.updatedAt.toMillis() < 48 * 60 * 60 * 1000);
              const realPrice = !isFresh ? findPriceForStation(name, apiPrices, fuelApiKey[ft]) : null;
              const price = isFresh
                ? communityEntry.price
                : realPrice ?? parseFloat((basePrices[ft] + (Math.random() * 0.6 - 0.3)).toFixed(2));
              prices[ft] = {
                price,
                isVerified: isFresh || !!realPrice,
                change: isFresh || realPrice ? 0 : parseFloat((Math.random() * 0.4 - 0.2).toFixed(2)),
                lastUpdated: communityEntry?.updatedAt?.toDate(),
              };
            }

            return { id: sId, name, brand: el.tags.brand, address, lat: el.lat, lon: el.lon, distance: parseFloat(dist.toFixed(1)), prices };
          });

        const stations = raw.sort((a, b) => a.distance - b.distance);
        setAllStations(stations);
        setLoading(false);
      }, (err) => {
        console.error('Geolocation error:', err);
        setLoading(false);
      }, { enableHighAccuracy: true, timeout: 5000 });
    } catch (error: any) {
      console.error('Error fetching stations:', error);
      alert(error.message || 'Kunde inte hämta stationer.');
      setLoading(false);
    }
  };

  // Derive visible stations: filter by radius, then map to Station shape for current fuelType
  const visibleStations: Station[] = allStations
    .filter(s => s.distance <= radius)
    .map(s => {
      const pd = s.prices[fuelType]!;
      return {
        id: s.id, name: s.name, brand: s.brand, address: s.address,
        lat: s.lat, lon: s.lon, distance: s.distance,
        fuelType,
        price: pd.price, isVerified: pd.isVerified, change: pd.change, lastUpdated: pd.lastUpdated,
      };
    });

  // Sort
  const sortedStations = [...visibleStations].sort((a, b) =>
    sortBy === 'price' ? a.price - b.price : a.distance - b.distance
  );

  const bestStation = [...visibleStations].sort((a, b) => a.price - b.price)[0] ?? null;
  const nearestStation = [...visibleStations].sort((a, b) => a.distance - b.distance)[0] ?? null;

  const openInGoogleMaps = (station: Station) => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${station.name} ${station.address}`)}`, '_blank');
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
            <h3 className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Billigast</h3>
            <p className="text-[10px] opacity-60 mb-2">{fuelNames[fuelType]}</p>
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

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6 mb-8">
        <div className="flex flex-col gap-6">
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
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-zinc-400" />
                <span className="text-xs font-black text-zinc-800 uppercase tracking-widest">Sökradie</span>
              </div>
              <span className="bg-brand-orange/10 text-brand-orange px-3 py-1 rounded-full text-xs font-black">{radius} km</span>
            </div>
            <input type="range" min="1" max="50" value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} />
          </div>
        </div>
      </motion.div>

      {/* Station List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2 mb-2">
          <h2 className="text-lg font-black text-zinc-900 tracking-tight">Stationer</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSortBy(s => s === 'distance' ? 'price' : 'distance')}
              className="flex items-center gap-1.5 text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-white px-3 py-1.5 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <ArrowUpDown size={10} />
              {sortBy === 'distance' ? 'Avstånd' : 'Pris'}
            </button>
            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
              {loading ? '...' : `${sortedStations.length} hittade`}
            </span>
          </div>
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
            sortedStations.map((station, index) => (
              <motion.div
                layout key={station.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
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
                    <button
                      onClick={(e) => { e.stopPropagation(); setReportingStation(station); }}
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

      {!loading && sortedStations.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 glass-card border-dashed mt-4">
          <Info className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
          <p className="text-zinc-500 font-bold">Inga stationer inom {radius} km.</p>
        </motion.div>
      )}
    </div>
  );
}
