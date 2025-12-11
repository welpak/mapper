import { Business } from './types';

// Using JSDelivr CDN for Plotly's US Counties GeoJSON
export const NC_COUNTIES_GEOJSON_URL = "https://cdn.jsdelivr.net/gh/plotly/datasets@master/geojson-counties-fips.json";

// NC Zip Codes GeoJSON (Community source)
export const NC_ZIPS_GEOJSON_URL = "https://raw.githubusercontent.com/OpenDataDE/State-zip-code-GeoJSON/master/nc_north_carolina_zip_codes_geo.min.json";

// Empty array to allow user to import their own data
export const MOCK_BUSINESSES: Business[] = [];
