import React, { useState, useEffect } from 'react';
import { Business } from '../types';
import { generateBusinessSummary } from '../services/geminiService';
import { parseRevenue, formatRevenue } from '../utils';
import { X, MapPin, Phone, Globe, Users, DollarSign, BrainCircuit, User, Calendar, Link as LinkIcon, Pencil, Save, Undo } from 'lucide-react';

interface BusinessDetailProps {
  business: Business | null;
  onClose: () => void;
  onSelectCounty: (county: string) => void;
  onSelectZip: (zip: string) => void;
  onUpdateBusiness: (updatedBusiness: Business) => void;
}

const BusinessDetail: React.FC<BusinessDetailProps> = ({ business, onClose, onSelectCounty, onSelectZip, onUpdateBusiness }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Business | null>(null);
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    setAiAnalysis(null);
    setIsEditing(false);
    if (business) {
        setFormData({ ...business });
    }
  }, [business?.id]);

  if (!business || !formData) return null;

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await generateBusinessSummary(business);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  const handleSave = () => {
      if (formData) {
          onUpdateBusiness(formData);
          setIsEditing(false);
      }
  };

  const handleCancel = () => {
      setFormData({ ...business });
      setIsEditing(false);
  };

  const handleInputChange = (field: keyof Business, value: string | number) => {
      if (formData) {
          setFormData({ ...formData, [field]: value });
      }
  };

  const handleAddTag = () => {
      if (newTag.trim() && formData) {
          if (!formData.tags.includes(newTag.trim())) {
              setFormData({ ...formData, tags: [...formData.tags, newTag.trim()] });
          }
          setNewTag('');
      }
  };

  const handleRemoveTag = (tagToRemove: string) => {
      if (formData) {
          setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) });
      }
  };

  const formattedPhone = business.phone ? business.phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3') : 'N/A';
  const formattedRevenue = business.revenue ? formatRevenue(parseRevenue(business.revenue)) : 'N/A';

  return (
    <div className="absolute top-0 right-0 h-full w-full md:w-96 bg-slate-900/95 backdrop-blur-md border-l border-slate-700 shadow-2xl z-40 flex flex-col transition-transform duration-300 transform">
      {/* Header */}
      <div className="p-6 border-b border-slate-700 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">{business.name}</h2>
          <span className="inline-block px-2 py-0.5 rounded text-xs font-mono bg-sky-900 text-sky-300 border border-sky-700">
            NAICS: {business.naicsCode}
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
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800 p-3 rounded border border-slate-700">
            <div className="flex items-center text-slate-400 text-sm mb-1">
              <Users size={14} className="mr-1" /> Employees
            </div>
            <div className="text-xl font-semibold text-white">{business.employees}</div>
          </div>
          <div className="bg-slate-800 p-3 rounded border border-slate-700">
            <div className="flex items-center text-slate-400 text-sm mb-1">
              <DollarSign size={14} className="mr-1" /> Revenue
            </div>
            <div className="text-xl font-semibold text-emerald-400">{formattedRevenue}</div>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Business Details</h3>
                {!isEditing ? (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded transition-colors"
                        title="Edit Details"
                    >
                        <Pencil size={14} />
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button 
                            onClick={handleCancel}
                            className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                            title="Cancel"
                        >
                            <Undo size={14} />
                        </button>
                        <button 
                            onClick={handleSave}
                            className="p-1 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded transition-colors"
                            title="Save Changes"
                        >
                            <Save size={14} />
                        </button>
                    </div>
                )}
            </div>
            
            {isEditing ? (
                // EDIT MODE - DETAILS
                <div className="grid grid-cols-1 gap-y-3 text-sm animate-in fade-in duration-300">
                     <div>
                        <label className="text-xs text-slate-500 uppercase block mb-1">Contact Name</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 focus:border-sky-500 focus:outline-none"
                            value={formData.contactName || ''}
                            onChange={(e) => handleInputChange('contactName', e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="text-xs text-slate-500 uppercase block mb-1">Contact Title</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 focus:border-sky-500 focus:outline-none"
                            value={formData.contactTitle || ''}
                            onChange={(e) => handleInputChange('contactTitle', e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="text-xs text-slate-500 uppercase block mb-1">Phone</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 focus:border-sky-500 focus:outline-none"
                            value={formData.phone || ''}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="text-xs text-slate-500 uppercase block mb-1">Website</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 focus:border-sky-500 focus:outline-none"
                            value={formData.website || ''}
                            onChange={(e) => handleInputChange('website', e.target.value)}
                        />
                     </div>
                     <div>
                        <label className="text-xs text-slate-500 uppercase block mb-1">Year Established</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 focus:border-sky-500 focus:outline-none"
                            value={formData.yearEstablished || ''}
                            onChange={(e) => handleInputChange('yearEstablished', e.target.value)}
                        />
                     </div>
                </div>
            ) : (
                // VIEW MODE - DETAILS
                <div className="grid grid-cols-1 gap-y-3 text-sm">
                    <div className="flex items-start">
                        <User size={16} className="text-slate-500 mt-0.5 mr-3 shrink-0" />
                        <div>
                            <span className="block text-slate-400 text-xs uppercase">Contact Person</span>
                            <span className="text-slate-200">{business.contactName || 'N/A'} {business.contactTitle ? `(${business.contactTitle})` : ''}</span>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <Phone size={16} className="text-slate-500 mt-0.5 mr-3 shrink-0" />
                        <div>
                            <span className="block text-slate-400 text-xs uppercase">Phone</span>
                            <span className="text-slate-200 font-mono">{formattedPhone}</span>
                        </div>
                    </div>
                    <div className="flex items-start">
                        <Globe size={16} className="text-slate-500 mt-0.5 mr-3 shrink-0" />
                        <div>
                            <span className="block text-slate-400 text-xs uppercase">Website</span>
                            {business.website ? (
                                <a href={`http://${business.website}`} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline break-all">
                                    {business.website}
                                </a>
                            ) : (
                                <span className="text-slate-500">N/A</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-start">
                        <Calendar size={16} className="text-slate-500 mt-0.5 mr-3 shrink-0" />
                        <div>
                            <span className="block text-slate-400 text-xs uppercase">Year Est.</span>
                            <span className="text-slate-200">{business.yearEstablished || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Location Hierarchy */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Location</h3>
          
          {isEditing ? (
              // EDIT MODE - LOCATION
              <div className="grid grid-cols-1 gap-y-3 text-sm animate-in fade-in duration-300 p-3 bg-slate-800/30 rounded border border-slate-700">
                  <div>
                    <label className="text-xs text-slate-500 uppercase block mb-1">State</label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 focus:border-sky-500 focus:outline-none"
                        value={formData.state || ''}
                        onChange={(e) => handleInputChange('state', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase block mb-1">County</label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 focus:border-sky-500 focus:outline-none"
                        value={formData.county || ''}
                        onChange={(e) => handleInputChange('county', e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500 uppercase block mb-1">City</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 focus:border-sky-500 focus:outline-none"
                            value={formData.city || ''}
                            onChange={(e) => handleInputChange('city', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 uppercase block mb-1">Zip</label>
                        <input 
                            type="text" 
                            className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 focus:border-sky-500 focus:outline-none"
                            value={formData.zip || ''}
                            onChange={(e) => handleInputChange('zip', e.target.value)}
                        />
                      </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 uppercase block mb-1">Address</label>
                    <input 
                        type="text" 
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-slate-200 focus:border-sky-500 focus:outline-none"
                        value={formData.address || ''}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                    />
                  </div>
              </div>
          ) : (
              // VIEW MODE - LOCATION
              <>
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
                    <span>{business.state}</span>
                    </div>
                    
                    <div 
                        onClick={() => onSelectCounty(business.county)}
                        className="flex items-center space-x-2 text-white hover:text-sky-400 ml-8 border-l border-slate-700 pl-4 cursor-pointer transition-colors"
                        title={`Go to ${business.county} County`}
                    >
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span>{business.county || 'Unknown'} County</span>
                    </div>
                    
                    <div 
                        onClick={() => onSelectZip(business.zip)}
                        className="flex items-center space-x-2 text-white hover:text-sky-400 ml-12 border-l border-slate-700 pl-4 cursor-pointer transition-colors"
                        title={`Go to Zip ${business.zip}`}
                    >
                    <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                    <span>{business.city} ({business.zip})</span>
                    </div>
                </div>
                <div className="flex items-start text-slate-400 text-sm mt-2 pl-16">
                    <MapPin size={14} className="mr-2 mt-0.5 shrink-0" />
                    {business.address}
                </div>
              </>
          )}
        </div>

        {/* Industry Info */}
        <div className="space-y-2">
           <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Industry Classification</h3>
           <p className="text-slate-300 text-sm leading-relaxed">
             {business.naicsDescription}
           </p>
           {business.sicCode && (
               <div className="text-xs text-slate-500">
                   SIC: <span className="text-slate-400">{business.sicCode}</span>
               </div>
           )}
           
           {isEditing ? (
               // EDIT MODE - TAGS
               <div className="mt-3">
                   <div className="flex flex-wrap gap-2 mb-2">
                        {formData.tags.map(tag => (
                        <span key={tag} className="flex items-center px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">
                            #{tag}
                            <button onClick={() => handleRemoveTag(tag)} className="ml-1 text-slate-500 hover:text-red-400">
                                <X size={10} />
                            </button>
                        </span>
                        ))}
                   </div>
                   <input 
                        type="text"
                        placeholder="Add tag + Enter"
                        className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-slate-200 focus:border-sky-500 focus:outline-none"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddTag();
                            }
                        }}
                   />
               </div>
           ) : (
               // VIEW MODE - TAGS
               <div className="flex flex-wrap gap-2 mt-2">
                    {business.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">
                        #{tag}
                    </span>
                    ))}
               </div>
           )}
        </div>
        
        {/* External Link */}
        {business.sourceUrl && (
             <div className="pt-2">
                 <a href={business.sourceUrl} target="_blank" rel="noreferrer" className="flex items-center text-xs text-slate-500 hover:text-sky-400 transition-colors">
                     <LinkIcon size={12} className="mr-1" />
                     View Source Record
                 </a>
             </div>
        )}

        {/* AI Action */}
        <div className="pt-4 border-t border-slate-700">
           {!aiAnalysis ? (
             <button 
               onClick={handleAiAnalysis}
               disabled={loadingAi}
               className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded font-medium flex items-center justify-center transition-all shadow-lg shadow-indigo-900/20"
             >
               {loadingAi ? (
                 <span className="animate-spin mr-2">⟳</span>
               ) : (
                 <BrainCircuit size={18} className="mr-2" />
               )}
               {loadingAi ? 'Analyzing...' : 'Generate AI Insight'}
             </button>
           ) : (
             <div className="bg-slate-800/50 rounded p-4 border border-indigo-500/30">
               <div className="flex items-center mb-2 text-indigo-400">
                 <BrainCircuit size={16} className="mr-2" />
                 <span className="text-sm font-bold uppercase">AI Summary</span>
               </div>
               <div className="prose prose-invert prose-sm">
                 <p className="text-slate-300 whitespace-pre-line">{aiAnalysis}</p>
               </div>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;