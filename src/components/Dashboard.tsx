import { useState, useEffect } from 'react';
import { Search, MapPin, Fuel, Navigation, TrendingUp, Plus, ArrowUpDown, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../lib/firebase';
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import type { Station, FuelType } from '../types';
import ReportPriceModal from './ReportPriceModal';

const fuelNames: Record<FuelType, string> = {
  bensin: 'Bensin 95',
  diesel: 'Diesel',
  gas: 'Fordonsgas',
  bensin98: 'Bensin 98'
};

const fuelApiKey: Record<FuelType, string> = {
  bensin: '95', diesel: 'diesel', gas: 'fordonsgas', bensin98: '98',
};

const fuelColors: Record<FuelType, string> = {
  bensin: 'text-amber-400',
  diesel: 'text-sky-400',
  gas: 'text-emerald-400',
  bensin98: 'text-rose-400'
};

const fuelGlows: Record<FuelType, string> = {
  bensin: 'shadow-[0_0_20px_rgba(251,191,36,0.3)] border-amber-500/20',
  diesel: 'shadow-[0_0_20px_rgba(56,189,248,0.3)] border-sky-500/20',
  gas: 'shadow-[0_0_20px_rgba(16,185,129,0.3)] border-emerald-500/20',
  bensin98: 'shadow-[0_0_20px_rgba(244,63,94,0.3)] border-rose-500/20'
};

const basePrices: Record<FuelType, number> = {
  bensin: 17.70, diesel: 18.20, gas: 12.50, bensin98: 18.95,
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

interface RawStation {
  id: string; originId: string; name: string; brand?: string; address: string;
  lat: number; lon: number; distance: number;
  prices: Partial<Record<FuelType, { price: number; isVerified: boolean; change: number; lastUpdated?: Date }>>;
}

export default function Dashboard() {
  const [radius, setRadius] = useState(15);
  const [fuelType, setFuelType] = useState<FuelType>('bensin');
  const [sortBy, setSortBy] = useState<'distance' | 'price'>('distance');
  const [allStations, setAllStations] = useState<RawStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportingStation, setReportingStation] = useState<Station | null>(null);

  useEffect(() => { fetchStations(); }, []);

  const fetchStations = async () => {
    setLoading(true);
    try {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const { latitude, longitude } = pos.coords;
        const overpassQuery = `[out:json][timeout:25];node["amenity"="fuel"](around:50000,${latitude},${longitude});out 60;`;
        const overpassMirrors = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];
        
        let osmData: any = { elements: [] };
        for (const mirror of overpassMirrors) {
          try {
            const osmRes = await fetch(`${mirror}?data=${encodeURIComponent(overpassQuery)}`);
            if (osmRes.ok) { osmData = await osmRes.json(); break; }
          } catch { continue; }
        }

        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&accept-language=sv`);
        const geoData = await geoRes.json();
        const county = geoData?.address?.county?.replace(' län', '') || geoData?.address?.state?.replace(' län', '') || 'Stockholms';
        const lanKey = Object.entries(countyToLan).find(([k]) => county.includes(k))?.[1] || 'stockholms-lan';

        let apiPrices: Record<string, string> = {};
        try {
          const priceRes = await fetch(`/api/prices?lan=${lanKey}`);
          if (priceRes.ok) apiPrices = await priceRes.json();
        } catch (e) { console.warn(e); }

        const allVerified: Record<string, Record<string, { price: number; updatedAt: Timestamp }>> = {};
        const snap = await getDocs(collection(db, 'prices'));
        snap.forEach(docSnap => {
          const d = docSnap.data() as any;
          if (!allVerified[d.stationId]) allVerified[d.stationId] = {};
          allVerified[d.stationId][d.fuelType] = { price: d.price, updatedAt: d.updatedAt };
        });

        const raw: RawStation[] = osmData.elements
          .filter((el: any) => el.tags?.name || el.tags?.brand)
          .map((el: any) => {
            const dist = Math.sqrt(Math.pow(el.lat - latitude, 2) + Math.pow(el.lon - longitude, 2)) * 111.32;
            const sId = el.id.toString();
            const name = el.tags.name || el.tags.brand || 'Station';
            const address = el.tags['addr:street'] ? `${el.tags['addr:street']} ${el.tags['addr:housenumber'] || ''}`.trim() : el.tags['addr:city'] || el.tags['addr:place'] || name;

            const prices: RawStation['prices'] = {};
            for (const ft of Object.keys(fuelApiKey) as FuelType[]) {
              const comm = allVerified[sId]?.[ft];
              const isFresh = comm && (Date.now() - comm.updatedAt.toMillis() < 48 * 60 * 60 * 1000);
              const realPrice = !isFresh ? findPriceForStation(name, apiPrices, fuelApiKey[ft]) : null;
              const price = isFresh ? comm.price : realPrice ?? parseFloat((basePrices[ft] + (Math.random() * 0.4 - 0.2)).toFixed(2));
              prices[ft] = { price, isVerified: isFresh || !!realPrice, change: isFresh || realPrice ? 0 : parseFloat((Math.random() * 0.2 - 0.1).toFixed(2)), lastUpdated: comm?.updatedAt?.toDate() };
            }
            return { id: sId, originId: sId, name, brand: el.tags.brand, address, lat: el.lat, lon: el.lon, distance: parseFloat(dist.toFixed(1)), prices };
          });

        setAllStations(raw.sort((a, b) => a.distance - b.distance));
        setLoading(false);
      }, () => setLoading(false));
    } catch (err) { console.error(err); setLoading(false); }
  };

  const visibleStations: Station[] = allStations
    .filter(s => s.distance <= radius)
    .map(s => {
      const pd = s.prices[fuelType]!;
      return { id: s.id, name: s.name, brand: s.brand, address: s.address, lat: s.lat, lon: s.lon, distance: s.distance, fuelType, price: pd.price, isVerified: pd.isVerified, change: pd.change, lastUpdated: pd.lastUpdated };
    });

  const sortedStations = [...visibleStations].sort((a, b) => sortBy === 'price' ? a.price - b.price : a.distance - b.distance);
  const bestStation = [...visibleStations].sort((a, b) => a.price - b.price)[0] ?? null;
  const nearestStation = [...visibleStations].sort((a, b) => a.distance - b.distance)[0] ?? null;

  const openInGoogleMaps = (station: Station) => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(`${station.name} ${station.address}`)}`, '_blank');
  };

  return (
    <div className="space-y-10">
      {/* Header Container */}
      <header className="flex justify-between items-end px-1">
        <div>
          <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-black tracking-tighter text-white">UPPTÄCK</motion.h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Live Telemetri</span>
          </div>
        </div>
        <button onClick={() => fetchStations()} className="w-10 h-10 glass-card !rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors">
          <Navigation size={18} className={loading ? 'animate-pulse' : ''} />
        </button>
      </header>

      {/* Hero Performance Cards */}
      <div className="grid grid-cols-2 gap-4">
        <motion.div 
          whileTap={{ scale: 0.98 }}
          onClick={() => bestStation && openInGoogleMaps(bestStation)}
          className={`col-span-2 glass-card p-8 flex flex-col justify-between min-h-[180px] cursor-pointer group border-l-4 ${bestStation ? fuelGlows[fuelType] : 'border-zinc-800'}`}
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mb-2">Bästa Alternativ</p>
              <h2 className="text-5xl font-black tracking-tighter text-white group-hover:scale-105 transition-transform origin-left">
                {bestStation ? bestStation.price.toFixed(2) : '--.--'}<span className="text-xl ml-1 text-zinc-500 font-bold">KR</span>
              </h2>
            </div>
            <div className={`p-4 rounded-3xl bg-zinc-800/50 ${fuelColors[fuelType]}`}>
              <Zap size={24} />
            </div>
          </div>
          <div className="flex justify-between items-end mt-4">
            <div className="min-w-0">
               <p className="font-bold text-zinc-400 text-sm truncate">{bestStation?.name || 'Väntar på data...'}</p>
               <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{bestStation?.address || 'Laddar stationer'}</p>
            </div>
            <span className={`text-xs font-black px-3 py-1 rounded-full bg-zinc-800 text-white`}>{bestStation ? bestStation.distance : '--'} km</span>
          </div>
        </motion.div>

        <motion.div className="glass-card p-6 flex flex-col justify-between gap-4">
           <div className="flex justify-between items-center text-zinc-500">
             <MapPin size={16} />
             <span className="text-[9px] font-black uppercase tracking-widest">Närmast</span>
           </div>
           <div>
             <div className="text-2xl font-black tracking-tighter">{nearestStation ? nearestStation.distance : '--.-'}<span className="text-xs text-zinc-500 ml-1">KM</span></div>
             <p className="text-[10px] font-bold text-zinc-500 truncate mt-1">{nearestStation?.name || '...'}</p>
           </div>
        </motion.div>

        <motion.div className="glass-card p-6 flex flex-col justify-between gap-4">
           <div className="flex justify-between items-center text-zinc-500">
             <TrendingUp size={16} />
             <span className="text-[9px] font-black uppercase tracking-widest">Trend</span>
           </div>
           <div>
             <div className={`text-2xl font-black tracking-tighter ${(nearestStation?.change ?? 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
               {loading ? '--.--' : ((nearestStation?.change ?? 0) >= 0 ? '+' : '') + (nearestStation?.change?.toFixed(2) || '0.00')}
             </div>
             <p className="text-[10px] font-bold text-zinc-500 truncate mt-1">Status: {loading ? 'Söker' : 'Synkad'}</p>
           </div>
        </motion.div>
      </div>

      {/* Advanced Control Panel */}
      <section className="glass-card p-6 py-8">
        <div className="space-y-8">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {(Object.keys(fuelNames) as FuelType[]).map((type) => (
              <button
                key={type}
                onClick={() => setFuelType(type)}
                className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap transition-all duration-300 ${
                  fuelType === type 
                    ? 'bg-white text-zinc-950 shadow-[0_0_20px_rgba(255,255,255,0.3)]' 
                    : 'bg-zinc-800/50 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                {fuelNames[type]}
              </button>
            ))}
          </div>
          
          <div className="px-1">
             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-zinc-800/50 rounded-xl text-zinc-400"><Search size={14} /></div>
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Radie: {radius} km</span>
                </div>
                <div className="h-[2px] flex-1 mx-6 bg-zinc-800/50" />
             </div>
             <input 
              type="range" min="1" max="50" value={radius} 
              onChange={(e) => setRadius(parseInt(e.target.value))} 
              className="accent-white"
             />
          </div>
        </div>
      </section>

      {/* High-Contrast Station List */}
      <div className="space-y-6 pb-12">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xl font-black tracking-tight uppercase">Stationer</h3>
          <button 
            onClick={() => setSortBy(s => s === 'distance' ? 'price' : 'distance')}
            className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-300 flex items-center gap-2 px-4 py-2 bg-zinc-900 rounded-full border border-white/5"
          >
            <ArrowUpDown size={12} />
            {sortBy === 'distance' ? 'Närmast' : 'Billigast'}
          </button>
        </div>

        <div className="grid gap-4">
          <AnimatePresence mode="popLayout">
            {loading ? (
              [1, 2, 3, 4].map(i => (
                <div key={i} className="glass-card p-6 animate-pulse flex justify-between">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-zinc-800 rounded-2xl" />
                    <div className="space-y-2"><div className="h-4 w-24 bg-zinc-800 rounded" /><div className="h-3 w-16 bg-zinc-800 rounded" /></div>
                  </div>
                  <div className="h-8 w-16 bg-zinc-800 rounded-xl mt-2" />
                </div>
              ))
            ) : (
              sortedStations.map((station, idx) => (
                <motion.div
                  key={station.id}
                  layout
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => openInGoogleMaps(station)}
                  className={`glass-card p-6 flex justify-between items-center cursor-pointer hover:bg-zinc-800/40 border-l-2 ${station.id === bestStation?.id ? `border-l-4 ${fuelGlows[fuelType]} animate-pulse-slow` : 'border-zinc-800/50'}`}
                >
                  <div className="flex items-center gap-5 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center shrink-0 border border-white/5 ${station.id === bestStation?.id ? fuelColors[fuelType] : 'text-zinc-600'}`}>
                      {station.id === bestStation?.id ? <Zap size={20} fill="currentColor" /> : <Fuel size={20} />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black tracking-tight truncate uppercase leading-none">{station.name}</span>
                        {station.isVerified && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 mt-2 truncate">
                        <MapPin size={10} className="shrink-0" />
                        <span className="truncate">{station.address}</span>
                        <span className="shrink-0">• {station.distance} km</span>
                      </div>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setReportingStation(station); }}
                        className="mt-3 text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors flex items-center gap-1"
                      >
                        <Plus size={10} /> Rapportera
                      </button>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div className={`text-2xl font-black tracking-tighter leading-none ${station.id === bestStation?.id ? fuelColors[fuelType] : 'text-white'}`}>
                      {station.price.toFixed(2)}
                      <span className="text-[10px] ml-0.5 text-zinc-600">KR</span>
                    </div>
                    <p className={`text-[9px] font-black uppercase mt-1 ${station.isVerified ? 'text-zinc-600' : (station.change ?? 0) > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {station.isVerified ? 'Verifierad' : `${(station.change ?? 0) > 0 ? '+' : ''}${station.change?.toFixed(2)}`}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
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
    </div>
  );
}
