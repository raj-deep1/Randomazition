import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  FileDown, 
  Search, 
  MapPin, 
  UserCheck, 
  Building2, 
  Users, 
  ArrowRightLeft, 
  UserPlus, 
  Trash2,
  RefreshCw,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { ExamCenter, Officer } from '../types';
import { exportToExcel, exportToPDF } from '../utils/exporter';

interface AllotmentResultsProps {
  centers: ExamCenter[];
  officers: Officer[];
  onManualReassign: (officerId: string, targetCenterCode: string | null) => void;
  onResetAllotment: () => void;
}

type ViewMode = 'centers' | 'officers';

export function AllotmentResults({
  centers,
  officers,
  onManualReassign,
  onResetAllotment
}: AllotmentResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('centers');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOfficerSwap, setActiveOfficerSwap] = useState<string | null>(null);
  const [reportTitle, setReportTitle] = useState('OFFICIAL RANDOMIZATION DUTY ALLOTMENT REPORT');
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);

  const assignedOfficers = officers.filter(o => o.assignedCenterCode !== null);
  const unassignedOfficers = officers.filter(o => o.assignedCenterCode === null);

  // Search filter
  const filteredCenters = centers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.code.includes(searchQuery)
  );

  const filteredOfficers = officers.filter(o => 
    o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (o.assignedCenterCode && o.assignedCenterCode.includes(searchQuery))
  );

  const handleExcelExport = () => {
    exportToExcel(centers, officers);
  };

  const handlePdfExport = async () => {
    setIsPdfGenerating(true);
    try {
      await exportToPDF(centers, officers, reportTitle);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  return (
    <div id="allotment-results-panel" className="space-y-6">
      
      {/* Action Header bar */}
      <div className="bg-indigo-950 text-white border-b-4 border-indigo-500 rounded-2xl p-6 shadow-md flex flex-col gap-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-200 border border-indigo-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              रैंडम अलॉटमेंट सफल (Random Allotment Complete)
            </div>
            <h2 className="text-xl font-bold tracking-tight">ड्यूटी आबंटन परिणाम एवं रिपोर्ट (Duty Allotment Results)</h2>
            <p className="text-xs text-indigo-200">सभी अधिकारियों की रैंडम ड्यूटी परीक्षा केंद्रों पर लगा दी गई है। आप नीचे रिपोर्ट देख सकते हैं तथा एक्सपोर्ट कर सकते हैं।</p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={handlePdfExport}
              disabled={isPdfGenerating}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-800/80 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
            >
              {isPdfGenerating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0"></div>
                  <span>तैयार हो रहा है...</span>
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4" />
                  <span>पीडीएफ रिपोर्ट (Export PDF)</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleExcelExport}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileDown className="h-4 w-4" />
              एक्सेल रिपोर्ट (Export Excel)
            </button>

            <button
              onClick={() => {
                if (window.confirm("क्या आप सच में पूरा आवंटन रद्द करके फिर से खाली करना चाहते हैं?")) {
                  onResetAllotment();
                }
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              आवंटन रीसेट (Reset)
            </button>
          </div>
        </div>

        {/* Manual report title editor section addition */}
        <div className="bg-indigo-900/35 border border-indigo-500/20 rounded-xl p-4 space-y-2">
          <label className="block text-[10px] sm:text-xs font-bold text-indigo-200 uppercase tracking-wider">
            रिपोर्ट शीर्षक संपादित करें (Edit Report Heading Title in Exports):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              placeholder="उदाहरण: OFFICIAL RANDOMIZATION DUTY ALLOTMENT REPORT"
              className="flex-1 bg-indigo-950/90 border border-indigo-700/60 rounded-lg px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/55 font-mono"
            />
            {reportTitle !== 'OFFICIAL RANDOMIZATION DUTY ALLOTMENT REPORT' && (
              <button
                type="button"
                onClick={() => setReportTitle('OFFICIAL RANDOMIZATION DUTY ALLOTMENT REPORT')}
                className="px-2.5 py-1 text-[10px] bg-indigo-800 hover:bg-indigo-700 rounded-lg text-indigo-100 font-medium cursor-pointer"
                title="डिफ़ॉल्ट पर रीसेट करें"
              >
                रीसेट
              </button>
            )}
          </div>
          <p className="text-[10px] text-indigo-300 leading-relaxed">
            * यहाँ जो भी आप मैन्युअल शीर्षक लिखेंगे, वह सीधे पी०डी०एफ० (PDF Export) के मुख्य बॉर्डर के मुख्य भाग में प्रिंट होगा।
          </p>
        </div>
      </div>

      {/* Primary Display Mode Select and Search bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
        {/* Toggle Mode */}
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/50 self-start">
          <button
            onClick={() => { setViewMode('centers'); setSearchQuery(''); }}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === 'centers' ? 'bg-white text-slate-800 shadow-xs border border-slate-200/40' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            परीक्षा केंद्रवार (Center Wise)
          </button>
          <button
            onClick={() => { setViewMode('officers'); setSearchQuery(''); }}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition flex items-center gap-1.5 ${
              viewMode === 'officers' ? 'bg-white text-slate-800 shadow-xs border border-slate-200/40' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            अधिकारीवार सूची (Officer Wise List)
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[280px] flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={viewMode === 'centers' ? "केंद्र कोड या नाम से खोजें..." : "अफसर का नाम, पद, केंद्र कोड से खोजें..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 bg-slate-50/50 rounded-lg text-xs focus:outline-none focus:border-slate-500"
          />
        </div>
      </div>

      {/* Render Lists */}
      {viewMode === 'centers' ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredCenters.map((center) => {
            const centerAllocated = officers.filter(o => o.assignedCenterCode === center.code);

            return (
              <motion.div
                key={center.id}
                layout
                className="bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden flex flex-col justify-between"
              >
                {/* Center Title header */}
                <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="font-mono font-bold text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md">CODE: {center.code}</span>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                      {center.name}
                    </h3>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                      centerAllocated.length >= center.capacity 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      तैनात: {centerAllocated.length} / {center.capacity}
                    </span>
                  </div>
                </div>

                {/* List of Officers inside */}
                <div className="divide-y divide-slate-100 flex-1 min-h-[120px]">
                  {centerAllocated.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      कोई कर्मचारी आवंटित नहीं है
                    </div>
                  ) : (
                    centerAllocated.map((off) => (
                      <div key={off.id} className="p-4 flex items-center justify-between hover:bg-slate-50/20 transition">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {off.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            {off.designation} ९ {off.department}
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono">मो: {off.mobile}</p>
                        </div>
                        
                        {/* Force Swap operations */}
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => onManualReassign(off.id, null)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition text-[10px] font-semibold px-2 flex items-center gap-1"
                            title="ड्यूटी से हटाकर सुरक्षित सूची में भेजें"
                          >
                            <Trash2 className="h-3 w-3" />
                            म्युट करें
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Bottom Quick Assignment form if slots remaining */}
                {centerAllocated.length < center.capacity && (
                  <div className="p-3.5 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-slate-400">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      खाली स्थान उपलब्ध है (Seats Vaccine)
                    </span>

                    {unassignedOfficers.length > 0 ? (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            onManualReassign(e.target.value, center.code);
                            e.target.value = '';
                          }
                        }}
                        className="text-[11px] bg-white border border-slate-200 px-2 py-1 rounded max-w-[180px] focus:outline-none focus:ring-1 focus:ring-slate-400"
                      >
                        <option value="">आरक्षित से लगाएं...</option>
                        {unassignedOfficers.map(uo => (
                          <option key={uo.id} value={uo.id}>{uo.name} ({uo.department.split(' ')[0]})</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[10px] text-amber-600 font-medium font-semibold">आरक्षित अधिकारी खाली नहीं हैं</span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Officer Wise layout */
        <div className="bg-white rounded-2xl border border-slate-100/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3.5 px-4">अधिकारी का नाम (Officer Name)</th>
                  <th className="py-3.5 px-4">पद एवं विभाग (Role & Department)</th>
                  <th className="py-3.5 px-4">मोबाइल सं० (Mobile)</th>
                  <th className="py-3.5 px-4">ड्यूटी स्टेटस (Duty Status)</th>
                  <th className="py-3.5 px-4">आवंटित परीक्षा केंद्र (Duty Exam Center)</th>
                  <th className="py-3.5 px-4 text-right">त्वरित बदल (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredOfficers.map((off) => {
                  const assignedTo = centers.find(c => c.code === off.assignedCenterCode);

                  return (
                    <tr key={off.id} className="hover:bg-slate-50/30 transition">
                      <td className="py-3 px-4 font-bold text-slate-800">{off.name}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-700">{off.designation}</div>
                        <div className="text-[10px] text-slate-400">{off.department}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{off.mobile}</td>
                      <td className="py-3 px-4">
                        {assignedTo ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-100/80 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            <UserCheck className="h-3 w-3 text-emerald-600" />
                            तैनात (Duty On)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 border border-slate-200/60 px-2 py-0.5 rounded-md text-[10px] font-bold">
                            आरक्षित (Reserve Pool)
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {assignedTo ? (
                          <div className="font-medium text-slate-800 space-y-0.5">
                            <span className="font-mono text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mr-1">CODE: {assignedTo.code}</span>
                            <span className="text-xs font-semibold">{assignedTo.name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">आरक्षित मास्टर लिस्ट में सुरक्षित है</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {assignedTo ? (
                          <button
                            onClick={() => onManualReassign(off.id, null)}
                            className="text-[10px] text-rose-600 hover:bg-rose-50 border border-rose-150 px-2 py-1 rounded-md transition cursor-pointer"
                          >
                            सुरक्षित में भेजें
                          </button>
                        ) : (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                onManualReassign(off.id, e.target.value);
                              }
                            }}
                            className="text-[10px] bg-white border border-slate-250 px-2 py-1 rounded max-w-[125px] focus:outline-none"
                          >
                            <option value="">केंद्र आबंटित करें...</option>
                            {centers.map(cent => {
                              const filledCount = officers.filter(o => o.assignedCenterCode === cent.code).length;
                              return (
                                <option key={cent.id} value={cent.code}>
                                  {cent.code} ({filledCount}/{cent.capacity})
                                </option>
                              );
                            })}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reserve List Box */}
      {unassignedOfficers.length > 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              आरक्षित बचे हुए अधिकारी (Reserve Unassigned Officers Pool - {unassignedOfficers.length})
            </h3>
            <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold">RESERVED</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {unassignedOfficers.map((uo) => (
              <div 
                key={uo.id} 
                className="bg-white border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs shadow-xs hover:border-slate-300 transition flex items-center gap-2"
              >
                <div>
                  <div className="font-semibold text-slate-800">{uo.name}</div>
                  <div className="text-[10px] text-slate-400">{uo.designation} ({uo.department.split(' ')[0]})</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
