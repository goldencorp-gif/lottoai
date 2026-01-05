
import React from 'react';
import { X, Shield, FileText } from 'lucide-react';

interface LegalModalProps {
  title: string;
  content: React.ReactNode;
  onClose: () => void;
}

const LegalModal: React.FC<LegalModalProps> = ({ title, content, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
               {title.includes('Privacy') ? <Shield className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
             </div>
             <h3 className="text-xl font-black text-white uppercase tracking-tight">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto scrollbar-thin space-y-4 text-sm text-gray-400 leading-relaxed">
          {content}
        </div>
        
        <div className="p-6 border-t border-gray-800 flex justify-end">
           <button 
             onClick={onClose}
             className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-xs tracking-wide transition-colors"
           >
             Close
           </button>
        </div>
      </div>
    </div>
  );
};

export default LegalModal;
