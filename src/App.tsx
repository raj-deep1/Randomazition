import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, 
  Users, 
  UploadCloud, 
  Shuffle, 
  CheckSquare, 
  FileCheck, 
  AlertCircle, 
  Trash2,
  Lock,
  Compass,
  Cpu,
  RefreshCw,
  HelpCircle,
  FileDown
} from 'lucide-react';

import { ExamCenter, Officer, TabType } from './types';
import { ExcelImporter } from './components/ExcelImporter';
import { CentersTable } from './components/CentersTable';
import { OfficersTable } from './components/OfficersTable';
import { RandomizePanel } from './components/RandomizePanel';
import { AllotmentResults } from './components/AllotmentResults';
import { DashboardStats } from './components/DashboardStats';

export default function App() {
  const [centers, setCenters] = useState<ExamCenter[]>([]);
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [hasAllotted, setHasAllotted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // 1. Load data from localStorage on component mount
  useEffect(() => {
    const savedCenters = localStorage.getItem('randomization_centers');
    const savedOfficers = localStorage.getItem('randomization_officers');
    const savedAllotted = localStorage.getItem('randomization_allotted');

    if (savedCenters) setCenters(JSON.parse(savedCenters));
    if (savedOfficers) setOfficers(JSON.parse(savedOfficers));
    if (savedAllotted) setHasAllotted(JSON.parse(savedAllotted));
  }, []);

  // 2. Persist data to localStorage whenever states change
  const saveToLocalStorage = (newCenters: ExamCenter[], newOfficers: Officer[], allotted: boolean) => {
    localStorage.setItem('randomization_centers', JSON.stringify(newCenters));
    localStorage.setItem('randomization_officers', JSON.stringify(newOfficers));
    localStorage.setItem('randomization_allotted', JSON.stringify(allotted));
  };

  const showFeedback = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 3. Import operations
  const handleDataImport = (importedCenters: ExamCenter[], importedOfficers: Officer[]) => {
    let updatedCenters = [...centers];
    let updatedOfficers = [...officers];

    if (importedCenters.length > 0) {
      // Append or replace
      updatedCenters = [...updatedCenters, ...importedCenters];
      showFeedback(`सफलतापूर्वक ${importedCenters.length} परीक्षा केंद्र आयात किए गए।`);
    }

    if (importedOfficers.length > 0) {
      updatedOfficers = [...updatedOfficers, ...importedOfficers];
      showFeedback(`सफलतापूर्वक ${importedOfficers.length} अधिकारियों की सूची जोड़ी गई।`);
    }

    setCenters(updatedCenters);
    setOfficers(updatedOfficers);
    saveToLocalStorage(updatedCenters, updatedOfficers, hasAllotted);
  };

  // 4. Center-specific operations
  const handleAddCenter = (newCenter: ExamCenter) => {
    const updated = [...centers, newCenter];
    setCenters(updated);
    saveToLocalStorage(updated, officers, hasAllotted);
    showFeedback('नया परीक्षा केंद्र सफलतापूर्वक जोड़ा गया!');
  };

  const handleUpdateCenterCapacity = (id: string, capacity: number) => {
    const updated = centers.map(c => c.id === id ? { ...c, capacity } : c);
    setCenters(updated);
    saveToLocalStorage(updated, officers, hasAllotted);
    showFeedback('केंद्र स्टाफ क्षमता संख्या अपडेट की गई।');
  };

  const handleDeleteCenter = (id: string) => {
    const updated = centers.filter(c => c.id !== id);
    setCenters(updated);
    saveToLocalStorage(updated, officers, hasAllotted);
    showFeedback('परीक्षा केंद्र हटा दिया गया।', 'info');
  };

  const handleClearCenters = () => {
    if (window.confirm("क्या आप सच में सभी परीक्षा केंद्रों को हटाना चाहते हैं?")) {
      setCenters([]);
      const updatedOfficers = officers.map(o => ({ ...o, assignedCenterCode: null }));
      setOfficers(updatedOfficers);
      setHasAllotted(false);
      saveToLocalStorage([], updatedOfficers, false);
      showFeedback('सभी परीक्षा केंद्र सूची हटा दी गई है।', 'info');
    }
  };

  // 5. Officer-specific operations
  const handleAddOfficer = (newOfficer: Officer) => {
    const updated = [...officers, newOfficer];
    setOfficers(updated);
    saveToLocalStorage(centers, updated, hasAllotted);
    showFeedback('नया अधिकारी सफलतापूर्वक मास्टर डेटाबेस में जोड़ा गया!');
  };

  const handleDeleteOfficer = (id: string) => {
    const updated = officers.filter(o => o.id !== id);
    setOfficers(updated);
    
    // Also remove from any assigned centers list
    const updatedCenters = centers.map(c => ({
      ...c,
      assignedOfficerIds: c.assignedOfficerIds.filter(oid => oid !== id)
    }));
    setCenters(updatedCenters);

    saveToLocalStorage(updatedCenters, updated, hasAllotted);
    showFeedback('अधिकारी को डेटाबेस से हटा दिया गया है।', 'info');
  };

  const handleClearOfficers = () => {
    if (window.confirm("क्या आप सच में सभी अधिकारियों की सूची हटाना चाहते हैं?")) {
      setOfficers([]);
      const updatedCenters = centers.map(c => ({ ...c, assignedOfficerIds: [] }));
      setCenters(updatedCenters);
      setHasAllotted(false);
      saveToLocalStorage(updatedCenters, [], false);
      showFeedback('सभी अधिकारियों की मास्टर सूची हटा दी गई।', 'info');
    }
  };

  // 6. Completing randomization
  const handleRandomizeComplete = (updatedCenters: ExamCenter[], updatedOfficers: Officer[]) => {
    setCenters(updatedCenters);
    setOfficers(updatedOfficers);
    setHasAllotted(true);
    saveToLocalStorage(updatedCenters, updatedOfficers, true);
    setActiveTab('results');
    showFeedback('परीक्षा ड्यूटी आबंटन सफलतापूर्वक संपन्न हुआ!', 'success');
  };

  const handleManualReassign = (officerId: string, targetCenterCode: string | null) => {
    // 1. Find previous assignment if any, and remove it
    const officerToUpdate = officers.find(o => o.id === officerId);
    if (!officerToUpdate) return;

    const previousCenterCode = officerToUpdate.assignedCenterCode;

    // 2. Update Officer List
    const updatedOfficers = officers.map(o => {
      if (o.id === officerId) {
        return { ...o, assignedCenterCode: targetCenterCode };
      }
      return o;
    });

    // 3. Update Center List
    const updatedCenters = centers.map(center => {
      let assigned = [...center.assignedOfficerIds];
      
      // Remove from previous center list
      if (center.code === previousCenterCode) {
        assigned = assigned.filter(oid => oid !== officerId);
      }
      
      // Add to new center list
      if (center.code === targetCenterCode) {
        if (!assigned.includes(officerId)) {
          assigned.push(officerId);
        }
      }
      return { ...center, assignedOfficerIds: assigned };
    });

    setCenters(updatedCenters);
    setOfficers(updatedOfficers);
    saveToLocalStorage(updatedCenters, updatedOfficers, hasAllotted);
    showFeedback('ड्यूटी असाइनमेंट में सफलतापूर्वक बदलाव किया गया!');
  };

  const handleResetAllotment = () => {
    const resetCenters = centers.map(c => ({ ...c, assignedOfficerIds: [] }));
    const resetOfficers = officers.map(o => ({ ...o, assignedCenterCode: null }));
    setCenters(resetCenters);
    setOfficers(resetOfficers);
    setHasAllotted(false);
    saveToLocalStorage(resetCenters, resetOfficers, false);
    setActiveTab('randomize');
    showFeedback('ड्यूटी आबंटन रीसेट कर दिया गया है।', 'info');
  };

  const handleResetEntireDatabase = () => {
    if (window.confirm("चेतावनी: यह कार्यवाही सारा डेटा डिलीट कर देगी। क्या आप सचमुच पूरा डेटा खाली करना चाहते हैं?")) {
      setCenters([]);
      setOfficers([]);
      setHasAllotted(false);
      localStorage.clear();
      setActiveTab('upload');
      showFeedback('डेटाबेस और स्टोरेज पूरी तरह से खाली किया गया।', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans select-none antialiased">
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg border flex items-center gap-2 text-xs font-semibold ${
              toast.type === 'success' 
                ? 'bg-emerald-600 border-emerald-500/50 text-white' 
                : 'bg-slate-800 border-slate-700 text-slate-100'
            }`}
          >
            <CheckSquare className="h-4 w-4 shrink-0" />
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Government styled Header */}
      <header className="sticky top-0 z-40 bg-indigo-900 text-white border-b-4 border-indigo-500 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500 rounded-lg shrink-0">
              <Cpu className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm sm:text-lg font-black tracking-tight text-white uppercase">परीक्षा केंद्र ड्यूटी रैंडमाइज़र (Exam Duty Randomizer)</h1>
                <span className="text-[9px] bg-indigo-750 border border-indigo-400 text-indigo-100 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider font-mono">v2.4</span>
              </div>
              <p className="text-[10px] sm:text-xs text-indigo-200">परीक्षा केंद्र ड्यूटी रेंडमाइज़र • District Exam Duty Allotment & Randomization System Office</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(centers.length > 0 || officers.length > 0) && (
              <button
                onClick={handleResetEntireDatabase}
                className="text-[10px] sm:text-xs text-indigo-200 hover:text-red-300 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-800/40 border border-indigo-800/45 transition cursor-pointer"
                title="सभी केंद्र एवं अधिकारियों की सूची साफ़ करें"
              >
                सिस्टम रीसेट (Full Reset)
              </button>
            )}
            
            <div className="h-4 w-px bg-indigo-800 hidden sm:block"></div>
            
            <div className="hidden md:flex items-center gap-1.5 text-[9px] font-mono text-indigo-200 bg-indigo-950/60 px-3 py-1 rounded-md border border-indigo-800/50">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
              <span>REGIONAL CLOUD SECURE-LINK ACTIVE</span>
            </div>
          </div>
        </div>

        {/* Tab Selection Row */}
        <div className="bg-[#1e1b4b] border-t border-indigo-950/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1.5 py-2 overflow-x-auto scrollbar-none" aria-label="Tabs">
              
              <button
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'upload' 
                    ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500' 
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-950/50'
                }`}
              >
                <UploadCloud className="h-3.5 w-3.5" />
                मास्टर इम्पोर्ट (Data Import)
              </button>

              <button
                onClick={() => setActiveTab('centers')}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'centers' 
                    ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500' 
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-950/50'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                परीक्षा केंद्र ({centers.length})
              </button>

              <button
                onClick={() => setActiveTab('officers')}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'officers' 
                    ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500' 
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-950/50'
                }`}
              >
                <Users className="h-3.5 w-3.5" />
                अधिकारी सूची ({officers.length})
              </button>

              <button
                onClick={() => setActiveTab('randomize')}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'randomize' 
                    ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500' 
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-950/50'
                }`}
              >
                <Shuffle className="h-3.5 w-3.5" />
                रेंडमाइजेशन (Randomize Engine)
              </button>

              <button
                onClick={() => {
                  if (hasAllotted) {
                    setActiveTab('results');
                  } else {
                    alert("कृपया पहले रैंडमाइजेशन प्रारंभ करें! (Run randomization first)");
                  }
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  !hasAllotted ? 'opacity-40 cursor-not-allowed ' : ''
                }${
                  activeTab === 'results' 
                    ? 'bg-emerald-600 text-white shadow-sm border border-emerald-500' 
                    : 'text-indigo-200 hover:text-white hover:bg-indigo-950/50'
                }`}
              >
                <FileCheck className="h-3.5 w-3.5" />
                ड्यूटी रिपोर्ट (Duty Charts)
                {hasAllotted && (
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-emerald-500 inline-block"></span>
                )}
              </button>

            </nav>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Dynamic Live Summary dashboard component */}
        <DashboardStats centers={centers} officers={officers} />

        {/* Tab views layout animation container */}
        <div id="active-tab-container" className="min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'upload' && (
                <ExcelImporter 
                  onDataLoaded={handleDataImport}
                  currentCentersCount={centers.length}
                  currentOfficersCount={officers.length}
                />
              )}

              {activeTab === 'centers' && (
                <CentersTable 
                  centers={centers}
                  onAddCenter={handleAddCenter}
                  onUpdateCenterCapacity={handleUpdateCenterCapacity}
                  onDeleteCenter={handleDeleteCenter}
                  onClearAll={handleClearCenters}
                />
              )}

              {activeTab === 'officers' && (
                <OfficersTable 
                  officers={officers}
                  onAddOfficer={handleAddOfficer}
                  onDeleteOfficer={handleDeleteOfficer}
                  onClearAll={handleClearOfficers}
                />
              )}

              {activeTab === 'randomize' && (
                <RandomizePanel 
                  centers={centers}
                  officers={officers}
                  onRandomizeComplete={handleRandomizeComplete}
                />
              )}

              {activeTab === 'results' && (
                <AllotmentResults 
                  centers={centers}
                  officers={officers}
                  onManualReassign={handleManualReassign}
                  onResetAllotment={handleResetAllotment}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </main>

      {/* Professional footer with references/credits */}
      <footer className="bg-white border-t border-slate-200 px-8 py-4 flex flex-col md:flex-row justify-between items-center text-[11px] text-slate-400 gap-2 w-full mt-12 shrink-0">
        <div>© 2026 Exam Management Authority • Confidential Regional Access Only</div>
        <div className="flex gap-4">
          <span>Privacy Policy</span>
          <span>User Guide (उपयोगकर्ता मार्गदर्शिका)</span>
          <span className="text-indigo-600 font-bold uppercase font-mono">System Secure</span>
        </div>
      </footer>
    </div>
  );
}
