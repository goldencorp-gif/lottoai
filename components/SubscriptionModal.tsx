
import React, { useState } from 'react';
import { X, Crown, Zap, Shield, Copy, Check, Bitcoin, Wallet } from 'lucide-react';
import { settings } from '../siteSettings';

interface SubscriptionModalProps {
  onClose: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ onClose }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-yellow-500/30 rounded-3xl w-full max-w-md p-6 relative shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Decor */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors z-10">
            <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6 relative z-10 pt-2">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl mx-auto flex items-center justify-center shadow-xl shadow-orange-500/20 mb-4 transform rotate-3 border border-white/10">
                <Crown className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Lotto AI <span className="text-yellow-400">Pro</span></h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Independent & Uncensored</p>
        </div>

        <div className="bg-indigo-900/20 border border-indigo-500/20 p-4 rounded-2xl mb-6 relative z-10">
           <p className="text-xs text-indigo-200 text-center leading-relaxed">
             Traditional payment processors block prediction tools. 
             To support our servers and keep the AI running without ads, we accept <strong>Direct Crypto Contributions</strong>.
           </p>
        </div>

        <div className="space-y-3 relative z-10 overflow-y-auto pr-1 scrollbar-thin pb-4">
            
            {/* Bitcoin */}
            <div className="p-4 bg-gray-800/60 rounded-2xl border border-gray-700/50 hover:border-yellow-500/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-yellow-500 font-bold text-xs uppercase">
                        <Bitcoin className="w-4 h-4" /> Bitcoin (BTC)
                    </div>
                    <button 
                       onClick={() => handleCopy(settings.crypto.btc, 'BTC')}
                       className="text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white transition-colors flex items-center gap-1"
                    >
                       {copied === 'BTC' ? <Check className="w-3 h-3 text-green-400"/> : <Copy className="w-3 h-3"/>}
                       {copied === 'BTC' ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] text-gray-400 break-all select-all">
                    {settings.crypto.btc}
                </div>
            </div>

            {/* Ethereum */}
            <div className="p-4 bg-gray-800/60 rounded-2xl border border-gray-700/50 hover:border-blue-500/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase">
                        <Wallet className="w-4 h-4" /> Ethereum (ETH)
                    </div>
                    <button 
                       onClick={() => handleCopy(settings.crypto.eth, 'ETH')}
                       className="text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white transition-colors flex items-center gap-1"
                    >
                       {copied === 'ETH' ? <Check className="w-3 h-3 text-green-400"/> : <Copy className="w-3 h-3"/>}
                       {copied === 'ETH' ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] text-gray-400 break-all select-all">
                    {settings.crypto.eth}
                </div>
                <div className="text-[9px] text-gray-600 mt-1 pl-1">Supports USDT (ERC20)</div>
            </div>

            {/* Solana */}
            <div className="p-4 bg-gray-800/60 rounded-2xl border border-gray-700/50 hover:border-purple-500/30 transition-colors">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase">
                        <Zap className="w-4 h-4" /> Solana (SOL)
                    </div>
                    <button 
                       onClick={() => handleCopy(settings.crypto.sol, 'SOL')}
                       className="text-[10px] bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white transition-colors flex items-center gap-1"
                    >
                       {copied === 'SOL' ? <Check className="w-3 h-3 text-green-400"/> : <Copy className="w-3 h-3"/>}
                       {copied === 'SOL' ? 'Copied' : 'Copy'}
                    </button>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px] text-gray-400 break-all select-all">
                    {settings.crypto.sol}
                </div>
            </div>

        </div>

        <div className="relative z-10 pt-4 mt-auto border-t border-gray-800">
             <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500">
                <Shield className="w-3 h-3" /> Secure, Anonymous & Decentralized
             </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;
