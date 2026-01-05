import React, { useState, useMemo } from 'react';
import { Sparkles, Grid, Download } from 'lucide-react';
import { generateLuckyImage } from '../services/geminiService';

interface VisualizerProps {
  entries: number[][];
  range: number;
  gameName: string;
  onImageGenerated: (url: string) => void;
  existingImageUrl?: string;
}

const Visualizer: React.FC<VisualizerProps> = ({ entries, range, gameName, onImageGenerated, existingImageUrl }) => {
  const [activeTab, setActiveTab] = useState<'heatmap' | 'image'>('heatmap');
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(existingImageUrl || null);

  // Flatten all numbers to calculate frequency
  const flatNumbers = useMemo<number[]>(() => {
    // Use reduce instead of flat() to ensure safe typing as number[]
    return entries.reduce((acc: number[], curr: number[]) => acc.concat(curr), [] as number[]);
  }, [entries]);
  
  const frequencyMap = useMemo(() => {
    const map: Record<number, number> = {};
    flatNumbers.forEach((n: number) => {
      map[n] = (map[n] || 0) + 1;
    });
    return map;
  }, [flatNumbers]);

  const maxFreq = useMemo(() => {
    const values = Object.values(frequencyMap) as number[];
    if (values.length === 0) return 1;
    return Math.max(...values);
  }, [frequencyMap]);

  const handleGenerateImage = async () => {
    setIsGeneratingImg(true);
    // Use the most frequent numbers for the image prompt
    const uniqueNums = Array.from(new Set(flatNumbers)).slice(0, 5) as number[];
    const url = await generateLuckyImage(uniqueNums, gameName);
    if (url) {
      setGeneratedImage(url);
      onImageGenerated(url);
    }
    setIsGeneratingImg(false);
  };

  return (
    <div className="bg-black/20 rounded-3xl border border-white/5 overflow-hidden">
      <div className="flex border-b border-white/5">
        <button 
          onClick={() => setActiveTab('heatmap')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${activeTab === 'heatmap' ? 'bg-indigo-600/10 text-indigo-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Grid className="w-4 h-4" /> Heatmap
        </button>
        <button 
          onClick={() => setActiveTab('image')}
          className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${activeTab === 'image' ? 'bg-purple-600/10 text-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
        >
          <Sparkles className="w-4 h-4" /> Vision Board
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'heatmap' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase">Number Distribution</h3>
              <div className="flex items-center gap-2 text-[10px] text-gray-500">
                <span className="w-3 h-3 rounded bg-indigo-500/20 border border-indigo-500/30"></span> Low
                <span className="w-3 h-3 rounded bg-indigo-500 border border-indigo-500"></span> High
              </div>
            </div>
            
            <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
              {Array.from({ length: range }, (_, i) => i + 1).map(num => {
                const freq = frequencyMap[num] || 0;
                const intensity = freq / maxFreq;
                const isPresent = freq > 0;
                
                return (
                  <div 
                    key={num}
                    className={`
                      aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all relative overflow-hidden
                      ${isPresent ? 'text-white' : 'text-gray-700 bg-gray-900/50'}
                    `}
                    style={{
                      backgroundColor: isPresent ? `rgba(99, 102, 241, ${0.2 + (intensity * 0.8)})` : undefined,
                      border: isPresent ? `1px solid rgba(99, 102, 241, ${0.3 + intensity})` : '1px solid rgba(255,255,255,0.05)',
                      transform: isPresent ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    {num}
                    {isPresent && <div className="absolute inset-0 bg-indigo-400 blur-xl opacity-20"></div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'image' && (
          <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-6">
            {!generatedImage && !isGeneratingImg && (
              <>
                <div className="w-20 h-20 rounded-full bg-purple-900/20 border border-purple-500/30 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-purple-400" />
                </div>
                <div className="max-w-xs">
                  <h3 className="text-lg font-black text-white mb-2">Visualize Your Win</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Generate a unique, high-quality AI visualization of your lucky numbers to help manifest your goal.
                  </p>
                </div>
                <button 
                  onClick={handleGenerateImage}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white font-bold text-xs uppercase tracking-widest shadow-lg shadow-purple-900/40 hover:scale-105 transition-transform"
                >
                  Generate Lucky Charm
                </button>
              </>
            )}

            {isGeneratingImg && (
              <div className="space-y-4">
                <div className="relative w-24 h-24 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
                  <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-purple-400 animate-pulse" />
                </div>
                <p className="text-xs font-bold text-purple-300 animate-pulse">Manifesting Visuals...</p>
              </div>
            )}

            {generatedImage && (
              <div className="space-y-4 w-full animate-in fade-in zoom-in duration-500">
                <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl shadow-purple-900/20 group">
                  <img src={generatedImage} alt="Lucky Charm" className="w-full h-auto object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-6">
                    <a href={generatedImage} download="lucky-charm.png" className="px-6 py-3 bg-white text-black rounded-xl font-bold text-xs uppercase flex items-center gap-2">
                      <Download className="w-4 h-4" /> Download
                    </a>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 font-mono">Generated by Gemini Image Model</p>
                <button 
                  onClick={handleGenerateImage}
                  className="text-xs text-purple-400 hover:text-white underline decoration-dashed underline-offset-4"
                >
                  Regenerate
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Visualizer;