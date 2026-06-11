import { ExamCenter, Officer } from '../types';

export const mockCenters: ExamCenter[] = [
  { id: 'c1', code: '1001', name: 'राजकीय बालक उच्च विद्यालय, सुपौल (Govt Boys High School)', capacity: 4, assignedOfficerIds: [] },
  { id: 'c2', code: '1002', name: 'टी. पी. कॉलेज, मधेपुरा (T.P. College, Madhepura)', capacity: 3, assignedOfficerIds: [] },
  { id: 'c3', code: '1003', name: 'एस. एन. एस. महिला कॉलेज, सहरसा (S.N.S. Womens College)', capacity: 2, assignedOfficerIds: [] },
  { id: 'c4', code: '1004', name: 'एम. एल. टी. कॉलेज, सहरसा (M.L.T. College, Saharsa)', capacity: 5, assignedOfficerIds: [] },
  { id: 'c5', code: '1005', name: 'बी. एस. एस. कॉलेज, सुपौल (B.S.S. College, Supaul)', capacity: 3, assignedOfficerIds: [] },
  { id: 'c6', code: '1006', name: 'राजकीय कन्या उच्च विद्यालय, वीरपुर (Govt Girls High School, Birpur)', capacity: 2, assignedOfficerIds: [] },
  { id: 'c7', code: '1007', name: 'के. पी. कॉलेज, मुरलीगंज (K.P. College, Murliganj)', capacity: 3, assignedOfficerIds: [] }
];

