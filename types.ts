export interface Business {
  id: string;
  name: string;
  address: string;
  city: string;
  county: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  naicsCode: string;
  naicsDescription: string;
  employees: number;
  revenue?: string;
  phone?: string;
  website?: string;
  tags: string[];
  
  // New detailed fields
  contactName?: string;
  contactTitle?: string;
  actualSales?: number;
  yearEstablished?: string;
  sicCode?: string;
  sicDescription?: string;
  locationType?: string;
  sourceUrl?: string;
  rawDetails?: string;
}

export interface GeoFeature {
  type: string;
  properties: {
    NAME: string;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: any[];
  };
}

export interface GeoData {
  type: string;
  features: GeoFeature[];
}

export enum ViewMode {
  STATE = 'STATE',
  COUNTY = 'COUNTY',
  LOCAL = 'LOCAL'
}