import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Business, GeoData, ViewMode } from '../types';
import { NC_ZIPS_GEOJSON_URL } from '../constants';
import { Layers, Users, DollarSign } from 'lucide-react';

interface D3MapProps {
  businesses: Business[];
  geoData: GeoData | null; // Now passed from parent
  onSelectBusiness: (b: Business) => void;
  selectedBusinessId?: string;
  onSelectCounty: (countyName: string) => void;
  selectedCountyName?: string | null;
  onSelectZip: (zipCode: string) => void;
  selectedZipCode?: string | null;
  stateTotalEmployees?: number;
  stateTotalRevenue?: string;
}

const D3Map: React.FC<D3MapProps> = ({ 
  businesses, 
  geoData,
  onSelectBusiness, 
  selectedBusinessId,
  onSelectCounty,
  selectedCountyName,
  onSelectZip,
  selectedZipCode,
  stateTotalEmployees = 0,
  stateTotalRevenue = "$0"
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Data States
  const [zipData, setZipData] = useState<GeoData | null>(null);
  
  // UI States
  const [loading, setLoading] = useState(true);
  const [loadingZips, setLoadingZips] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.STATE);
  const [showZips, setShowZips] = useState(false); // Toggle State
  
  // Hovered Name State (For the top header)
  const [hoveredName, setHoveredName] = useState<string | null>(null);

  // Sync Loading state with geoData arrival
  useEffect(() => {
    if (geoData) setLoading(false);
  }, [geoData]);

  // Fetch Zips if Toggled
  useEffect(() => {
      if (showZips && !zipData && !loadingZips) {
          const fetchZips = async () => {
              try {
                  setLoadingZips(true);
                  const response = await fetch(NC_ZIPS_GEOJSON_URL);
                  if(!response.ok) throw new Error("Failed to load zip codes");
                  const data = await response.json();
                  setZipData(data as GeoData);
              } catch (e) {
                  console.error("Zip Load Error", e);
              } finally {
                  setLoadingZips(false);
              }
          };
          fetchZips();
      }
  }, [showZips, zipData, loadingZips]);


  // Initialize Map Structure
  const mapInitialized = useRef(false);
  const projectionRef = useRef<d3.GeoProjection | null>(null);
  
  useEffect(() => {
    if (!geoData || !svgRef.current || !containerRef.current) return;
    if (mapInitialized.current) {
        drawLayers();
        return;
    }

    const svg = d3.select(svgRef.current);
    const { width, height } = containerRef.current.getBoundingClientRect();
    
    // Clear any existing
    svg.selectAll("*").remove();

    // Projection
    const projection = d3.geoTransverseMercator()
      .rotate([79, -33 - 40 / 60])
      .fitSize([width, height], geoData as any);
    
    projectionRef.current = projection;

    // Groups
    const g = svg.append("g").attr("class", "map-content");
    g.append("g").attr("class", "layer-base"); // Counties
    g.append("g").attr("class", "layer-zips"); // Zips
    g.append("g").attr("class", "layer-pins"); // Pins

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 15])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
        
        const k = event.transform.k;
        if (k > 8) setViewMode(ViewMode.LOCAL);
        else if (k > 3) setViewMode(ViewMode.COUNTY);
        else setViewMode(ViewMode.STATE);

        // Adjust stroke widths
        g.selectAll("path").attr("stroke-width", 0.5 / k);
        
        // Semantic Pin Resizing
        g.selectAll(".map-pin").each(function(d: any) {
             const coords = projection([d.lng, d.lat]);
             if (!coords) return;
             
             const node = d3.select(this);
             const isSelected = d.id === node.attr("data-selected-id");
             const isHovered = node.attr("data-hovered") === "true";
             
             const scale = Math.max(0.2, 1 / k);
             let finalScale = scale;
             if (isSelected) finalScale *= 1.5;
             if (isHovered) finalScale *= 1.5;
             
             node.attr("transform", `translate(${coords[0]},${coords[1]}) scale(${finalScale})`);
        });
      });

    svg.call(zoom);
    mapInitialized.current = true;
    drawLayers();

  }, [geoData]); // Re-init if base geoData changes

  // Draw Layers Function
  const drawLayers = () => {
     if (!svgRef.current || !projectionRef.current || !geoData) return;
     const svg = d3.select(svgRef.current);
     const pathGenerator = d3.geoPath().projection(projectionRef.current);
     
     // 1. Draw Counties (Always render, but maybe hide if zips are opaque? Keep for context)
     const baseLayer = svg.select(".layer-base");
     
     // Bind Data
     const counties = baseLayer.selectAll("path.county")
        .data(geoData.features);
     
     // Enter
     counties.enter()
        .append("path")
        .attr("class", "county draw-path transition-colors duration-200")
        .attr("d", pathGenerator as any)
        .attr("fill", "#0f172a")
        .attr("stroke", "#38bdf8")
        .attr("stroke-width", 0.5)
        .merge(counties as any)
        .attr("cursor", showZips ? "default" : "pointer")
        .attr("opacity", showZips ? 0.3 : 1) // Dim counties if Zips are on
        .on("click", (event, d: any) => {
            if (showZips) return; // Ignore county clicks in zip mode
            const name = d.properties?.NAME || d.properties?.name;
            if (name) onSelectCounty(name);
        })
        .on("mouseenter", function(event, d: any) {
             if (showZips) return;
             const name = d.properties?.NAME || d.properties?.name;
             setHoveredName(name || "Unknown County");
             d3.select(this).attr("opacity", 0.8); 
        })
        .on("mouseleave", function(event, d: any) {
             if (showZips) return;
             setHoveredName(null);
             d3.select(this).attr("opacity", 1);
        });

     // 2. Draw Zips (If enabled and loaded)
     const zipLayer = svg.select(".layer-zips");
     
     if (showZips && zipData) {
         const zips = zipLayer.selectAll("path.zip")
            .data(zipData.features);

         zips.enter()
            .append("path")
            .attr("class", "zip transition-colors duration-200")
            .attr("d", pathGenerator as any)
            .attr("fill", "transparent") // Default transparent
            .attr("stroke", "#2dd4bf") // Teal-400
            .attr("stroke-width", 0.5)
            .attr("cursor", "pointer")
            .merge(zips as any)
            .on("click", (event, d: any) => {
                 const zip = d.properties?.ZCTA5CE10 || d.properties?.zip;
                 if (zip) onSelectZip(zip);
            })
             .on("mouseenter", function(event, d: any) {
                 const zip = d.properties?.ZCTA5CE10 || d.properties?.zip;
                 setHoveredName("Zip " + zip);
                 d3.select(this).attr("fill", "#134e4a"); // Teal-900 highlight
            })
            .on("mouseleave", function(event, d: any) {
                 setHoveredName(null);
                 const zip = d.properties?.ZCTA5CE10 || d.properties?.zip;
                 const isSelected = zip === selectedZipCode;
                 d3.select(this).attr("fill", isSelected ? "#0d9488" : "transparent");
            });

         zips.exit().remove();
     } else {
         zipLayer.selectAll("*").remove();
     }
  };

  // Effect to re-draw when toggle changes or data arrives
  useEffect(() => {
     drawLayers();
  }, [showZips, zipData, geoData]);


  // Update Selections (County/Zip Colors)
  useEffect(() => {
      if (!svgRef.current) return;
      const svg = d3.select(svgRef.current);
      
      // Update County Colors
      svg.select(".layer-base").selectAll("path.county")
        .attr("fill", (d: any) => {
             const name = d.properties?.NAME || d.properties?.name;
             if (showZips) return "#0f172a"; // Reset if zips mode
             return (name === selectedCountyName) ? "#0ea5e9" : "#0f172a";
        });
        
      // Update Zip Colors
      if (showZips) {
          svg.select(".layer-zips").selectAll("path.zip")
            .attr("fill", (d: any) => {
                 const zip = d.properties?.ZCTA5CE10 || d.properties?.zip;
                 return (zip === selectedZipCode) ? "#0d9488" : "transparent"; 
            });
      }
      
  }, [selectedCountyName, selectedZipCode, geoData, zipData, showZips]);


  // Update Pins
  useEffect(() => {
    if (!geoData || !mapInitialized.current || !svgRef.current) return;
    
    const svg = d3.select(svgRef.current);
    const g = svg.select(".layer-pins"); // Use layer-pins group
    const projection = projectionRef.current;
    
    if (!g.empty() && projection) {
        const pinPath = "M12 0c-4.418 0-8 3.582-8 8 0 5.094 6.941 14.566 7.42 15.214.286.388.874.388 1.16 0 .479-.648 7.42-10.12 7.42-15.214 0-4.418-3.582-8-8-8zm0 11c-1.657 0-3-1.343-3-3s1.343-3 3-3 3 1.343 3 3-1.343 3-3 3z";

        const pins = g.selectAll<SVGGElement, Business>(".map-pin")
            .data(businesses, (d) => d.id);

        pins.exit().remove();

        const pinsEnter = pins.enter()
            .append("g")
            .attr("class", "map-pin pin-interactive")
            .attr("cursor", "pointer")
            .attr("transform", (d) => {
                const coords = projection([d.lng, d.lat]);
                return coords ? `translate(${coords[0]},${coords[1]}) scale(0.2)` : null;
            });
        
        pinsEnter.append("path")
            .attr("d", pinPath)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("transform", "translate(-12, -24)");

        const allPins = pinsEnter.merge(pins);

        allPins
            .attr("data-selected-id", selectedBusinessId || "")
            .each(function(d) {
                const isSelected = d.id === selectedBusinessId;
                d3.select(this).select("path").attr("fill", isSelected ? "#f43f5e" : "#fbbf24");
                
                const transform = d3.zoomTransform(svg.node()!);
                const k = transform.k;
                const coords = projection([d.lng, d.lat]);
                if (coords) {
                     const scale = Math.max(0.2, 1 / k);
                     const finalScale = isSelected ? scale * 1.5 : scale;
                     d3.select(this).attr("transform", `translate(${coords[0]},${coords[1]}) scale(${finalScale})`);
                }
            })
            .on("click", (event, d) => {
                event.stopPropagation();
                onSelectBusiness(d);
            })
            .on("mouseenter", function(event, d) {
                const node = d3.select(this);
                node.attr("data-hovered", "true");
                node.select("path").attr("fill", "#a855f7"); 

                const transform = d3.zoomTransform(svg.node()!);
                const k = transform.k;
                const coords = projection([d.lng, d.lat]);
                if (coords) {
                    const baseScale = Math.max(0.2, 1 / k);
                    const finalScale = baseScale * 1.5; 
                    node.transition().duration(200)
                        .attr("transform", `translate(${coords[0]},${coords[1]}) scale(${finalScale})`);
                }
                setHoveredName(d.name);
            })
            .on("mouseleave", function(event, d) {
                const node = d3.select(this);
                node.attr("data-hovered", "false");
                const isSelected = d.id === selectedBusinessId;
                node.select("path").attr("fill", isSelected ? "#f43f5e" : "#fbbf24"); 

                const transform = d3.zoomTransform(svg.node()!);
                const k = transform.k;
                const coords = projection([d.lng, d.lat]);
                if (coords) {
                    const baseScale = Math.max(0.2, 1 / k);
                    const finalScale = isSelected ? baseScale * 1.5 : baseScale;
                    node.transition().duration(200)
                        .attr("transform", `translate(${coords[0]},${coords[1]}) scale(${finalScale})`);
                }
                setHoveredName(null);
            });
    }

  }, [businesses, selectedBusinessId, geoData]);

  // Determine if we should show the State Overview
  const showStateOverview = !selectedBusinessId && !selectedCountyName && !selectedZipCode;

  return (
    <div ref={containerRef} className="w-full h-full relative bg-slate-950 overflow-hidden">
      {/* Top Header Tooltip Area */}
      <div className="absolute top-0 left-0 w-full h-32 pointer-events-none z-20 flex items-center justify-center bg-gradient-to-b from-slate-950/80 to-transparent">
         <h1 className="text-4xl font-bold text-white drop-shadow-lg tracking-wide transition-all duration-300 transform">
             {hoveredName || " "}
         </h1>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-slate-900/80">
          <div className="text-sky-400 text-xl font-light animate-pulse">Loading Map Data...</div>
        </div>
      )}

      {loadingZips && (
        <div className="absolute top-16 right-4 z-50 bg-slate-800 p-2 rounded shadow text-teal-400 text-xs animate-pulse">
            Loading Zip Codes...
        </div>
      )}
      
      {/* View Mode Indicator */}
      <div className="absolute top-4 right-4 z-10 bg-slate-800/80 backdrop-blur border border-slate-700 p-2 rounded text-xs text-slate-300 font-mono pointer-events-none">
        LEVEL: <span className="text-sky-400 font-bold">{viewMode}</span>
      </div>

      {/* State Overview Panel */}
      {showStateOverview && !loading && (
        <div className="absolute top-20 right-4 z-10 w-64 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-4 shadow-xl">
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">State Overview</h3>
             <div className="space-y-3">
                 <div className="flex items-center justify-between">
                     <div className="flex items-center text-slate-400 text-sm">
                         <Users size={16} className="mr-2" /> Employees
                     </div>
                     <span className="text-white font-bold">{stateTotalEmployees.toLocaleString()}</span>
                 </div>
                 <div className="flex items-center justify-between">
                     <div className="flex items-center text-slate-400 text-sm">
                         <DollarSign size={16} className="mr-2" /> Revenue
                     </div>
                     <span className="text-emerald-400 font-bold">{stateTotalRevenue}</span>
                 </div>
             </div>
        </div>
      )}

      {/* Zip Code Toggle */}
      <div className="absolute bottom-16 right-4 z-30">
          <button 
            onClick={() => setShowZips(!showZips)}
            className={`flex items-center gap-2 px-3 py-2 rounded shadow-lg border transition-all ${showZips ? 'bg-teal-900 border-teal-500 text-teal-300' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
          >
              <Layers size={16} />
              <span className="text-sm font-medium">Show Zip Codes</span>
          </button>
      </div>

      <svg ref={svgRef} className="w-full h-full block" style={{ cursor: 'grab' }} />
      
      <div className="absolute bottom-4 left-4 pointer-events-none">
        <div className="text-slate-500 text-xs">
          NC Business Atlas v1.0 <br/>
          D3.js + React
        </div>
      </div>
    </div>
  );
};

export default D3Map;