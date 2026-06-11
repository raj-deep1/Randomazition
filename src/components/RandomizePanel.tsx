import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, HelpCircle, Shuffle, ChevronRight, AlertTriangle, Cpu, Users, Building } from 'lucide-react';
import { ExamCenter, Officer } from '../types';
import { performRandomization } from '../utils/randomizer';

interface RandomizePanelProps {
  centers: ExamCenter[];
  officers: Officer[];
  onRandomizeComplete: (updatedCenters: ExamCenter[], updatedOfficers: Officer[]) => void;
}

export function RandomizePanel({ centers, officers, onRandomizeComplete }: RandomizePanelProps) {
  const [avoidSameDept, setAvoidSameDept] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [tickerName, setTickerName] = useState('');
  const [tickerCenter, setTickerCenter] = useState('');

  const totalRequired = centers.reduce((sum, c) => sum + c.capacity, 0);
  const totalAvailable = officers.length;
  const isShortage = totalAvailable < totalRequired;

  // Real-time shuffling teaser / ticker animation effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnimating) {
      interval = setInterval(() => {
        if (officers.length > 0) {
          const randOfficer = officers[Math.floor(Math.random() * officers.length)];
          setTickerName(randOfficer.name);
        }
        if (centers.length > 0) {
          const randCent = centers[Math.floor(Math.random() * centers.length)];
          setTickerCenter(randCent.name.split(' (')[0]);
        }
      }, 75);
    }
    return () => clearInterval(interval);
  }, [isAnimating, officers, centers]);

  const handleStartRandomize = () => {
    if (centers.length === 0 || officers.length === 0) return;

    setIsAnimating(true);

    // Run animation for 2 seconds for dramatic official effect, then compile results
    setTimeout(() => {
      const { updatedCenters, updatedOfficers } = performRandomization(centers, officers, {
        avoidSameDepartment: avoidSameDept
      });
      onRandomizeComplete(updatedCenters, updatedOfficers);
      setIsAnimating(false);
    }, 2000);
  };

  return (
    <div id="randomization-engine-container" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Settings / Checklist block (2 columns on lg) */}
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 underline decoration-indigo-400 decoration-4 underline-offset-8">
            <Shuffle className="h-5 w-5 text-indigo-600" />
            रैंडम ड्यूटी आबंटन इंजन (Randomization Control Engine)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2.5">अधिकारियों को परीक्षा केंद्रों पर रैंडम रूप से ड्यूटी आवंटित करने के नियम और सेटिंग्स</p>
        </div>

        {/* Verification Check boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">कुल आवश्यक पद (Total Vacancies)</p>
                <h4 className="text-2xl font-bold text-slate-800 mt-1">{totalRequired}</h4>
              </div>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Building className="h-4 w-4" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400">सभी परीक्षा केन्द्रों की कुल स्वीकृत क्षमता</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">कुल उपलब्ध कर्मचारी (Available Staff)</p>
                <h4 className="text-2xl font-bold text-slate-800 mt-1">{totalAvailable}</h4>
              </div>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
            </div>
            {isShortage ? (
              <div className="flex items-center gap-1 text-[10px] text-amber-600 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                स्टाफ की कमी ({totalRequired - totalAvailable} पद कम)
              </div>
            ) : (
              <p className="text-[10px] text-emerald-600 font-semibold">• स्टाफ पर्याप्त है (Surplus +{totalAvailable - totalRequired})</p>
            )}
          </div>
        </div>

        {/* Configurations inputs */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider">आबंटन नियंत्रण नियम (Constraint Rules)</h3>
          
          {/* Smart switch */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/40 border border-indigo-100/50">
            <input
              type="checkbox"
              id="avoidSameDept"
              checked={avoidSameDept}
              onChange={(e) => setAvoidSameDept(e.target.checked)}
              className="mt-1 h-4 w-4 text-indigo-600 border-slate-350 rounded focus:ring-indigo-500 pointer"
            />
            <div className="space-y-1">
              <label htmlFor="avoidSameDept" className="text-xs font-bold text-slate-800 cursor-pointer flex items-center gap-1.5 select-none">
                समान विभाग के अधिकारियों को अलग रखें (Spread Department Officers)
              </label>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                यह बहुत उपयोगी सरकारी नियम है। जब सक्रिय होता है, तब यह सुनिश्चित करता है कि एक ही स्कूल/कार्यालय या विभाग के एक से अधिक अधिकारियों को एक ही परीक्षा केंद्र पर ड्यूटी न दी जाये, जिससे निष्पक्षता बनी रहे।
              </p>
            </div>
          </div>
        </div>

        {/* Final Trigger button */}
        <div className="pt-4">
          {centers.length === 0 || officers.length === 0 ? (
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-amber-800 text-xs text-center">
              रैंडमाइजेशन प्रारंभ करने के लिए कृपया पहले कम से कम 1 परीक्षा केंद्र और 1 अधिकारी डेटा अपलोड करें।
            </div>
          ) : (
            <button
              onClick={handleStartRandomize}
              disabled={isAnimating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm tracking-wide py-4 px-6 rounded-2xl shadow-md transition duration-150 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-40"
            >
              {isAnimating ? (
                <>
                  <Cpu className="h-5 w-5 animate-spin" />
                  सुरक्षित सरकारी एल्गोरिथम द्वारा रैंडमाइजेशन जारी है...
                </>
              ) : (
                <>
                  <Shuffle className="h-5 w-5 text-indigo-200 group-hover:rotate-180 transition duration-300" />
                  परीक्षा ड्यूटी रैंडमाइजेशन प्रारंभ करें (Start Random Allotment)
                  <ChevronRight className="h-4 w-4 text-indigo-300 group-hover:translate-x-1 transition" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Animation Ticker Box / Live progress block */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white min-h-[340px] flex flex-col justify-between overflow-hidden relative shadow-md">
        
        {/* Subtle glowing orbs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl"></div>

        <div className="space-y-1.5 relative">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider font-mono">STATUS TERMINAL</span>
          <h3 className="text-base font-bold tracking-tight">सक्रिय सिस्टम प्रोग्रेस (Live Terminal)</h3>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center py-6 text-center space-y-4 relative">
          <AnimatePresence mode="wait">
            {isAnimating ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-4 w-full"
              >
                {/* Visual Radar loader */}
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <span className="absolute inset-0 rounded-full border border-indigo-500 animate-ping opacity-75"></span>
                  <span className="absolute w-12 h-12 rounded-full bg-indigo-500/20 border-2 border-indigo-500/50"></span>
                  <Cpu className="h-6 w-6 text-indigo-400 relative animate-pulse" />
                </div>

                <div className="space-y-1 bg-slate-950/80 p-4 rounded-xl border border-slate-800 font-mono">
                  <p className="text-xs text-indigo-400">आबंटित हो रहे हैं:</p>
                  <p className="text-sm font-bold text-slate-100 truncate">{tickerName || '...'}</p>
                  <p className="text-[10px] text-slate-500">➜ {tickerCenter || '...'}</p>
                </div>

                <p className="text-[10px] text-slate-400 tracking-wide animate-pulse">रैंडम आवंटन प्रक्रिया चल रही है...</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-full border border-slate-800 bg-slate-950/50 flex items-center justify-center text-slate-500 mx-auto">
                  <Cpu className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">सिस्टम तैयार है (System Ready)</p>
                  <p className="text-[10px] text-slate-500 max-w-[200px] mx-auto font-mono">
                    Fisher-Yates Shuffle + Department Collision Multipliers are preloaded.
                  </p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="pt-4 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex justify-between relative">
          <span>PORT: SECURE-CLI</span>
          <span>ONLINE: 100%</span>
        </div>
      </div>
    </div>
  );
}
