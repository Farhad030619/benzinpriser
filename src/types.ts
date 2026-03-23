export interface FuelLog {
  id: string;
  sek: number;
  lit: number;
  date: Date;
}

export interface Station {
  id: number;
  name: string;
  brand: string;
  lat: number;
  lon: number;
  distance: number;
  price: number;
  fuelType: string;
  address?: string;
  change?: number;
}

export type FuelType = 'bensin' | 'diesel' | 'gas' | 'bensin98';
