import React from 'react';
import { Business } from '../types';
import { parseRevenue, formatRevenue } from '../utils';
import { X, Users, DollarSign, MapPin } from 'lucide-react';

interface CountyDetailProps {
  countyName: string;
  countyBusinesses: Business[];
  countyTotalEmployees: number;
  countyTotalRevenue: string;
  onClose: () => void;
  onSelectBusiness: (b: Business) => void;
}

const CountyDetail: React.FC<CountyDetailProps> = ({ 
  countyName, 
  countyBusinesses, 
  countyTotalEmployees,
  countyTotalRevenue,
  onClose,
  onSelectBusiness
}) => {
  return (
    <div className="absolute top-0 right-0 h-full w-full md:w-96 bg-slate-900/95 backdrop-blur-md border-l border-slate-700 shadow-2xl z-40 flex flex-col transition-transform duration-300 transform">
      {/* Header */}
      <div className="p-6 border-b border-slate-700 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{countyName} County</h2>
          <span className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-indigo-900 text-indigo-300 border border-indigo-700">
            {countyBusinesses.length} Businesses
          </span>
        </div>
        <div className="flex gap-2">
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors">
                <X size={20} />
            </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* County Aggregates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 p-3 rounded border border-slate-700">
            <div className="flex items-center text-slate-400 text-xs uppercase font-bold mb-1">
              <Users size={14} className="mr-1" /> County Employees
            </div>
            <div className="text-xl font-semibold text-white">{countyTotalEmployees.toLocaleString()}</div>
          </div>
          <div className="bg-slate-800 p-3 rounded border border-slate-700">
            <div className="flex items-center text-slate-400 text-xs uppercase font-bold mb-1">
              <DollarSign size={14} className="mr-1" /> County Revenue
            </div>
            <div className="text-xl font-semibold text-emerald-400">{countyTotalRevenue}</div>
          </div>
        </div>

        {/* Location Hierarchy */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Location Hierarchy</h3>
          <div className="flex flex-col space-y-2 select-none">
            
            <div 
                onClick={onClose}
                className="flex items-center space-x-2 text-white hover:text-sky-400 cursor-pointer transition-colors"
                title="Go to State View"
            >
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span>USA</span>
            </div>
            
            <div 
                onClick={onClose}
                className="flex items-center space-x-2 text-white hover:text-sky-400 ml-4 border-l border-slate-700 pl-4 cursor-pointer transition-colors"
                title="Go to State View"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span>North Carolina</span>
            </div>
            
            <div className="flex items-center space-x-2 text-white ml-8 border-l border-slate-700 pl-4 font-bold">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span>{countyName} County</span>
            </div>
            
          </div>
        </div>

        {/* Business List */}
        <div>
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Businesses in {countyName}</h3>
           <div className="space-y-3">
             {countyBusinesses.length === 0 ? (
               <div className="text-slate-500 text-sm italic">No businesses found in this county.</div>
             ) : (
               countyBusinesses.map(b => (
                 <div 
                    key={b.id} 
                    onClick={() => onSelectBusiness(b)}
                    className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 rounded cursor-pointer transition-colors"
                 >
                   <div className="font-bold text-slate-200 mb-2">{b.name}</div>
                   
                   <div className="flex gap-3">
                      <div className="flex items-center text-xs text-slate-400 bg-slate-900/50 px-2 py-1 rounded">
                         <Users size={12} className="mr-1.5" />
                         {b.employees}
                      </div>
                      <div className="flex items-center text-xs text-emerald-400 bg-slate-900/50 px-2 py-1 rounded">
                         <DollarSign size={12} className="mr-0.5" />
                         {b.revenue ? formatRevenue(parseRevenue(b.revenue)) : 'N/A'}
                      </div>
                   </div>
                   
                   <div className="flex items-center text-xs text-slate-500 mt-2">
                      <MapPin size={12} className="mr-1" />
                      {b.city}
                   </div>
                 </div>
               ))
             )}
           </div>
        </div>

      </div>
    </div>
  );
};

export default CountyDetail;