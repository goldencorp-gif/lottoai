import React, { useState } from 'react';
import { LotteryGameType } from '../types';
import { fetchLatestDraws } from '../services/geminiService';
import { 
  Database, RefreshCw, ArrowLeft, 
  Trash2, FileText, AlertCircle, Save, Search, Zap, Loader2, Link as LinkIcon
} from 'lucide-react';
import { GAME_CONFIGS } from '../constants';

interface InputWizardViewProps {
  game: LotteryGameType;
  currentData: string;
  onSave: (data: string) => void;
  onCancel: () => void;
}

const InputWizardView: React.FC<InputWizardViewProps> = ({ game, currentData, onSave, onCancel }) => {
  const [localData, setLocalData] = useState<string>(currentData);
  const [sources, setSources] = useState<{ title: string, uri: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchLatestDraws(game);
      setLocalData(result.data);
      setSources(result.sources);
    } catch (e: any) {
      setError(e.message || "Failed to fetch data. Verify network connectivity.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500">
      <div className="glass-panel rounded-3xl p-8 border-white/5 min-h-[80vh] flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <button onClick={onCancel} className="p-3 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors group">
              <ArrowLeft className="w-5 h-5 text-gray-400 group-hover:text-white" />
            </button>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Data Intelligence</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Managing results for {game}</p>
            </div>
          </div>
          <button onClick={() => setLocalData('')} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-bold uppercase flex items-center gap-2">
            <Trash2 className="w-4 h-4" /> Clear
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-grow">
          <div className="space-y-6">
            <div className="p-6 bg-gray-900/40 rounded-3xl border border-gray-800">
              <h3 className="text-sm font-black text-white uppercase mb-4">Auto-Sync (AI Search)</h3>
              <p className="text-[10px] text-gray-500 mb-6 leading-relaxed">
                Gemini will crawl official lottery portals to extract the latest winning sequences.
              </p>
              <button onClick={handleFetch} disabled={isLoading} className={`w-full py-4 rounded-xl font-bold uppercase text-xs flex items-center justify-center gap-2 transition-all ${isLoading ? 'bg-gray-800 text-gray-500' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl'}`}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                Sync Results
              </button>
              {error && <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-400 font-bold">{error}</div>}
            </div>

            {sources.length > 0 && (
              <div className="p-6 bg-indigo-900/10 rounded-3xl border border-indigo-500/20">
                <h3 className="text-xs font-black text-indigo-400 uppercase mb-3 flex items-center gap-2">
                  <LinkIcon className="w-3 h-3" /> Grounding Sources
                </h3>
                <div className="space-y-2">
                  {sources.map((s, i) => (
                    <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="block p-2 bg-black/20 rounded-lg text-[10px] text-gray-400 hover:text-white border border-white/5 transition-colors truncate">
                      {s.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 flex flex-col bg-black/40 border border-gray-800 rounded-3xl p-1">
             <textarea value={localData} onChange={(e) => setLocalData(e.target.value)} placeholder="Paste results or use Sync..." className="w-full h-full bg-transparent p-6 text-sm font-mono text-gray-300 resize-none outline-none placeholder:text-gray-800"/>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-800 flex justify-end">
          <button onClick={() => onSave(localData)} className="py-4 px-12 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg uppercase shadow-xl">
            <Save className="w-5 h-5 mr-2 inline" /> Save & Analyze
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputWizardView;