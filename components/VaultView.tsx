import React, { useRef, useState } from 'react';
import { Bookmark, Trash2, Calendar, Hash, Image as ImageIcon, Zap, ExternalLink, Download, Upload, Info, X } from 'lucide-react';
import { SavedPrediction, LotteryGameType } from '../types';
import { BUY_LINKS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import AdUnit from './AdUnit';

interface VaultViewProps {
  entries: SavedPrediction[];
  onDelete: (id: string) => void;
  onImport: (entries: SavedPrediction[]) => void;
}

const VaultView: React.FC<VaultViewProps> = ({ entries, onDelete, onImport }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showInfo, setShowInfo] = useState(false);

  const handleBackup = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lotto-ai-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json)) {
          onImport(json);
        } else {
          alert("Invalid backup file format.");
        }
      } catch (err) {
        alert("Failed to parse backup file.");
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="glass-panel rounded-3xl p-8 border-white/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-xl">
              <Bookmark className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{t('vault.title')}</h2>
                <button 
                  onClick={() => setShowInfo(!showInfo)}
                  className="p-1 rounded-full bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Saved Strategies & Sets</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleBackup}
              disabled={entries.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" /> {t('vault.backup')}
            </button>
            <button 
              onClick={handleRestoreClick}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold uppercase transition-colors"
            >
              <Upload className="w-4 h-4" /> {t('vault.restore')}
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".json" 
              className="hidden" 
            />
          </div>
        </div>

        {/* Info Box */}
        {showInfo && (
          <div className="mb-6 p-5 bg-indigo-900/20 border border-indigo-500/20 rounded-2xl relative animate-in fade-in slide-in-from-top-2">
             <button onClick={() => setShowInfo(false)} className="absolute top-3 right-3 text-indigo-400 hover:text-white"><X className="w-4 h-4" /></button>
             <h3 className="text-sm font-bold text-indigo-300 mb-2 uppercase tracking-wide">{t('vault.info.title')}</h3>
             <p className="text-xs text-gray-300 leading-relaxed mb-2">{t('vault.info.desc')}</p>
             <ul className="text-[10px] text-gray-400 space-y-1 list-disc list-inside">
                <li>{t('vault.info.backup')}</li>
                <li>{t('vault.info.restore')}</li>
             </ul>
          </div>
        )}

        {/* Ad Unit in Vault */}
        <AdUnit slot="VAULT" format="auto" />

        {entries.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-gray-800 rounded-3xl">
            <Hash className="w-16 h-16 text-gray-800 mx-auto mb-4" />
            <p className="text-gray-600 font-bold uppercase tracking-widest text-sm">{t('vault.empty')}</p>
            <p className="text-xs text-gray-700 mt-2">Generate and save predictions to view them here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {entries.map((entry) => (
              <div key={entry.id} className="p-6 bg-gray-900/40 rounded-3xl border border-gray-800 hover:border-indigo-500/30 transition-all group relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <button 
                    onClick={() => onDelete(entry.id)}
                    className="p-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mb-6 space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                    {entry.game}
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    {entry.label}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-500 pt-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(entry.timestamp).toLocaleDateString()} &bull; {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                {entry.visualUrl && (
                  <div className="mb-6 rounded-2xl overflow-hidden border border-white/10 relative h-32 w-full group-hover:h-48 transition-all duration-500">
                    <img src={entry.visualUrl} alt="Lucky Charm" className="w-full h-full object-cover" />
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> Vision Board
                    </div>
                  </div>
                )}

                <div className="space-y-3 bg-black/20 p-4 rounded-2xl border border-white/5 mt-auto">
                  {entry.numbers.map((nums, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-[9px] font-bold text-gray-600 uppercase w-4">#{idx+1}</span>
                      <div className="flex flex-wrap gap-1.5 items-center">
                        {nums.sort((a,b) => a-b).map(n => (
                          <div key={n} className="w-7 h-7 rounded-full bg-indigo-600/20 flex items-center justify-center text-[10px] font-bold border border-indigo-500/20 text-indigo-200 shadow-sm">
                            {n}
                          </div>
                        ))}
                        
                        {/* Powerball display in Vault */}
                        {entry.powerballs && entry.powerballs[idx] !== undefined && (
                          <>
                            <div className="h-4 w-px bg-white/10 mx-1"></div>
                            <div className="w-7 h-7 rounded-full bg-gray-200/90 flex items-center justify-center text-[10px] font-black border border-white text-gray-900 shadow-sm relative">
                              <Zap className="w-2 h-2 absolute -top-1 -right-1 text-white fill-white" />
                              {entry.powerballs[idx]}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Affiliate Link in Vault */}
                {BUY_LINKS[entry.game as LotteryGameType] && (
                  <div className="mt-4 pt-4 border-t border-gray-800">
                    <a 
                      href={BUY_LINKS[entry.game as LotteryGameType]} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-2 bg-green-600/10 hover:bg-green-600/20 border border-green-500/20 text-green-400 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-2"
                    >
                      {t('btn.playNow')} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VaultView;