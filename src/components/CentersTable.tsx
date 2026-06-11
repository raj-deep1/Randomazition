import React, { useState } from 'react';
import { Building2, Plus, Trash2, Edit2, Users, Check } from 'lucide-react';
import { ExamCenter } from '../types';

interface CentersTableProps {
  centers: ExamCenter[];
  onAddCenter: (center: ExamCenter) => void;
  onUpdateCenterCapacity: (id: string, capacity: number) => void;
  onDeleteCenter: (id: string) => void;
  onClearAll: () => void;
}

export function CentersTable({ 
  centers, 
  onAddCenter, 
  onUpdateCenterCapacity, 
  onDeleteCenter,
  onClearAll
}: CentersTableProps) {
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCapacity, setNewCapacity] = useState(2);
  const [error, setError] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCapacity, setEditCapacity] = useState<number>(2);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newCode.trim() || !newName.trim()) {
      setError('सभी फील्ड आवश्यक हैं! (All fields are required)');
      return;
    }

    if (centers.some(c => c.code.toLowerCase() === newCode.trim().toLowerCase())) {
      setError('यह केंद्र कोड पहले से मौजूद है! (Center code already exists)');
      return;
    }

    onAddCenter({
      id: `c_${Date.now()}`,
      code: newCode.trim(),
      name: newName.trim(),
      capacity: Number(newCapacity) || 0,
      assignedOfficerIds: []
    });

    setNewCode('');
    setNewName('');
    setNewCapacity(2);
  };

  const startEditing = (center: ExamCenter) => {
    setEditingId(center.id);
    setEditCapacity(center.capacity);
  };

  const saveCapacity = (id: string) => {
    onUpdateCenterCapacity(id, editCapacity);
    setEditingId(null);
  };

  return (
    <div id="centers-management-panel" className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Header actions */}
      <div className="p-6 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 underline decoration-indigo-400 decoration-4 underline-offset-8">
            <Building2 className="h-5 w-5 text-indigo-600" />
            परीक्षा केंद्र प्रबंधन (Exam Centers)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2.5">प्रत्येक परीक्षा केंद्र का कोड, नाम और उसपर तैनात किए जाने वाले अधिकारियों की वांछित संख्या निर्धारित करें</p>
        </div>
        {centers.length > 0 && (
          <button 
            onClick={onClearAll}
            className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100 transition duration-150 cursor-pointer self-start sm:self-auto"
          >
            सभी केंद्र डिलीट करें (Clear All)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Form to add manual centers */}
        <div className="p-6 bg-slate-50/50 border-r border-slate-100">
          <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-1.5">
            <Plus className="h-4 w-4 text-slate-500" />
            नया केंद्र जोड़ें (Add New Center)
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-lg">{error}</div>}
            
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">केंद्र कोड (Center Code) *</label>
              <input
                type="text"
                placeholder="उदा. 1001"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">परीक्षा केंद्र का नाम (Center Name) *</label>
              <input
                type="text"
                placeholder="उदा. राजकीय बॉयज हाई स्कूल, सुपौल"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-500"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-600">अफसर क्षमता संख्या (Required Officers) *</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newCapacity}
                  onChange={(e) => setNewCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-slate-500"
                />
                <span className="text-xs text-slate-400 font-medium">ऑफिसर तैनात किए जाने हैं</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              केंद्र सुरक्षित करें
            </button>
          </form>
        </div>

        {/* List of centers */}
        <div className="lg:col-span-2 overflow-x-auto">
          {centers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <Building2 className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold">कोई परीक्षा केंद्र लोड नहीं है।</p>
              <p className="text-xs text-slate-400">ऊपर इम्पोर्ट टैब से डेटा इम्पोर्ट करें या बायीं ओर फॉर्म से नया बनायें।</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
                  <th className="py-3 px-4">कोड (Code)</th>
                  <th className="py-3 px-4">परीक्षा केंद्र का नाम (Center Name)</th>
                  <th className="py-3 px-4 text-center">आवश्यक स्टाफ (Staff Needed)</th>
                  <th className="py-3 px-4 text-right">कार्य (Action)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {centers.map((center) => (
                  <tr key={center.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-500">{center.code}</td>
                    <td className="py-3 px-4 font-medium text-slate-800">{center.name}</td>
                    <td className="py-3 px-4 text-center">
                      {editingId === center.id ? (
                        <div className="inline-flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={editCapacity}
                            onChange={(e) => setEditCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 px-2 py-1 bg-white border border-slate-300 rounded text-center text-xs font-semibold"
                          />
                          <button
                            onClick={() => saveCapacity(center.id)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md text-xs">{center.capacity}</span>
                          <button
                            onClick={() => startEditing(center)}
                            className="p-0.5 text-slate-400 hover:text-slate-600 rounded"
                            title="अपडेट करें"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onDeleteCenter(center.id)}
                        className="p-1 px-2 hover:bg-rose-50 rounded text-rose-500 hover:text-rose-700 transition"
                        title="डिलीट करें"
                      >
                        <Trash2 className="h-4 w-4" />
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
  );
}
