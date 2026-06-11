import React, { useState } from 'react';
import { motion } from 'motion/react';
import * as XLSX from 'xlsx';
import { 
  Building2, 
  Users, 
  Link, 
  Clipboard, 
  Upload, 
  FileSpreadsheet, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Search,
  LogOut,
  Check,
  RefreshCw
} from 'lucide-react';
import { ExamCenter, Officer } from '../types';
import { mockCenters, mockOfficers } from '../utils/mockData';
import { 
  initAuth, 
  googleSignIn, 
  logout as googleLogout,
  searchDriveSheets, 
  getSpreadsheetAsCSV,
  DriveFile 
} from '../utils/firebaseAuth';
import { User } from 'firebase/auth';

interface ExcelImporterProps {
  onDataLoaded: (centers: ExamCenter[], officers: Officer[]) => void;
  currentCentersCount: number;
  currentOfficersCount: number;
}

type ImportMode = 'sheet' | 'drive' | 'paste' | 'upload';

export function ExcelImporter({ onDataLoaded, currentCentersCount, currentOfficersCount }: ExcelImporterProps) {
  const [mode, setMode] = useState<ImportMode>('sheet');
  const [sheetUrl, setSheetUrl] = useState('');
  const [pasteCenters, setPasteCenters] = useState('');
  const [pasteOfficers, setPasteOfficers] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Google Drive Integration States
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [driveSearchQuery, setDriveSearchQuery] = useState('');
  const [isDriveLoading, setIsDriveLoading] = useState(false);

  React.useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        setAccessToken(token);
        fetchFiles(token, '');
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setDriveFiles([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const fetchFiles = async (token: string, search: string) => {
    setIsDriveLoading(true);
    try {
      const list = await searchDriveSheets(token, search);
      setDriveFiles(list);
    } catch (err: any) {
      console.error('Error fetching drive files:', err);
    } finally {
      setIsDriveLoading(false);
    }
  };

  const handleDriveLogin = async () => {
    setIsLoading(true);
    setImportStatus(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        setImportStatus({
          type: 'success',
          message: `सफलतापूर्वक Google Account से लॉग इन किया! (Signed in successfully as ${result.user.displayName})`
        });
        fetchFiles(result.accessToken, '');
      }
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: err.message || 'लॉग इन करने में विफल।'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDriveLogout = async () => {
    setIsLoading(true);
    try {
      await googleLogout();
      setUser(null);
      setAccessToken(null);
      setDriveFiles([]);
      setImportStatus({
        type: 'success',
        message: 'सफलतापूर्वक लॉग आउट किया गया।'
      });
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: 'लॉग आउट करने में विफल।'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchDrive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    fetchFiles(accessToken, driveSearchQuery);
  };

  const handleDriveFileImport = async (fileId: string, fileName: string) => {
    if (!accessToken) return;
    setIsLoading(true);
    setImportStatus(null);
    try {
      const csvText = await getSpreadsheetAsCSV(accessToken, fileId);
      const rows = parseRows(csvText, []);
      
      if (rows.length < 2) {
        throw new Error('स्प्रेडशीट खाली है या इसमें पर्याप्त डेटा नहीं है।');
      }

      const headers = rows[0].map(h => h.toLowerCase());
      const parsedCenters: ExamCenter[] = [];
      const parsedOfficers: Officer[] = [];
      
      const isCenterSheet = headers.some(h => Math.max(h.indexOf('केंद्र'), h.indexOf('center'), h.indexOf('code'), h.indexOf('capacity'), h.indexOf('कोड'), h.indexOf('संख्या')) > -1);
      const isOfficerSheet = headers.some(h => Math.max(h.indexOf('ऑफिसर'), h.indexOf('officer'), h.indexOf('designation'), h.indexOf('पद'), h.indexOf('mobile'), h.indexOf('अधिकारी')) > -1);

      if (isOfficerSheet && !isCenterSheet) {
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (r.length < 2) continue;
          parsedOfficers.push({
            id: `o_${Date.now()}_${i}`,
            name: r[0] || `Officer ${i}`,
            designation: r[1] || 'Assistant',
            department: r[2] || 'General',
            mobile: r[3] || '0000000000',
            assignedCenterCode: null
          });
        }
        onDataLoaded([], parsedOfficers);
        setImportStatus({
          type: 'success',
          message: `Google Drive फ़ाइल "${fileName}" से ${parsedOfficers.length} अधिकारियों की सूची सफलतापूर्वक आयात की गई!`
        });
      } else {
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (r.length < 2) continue;
          parsedCenters.push({
            id: `c_${Date.now()}_${i}`,
            code: r[0] || `${100 + i}`,
            name: r[1] || `Center ${i}`,
            capacity: parseInt(r[2]) || 2,
            assignedOfficerIds: []
          });
        }
        onDataLoaded(parsedCenters, []);
        setImportStatus({
          type: 'success',
          message: `Google Drive फ़ाइल "${fileName}" से ${parsedCenters.length} परीक्षा केंद्रों की सूची सफलतापूर्वक आयात की गई!`
        });
      }
    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: err.message || 'गूगल ड्राइव फ़ाइल डाउनलोड करने या आयात करने में विफल।'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Parse generic CSV or TSV string into objects
  const parseRows = (text: string, expectedCols: string[]) => {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length === 0) return [];
    
    // Check delimiter (Tab for Sheets paste, Comma/Semicolon for CSV)
    let delimiter = '\t';
    if (lines[0].includes(',')) delimiter = ',';
    
    // Parse rows
    return lines.map(line => {
      // Handle simple split or basic CSV regex
      const parts = line.split(delimiter).map(p => p.trim().replace(/^["']|["']$/g, ""));
      return parts;
    });
  };

  // 1. Google Sheets Link parser
  const handleGoogleSheetImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sheetUrl.trim()) return;

    setIsLoading(true);
    setImportStatus(null);

    try {
      // Find spreadsheet ID
      // Standard urls: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKv1Sux6386Ae39-C46SmvTxa1E/edit?usp=sharing
      const matches = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!matches || !matches[1]) {
        throw new Error('अमान्य गूगल शीट URL। कृपया पूर्ण URL डालें। (Invalid Google Sheet URL)');
      }

      const sheetId = matches[1];
      // Fetch public CSV export of Sheet 1
      const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&id=${sheetId}`;
      
      const response = await fetch(csvUrl);
      if (!response.ok) {
        throw new Error('गूगल शीट डाउनलोड करने में विफल। सुनिश्चित करें कि शीट "Anyone with link can view" पर सेट है। (Failed to fetch spreadsheet)');
      }

      const text = await response.text();
      const rows = parseRows(text, []);
      
      if (rows.length < 2) {
        throw new Error('शीट खाली है या इसमें पर्याप्त डेटा नहीं है।');
      }

      // We need to automatically detect if this sheet represents Center data or Officer data based on columns.
      // Let's analyze header row
      const headers = rows[0].map(h => h.toLowerCase());
      
      const parsedCenters: ExamCenter[] = [];
      const parsedOfficers: Officer[] = [];
      
      // Look for center keys
      const isCenterSheet = headers.some(h => h.includes('केंद्र') || h.includes('center') || h.includes('code') || h.includes('capacity'));
      const isOfficerSheet = headers.some(h => h.includes('ऑफिसर') || h.includes('officer') || h.includes('designation') || h.includes('पद') || h.includes('mobile'));

      // If cannot figure out, let's guide or map columns
      if (isOfficerSheet && !isCenterSheet) {
        // Parse officers
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (r.length < 2) continue;
          parsedOfficers.push({
            id: `o_${Date.now()}_${i}`,
            name: r[0] || `Officer ${i}`,
            designation: r[1] || 'Assistant',
            department: r[2] || 'General',
            mobile: r[3] || '0000000000',
            assignedCenterCode: null
          });
        }
        onDataLoaded([], parsedOfficers);
        setImportStatus({
          type: 'success',
          message: `सफलतापूर्वक ${parsedOfficers.length} अधिकारियों की सूची आयात की गई! (Imported ${parsedOfficers.length} Officers)`
        });
      } else {
        // Default to parsed Centers or split
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (r.length < 2) continue;
          parsedCenters.push({
            id: `c_${Date.now()}_${i}`,
            code: r[0] || `${100 + i}`,
            name: r[1] || `Center ${i}`,
            capacity: parseInt(r[2]) || 2,
            assignedOfficerIds: []
          });
        }
        onDataLoaded(parsedCenters, []);
        setImportStatus({
          type: 'success',
          message: `सफलतापूर्वक ${parsedCenters.length} परीक्षा केंद्रों की सूची आयात की गई! (Imported ${parsedCenters.length} Centers)`
        });
      }

    } catch (err: any) {
      setImportStatus({
        type: 'error',
        message: err.message || 'फाइल प्रोसेसिंग त्रुटि हुई।'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Direct Excel/CSV file drag & drop upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to json
        const data = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });
        if (data.length < 2) {
          throw new Error('फाइल खाली है या अमान्य है!');
        }

        const headers = data[0].map((h: any) => String(h).toLowerCase());
        const parsedCenters: ExamCenter[] = [];
        const parsedOfficers: Officer[] = [];

        // Check columns to identify whether file is of Centers or Officers
        const isOfficer = headers.some((h: string) => h.includes('officer') || h.includes('नाम') || h.includes('officer_name') || h.includes('designation') || h.includes('पद'));

        if (isOfficer) {
          // Name, Designation, Department, Mobile
          for (let i = 1; i < data.length; i++) {
            const r = data[i];
            if (!r || r.length === 0 || !r[0]) continue;
            parsedOfficers.push({
              id: `o_${Date.now()}_${i}`,
              name: String(r[0]),
              designation: String(r[1] || 'अधिकारी (Officer)'),
              department: String(r[2] || 'सामान्य (General)'),
              mobile: r[3] ? String(r[3]) : '9999999999',
              assignedCenterCode: null
            });
          }
          onDataLoaded([], parsedOfficers);
          setImportStatus({
            type: 'success',
            message: `फाइल से ${parsedOfficers.length} अधिकारियों को लोड किया गया।`
          });
        } else {
          // Center Code, Name, Capacity
          for (let i = 1; i < data.length; i++) {
            const r = data[i];
            if (!r || r.length === 0 || !r[0]) continue;
            parsedCenters.push({
              id: `c_${Date.now()}_${i}`,
              code: String(r[0]),
              name: String(r[1] || 'परीक्षा केंद्र (Exam Center)'),
              capacity: parseInt(r[2]) || 2,
              assignedOfficerIds: []
            });
          }
          onDataLoaded(parsedCenters, []);
          setImportStatus({
            type: 'success',
            message: `फाइल से ${parsedCenters.length} परीक्षा केंद्रों को लोड किया गया।`
          });
        }
      } catch (err: any) {
        setImportStatus({
          type: 'error',
          message: err.message || 'फाइल को पार्स करने में त्रुटि आई।'
        });
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  // 3. Direct Copy and Paste Rows parser 
  const handlePasteImport = (target: 'centers' | 'officers') => {
    setImportStatus(null);
    const text = target === 'centers' ? pasteCenters : pasteOfficers;
    if (!text.trim()) {
      setImportStatus({ type: 'error', message: 'कृपया पहले बॉक्स में डेटा पेस्ट करें।' });
      return;
    }

    try {
      const parsed = parseRows(text, []);
      if (parsed.length === 0) throw new Error('अमान्य डेटा फॉर्मेट।');

      if (target === 'centers') {
        const list: ExamCenter[] = parsed.map((r, i) => ({
          id: `c_${Date.now()}_${i}`,
          code: r[0] || `${2000 + i}`,
          name: r[1] || `केन्द्र - ${i + 1}`,
          capacity: parseInt(r[2]) || 2,
          assignedOfficerIds: []
        }));
        onDataLoaded(list, []);
        setPasteCenters('');
        setImportStatus({ type: 'success', message: `सफलतापूर्वक ${list.length} परीक्षा केंद्र जोड़े गए!` });
      } else {
        const list: Officer[] = parsed.map((r, i) => ({
          id: `o_${Date.now()}_${i}`,
          name: r[0] || `अधिकारी ${i + 1}`,
          designation: r[1] || 'सहायक (Assistant)',
          department: r[2] || 'सामान्य विभाग',
          mobile: r[3] || '9431100000',
          assignedCenterCode: null
        }));
        onDataLoaded([], list);
        setPasteOfficers('');
        setImportStatus({ type: 'success', message: `सफलतापूर्वक ${list.length} अधिकारियों को जोड़ा गया!` });
      }
    } catch (err: any) {
      setImportStatus({ type: 'error', message: 'पार्स करने में गड़बड़। कृपया चेक करें कि कोलम क्रम सही है।' });
    }
  };

  return (
    <div id="data-importer-panel" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800 underline decoration-indigo-400 decoration-4 underline-offset-8">मास्टर डेटा इम्पोर्ट करें (Import Master Data)</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2.5">गूगल स्प्रेडशीट, फाइल अपलोड, या डायरेक्ट कॉपी-पेस्ट के माध्यम से परीक्षा केंद्रों एवं अफसरों की सूची अपलोड करें</p>
        </div>
        <div className="mt-3 md:mt-0 flex gap-2 text-xs font-mono bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-150">
          <span>केंद्र (Centers): <b className="text-indigo-900 font-bold">{currentCentersCount}</b></span>
          <span className="text-indigo-300">|</span>
          <span>अधिकारी (Officers): <b className="text-indigo-900 font-bold">{currentOfficersCount}</b></span>
        </div>
      </div>

      {/* Tabs list */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200/50">
        <button
          type="button"
          onClick={() => { setMode('sheet'); setImportStatus(null); }}
          className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            mode === 'sheet' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          <Link className="h-3.5 w-3.5 text-slate-400" />
          गूगल स्प्रेडशीट
        </button>
        <button
          type="button"
          onClick={() => { setMode('drive'); setImportStatus(null); }}
          className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            mode === 'drive' ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          <span className="text-sm">📁</span>
          Google Drive
        </button>
        <button
          type="button"
          onClick={() => { setMode('paste'); setImportStatus(null); }}
          className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            mode === 'paste' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          <Clipboard className="h-3.5 w-3.5 text-slate-400" />
          कॉपी-पेस्ट डेटा
        </button>
        <button
          type="button"
          onClick={() => { setMode('upload'); setImportStatus(null); }}
          className={`px-4 py-2.5 rounded-lg text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            mode === 'upload' ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50 font-semibold' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
          }`}
        >
          <Upload className="h-3.5 w-3.5 text-slate-400" />
          फाइल अपलोड
        </button>
      </div>

      {importStatus && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-start gap-3 border ${
            importStatus.type === 'success' 
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
              : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}
        >
          {importStatus.type === 'success' ? <CheckCircle className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />}
          <div>
            <p className="text-sm font-medium">{importStatus.message}</p>
          </div>
        </motion.div>
      )}

      {/* Mode Content wrapper */}
      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
        {mode === 'drive' && (
          <div className="space-y-6">
            {!user ? (
              <div className="text-center py-8 space-y-4">
                <div className="mx-auto w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold">
                  <span className="text-2xl">📁</span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800 font-sans">अपने Google Account से सुरक्षित कनेक्ट करें</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Google Drive से सीधे अपनी प्राइवेट परीक्षा स्प्रेडशीट सर्च करने और आबंटन डेटा इम्पोर्ट करने के लिए कृपया साइन इन करें। यह ब्राउज़र के अंदर पूरी तरह सुरक्षित है।
                  </p>
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleDriveLogin}
                    disabled={isLoading}
                    className="flex items-center gap-3 bg-white border border-slate-300 rounded-xl px-6 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="h-5 w-5 shrink-0 block">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                    </svg>
                    <span>Google Account से कनेक्ट करें</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Logged in header / profile bar */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-indigo-50/60 border border-indigo-100 rounded-xl gap-3 text-left">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || ''} className="w-9 h-9 rounded-full border border-indigo-200" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {user.displayName?.[0] || 'G'}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-slate-800">{user.displayName}</p>
                      <p className="text-[10px] text-slate-500">{user.email} • Google Drive Active</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => accessToken && fetchFiles(accessToken, driveSearchQuery)}
                      disabled={isDriveLoading}
                      className="px-3 py-1.5 text-[11px] bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-600 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="रिफ्रेश करें"
                    >
                      <RefreshCw className={`h-3 w-3 ${isDriveLoading ? 'animate-spin' : ''}`} />
                      रिफ्रेश
                    </button>
                    <button
                      type="button"
                      onClick={handleDriveLogout}
                      className="px-3 py-1.5 text-[11px] bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="h-3 w-3" />
                      डिस्कनेक्ट (Logout)
                    </button>
                  </div>
                </div>

                {/* Search query box */}
                <form onSubmit={handleSearchDrive} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={driveSearchQuery}
                      onChange={(e) => setDriveSearchQuery(e.target.value)}
                      placeholder="अपनी गूगल ड्राइव फाइलों का नाम खोजें (उदा. 'Centers', 'Officers')..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/80 font-sans"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isDriveLoading}
                    className="px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    सर्च
                  </button>
                </form>

                {/* File List */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                  <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-left font-sans">
                    Google Spreadsheet Files ({driveFiles.length})
                  </div>
                  
                  {isDriveLoading ? (
                    <div className="p-10 text-center text-xs text-slate-400 space-y-2">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <p>गूगल ड्राइव फाइलों की खोज जारी है...</p>
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <div className="p-10 text-center text-xs text-slate-400">
                      कोई स्प्रेडशीट फाइल नहीं मिली। कृपया भिन्न नाम खोजें या सुनिश्चित करें कि आपके ड्राइव में गूगल शीट्स अवेलेबल हैं।
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-[250px] overflow-y-auto">
                      {driveFiles.map((file) => (
                        <div key={file.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition gap-4 text-left">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-base shrink-0">📊</span>
                              <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate" title={file.name}>
                                {file.name}
                              </p>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1 font-mono">
                              ID: <code className="bg-slate-50 px-1 py-0.5 rounded font-mono">{file.id.substring(0, 8)}...</code>
                              {file.modifiedTime && ` • संशोधित: ${new Date(file.modifiedTime).toLocaleDateString('hi-IN')}`}
                            </p>
                          </div>
                          
                          <div className="flex gap-1.5 shrink-0">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg text-xs font-semibold flex items-center transition"
                                title="गूगल ड्राइव में देखें"
                              >
                                🔗 खोलें
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDriveFileImport(file.id, file.name)}
                              disabled={isLoading}
                              className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-[10px] sm:text-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              इम्पोर्ट करें
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1 text-left">
                  <div className="flex items-center gap-1.5 text-indigo-800 font-semibold text-xs leading-none">
                    <HelpCircle className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>ऑटो-डिटेक्शन के नियम (How is it processed?)</span>
                  </div>
                  <p className="text-[11px] text-indigo-700/80 leading-relaxed font-sans mt-1">
                    यह ऐप फाइल की पहली पंक्ति के कोलमों को देखकर परीक्षा केंद्र (Centers) अथवा अधिकारियों (Officers) की सूची की स्वतः पहचान कर लेता है। परीक्षा केंद्रों के लिए कोलम में "कोड / नाम / क्षमता" और अधिकारियों के लिए "नाम / पद / विभाग / मोबाइल" होने पर डेटा सुचारू रूप से इम्पोर्ट होगा।
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'sheet' && (
          <form onSubmit={handleGoogleSheetImport} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">गूगल स्प्रेडशीट शेयर लिंक (Shareable Link)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/.../edit?usp=sharing"
                  className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/80"
                />
                <button
                  type="submit"
                  disabled={isLoading || !sheetUrl.trim()}
                  className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 transition disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  {isLoading ? 'इम्पोर्ट जारी है...' : 'डाटा इम्पोर्ट करें'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Hint Box */}
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-blue-800 font-semibold text-xs">
                <HelpCircle className="h-4 w-4 text-blue-500" />
                गूगल शीट कैसे तैयार करें (Guide)?
              </div>
              <ul className="text-xs text-blue-700/80 list-disc ml-4 space-y-1">
                <li>गूगल शीट में पहली पंक्ति (Header) कोलम की होनी चाहिए।</li>
                <li><b>परीक्षा केंद्र के लिए कोलम:</b> केंद्र कोड (Code), केंद्र का नाम (Name), क्षमता (Capacity)</li>
                <li><b>अधिकारियों के लिए कोलम:</b> अफसर का नाम (Name), पद (Designation), विभाग (Department), मोबाइल (Mobile)</li>
                <li>सुनिश्चित करें कि शीट की <b>Link Sharing</b> Settings <b>"Anyone with the link can view"</b> पर सेट हो, ताकि यह ऐप डाटा पैच कर सके।</li>
              </ul>
            </div>
          </form>
        )}

        {mode === 'paste' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Center Box */}
            <div className="space-y-3 bg-white p-5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-700">परीक्षा केंद्र पेस्ट करें (Paste Exam Centers)</h3>
              </div>
              <p className="text-xs text-slate-400">क्रम: <code className="bg-slate-50 px-1 py-0.5 rounded text-xs font-mono font-semibold">केंद्र_कोड [Tab] केंद्र_का_नाम [Tab] क्षमता_अदद</code></p>
              <textarea
                value={pasteCenters}
                onChange={(e) => setPasteCenters(e.target.value)}
                placeholder="1001&#9;राजकीय स्कूल, सुपौल&#9;4&#10;1002&#9;राजकीय स्कूल, मधेपुरा&#9;2"
                rows={5}
                className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              <button
                onClick={() => handlePasteImport('centers')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer"
              >
                केंद्र अपलोड करें
              </button>
            </div>

            {/* Officer Box */}
            <div className="space-y-3 bg-white p-5 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-700">अधिकारी डेटा पेस्ट करें (Paste Officer List)</h3>
              </div>
              <p className="text-xs text-slate-400">क्रम: <code className="bg-slate-50 px-1 py-0.5 rounded text-xs font-mono font-semibold">अफसर_नाम [Tab] पद/पोस्ट [Tab] विभाग [Tab] मोबाइल_नंबर</code></p>
              <textarea
                value={pasteOfficers}
                onChange={(e) => setPasteOfficers(e.target.value)}
                placeholder="रमेश झा&#9;असिस्टेंट प्रोफेसर&#9;शिक्षा विभाग&#9;9431200000&#10;संदीप सिंह&#9;वरिष्ठ लिपिक&#9;राजस्व विभाग&#9;9835011112"
                rows={5}
                className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
              <button
                onClick={() => handlePasteImport('officers')}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold tracking-wide transition cursor-pointer"
              >
                अधिकारी लोड करें
              </button>
            </div>
          </div>
        )}

        {mode === 'upload' && (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-2xl bg-white p-10 text-center hover:border-slate-300 transition duration-150">
            <Upload className="h-10 w-10 text-slate-400 mb-3" />
            <h3 className="text-sm font-bold text-slate-700">एक्सेल (.xlsx) या .csv फाइल खींच कर यहाँ लाएं</h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">फाइल में कोलम के अनुसार परीक्षा केंद्र या अधिकारियों के नाम होने चाहिए</p>
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button className="px-5 py-2.5 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition">
                फाइल सेलेक्ट करें
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
