import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { HashRouter } from 'react-router-dom';
import * as d3 from 'd3';
import * as topojson from 'topojson-client';
import Sidebar from './components/Sidebar';
import D3Map from './components/D3Map';
import BusinessDetail from './components/BusinessDetail';
import CountyDetail from './components/CountyDetail';
import ZipDetail from './components/ZipDetail';
import { Business, GeoData } from './types';
import { MOCK_BUSINESSES, NC_COUNTIES_GEOJSON_URL } from './constants';
import { parseRevenue, formatRevenue, parseCSV } from './utils';

const STORAGE_KEY = 'nc_business_data_v1';

const App: React.FC = () => {
  // Initialize from LocalStorage if available
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : MOCK_BUSINESSES;
    } catch (e) {
      console.error("Failed to load saved data", e);
      return MOCK_BUSINESSES;
    }
  });

  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>(businesses);
  
  // Map Data State (Hoisted to App level for reverse geocoding)
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // Hierarchical Selection State
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedZip, setSelectedZip] = useState<string | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);

  // Load Map Data on Mount
  useEffect(() => {
    const fetchTopology = async () => {
      try {
        const response = await fetch(NC_COUNTIES_GEOJSON_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            throw new Error("Failed to parse map data.");
        }
        
        if (data.type === 'FeatureCollection') {
            let features = data.features;
            // Filter for NC (FIPS 37)
            const ncFeatures = features.filter((f: any) => 
                f.properties?.STATE === '37' || 
                (typeof f.id === 'string' && f.id.startsWith('37'))
            );
            if (ncFeatures.length > 0) {
                setGeoData({ ...data, features: ncFeatures } as GeoData);
            } else {
                setGeoData(data as GeoData);
            }
        } else if (data.type === 'Topology') {
            // @ts-ignore
            const objectName = Object.keys(data.objects)[0];
            // @ts-ignore
            const geojson = topojson.feature(data, data.objects[objectName]);
            setGeoData(geojson as unknown as GeoData);
        }
      } catch (e: any) {
        console.error("Failed to load map data", e);
        setMapError(e.message);
      }
    };
    fetchTopology();
  }, []);

  // Sync filtered list when main list changes
  useEffect(() => {
    setFilteredBusinesses(businesses);
  }, [businesses]);

  // Derive businesses for the selected county
  const countyBusinesses = useMemo(() => {
    if (!selectedCounty) return [];
    return businesses.filter(b => b.county.toLowerCase() === selectedCounty.toLowerCase());
  }, [selectedCounty, businesses]);

  // Derive businesses for the selected zip
  const zipBusinesses = useMemo(() => {
    if (!selectedZip) return [];
    return businesses.filter(b => b.zip === selectedZip);
  }, [selectedZip, businesses]);

  // Calculate State-specific totals (All businesses)
  const stateTotals = useMemo(() => {
    const totalEmployees = businesses.reduce((sum, b) => sum + (b.employees || 0), 0);
    const totalRevenueVal = businesses.reduce((sum, b) => sum + parseRevenue(b.revenue), 0);
    return {
        employees: totalEmployees,
        revenue: formatRevenue(totalRevenueVal)
    };
  }, [businesses]);

  // Calculate County-specific totals
  const countyTotals = useMemo(() => {
    if (!selectedCounty) return { employees: 0, revenue: '$0' };
    
    const totalEmployees = countyBusinesses.reduce((sum, b) => sum + (b.employees || 0), 0);
    const totalRevenueVal = countyBusinesses.reduce((sum, b) => sum + parseRevenue(b.revenue), 0);
    
    return {
        employees: totalEmployees,
        revenue: formatRevenue(totalRevenueVal)
    };
  }, [selectedCounty, countyBusinesses]);

  // Calculate Zip-specific totals
  const zipTotals = useMemo(() => {
    if (!selectedZip) return { employees: 0, revenue: '$0' };

    const totalEmployees = zipBusinesses.reduce((sum, b) => sum + (b.employees || 0), 0);
    const totalRevenueVal = zipBusinesses.reduce((sum, b) => sum + parseRevenue(b.revenue), 0);

    return {
        employees: totalEmployees,
        revenue: formatRevenue(totalRevenueVal)
    };
  }, [selectedZip, zipBusinesses]);

  // --- Helper to cleanup county names ---
  const cleanCountyName = (name: string) => {
      if (!name) return "";
      let clean = name.trim();
      if (clean.toLowerCase().endsWith(" county")) {
          clean = clean.substring(0, clean.length - 7).trim();
      }
      // Simple Title Case
      return clean.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
  };

  // --- Handle File Upload ---
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, isAppending: boolean) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let rawData: any[] = [];
        
        // Detect CSV
        if (file.name.toLowerCase().endsWith('.csv')) {
            rawData = parseCSV(content);
        } else {
            rawData = JSON.parse(content);
        }

        if (Array.isArray(rawData)) {
            let processedCount = 0;
            let dupCount = 0;
            let geoCodedCount = 0;

            const mappedData: Business[] = rawData.map((item: any, index: number) => {
                const lat = parseFloat(item.latitude || item.lat);
                const lng = parseFloat(item.longitude || item.lng);
                
                // Skip invalid locations
                if (isNaN(lat) || isNaN(lng)) return null;

                // 1. Normalize County Name
                let county = cleanCountyName(item.county);

                // 2. Reverse Geocoding (Point-in-Polygon) if county is missing
                if (!county && geoData && geoData.features) {
                    const point: [number, number] = [lng, lat];
                    const feature = geoData.features.find((f: any) => 
                        d3.geoContains(f, point)
                    );
                    if (feature) {
                        county = feature.properties?.NAME || feature.properties?.name || "";
                        if (county) {
                             county = cleanCountyName(county);
                             geoCodedCount++;
                        }
                    }
                }

                // If still no county, mark as Unknown but keep the record
                if (!county) county = "Unknown";

                return {
                    id: item.id || `uploaded-${Date.now()}-${index}`,
                    name: item.name || "Unknown Business",
                    address: item.address || "",
                    city: item.city || "",
                    county: county,
                    state: item.state || "NC",
                    zip: item.zip || "",
                    lat: lat,
                    lng: lng,
                    naicsCode: item.naics_code || item.naicsCode || "0000",
                    naicsDescription: item.naics_description || item.naicsDescription || "Unknown",
                    employees: parseInt(item.actual_employee_count || item.employees) || 0,
                    revenue: item.actual_sales_volume || item.revenue,
                    phone: item.phone,
                    website: item.website,
                    contactName: item.contact_name || item.contactName,
                    contactTitle: item.contact_title || item.contactTitle,
                    yearEstablished: item.year_established || item.yearEstablished,
                    sicCode: item.sic_code || item.sicCode,
                    sourceUrl: item.source_url || item.sourceUrl,
                    rawDetails: item.raw_details || item.rawDetails,
                    tags: item.tags || [item.naics_description || item.naicsDescription || "Business"]
                };
            }).filter(b => b !== null) as Business[];
            
            // 3. Merge Strategy
            let finalData: Business[];
            
            if (isAppending) {
                // Deduplicate against existing businesses
                const existingMap = new Set(businesses.map(b => `${b.name.toLowerCase()}|${b.zip}`));
                const nonDuplicates = mappedData.filter(b => {
                    const key = `${b.name.toLowerCase()}|${b.zip}`;
                    if (existingMap.has(key)) {
                        dupCount++;
                        return false;
                    }
                    return true;
                });
                finalData = [...businesses, ...nonDuplicates];
                processedCount = nonDuplicates.length;
            } else {
                // For replace mode, we still dedup within the new file itself
                const seen = new Set();
                finalData = mappedData.filter(b => {
                    const key = `${b.name.toLowerCase()}|${b.zip}`;
                    if (seen.has(key)) {
                         dupCount++;
                         return false;
                    }
                    seen.add(key);
                    return true;
                });
                processedCount = finalData.length;
            }

            setBusinesses(finalData);
            setFilteredBusinesses(finalData);
            
            // Persist to LocalStorage
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(finalData));
                let msg = `Loaded ${processedCount} records.`;
                if (dupCount > 0) msg += ` Skipped ${dupCount} duplicates.`;
                if (geoCodedCount > 0) msg += ` Auto-detected county for ${geoCodedCount} records.`;
                alert(msg);
            } catch (err) {
                console.error("Storage Error", err);
                alert(`Loaded ${processedCount} records (Storage Full).`);
            }
            
        } else {
            alert("Invalid file format. Expected an array of records.");
        }
      } catch (error) {
        console.error("Error parsing file", error);
        alert("Failed to parse file. Please ensure it is valid JSON or CSV.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleUpdateBusiness = (updatedBusiness: Business) => {
    const updatedList = businesses.map(b => b.id === updatedBusiness.id ? updatedBusiness : b);
    setBusinesses(updatedList);
    // Since filteredBusinesses might be a subset, we should also update it if the item exists there
    setFilteredBusinesses(prev => prev.map(b => b.id === updatedBusiness.id ? updatedBusiness : b));
    setSelectedBusiness(updatedBusiness);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
  };

  const handleClearData = () => {
    if (window.confirm("Are you sure you want to clear all saved data and revert to the default set?")) {
        localStorage.removeItem(STORAGE_KEY);
        setBusinesses(MOCK_BUSINESSES);
        handleCloseAll();
    }
  };

  const handleFilterChange = useCallback((query: string) => {
    const rawLower = query.toLowerCase().trim();
    if (!rawLower) {
        setFilteredBusinesses(businesses);
        return;
    }

    const isTagSearch = rawLower.startsWith('#');
    const searchTerm = isTagSearch ? rawLower.slice(1) : rawLower;

    const filtered = businesses.filter(b => {
      // Tag Logic
      const matchesTags = b.tags.some(tag => tag.toLowerCase().includes(searchTerm));
      
      // If starts with #, strict tag search
      if (isTagSearch) {
          return matchesTags;
      }

      return (
        b.name.toLowerCase().includes(rawLower) ||
        b.city.toLowerCase().includes(rawLower) ||
        b.county.toLowerCase().includes(rawLower) ||
        b.state.toLowerCase().includes(rawLower) ||
        b.zip.includes(rawLower) ||
        b.naicsCode.includes(rawLower) ||
        matchesTags
      );
    });
    setFilteredBusinesses(filtered);
  }, [businesses]);

  const handleSelectBusiness = (b: Business) => {
    setSelectedBusiness(b);
    // Only auto-select Zip/County if not already selected to allow browsing
    if (!selectedZip) setSelectedZip(b.zip);
    if (!selectedCounty) setSelectedCounty(b.county);
  };

  const handleSelectCounty = (countyName: string) => {
    setSelectedBusiness(null);
    setSelectedZip(null);
    setSelectedCounty(countyName);
  };
  
  const handleSelectZip = (zipCode: string) => {
      setSelectedBusiness(null);
      setSelectedZip(zipCode);
      const matchingBusiness = businesses.find(b => b.zip === zipCode);
      if (matchingBusiness) {
          setSelectedCounty(matchingBusiness.county);
      }
  };

  const handleCloseAll = () => {
    setSelectedBusiness(null);
    setSelectedZip(null);
    setSelectedCounty(null);
  };

  return (
    <HashRouter>
      <div className="flex h-screen w-screen bg-slate-900 overflow-hidden">
        <Sidebar 
          businesses={filteredBusinesses}
          onUpload={handleFileUpload}
          onFilterChange={handleFilterChange}
          onSelectBusiness={handleSelectBusiness}
          selectedId={selectedBusiness?.id}
          onClearData={handleClearData}
        />

        <div className="flex-1 relative">
          <D3Map 
            businesses={filteredBusinesses} 
            geoData={geoData} 
            onSelectBusiness={handleSelectBusiness}
            selectedBusinessId={selectedBusiness?.id}
            onSelectCounty={handleSelectCounty}
            selectedCountyName={selectedCounty}
            onSelectZip={handleSelectZip}
            selectedZipCode={selectedZip}
            stateTotalEmployees={stateTotals.employees}
            stateTotalRevenue={stateTotals.revenue}
          />
          
          {selectedBusiness ? (
             <BusinessDetail 
                business={selectedBusiness} 
                onClose={handleCloseAll}
                onSelectCounty={handleSelectCounty}
                onSelectZip={handleSelectZip}
                onUpdateBusiness={handleUpdateBusiness}
             />
          ) : selectedZip ? (
             <ZipDetail
                zipCode={selectedZip}
                countyName={selectedCounty || "Unknown County"}
                zipBusinesses={zipBusinesses}
                zipTotalEmployees={zipTotals.employees}
                zipTotalRevenue={zipTotals.revenue}
                onClose={handleCloseAll}
                onSelectCounty={handleSelectCounty}
                onSelectBusiness={handleSelectBusiness}
             />
          ) : selectedCounty ? (
             <CountyDetail 
                countyName={selectedCounty}
                countyBusinesses={countyBusinesses}
                countyTotalEmployees={countyTotals.employees}
                countyTotalRevenue={countyTotals.revenue}
                onClose={handleCloseAll}
                onSelectBusiness={handleSelectBusiness}
             />
          ) : null}
        </div>
      </div>
    </HashRouter>
  );
};

export default App;