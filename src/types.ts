export interface FuelLog {
  id: string;
  sek: number;
  lit: number;
  date: Date;
}

export interface Station {
  id: string;
  name: string;
  brand?: string;
  lat: number;
  lon: number;
  distance: number;
  price: number;
  fuelType: FuelType;
  address?: string;
  change?: number;
  isVerified?: boolean;
  lastUpdated?: Date;
}

export type FuelType = 'bensin' | 'diesel' | 'gas' | 'bensin98';
