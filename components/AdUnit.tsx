
import React, { useEffect, useRef } from 'react';
import { AD_PUBLISHER_ID, AD_SLOTS, CUSTOM_ADS, SHOW_AD_LABEL } from '../constants/ads';
import { DONATION_LINK } from '../constants';
import { Heart, Coffee, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

// Define the valid keys based on the constants
type AdSlotKey = keyof typeof AD_SLOTS;

interface AdUnitProps {
  slot: AdSlotKey; 
  format?: 'auto' | 'fluid' | 'rectangle' | 'horizontal' | 'vertical';
  className?: string;
  label?: string;
}

const AdUnit: React.FC<AdUnitProps> = ({ slot, format = 'auto', className = '', label = 'Advertisement' }) => {
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  // Check if Custom Ad is enabled for this specific slot
  const customAd = CUSTOM_ADS[slot];
  const isCustom = customAd && customAd.enabled;
  
  // Get the AdSense ID for this slot
  const adSenseSlotId = AD_SLOTS[slot];
  
  // IF ID IS EMPTY, HIDE THE AD UNIT COMPLETELY
  if (!isCustom && (!adSenseSlotId || adSenseSlotId === "")) {
      return null;
  }
  
  // Check if AdSense is configured properly
  const isAdSenseConfigured = !AD_PUBLISHER_ID.includes('XXX');

  // Check if the user is still using the default placeholder ID
  const isPlaceholder = adSenseSlotId === '1234567890';

  useEffect(() => {
    // If we are showing a custom ad, AdSense isn't configured, OR it's a placeholder ID, do NOT initialize
    if (isCustom || !isAdSenseConfigured || isPlaceholder) return;

    // Prevent double initialization
    if (initialized.current) return;

    try {
      if (window.adsbygoogle && adRef.current) {
        if (adRef.current.innerHTML === "") {
             (window.adsbygoogle = window.adsbygoogle || []).push({});
             initialized.current = true;
        }
      }
    } catch (e) {
      console.error("AdSense push error:", e);
    }
  }, [slot, isCustom, isAdSenseConfigured, isPlaceholder]);

  return (
    <div className={`my-4 flex flex-col items-center gap-1 ${className}`}>
        {SHOW_AD_LABEL && label && isAdSenseConfigured && !isPlaceholder && <span className="text-[9px] text-gray-700 uppercase tracking-widest font-bold">SPONSORED</span>}
        
        <div className="w-full bg-gray-900/30 border border-white/5 rounded-xl overflow-hidden min-h-[100px] flex items-center justify-center relative">
            {isCustom ? (
                /* CUSTOM AD RENDER */
                <a 
                  href={customAd.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full h-full flex items-center justify-center group relative"
                >
                   <img 
                     src={customAd.image} 
                     alt={customAd.alt} 
                     className="max-w-full h-auto object-contain transition-transform duration-500 group-hover:scale-[1.02]" 
                   />
                </a>
            ) : isPlaceholder ? (
                 /* PLACEHOLDER WARNING - Helps user debug blank ads */
                 <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-yellow-500/30 bg-yellow-500/5 w-full h-full min-h-[120px]">
                    <div className="flex items-center gap-2 text-yellow-500 mb-2">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-xs font-bold uppercase">AdSense Setup Required</span>
                    </div>
                    <p className="text-[10px] text-gray-400 max-w-xs leading-relaxed">
                       You have entered your Publisher ID, but you still need to create a specific <strong>Ad Unit</strong> for this slot ({slot}).
                    </p>
                    <div className="mt-2 bg-black/40 px-3 py-2 rounded border border-white/10 text-[10px] text-gray-300 font-mono">
                       Paste the ID in siteSettings.ts
                    </div>
                 </div>
            ) : isAdSenseConfigured ? (
                /* GOOGLE ADSENSE RENDER */
                <ins className="adsbygoogle"
                    style={{ display: 'block', width: '100%', textAlign: 'center' }}
                    data-ad-client={AD_PUBLISHER_ID}
                    data-ad-slot={adSenseSlotId}
                    data-ad-format={format}
                    data-full-width-responsive="true"
                    ref={adRef}
                ></ins>
            ) : (
                /* FALLBACK: SUPPORT BANNER (Use this for Review Mode) */
                <a 
                  href={DONATION_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-full min-h-[120px] flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-900/20 to-purple-900/20 hover:from-indigo-900/30 hover:to-purple-900/30 transition-all p-4 group text-center cursor-pointer"
                >
                    <div className="flex items-center gap-2 text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                        <Heart className="w-5 h-5 fill-indigo-500/20" />
                        <span className="text-sm font-black uppercase tracking-widest">Support Lotto AI</span>
                    </div>
                    <p className="text-[10px] text-gray-500 max-w-xs">
                        Keep the AI servers running. Every contribution helps us improve the algorithm.
                    </p>
                    <div className="mt-2 px-4 py-1.5 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-[10px] font-bold text-indigo-300 flex items-center gap-2 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                        <Coffee className="w-3 h-3" /> Donate
                    </div>
                </a>
            )}
        </div>
    </div>
  );
};

export default AdUnit;
