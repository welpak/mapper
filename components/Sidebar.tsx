import React, { ChangeEvent } from 'react';
import { Business } from '../types';
import { Search, Upload, Database, Trash2, PlusSquare } from 'lucide-react';

interface SidebarProps {
  businesses: Business[];
  onUpload: (e: ChangeEvent<HTMLInputElement>, isAppending: boolean) => void;
  onFilterChange: (query: string) => void;
  onSelectBusiness: (b: Business) => void;
  selectedId?: string;
  onClearData?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  businesses, 
  onUpload, 
  onFilterChange, 
  onSelectBusiness, 
  selectedId,
  onClearData 
}) => {
  const [isAppending, setIsAppending] = React.useState(false);

  return (
    <div className="w-80 h-full bg-slate-900 border-r border-slate-700 flex flex-col z-30 shadow-xl">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Database className="text-sky-500" />
          NC Data Explorer
        </h1>
        <p className="text-xs text-slate-500 mt-1">NAICS 1111 - 1129</p>
      </div>

      {/* Controls */}
      <div className="p-4 space-y-4 border-b border-slate-800">
        {/* Upload Section */}
        <div className="space-y-2">
          <div className="relative group">
            <input 
              type="file" 
              accept=".json,.csv"
              onChange={(e) => onUpload(e, isAppending)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <button className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded flex items-center justify-center text-sm text-slate-300 transition-colors">
              <Upload size={16} className="mr-2" />
              {isAppending ? 'Append Scraped Data' : 'Import Scraped Data'}
            </button>
          </div>
          
          <div className="flex items-center gap-2 px-1">
             <input 
               type="checkbox" 
               id="appendMode" 
               checked={isAppending} 
               onChange={(e) => setIsAppending(e.target.checked)}
               className="w-3 h-3 rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-0 cursor-pointer"
             />
             <label htmlFor="appendMode" className="text-xs text-slate-400 cursor-pointer select-none flex items-center gap-1">
               <PlusSquare size={12} /> Append to existing data
             </label>
             {isAppending && (
               <span className="ml-auto text-[10px] bg-sky-900 text-sky-300 px-1.5 py-0.5 rounded">Active</span>
             )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Filter (Name, Zip, County, #Tag...)" 
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-sky-500 placeholder-slate-600"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2 space-y-1">
          {businesses.length === 0 ? (
             <div className="p-4 text-center text-slate-500 text-sm">
               No businesses found. Upload data or check filters.
             </div>
          ) : (
            businesses.map(b => (
              <div 
                key={b.id}
                onClick={() => onSelectBusiness(b)}
                className={`p-3 rounded cursor-pointer transition-all border ${selectedId === b.id ? 'bg-sky-900/20 border-sky-500/50' : 'bg-transparent border-transparent hover:bg-slate-800 hover:border-slate-700'}`}
              >
                <div className="font-medium text-slate-200 text-sm truncate">{b.name}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-slate-500 truncate">{b.city}</span>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                    {b.employees} emps
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-900">
         <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-600">{businesses.length} Records Loaded</span>
            {onClearData && (
                <button 
                    onClick={onClearData}
                    className="text-xs text-red-900 hover:text-red-400 flex items-center gap-1 transition-colors p-1 rounded hover:bg-slate-800"
                    title="Clear Saved Data"
                >
                    <Trash2 size={12} /> Reset
                </button>
            )}
         </div>
      </div>
    </div>
  );
};

export default Sidebar;