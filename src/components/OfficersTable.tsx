import React, { useState } from 'react';
import { Users, Plus, Trash2, Search, Filter } from 'lucide-react';
import { Officer } from '../types';

interface OfficersTableProps {
  officers: Officer[];
  onAddOfficer: (officer: Officer) => void;
  onDeleteOfficer: (id: string) => void;
  onClearAll: () => void;
}

export function OfficersTable({
  officers,
  onAddOfficer,
  onDeleteOfficer,
  onClearAll
}: OfficersTableProps) {
  const [newName, setNewName] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newName.trim() || !newDesignation.trim() || !newDepartment.trim()) {
      setError('नाम, पद और विभाग अनिवार्य हैं! (Name, designation & dept are required)');
      return;
    }

    if (newMobile && !/^\d{10}$/.test(newMobile.trim())) {
      setError('मोबाइल संख्या 10 अंकों की होनी चाहिए! (Mobile must be of 12 or 10 digits)');
      return;
    }

    onAddOfficer({
      id: `o_${Date.now()}`,
      name: newName.trim(),
      designation: newDesignation.trim(),
      department: newDepartment.trim(),
      mobile: newMobile.trim() || '9999999999',
      assignedCenterCode: null
    });

    setNewName('');
    setNewDesignation('');
    setNewDepartment('');
    setNewMobile('');
  };

  // Get list of unique departments for filters
  const departments = Array.from(new Set(officers.map(o => o.department))).filter(Boolean);

  // Filter officers based on search query of name/designation and department filter
  const filteredOfficers = officers.filter(o => {
    const matchesSearch = 
      o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.mobile.includes(searchQuery);
    
    const matchesDept = departmentFilter ? o.department === departmentFilter : true;

    return matchesSearch && matchesDept;
  });

  return (
    <div id="officers-management-panel" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 underline decoration-indigo-400 decoration-4 underline-offset-8">
            <Users className="h-5 w-5 text-indigo-600" />
            अधिकारी डेटाबेस प्रबंधन (Officers Database)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2.5">अधिकारियों का नाम, पद, विभाग और मोबाइल नंबर जोड़ें, संशोधन करें या खोजें</p>
        </div>
        {officers.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 transition duration-150 cursor-pointer self-start sm:self-auto"
          >
            सभी अधिकारी हटाएं (Clear All)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Manual Add Form */}
        <div className="p-6 bg-slate-50/50 border-r border-slate-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-slate-500" />
            नया अधिकारी पंजीकृत करें (Register Officer)
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg">{error}</div>}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">अधिकारी का नाम (Officer Name) *</label>
              <input
                type="text"
                placeholder="उदा. डॉ. अरुण कुमार वर्मा"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">पद (Designation) *</label>
              <input
                type="text"
                placeholder="उदा. व्याख्याता / प्रोफेसर / इंजीनियर"
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">विभाग / कार्यालय (Department) *</label>
              <input
                type="text"
                placeholder="उदा. शिक्षा विभाग / जल संसाधन"
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">मोबाइल संख्या (10-digit Mobile)</label>
              <input
                type="text"
                maxLength={10}
                placeholder="उदा. 98350XXXXX"
                value={newMobile}
                onChange={(e) => setNewMobile(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              अधिकारी सुरक्षित करें
            </button>
          </form>
        </div>

        {/* Filter and List wrapper */}
        <div className="lg:col-span-2 flex flex-col h-[520px] overflow-hidden">
          {/* Controls */}
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="नाम, पद या मोबाइल नंबर से खोजें..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-slate-400"
              />
            </div>

            {departments.length > 0 && (
              <div className="relative min-w-[160px] flex items-center">
                <Filter className="absolute left-3 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-xs appearance-none focus:outline-none focus:border-slate-400"
                >
                  <option value="">सभी विभाग (All Departments)</option>
                  {departments.map((dept, idx) => (
                    <option key={idx} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Table list */}
          <div className="flex-1 overflow-y-auto">
            {filteredOfficers.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <Users className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="text-sm font-semibold">कोई अधिकारी मेल नहीं खाता।</p>
                <p className="text-xs text-slate-400">कृपया इम्पोर्ट करें या खोज क्वेरी रीसेट करें।</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-white z-10 shadow-xs border-b border-slate-100 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">नाम (Officer Name)</th>
                    <th className="py-3 px-4">पद (Designation)</th>
                    <th className="py-3 px-4">विभाग (Department)</th>
                    <th className="py-3 px-4">मोबाइल (Mobile)</th>
                    <th className="py-3 px-4 text-right">कार्य (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredOfficers.map((off) => (
                    <tr key={off.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 px-4 font-semibold text-slate-800">{off.name}</td>
                      <td className="py-3 px-4 text-slate-600 font-medium">{off.designation}</td>
                      <td className="py-3 px-4">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium">{off.department}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">{off.mobile}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onDeleteOfficer(off.id)}
                          className="p-1 px-1.5 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-700 transition"
                          title="हटाएं"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
