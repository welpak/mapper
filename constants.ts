import { Business } from './types';

// Using JSDelivr CDN for Plotly's US Counties GeoJSON
export const NC_COUNTIES_GEOJSON_URL = "https://cdn.jsdelivr.net/gh/plotly/datasets@master/geojson-counties-fips.json";

// NC Zip Codes GeoJSON (Community source)
export const NC_ZIPS_GEOJSON_URL = "https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/nc_north_carolina_zip_codes_geo.min.json";

// Mock data to simulate the scraped results if no file is uploaded
export const MOCK_BUSINESSES: Business[] = [
  {
    id: '1',
    name: 'Carolina Soy Producers',
    address: '123 Farm Rd',
    city: 'Raleigh',
    county: 'Wake',
    state: 'NC',
    zip: '27601',
    lat: 35.7796,
    lng: -78.6382,
    naicsCode: '1111',
    naicsDescription: 'Oilseed and Grain Farming',
    employees: 45,
    tags: ['Agriculture', 'Soy', 'Production'],
    revenue: '$5M',
    yearEstablished: '1998',
    contactName: 'John Doe',
    phone: '919-555-0101'
  },
  {
    id: '2',
    name: 'Blue Ridge Cattle Co.',
    address: '88 Mountain View Dr',
    city: 'Asheville',
    county: 'Buncombe',
    state: 'NC',
    zip: '28801',
    lat: 35.5951,
    lng: -82.5515,
    naicsCode: '1121',
    naicsDescription: 'Cattle Ranching and Farming',
    employees: 12,
    tags: ['Livestock', 'Cattle', 'Organic'],
    revenue: '$1.2M',
    contactName: 'Sarah Smith',
    website: 'blueridgecattle.com'
  },
  {
    id: '3',
    name: 'Coastal Aqua Farms',
    address: '900 Ocean Blvd',
    city: 'Wilmington',
    county: 'New Hanover',
    state: 'NC',
    zip: '28401',
    lat: 34.2104,
    lng: -77.9447,
    naicsCode: '1125',
    naicsDescription: 'Aquaculture',
    employees: 28,
    tags: ['Seafood', 'Aquaculture', 'Sustainable'],
    revenue: '$3.5M'
  },
  {
    id: '4',
    name: 'Piedmont Poultry',
    address: '45 Chicken Run',
    city: 'Greensboro',
    county: 'Guilford',
    state: 'NC',
    zip: '27401',
    lat: 36.0726,
    lng: -79.7920,
    naicsCode: '1123',
    naicsDescription: 'Poultry and Egg Production',
    employees: 150,
    tags: ['Poultry', 'Eggs', 'Wholesale'],
    revenue: '$12M'
  },
  {
    id: '5',
    name: 'Charlotte Urban Hydroponics',
    address: '500 S Tryon St',
    city: 'Charlotte',
    county: 'Mecklenburg',
    state: 'NC',
    zip: '28202',
    lat: 35.2271,
    lng: -80.8431,
    naicsCode: '1114',
    naicsDescription: 'Greenhouse, Nursery, and Floriculture Production',
    employees: 8,
    tags: ['Hydroponics', 'Urban Farming', 'Tech'],
    revenue: '$800k'
  },
  // New entry requested by user
  {
    id: '400107754',
    name: 'Adrien J Smith & Sons Inc',
    address: '433 Greenhall Rd',
    city: 'Edenton',
    state: 'NC',
    zip: '27932',
    county: 'Chowan', // Inferred from zip/location for map placement, though raw data had empty county
    lat: 36.122619,
    lng: -76.626828,
    phone: '2524823534',
    website: 'AJSMITHSONS.COM',
    contactName: 'Adrien Smith',
    employees: 4,
    revenue: '$1,106,000',
    actualSales: 1106000.0,
    naicsCode: '111150',
    naicsDescription: 'Corn Farming',
    yearEstablished: 'Unknown',
    tags: ['Corn', 'Farming'],
    sourceUrl: 'https://accessnc.nccommerce.com/BusinessSearch/Company/Detail/400107754',
    rawDetails: `company name: Adrien J Smith & Sons Inc...`
  }
];