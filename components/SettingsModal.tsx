import React, { useState, useEffect } from 'react';
import { X, Key, Trash2, ExternalLink, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) setApiKey(stored);
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      localStorage.removeItem('gemini_api_key');
    } else {
      localStorage.setItem('gemini_api_key', apiKey.trim());
    }
    setSaved(true);
    setTimeout(() => {
        setSaved(false);
        onClose();
    }, 1000);
  };

  const handleClear = () => {
    setApiKey('');
    localStorage.removeItem('gemini_api_key');
    setSaved(true);
    setTimeout(() => {
        setSaved(false);
        onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md p-6 relative shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-600/20 rounded-xl text-indigo-400">
                <Key className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">API Configuration</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Bring Your Own Key</p>
            </div>
        </div>

        <div className="space-y-6">
            <div className="p-4 bg-indigo-900/20 border border-indigo-500/20 rounded-2xl">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div className="space-y-2">
                        <p className="text-xs text-indigo-200 leading-relaxed font-medium">
                            By providing your own Google Gemini API Key, you unlock:
                        </p>
                        <ul className="text-[10px] text-gray-400 space-y-1 list-disc list-inside">
                            <li>Higher rate limits (Less "Busy" errors)</li>
                            <li>Real-time Web Search capabilities</li>
                            <li>Faster generation speeds</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Google Gemini API Key</label>
                <div className="relative">
                    <input 
                        type="password" 
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-black/40 border border-gray-700 rounded-xl pl-4 pr-10 py-3 text-white text-sm outline-none focus:border-indigo-500 transition-colors font-mono"
                    />
                </div>
                <div className="flex justify-between items-center px-1">
                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                        Get a Key <ExternalLink className="w-3 h-3" />
                    </a>
                    {apiKey && (
                        <button onClick={handleClear} className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Clear Key
                        </button>
                    )}
                </div>
            </div>

            <button 
                onClick={handleSave} 
                className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${saved ? 'bg-green-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'}`}
            >
                {saved ? 'Saved Successfully' : 'Save Configuration'}
            </button>
            
            <p className="text-[9px] text-gray-600 text-center max-w-xs mx-auto">
                Your key is stored locally in your browser. It is never sent to our servers, only directly to Google's API.
            </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;