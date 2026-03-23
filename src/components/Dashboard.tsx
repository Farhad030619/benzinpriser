import { useState, useEffect } from 'react';
import type { Station, FuelType } from '../types';
import { MapPin, Navigation, TrendingUp, Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [radius, setRadius] = useState(15);
  const [fuelType, setFuelType] = useState<FuelType>('bensin');
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);

  // Simulated mapping for testing
  const fuelNames = {
    bensin: 'Bensin 95',
    diesel: 'Diesel',
    gas: 'Fordonsgas',
    bensin98: 'Bensin 98'
  };

  useEffect(() => {
    fetchStations();
  }, [radius, fuelType]);

  const fetchStations = async () => {
    setLoading(true);
    try {
      // Simulate real GPS in Stockholm
      const lat = 59.3293;
      const lng = 18.0686;
      const query = `[out:json];node["amenity"="fuel"](around:${radius * 1000},${lat},${lng});out 15;`;
      
      const response = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      const parsed: Station[] = data.elements.map((el: any) => {
        // Mock prices based on fuel type
        const basePrice = fuelType === 'diesel' ? 18.50 : 17.50;
        const randomVariation = (Math.random() * 2 - 1).toFixed(2);
        
        // Extract address components if available
        const street = el.tags['addr:street'] || '';
        const houseNumber = el.tags['addr:housenumber'] || '';
        const city = el.tags['addr:city'] || '';
        const address = [street, houseNumber, city].filter(Boolean).join(', ') || 'Okänd adress';
        
        // Mock price change
        const change = parseFloat((Math.random() * 0.4 - 0.2).toFixed(2));
        
        return {
          id: el.id,
          name: el.tags.name || el.tags.brand || "Bensinstation",
          brand: el.tags.brand || "",
          lat: el.lat,
          lon: el.lon,
          distance: parseFloat((Math.random() * (radius / 2)).toFixed(1)),
          price: parseFloat((basePrice + parseFloat(randomVariation)).toFixed(2)),
          fuelType: fuelNames[fuelType],
          address: address,
          change: change
        };
      });

      // Sort by distance (as requested)
      parsed.sort((a, b) => a.distance - b.distance);
      setStations(parsed);
    } catch (error) {
      console.error("Error fetching stations", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedByPrice = [...stations].sort((a, b) => a.price - b.price);
  const bestStation = sortedByPrice.length > 0 ? sortedByPrice[0] : null;
  const nearestStation = stations.length > 0 ? stations[0] : null; // Already sorted by distance in fetch

  const openInGoogleMaps = (station: Station) => {
    // Fallback direct coordinates
    const directUrl = `https://www.google.com/maps?q=${station.lat},${station.lon}`;
    window.open(directUrl, '_blank');
  };

  return (
    <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Hitta station</h1>
        <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
          <div className="w-2 h-2 rounded-full bg-brand-orange animate-pulse" />
          Position hittad
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Närmast billigast */}
        <div className="col-span-1 row-span-2 glass-card bg-brand-orange text-white p-5 flex flex-col justify-between shadow-[0_10px_30px_-10px_rgba(242,122,84,0.5)] border-transparent">
          <div>
            <h3 className="text-sm font-semibold opacity-90 mb-1">Billigast</h3>
            <Navigation className="w-5 h-5 absolute top-4 right-4 opacity-50" />
            <div className="text-4xl font-black mt-2 leading-none">
              {loading ? '--.--' : bestStation ? bestStation.price : '--.--'}
            </div>
            <div className="text-sm font-medium mt-1 opacity-90">
              {bestStation?.name || 'Söker...'}
            </div>
          </div>
          <div className="text-xs font-semibold mt-4 opacity-80 flex items-center gap-1">
            <MapPin size={12} />
            {bestStation ? `${bestStation.distance} km` : '-- km'}
          </div>
        </div>

        {/* Närmast */}
        <div 
          onClick={() => nearestStation && openInGoogleMaps(nearestStation)}
          className="glass-card bg-white p-4 flex flex-col justify-center relative overflow-hidden cursor-pointer active:scale-95 transition-transform"
        >
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Närmast</h3>
          <div className="flex flex-col">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-bold text-zinc-800">{nearestStation?.price || '--.--'}</span>
              <span className="text-xs font-bold text-zinc-400">{nearestStation?.distance || '0.0'} km</span>
            </div>
            <div className="text-[10px] font-bold text-zinc-600 truncate mt-1">
              {nearestStation?.name || 'Söker...'}
            </div>
            <div className="text-[9px] font-medium text-zinc-400 truncate">
              {nearestStation?.address || 'Hittar ej adress'}
            </div>
          </div>
        </div>

        {/* Prisändring */}
        <div className="glass-card bg-white p-4 flex flex-col justify-center">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Prisändring</h3>
          <div className={`flex items-center gap-1 font-bold ${nearestStation && nearestStation.change && nearestStation.change > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
            <TrendingUp size={16} className={nearestStation && nearestStation.change && nearestStation.change < 0 ? 'rotate-180' : ''} />
            {nearestStation?.change ? `${nearestStation.change > 0 ? '+' : ''}${nearestStation.change}` : '0.00'} kr
          </div>
          <div className="text-[10px] text-zinc-400 font-medium">Baserat på närmaste</div>
        </div>
      </div>

      {/* Fuel Selector */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Välj bränsle</h2>
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {(Object.keys(fuelNames) as FuelType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFuelType(type)}
              className={`px-5 py-2 rounded-full font-semibold text-sm whitespace-nowrap transition-all shadow-sm ${
                fuelType === type 
                  ? 'bg-brand-orange text-white shadow-[0_4px_15px_-5px_rgba(242,122,84,0.5)]' 
                  : 'bg-white text-zinc-600 hover:bg-zinc-50 border border-zinc-100'
              }`}
            >
              {fuelNames[type]}
            </button>
          ))}
        </div>
      </div>

      {/* Radius Slider with Custom Styling applied globally */}
      <div className="mb-8 glass-card p-5">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Sökradie</h2>
          <span className="font-bold text-brand-orange">{radius} km</span>
        </div>
        <div className="px-1 line-h-0">
           <input 
             type="range" 
             min="1" 
             max="50" 
             value={radius} 
             onChange={(e) => setRadius(parseInt(e.target.value))}
           />
        </div>
      </div>

      {/* Station List */}
      <div>
        <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-3">Stationer</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 text-brand-orange animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {stations.map(station => (
              <div 
                key={station.id} 
                onClick={() => openInGoogleMaps(station)}
                className="glass-card p-4 flex justify-between items-center transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer hover:border-brand-orange/20"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <h4 className="font-bold text-zinc-800 truncate">{station.name}</h4>
                  <p className="text-[10px] font-bold text-zinc-600 truncate">{station.address}</p>
                  <p className="text-xs font-semibold text-zinc-400 mt-0.5">{station.distance} km bort</p>
                </div>
                <div className="text-right">
                  <div className="font-black text-lg text-brand-orange">{station.price} kr</div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    {station.change && station.change > 0 ? `+${station.change}` : station.change} kr
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
