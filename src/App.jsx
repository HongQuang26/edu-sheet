import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, FileText, Upload, Plus, LogOut, 
  CheckCircle, XCircle, PlayCircle, AlertTriangle, 
  ChevronRight, ArrowLeft, Eye, Layout, Trash2, Save, Database
} from 'lucide-react';

// --- TÍCH HỢP SUPABASE DATABASE ---
import { createClient } from '@supabase/supabase-js';

// ⚠️ HƯỚNG DẪN: THAY 2 DÒNG DƯỚI ĐÂY BẰNG THÔNG TIN SUPABASE CỦA BẠN
const SUPABASE_URL = 'https://dfffduygecpoalejrpfc.supabase.co/rest/v1/';
const SUPABASE_ANON_KEY = 'sb_publishable_DpFWusgFSZiedBWIMDkW6w_msH_DMyl';

// Kiểm tra xem người dùng đã điền Key chưa
const isSupabaseConfigured = SUPABASE_URL !== 'YOUR_SUPABASE_URL';
const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

export default function App() {
  const [isCloudReady, setIsCloudReady] = useState(isSupabaseConfigured);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login'); 
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  
  // Dữ liệu State
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '', name: '', role: 'student' });

  // 1. TẢI DỮ LIỆU TỪ SUPABASE KHI VÀO WEB
  useEffect(() => {
    if (!supabase) return;

    const fetchAllData = async () => {
      try {
        const { data: usersData } = await supabase.from('edu_users').select('*');
        if (usersData) setUsers(usersData);

        const { data: classesData } = await supabase.from('edu_classes').select('*');
        if (classesData) setClasses(classesData);

        const { data: examsData } = await supabase.from('edu_exams').select('*');
        if (examsData) setExams(examsData);
        
        setIsCloudReady(true);
      } catch (err) {
        console.error("Lỗi tải dữ liệu Supabase:", err);
      }
    };

    fetchAllData();
  }, []);

  // HÀM LƯU / CẬP NHẬT LÊN SUPABASE
  const saveToSupabase = async (tableName, data) => {
    if (!supabase) return; // Nếu chưa setup key, bỏ qua (để chạy demo)
    try {
      const { error } = await supabase.from(tableName).upsert(data);
      if (error) console.error("Lỗi lưu lên Supabase:", error);
    } catch (err) {
      console.error(err);
    }
  };

  const navigate = (view, data = {}) => {
    if (data.cls) setSelectedClass(data.cls);
    if (data.exam) setSelectedExam(data.exam);
    setCurrentView(view);
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentView('login');
  };

  // --- XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ ---
  const handleAuth = async () => {
    if (!authForm.username || !authForm.password) return alert('Vui lòng điền đủ tên đăng nhập và mật khẩu!');
    
    if (authMode === 'login') {
      const user = users.find(u => u.username === authForm.username && u.password === authForm.password);
      if (user) {
        setCurrentUser(user);
        navigate('dashboard');
      } else {
        alert('Sai tên đăng nhập hoặc mật khẩu!');
      }
    } else {
      if (!authForm.name) return alert('Vui lòng nhập họ và tên!');
      if (users.find(u => u.username === authForm.username)) return alert('Tên đăng nhập đã tồn tại!');
      
      const newUserId = (authForm.role === 'teacher' ? 't_' : 's_') + Date.now();
      const newUser = { id: newUserId, ...authForm };
      
      // Lưu State cục bộ (cho demo)
      setUsers([...users, newUser]);
      // Lưu lên Supabase
      await saveToSupabase('edu_users', newUser);
      
      setCurrentUser(newUser);
      navigate('dashboard');
    }
  };

  if (currentView === 'login') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative">
        <div className={`absolute top-4 right-4 flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold shadow-sm border ${isSupabaseConfigured ? 'text-green-600 bg-green-50 border-green-200' : 'text-orange-600 bg-orange-50 border-orange-200'}`}>
          <Database size={16} /> {isSupabaseConfigured ? 'Đã nối Supabase' : 'Chế độ Demo Cục bộ'}
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 max-w-md w-full">
          <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
            <Layout size={32} />
          </div>
          <h1 className="text-2xl font-black mb-2 text-center tracking-tight">EduSheet</h1>
          <p className="text-gray-500 mb-8 text-center font-medium">{authMode === 'login' ? 'Đăng nhập để vào lớp học' : 'Đăng ký tài khoản mới'}</p>
          
          <div className="space-y-4">
            {authMode === 'signup' && (
              <input 
                type="text" placeholder="Họ và tên (VD: Nguyễn Văn A)" 
                className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-black font-medium transition"
                value={authForm.name} onChange={(e) => setAuthForm({...authForm, name: e.target.value})}
              />
            )}
            <input 
              type="text" placeholder="Tên đăng nhập" 
              className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-black font-medium transition"
              value={authForm.username} onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
            />
            <input 
              type="password" placeholder="Mật khẩu" 
              className="w-full border-2 border-gray-200 p-3 rounded-xl outline-none focus:border-black font-medium transition"
              value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
            />
            
            {authMode === 'signup' && (
              <div className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200 justify-center">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="role" checked={authForm.role === 'student'} onChange={() => setAuthForm({...authForm, role: 'student'})} className="text-black focus:ring-black w-4 h-4" />
                  <span className="text-sm font-bold">Học sinh</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer ml-4">
                  <input type="radio" name="role" checked={authForm.role === 'teacher'} onChange={() => setAuthForm({...authForm, role: 'teacher'})} className="text-black focus:ring-black w-4 h-4" />
                  <span className="text-sm font-bold">Giáo viên</span>
                </label>
              </div>
            )}
            <button onClick={handleAuth} className="w-full py-3.5 px-4 bg-black text-white rounded-xl font-bold hover:bg-gray-800 shadow-md transition mt-2">
              {authMode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
          </div>
          <div className="mt-6 text-center text-sm text-gray-500 font-medium">
            {authMode === 'login' ? (
              <>Chưa có tài khoản? <button onClick={() => setAuthMode('signup')} className="text-black font-bold hover:underline">Đăng ký ngay</button></>
            ) : (
              <>Đã có tài khoản? <button onClick={() => setAuthMode('login')} className="text-black font-bold hover:underline">Đăng nhập</button></>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shrink-0 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl cursor-pointer tracking-tight" onClick={() => navigate('dashboard')}>
            <Layout size={24} /> EduSheet
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-600 bg-gray-100 px-4 py-1.5 rounded-full hidden sm:inline-block border border-gray-200">
              {currentUser.name} ({currentUser.role === 'teacher' ? 'Giáo viên' : 'Học sinh'})
            </span>
            <button onClick={logout} className="text-gray-500 hover:text-red-500 transition p-2 rounded-lg hover:bg-red-50" title="Đăng xuất">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {currentView === 'dashboard' && <Dashboard currentUser={currentUser} classes={classes} setClasses={setClasses} saveToSupabase={saveToSupabase} navigate={navigate} />}
        {currentView === 'class' && <ClassDetail currentUser={currentUser} cls={selectedClass} exams={exams.filter(e => e.classId === selectedClass.id)} navigate={navigate} />}
        {currentView === 'create_exam' && <ExamCreator cls={selectedClass} navigate={navigate} exams={exams} setExams={setExams} saveToSupabase={saveToSupabase} />}
        {currentView === 'exam_taker' && <ExamTaker exam={selectedExam} navigate={navigate} currentUser={currentUser} />}
        {currentView === 'exam_result' && <ExamResult exam={selectedExam} results={selectedExam.results} navigate={navigate} />}
      </main>
    </div>
  );
}

// ================= CÁC COMPONENT GIAO DIỆN =================

function Dashboard({ currentUser, classes, setClasses, saveToSupabase, navigate }) {
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const myClasses = currentUser.role === 'teacher' ? classes.filter(c => c.teacherId === currentUser.id) : classes; 

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return alert('Vui lòng nhập tên lớp!');
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newClass = { id: 'c_' + Date.now(), name: newClassName, code: newCode, teacherId: currentUser.id };
    
    setClasses([...classes, newClass]);
    await saveToSupabase('edu_classes', newClass); // Lưu Supabase
    
    setShowCreateClass(false);
    setNewClassName('');
  };

  const handleJoinClass = () => {
    const found = classes.find(c => c.code === joinCode);
    if (found) navigate('class', { cls: found });
    else alert('Mã lớp không chính xác!');
  };

  return (
    <div className="space-y-6">
      {/* Modal tạo lớp */}
      {showCreateClass && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl transform transition-all">
            <h3 className="text-2xl font-black mb-6">Tạo lớp học mới</h3>
            <input 
              type="text" placeholder="Nhập tên lớp (VD: Luyện thi Toán 12)" 
              className="w-full border-2 border-gray-200 p-4 rounded-xl mb-6 outline-none focus:border-black font-medium transition"
              value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreateClass(false)} className="px-6 py-3 rounded-xl bg-gray-100 font-bold hover:bg-gray-200 text-gray-700 transition">Hủy</button>
              <button onClick={handleCreateClass} className="px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-gray-800 shadow-lg transition">Tạo Lớp</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-black tracking-tight">Lớp học của bạn</h2>
        {currentUser.role === 'teacher' ? (
          <button onClick={() => setShowCreateClass(true)} className="bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-800 shadow-md font-bold transition">
            <Plus size={18} /> Tạo lớp mới
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {isJoining ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <input 
                  type="text" placeholder="Nhập mã lớp..." 
                  className="border-2 border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-black font-bold uppercase flex-1 sm:w-48 transition"
                  value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                />
                <button onClick={handleJoinClass} className="bg-black text-white px-6 py-2 rounded-xl font-bold shadow-md hover:bg-gray-800 transition">Vào</button>
                <button onClick={() => setIsJoining(false)} className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold hover:bg-gray-200 transition">Hủy</button>
              </div>
            ) : (
              <button onClick={() => setIsJoining(true)} className="bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-800 shadow-md font-bold transition">
                <Plus size={18} /> Tham gia bằng mã
              </button>
            )}
          </div>
        )}
      </div>

      {myClasses.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-200 shadow-sm">
          <BookOpen className="mx-auto text-gray-300 mb-4" size={56} />
          <p className="text-gray-500 font-bold text-lg">Bạn chưa có lớp học nào.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {myClasses.map(cls => (
            <div key={cls.id} onClick={() => navigate('class', { cls })} className="bg-white border border-gray-200 p-6 rounded-3xl hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-black group-hover:text-white transition-colors border border-gray-100">
                <BookOpen size={28} />
              </div>
              <h3 className="text-xl font-black mb-2 truncate text-gray-800">{cls.name}</h3>
              <p className="text-gray-500 text-sm mb-5 font-medium">Mã lớp: <span className="font-mono font-bold bg-gray-100 text-black px-2 py-1 rounded-md">{cls.code}</span></p>
              <div className="flex items-center text-sm text-gray-400 font-bold group-hover:text-black transition-colors">
                Vào lớp học <ChevronRight size={18} className="ml-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassDetail({ currentUser, cls, exams, navigate }) {
  return (
    <div className="space-y-6">
      <button onClick={() => navigate('dashboard')} className="flex items-center text-sm text-gray-500 hover:text-black transition font-bold">
        <ArrowLeft size={16} className="mr-1.5"/> Quay lại danh sách
      </button>

      <div className="bg-black text-white p-10 rounded-[2rem] flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 shadow-xl">
        <div>
          <h1 className="text-4xl font-black mb-3 tracking-tight">{cls.name}</h1>
          <p className="text-gray-400 font-medium">Mã chia sẻ cho học sinh: <span className="text-white font-mono font-bold bg-white/20 px-3 py-1.5 rounded-lg ml-2">{cls.code}</span></p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-10 mb-6 gap-4">
        <h2 className="text-2xl font-black tracking-tight">Bài tập & Đề thi</h2>
        {currentUser.role === 'teacher' && (
          <button 
            onClick={() => navigate('create_exam', { cls })}
            className="bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-800 font-bold shadow-md transition"
          >
            <Plus size={18} /> Tạo Bài tập mới
          </button>
        )}
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm">
        {exams.length === 0 ? (
          <div className="p-16 text-center text-gray-400 font-bold text-lg">Chưa có bài tập nào được giao cho lớp này.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {exams.map(exam => (
              <div key={exam.id} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
                    <FileText size={28} />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-gray-800 mb-1">{exam.title}</h3>
                    <p className="text-sm text-gray-500 font-bold">{(exam.questions || []).length} câu hỏi trắc nghiệm / tự luận</p>
                  </div>
                </div>
                {currentUser.role === 'student' ? (
                  <button onClick={() => navigate('exam_taker', { exam })} className="bg-black text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 w-full sm:w-auto shadow-md transition transform hover:-translate-y-0.5">
                    Bắt đầu làm bài
                  </button>
                ) : (
                  <button className="text-gray-500 hover:text-black text-sm font-bold flex items-center gap-1.5 bg-gray-100 px-4 py-2 rounded-lg transition">
                    <Eye size={16} /> Xem cấu trúc
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ExamCreator({ cls, navigate, exams, setExams, saveToSupabase }) {
  const [title, setTitle] = useState('');
  const [fileUploaded, setFileUploaded] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  const addQuestion = (type) => {
    const defaultCorrect = type === 'mcq4' ? 'A' : type === 'tf' ? 'Đúng' : '';
    setQuestions([...questions, { id: 'q_' + Date.now(), type, correct: defaultCorrect, videoUrl: '' }]);
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleSave = async () => {
    if (!title.trim()) return alert('Vui lòng nhập tiêu đề bài kiểm tra!');
    if (!fileUploaded) return alert('Vui lòng đính kèm file đề bài!');
    if (questions.length === 0) return alert('Vui lòng thêm ít nhất 1 câu hỏi!');

    setIsSaving(true);
    const newExam = {
      id: 'e_' + Date.now(),
      classId: cls.id,
      title,
      fileUrl: 'fake-url-for-demo',
      questions // Supabase cột kiểu JSONB lưu trực tiếp mảng Object
    };
    
    setExams([...exams, newExam]);
    await saveToSupabase('edu_exams', newExam); // Đẩy lên Supabase
    
    setIsSaving(false);
    navigate('class', { cls });
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate('class', { cls })} className="flex items-center text-sm text-gray-500 hover:text-black transition font-bold mb-2">
            <ArrowLeft size={16} className="mr-1.5"/> Hủy tạo đề
          </button>
          <h2 className="text-3xl font-black tracking-tight">Soạn Đề thi & Đáp án</h2>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="bg-black text-white px-8 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 shadow-xl disabled:bg-gray-400 transition">
          <Save size={20} /> {isSaving ? 'Đang lưu...' : 'Lưu và Phát hành'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CỘT TRÁI: UPLOAD ĐỀ */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm space-y-8">
          <div>
            <label className="block text-sm font-black text-gray-800 mb-3 uppercase tracking-wider">1. Tên bài kiểm tra</label>
            <input 
              type="text" placeholder="VD: Kiểm tra 15 phút Toán Đại số..." 
              className="w-full border-2 border-gray-200 p-4 rounded-xl outline-none focus:border-black font-bold text-lg transition"
              value={title} onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-800 mb-3 uppercase tracking-wider">2. Đính kèm File Đề (PDF)</label>
            <div className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${fileUploaded ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}>
              {fileUploaded ? (
                <div className="text-green-600 font-black flex flex-col items-center">
                  <CheckCircle className="mb-3" size={40}/> ĐÃ ĐÍNH KÈM FILE THÀNH CÔNG
                </div>
              ) : (
                <div>
                  <Upload className="mx-auto text-gray-400 mb-4" size={40} />
                  <p className="text-gray-500 text-sm font-medium mb-5">Học sinh sẽ xem file này khi làm bài</p>
                  <input 
                    type="file" id="actual-file-upload" className="hidden" accept=".pdf,.doc,.docx"
                    onChange={(e) => { if (e.target.files && e.target.files.length > 0) setFileUploaded(true); }}
                  />
                  <label htmlFor="actual-file-upload" className="bg-white border-2 border-gray-200 text-black px-6 py-3 rounded-xl text-sm font-bold cursor-pointer hover:border-black transition inline-block shadow-sm">
                    Mở File từ máy tính
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: TẠO PHIẾU ĐÁP ÁN */}
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col h-[75vh]">
          <h3 className="font-black text-sm uppercase tracking-wider text-gray-800 mb-4">3. Thiết lập Phiếu Trả Lời & Video Chữa Bài</h3>
          
          <div className="flex gap-2 mb-6 flex-wrap pb-4 border-b border-gray-100">
            <button onClick={() => addQuestion('mcq4')} className="bg-gray-100 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 flex items-center gap-1.5 transition text-gray-700"><Plus size={16}/> Chọn A-B-C-D</button>
            <button onClick={() => addQuestion('tf')} className="bg-gray-100 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 flex items-center gap-1.5 transition text-gray-700"><Plus size={16}/> Đúng / Sai</button>
            <button onClick={() => addQuestion('short')} className="bg-gray-100 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-200 flex items-center gap-1.5 transition text-gray-700"><Plus size={16}/> Điền đáp án</button>
          </div>

          <div className="flex-1 overflow-y-auto pr-3 space-y-5 custom-scrollbar">
            {questions.length === 0 ? (
              <div className="text-center text-gray-400 mt-20 font-bold">Hãy bấm các nút bên trên để thêm câu hỏi vào phiếu.</div>
            ) : (
              questions.map((q, index) => (
                <div key={q.id} className="p-5 border-2 border-gray-100 rounded-2xl bg-gray-50/50 relative group hover:border-gray-300 transition">
                  <button onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition"><Trash2 size={20}/></button>
                  <h4 className="font-black text-base text-gray-800 mb-4">Câu {index + 1} <span className="text-xs font-bold text-gray-400 ml-2 bg-white px-2 py-1 rounded-md border border-gray-200">({q.type === 'mcq4' ? 'Trắc nghiệm 4 Đ/A' : q.type === 'tf' ? 'Đúng/Sai' : 'Điền ngắn'})</span></h4>
                  
                  <div className="mb-4">
                    <label className="text-xs font-black text-gray-600 block mb-2 uppercase">Đáp án đúng chính xác:</label>
                    {q.type === 'mcq4' && (
                      <select className="p-2.5 border-2 border-gray-200 rounded-xl bg-white outline-none w-24 font-black text-lg focus:border-black transition" value={q.correct} onChange={e => updateQuestion(q.id, 'correct', e.target.value)}>
                        {['A','B','C','D'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}
                    {q.type === 'tf' && (
                      <select className="p-2.5 border-2 border-gray-200 rounded-xl bg-white outline-none w-28 font-black text-lg focus:border-black transition" value={q.correct} onChange={e => updateQuestion(q.id, 'correct', e.target.value)}>
                        {['Đúng','Sai'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    )}
                    {q.type === 'short' && (
                      <input type="text" className="p-3 border-2 border-gray-200 rounded-xl bg-white outline-none w-full font-black text-lg focus:border-black transition" placeholder="Nhập đáp án..." value={q.correct} onChange={e => updateQuestion(q.id, 'correct', e.target.value)} />
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-black text-gray-600 block mb-2 uppercase">Link Video (Google Drive) chữa câu này:</label>
                    <input type="text" className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white outline-none text-sm text-blue-600 font-medium focus:border-black transition" placeholder="Dán link Google Drive vào đây..." value={q.videoUrl} onChange={e => updateQuestion(q.id, 'videoUrl', e.target.value)} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamTaker({ exam, navigate }) {
  const [answers, setAnswers] = useState({});
  const [cheatWarning, setCheatWarning] = useState(false);
  const [cheatCount, setCheatCount] = useState(0);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setCheatWarning(true);
        setCheatCount(prev => prev + 1);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleVisibilityChange);
    };
  }, []);

  const handleSelect = (qId, val) => {
    setAnswers({ ...answers, [qId]: val });
  };

  const submitExam = () => {
    let score = 0;
    const details = exam.questions.map(q => {
      const userAnswer = answers[q.id] || '';
      const isCorrect = String(userAnswer).toLowerCase().trim() === String(q.correct).toLowerCase().trim();
      if (isCorrect) score++;
      return { questionId: q.id, userAnswer, isCorrect };
    });

    const results = { score, total: exam.questions.length, details, cheatCount };
    navigate('exam_result', { exam: { ...exam, results } });
  };

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col md:flex-row bg-gray-100 overflow-hidden absolute inset-0 top-16">
      {cheatWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl scale-in">
            <AlertTriangle size={64} className="text-red-500 mx-auto mb-5 animate-pulse" />
            <h3 className="text-2xl font-black text-red-600 mb-3">Cảnh báo gian lận!</h3>
            <p className="text-gray-600 mb-8 font-bold leading-relaxed">Hệ thống phát hiện bạn vừa rời khỏi màn hình thi (Lần thứ {cheatCount}).</p>
            <button onClick={() => setCheatWarning(false)} className="w-full bg-black text-white py-4 rounded-xl font-black text-lg hover:bg-gray-800 transition shadow-lg">
              ĐÃ HIỂU, QUAY LẠI
            </button>
          </div>
        </div>
      )}

      {/* KHU VỰC ĐỌC ĐỀ */}
      <div className="w-full md:w-3/5 lg:w-2/3 p-4 h-[50vh] md:h-full flex flex-col">
        <div className="bg-white rounded-3xl border border-gray-200 flex-1 flex items-center justify-center shadow-md relative overflow-hidden">
          <div className="text-center p-8">
            <FileText size={80} className="mx-auto text-gray-200 mb-6" />
            <h2 className="text-2xl font-black text-gray-400 mb-3 uppercase tracking-wider">Khu Vực Xem Đề (PDF)</h2>
          </div>
          <div className="absolute top-4 left-4 bg-gray-900 text-white px-4 py-1.5 rounded-lg text-xs font-black tracking-widest shadow-md">
            TRÌNH DUYỆT PDF
          </div>
        </div>
      </div>

      {/* KHU VỰC PHIẾU TRẢ LỜI */}
      <div className="w-full md:w-2/5 lg:w-1/3 bg-white border-l border-gray-200 h-[50vh] md:h-full flex flex-col shadow-2xl z-10 relative">
        <div className="p-5 border-b border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-black text-lg leading-tight text-gray-800 line-clamp-1">{exam.title}</h3>
            <span className="text-xs text-red-500 font-black flex items-center gap-1.5 mt-1.5"><div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div> Giám sát thi đang bật</span>
          </div>
          <button onClick={submitExam} className="bg-black text-white px-6 py-3 rounded-xl font-black hover:bg-gray-800 shadow-lg transform hover:-translate-y-0.5 transition">
            NỘP BÀI
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar bg-gray-50/30">
          {(exam.questions || []).map((q, index) => (
            <div key={q.id} className="p-5 border-2 border-gray-100 rounded-2xl bg-white shadow-sm hover:border-gray-300 transition">
              <h4 className="font-black text-gray-900 mb-4 text-lg">Câu {index + 1}</h4>
              
              {q.type === 'mcq4' && (
                <div className="flex gap-4 justify-center">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <button
                      key={opt} onClick={() => handleSelect(q.id, opt)}
                      className={`w-14 h-14 rounded-full border-2 font-black text-xl transition-all duration-200 ${answers[q.id] === opt ? 'bg-black text-white border-black scale-110 shadow-xl' : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:bg-gray-50'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'tf' && (
                <div className="flex gap-4 justify-center">
                  {['Đúng', 'Sai'].map(opt => (
                    <button
                      key={opt} onClick={() => handleSelect(q.id, opt)}
                      className={`flex-1 py-4 rounded-xl border-2 font-black text-lg transition-all duration-200 ${answers[q.id] === opt ? 'bg-black text-white border-black shadow-xl' : 'border-gray-200 text-gray-500 hover:border-gray-400 hover:bg-gray-50'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'short' && (
                <input 
                  type="text" placeholder="Gõ câu trả lời vào đây..." 
                  className="w-full border-2 border-gray-200 p-4 rounded-xl outline-none focus:border-black font-black text-center text-xl transition-colors shadow-inner bg-gray-50 focus:bg-white"
                  value={answers[q.id] || ''} onChange={(e) => handleSelect(q.id, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExamResult({ exam, results, navigate }) {
  const percentage = Math.round((results.score / results.total) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <button onClick={() => navigate('class', { cls: { id: exam.classId } })} className="flex items-center text-sm text-gray-500 hover:text-black transition font-bold">
        <ArrowLeft size={16} className="mr-1.5"/> Về giao diện Lớp học
      </button>

      <div className="bg-white border border-gray-200 p-10 rounded-[2.5rem] text-center shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-gray-900 to-black"></div>
        <h2 className="text-3xl font-black mb-8 tracking-tight">KẾT QUẢ KIỂM TRA</h2>
        <div className="inline-flex items-center justify-center w-40 h-40 rounded-full border-[12px] border-black text-6xl font-black mb-6 text-black">
          {results.score}/{results.total}
        </div>
        <p className="text-gray-500 font-black text-xl mb-3">TỈ LỆ CHÍNH XÁC: {percentage}%</p>
        
        {results.cheatCount > 0 && (
          <div className="bg-red-50 border border-red-200 inline-block px-5 py-3 rounded-xl mt-4">
            <p className="text-red-600 font-black flex items-center gap-2">
              <AlertTriangle size={18} /> Hệ thống ghi nhận {results.cheatCount} lần thoát khỏi màn hình làm bài!
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 mt-12 mb-6">
        <div className="w-2 h-8 bg-black rounded-full"></div>
        <h3 className="text-2xl font-black tracking-tight">Chi tiết & Video Chữa Bài</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {exam.questions.map((q, index) => {
          const detail = results.details.find(d => d.questionId === q.id);
          const isCorrect = detail.isCorrect;

          return (
            <div key={q.id} className={`bg-white border-2 p-6 rounded-3xl flex flex-col justify-between shadow-sm hover:shadow-md transition ${isCorrect ? 'border-green-200 bg-green-50/20' : 'border-red-200 bg-red-50/20'}`}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-black text-xl">Câu {index + 1}</h4>
                  {isCorrect ? <CheckCircle className="text-green-500 shrink-0" size={28} /> : <XCircle className="text-red-500 shrink-0" size={28} />}
                </div>
                
                <div className="text-base font-medium space-y-2 mb-6">
                  <p className="text-gray-600">Bạn đã chọn: <span className={`font-black ml-1 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{detail.userAnswer || '(Không điền)'}</span></p>
                  {!isCorrect && <p className="text-gray-600">Đáp án chính xác: <span className="font-black text-black ml-1 bg-gray-100 px-2 py-1 rounded">{q.correct}</span></p>}
                </div>
              </div>

              {q.videoUrl ? (
                <a 
                  href={q.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-5 py-3 rounded-xl text-sm font-black hover:bg-blue-100 hover:text-blue-800 transition"
                >
                  <PlayCircle size={20} /> XEM VIDEO CHỮA CÂU NÀY
                </a>
              ) : (
                <div className="mt-auto text-center text-xs text-gray-400 font-bold py-3 bg-gray-50 rounded-xl border border-gray-100">
                  GIÁO VIÊN KHÔNG ĐÍNH KÈM VIDEO
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}