export const mockOfficers: Officer[] = [
  { id: 'o1', name: 'रमेश कुमार झा (Ramesh Kumar Jha)', designation: 'सहायक प्रोफेसर (Asst. Professor)', department: 'शिक्षा विभाग (Education)', mobile: '9431200001', assignedCenterCode: null },
  { id: 'o2', name: 'संदीप कुमार सिंह (Sandeep Kr. Singh)', designation: 'वरिष्ठ लिपिक (Senior Clerk)', department: 'राजस्व विभाग (Revenue)', mobile: '9835011112', assignedCenterCode: null },
  { id: 'o3', name: 'मीना कुमारी (Meena Kumari)', designation: 'व्याख्याता (Lecturer)', department: 'शिक्षा विभाग (Education)', mobile: '7004122334', assignedCenterCode: null },
  { id: 'o4', name: 'आलोक कुमार यादव (Alok Kumar Yadav)', designation: 'कनिष्ठ अभियंता (Junior Engineer)', department: 'पथ निर्माण विभाग (PWD)', mobile: '9122334455', assignedCenterCode: null },
  { id: 'o5', name: 'राजेश प्रसाद सिन्हा (Rajesh Pd. Sinha)', designation: 'प्रखंड विकास पदाधिकारी (BDO)', department: 'ग्रामीण विकास (Rural Dev)', mobile: '9931055566', assignedCenterCode: null },
  { id: 'o6', name: 'प्रियंका भारती (Priyanka Bharti)', designation: 'सहायक शिक्षक (Asst. Teacher)', department: 'शिक्षा विभाग (Education)', mobile: '8877665544', assignedCenterCode: null },
  { id: 'o7', name: 'संजय कुमार महतो (Sanjay Kr. Mahto)', designation: 'अंचल अधिकारी (CO)', department: 'राजस्व विभाग (Revenue)', mobile: '9470298877', assignedCenterCode: null },
  { id: 'o8', name: 'राजीव रंजन सिन्हा (Rajiv Ranjan Sinha)', designation: 'कृषि समन्वयक (Agriculture Coordinator)', department: 'कृषि विभाग (Agriculture)', mobile: '9334188722', assignedCenterCode: null },
  { id: 'o9', name: 'डॉ. अमित राज (Dr. Amit Raj)', designation: 'चिकित्सा पदाधिकारी (Medical Officer)', department: 'स्वास्थ्य विभाग (Health)', mobile: '9430077881', assignedCenterCode: null },
  { id: 'o10', name: 'सुधांशु शेखर (Sudhanshu Shekhar)', designation: 'सहायक यंत्री (Assistant Engineer)', department: 'जल संसाधन विभाग (Water Resource)', mobile: '9845112233', assignedCenterCode: null },
  { id: 'o11', name: 'रेणुका चौधरी (Renuka Choudhary)', designation: 'पंचायती राज पदाधिकारी (BPRO)', department: 'पंचायती राज (Panchayati Raj)', mobile: '7766112233', assignedCenterCode: null },
  { id: 'o12', name: 'धीरज कुमार पासवान (Dheeraj Kr. Paswan)', designation: 'सांख्यिकी सहायक (Statistical Asst.)', department: 'योजना विभाग (Planning)', mobile: '9934112244', assignedCenterCode: null },
  { id: 'o13', name: 'काजल गुप्ता (Kajal Gupta)', designation: 'श्रम प्रवर्तन पदाधिकारी (LEO)', department: 'श्रम संसाधन (Labour Resource)', mobile: '9123887744', assignedCenterCode: null },
  { id: 'o14', name: 'मनोज कुमार वर्णवाल (Manoj Kr. Barnwal)', designation: 'सहकारिता प्रसार पदाधिकारी (BCCO)', department: 'सहकारिता विभाग (Cooperative)', mobile: '9471122335', assignedCenterCode: null },
  { id: 'o15', name: 'रूबी नाज (Ruby Naz)', designation: 'सी० डी० पी० ओ० (CDPO)', department: 'समाज कल्याण (Social Welfare)', mobile: '9801223344', assignedCenterCode: null },
  { id: 'o16', name: 'अरविन्द कुमार मिश्र (Arvind Kr. Mishra)', designation: 'वरिष्ठ व्याख्याता (Senior Lecturer)', department: 'शिक्षा विभाग (Education)', mobile: '9431445566', assignedCenterCode: null },
  { id: 'o17', name: 'विशाल कुमार (Vishal Kumar)', designation: 'कर निरीक्षक (Tax Inspector)', department: 'नगर विकास (Urban Dev)', mobile: '9155223344', assignedCenterCode: null },
  { id: 'o18', name: 'अर्पना राय (Arpana Rai)', designation: 'थाना प्रभारी (SI)', department: 'गृह विभाग (Home Affairs)', mobile: '8051223344', assignedCenterCode: null },
  { id: 'o19', name: 'राजकुमार ठाकुर (Rajkumar Thakur)', designation: 'सहायक लेखपाल (Asst. Accountant)', department: 'वित्त विभाग (Finance)', mobile: '9905223344', assignedCenterCode: null },
  { id: 'o20', name: 'अजीत कुमार भारती (Ajeet Kr. Bharti)', designation: 'पशु चिकित्सा अधिकारी (VAS)', department: 'पशुपालन विभाग (Animal Husbandry)', mobile: '9430554433', assignedCenterCode: null },
  { id: 'o21', name: 'संजना कुमारी (Sanjana Kumari)', designation: 'सहायक निदेशक (Assistant Director)', department: 'सामाजिक सुरक्षा (Social Security)', mobile: '9570112233', assignedCenterCode: null },
  { id: 'o22', name: 'मुकुल कुमार देव (Mukul Kr. Dev)', designation: 'पर्यवेक्षक (Supervisor)', department: 'बाल विकास (ICDS)', mobile: '9334887722', assignedCenterCode: null },
  { id: 'o23', name: 'निधि सिन्हा (Nidhi Sinha)', designation: 'राजस्व कर्मचारी (Revenue Officer)', department: 'राजस्व विभाग (Revenue)', mobile: '9431877665', assignedCenterCode: null },
  { id: 'o24', name: 'कमल नयन झा (Kamal Nayan Jha)', designation: 'उच्च वर्गीय लिपिक (UDC)', department: 'योजना विभाग (Planning)', mobile: '9123445588', assignedCenterCode: null },
  { id: 'o25', name: 'अमन राज (Aman Raj)', designation: 'सहायक यंत्री (Assistant Engineer)', department: 'भवन निर्माण (Building Const)', mobile: '9470889922', assignedCenterCode: null }
];
