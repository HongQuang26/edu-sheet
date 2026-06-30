import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js'; // BẢN CHÍNH THỨC 100%
import { 
  BookOpen, Users, FileText, Upload, Plus, LogOut, 
  CheckCircle, XCircle, PlayCircle, AlertTriangle, 
  ChevronRight, ArrowLeft, Eye, Layout, Trash2, Save, 
  Link as LinkIcon, Download, Clock, Calendar 
} from 'lucide-react';

// ==========================================
// ⚠️ BẠN HÃY DÁN URL VÀ KEY SUPABASE VÀO 2 DÒNG DƯỚI ĐÂY
// ==========================================
const SUPABASE_URL = 'https://dfffduygecpoalejrpfc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_DpFWusgFSZiedBWIMDkW6w_msH_DMyl';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); 
  const [currentView, setCurrentView] = useState('login'); 
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  
  // Dữ liệu toàn cục
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [enrollments, setEnrollments] = useState([]); 
  const [results, setResults] = useState([]); 
  const [allUsers, setAllUsers] = useState([]); 
  
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', role: 'student' });
  const [isLoading, setIsLoading] = useState(true);

  // 1. KIỂM TRA ĐĂNG NHẬP
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setCurrentUser(null);
        setCurrentView('login');
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. LẤY HỒ SƠ & TẢI DỮ LIỆU
  const fetchUserProfile = async (userId) => {
    setIsLoading(true);
    const { data } = await supabase.from('edu_users').select('*').eq('id', userId).single();
    if (data) {
      setCurrentUser(data);
      setCurrentView('dashboard');
      fetchData(); 
    }
    setIsLoading(false);
  };

  const fetchData = async () => {
    supabase.from('edu_classes').select('*').then(({data}) => data && setClasses(data));
    supabase.from('edu_exams').select('*').then(({data}) => data && setExams(data));
    supabase.from('edu_enrollments').select('*').then(({data}) => data && setEnrollments(data));
    supabase.from('edu_results').select('*').then(({data}) => data && setResults(data));
    supabase.from('edu_users').select('*').then(({data}) => data && setAllUsers(data));
  };

  // 3. XỬ LÝ ĐĂNG NHẬP / ĐĂNG KÝ
  const handleAuth = async () => {
    if (!authForm.email || !authForm.password) return alert('Vui lòng điền đủ Email và Mật khẩu!');
    setIsLoading(true);
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: authForm.email, password: authForm.password });
        if (error) throw error; 
      } else {
        if (!authForm.name) throw new Error('Vui lòng nhập họ và tên!');
        if (authForm.password.length < 6) throw new Error('Mật khẩu phải có ít nhất 6 ký tự!');
        
        const { data: authData, error: authError } = await supabase.auth.signUp({ email: authForm.email, password: authForm.password });
        if (authError) throw authError;

        if (authData.user) {
          const { error: dbError } = await supabase.from('edu_users').insert([{
            id: authData.user.id, username: authForm.email, name: authForm.name, role: authForm.role
          }]);
          if (dbError) throw dbError;
        }
        alert('Đăng ký thành công! Hãy đăng nhập nhé.');
        setAuthMode('login'); 
      }
    } catch (error) {
      alert(error.message || 'Có lỗi xảy ra!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut(); 
    setSession(null);
    setCurrentUser(null);
    setCurrentView('login');
    setIsLoading(false);
  };

  const navigate = (view, data = {}) => {
    if (data.cls) setSelectedClass(data.cls);
    if (data.exam) setSelectedExam(data.exam);
    setCurrentView(view);
  };

  if (isLoading) return <LoadingScreen />;
  if (!session || !currentUser) return <AuthScreen authMode={authMode} setAuthMode={setAuthMode} authForm={authForm} setAuthForm={setAuthForm} handleAuth={handleAuth} />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shrink-0 shadow-sm no-print animate-fade-in-down">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl cursor-pointer tracking-tight hover:scale-105 transition-transform" onClick={() => navigate('dashboard')}>
            <Layout size={24} /> EduSheet
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-black text-gray-600 bg-gray-100 px-4 py-2 rounded-xl hidden sm:inline-block border border-gray-200">
              {currentUser.name} ({currentUser.role === 'teacher' ? 'Giáo viên' : 'Học sinh'})
            </span>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100" title="Đăng xuất">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 relative">
        {currentView === 'dashboard' && <Dashboard currentUser={currentUser} classes={classes} setClasses={setClasses} enrollments={enrollments} setEnrollments={setEnrollments} navigate={navigate} supabase={supabase} />}
        {currentView === 'class' && <ClassDetail currentUser={currentUser} cls={selectedClass} exams={exams.filter(e => e.classId === selectedClass.id)} enrollments={enrollments} allUsers={allUsers} results={results} navigate={navigate} setExams={setExams} supabase={supabase} />}
        {currentView === 'create_exam' && <ExamCreator cls={selectedClass} navigate={navigate} setExams={setExams} exams={exams} supabase={supabase} />}
        {currentView === 'exam_taker' && <ExamTaker exam={selectedExam} navigate={navigate} currentUser={currentUser} resultsState={results} setResultsState={setResults} supabase={supabase} />}
        {currentView === 'exam_result' && <ExamResult exam={selectedExam} results={selectedExam.results} navigate={navigate} currentUser={currentUser} />}
      </main>

      {/* CSS Hiệu ứng */}
      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        .page-transition { animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-down { animation: fadeInDown 0.4s ease-out forwards; }
        .animate-pop { animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @media print { body * { visibility: hidden; } .print-section, .print-section * { visibility: visible; } .print-section { position: absolute; left: 0; top: 0; width: 100%; padding: 0; } .no-print { display: none !important; } }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}

// ================= CÁC COMPONENT GIAO DIỆN CON =================

function Dashboard({ currentUser, classes, setClasses, enrollments, setEnrollments, navigate, supabase }) {
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromLink = params.get('join');
    if (codeFromLink && currentUser.role === 'student') {
      handleJoinClass(codeFromLink.toUpperCase());
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const myClasses = currentUser.role === 'teacher' 
    ? classes.filter(c => c.teacherId === currentUser.id) 
    : classes.filter(c => enrollments.some(e => e.class_id === c.id && e.student_id === currentUser.id));

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return alert('Vui lòng nhập tên lớp!');
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newClass = { id: 'c_' + Date.now(), name: newClassName, code: newCode, teacherId: currentUser.id };
    await supabase.from('edu_classes').insert([newClass]);
    setClasses([...classes, newClass]);
    setShowCreateClass(false);
    setNewClassName('');
  };

  const handleJoinClass = async (codeToJoin = joinCode) => {
    const found = classes.find(c => c.code === codeToJoin);
    if (!found) return alert('Mã lớp không chính xác!');
    const alreadyJoined = enrollments.some(e => e.class_id === found.id && e.student_id === currentUser.id);
    if (alreadyJoined) { navigate('class', { cls: found }); return; }

    const newEnroll = { id: 'en_' + Date.now(), class_id: found.id, student_id: currentUser.id };
    await supabase.from('edu_enrollments').insert([newEnroll]);
    setEnrollments([...enrollments, newEnroll]);
    navigate('class', { cls: found });
  };

  return (
    <div className="space-y-6 page-transition">
      {/* Giao diện tạo/join lớp */}
      {showCreateClass && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-pop">
            <h3 className="text-2xl font-black mb-6">Tạo lớp học mới</h3>
            <input 
              type="text" placeholder="Nhập tên lớp..." 
              className="w-full border-2 border-gray-200 p-4 rounded-xl mb-6 outline-none focus:border-black font-medium transition-colors"
              value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreateClass(false)} className="px-6 py-3 rounded-xl bg-gray-100 font-bold hover:bg-gray-200 transition-colors">Hủy</button>
              <button onClick={handleCreateClass} className="px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-gray-800 transition-transform hover:scale-105 active:scale-95">Tạo Lớp</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-black tracking-tight">Bảng tin Lớp học</h2>
        {currentUser.role === 'teacher' ? (
          <button onClick={() => setShowCreateClass(true)} className="bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-gray-800 hover:-translate-y-1 transition-all shadow-md hover:shadow-lg">
            <Plus size={18} /> Tạo lớp mới
          </button>
        ) : (
          <div className="flex flex-wrap gap-2 animate-fade-in-down">
            {isJoining ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <input 
                  type="text" placeholder="Nhập mã lớp..." 
                  className="border-2 border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-black font-bold uppercase w-40 transition-colors"
                  value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                />
                <button onClick={() => handleJoinClass(joinCode)} className="bg-black text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-800 transition-transform hover:scale-105 active:scale-95">Vào</button>
                <button onClick={() => setIsJoining(false)} className="px-5 py-2 rounded-xl bg-gray-100 font-bold hover:bg-gray-200 transition-colors">Hủy</button>
              </div>
            ) : (
              <button onClick={() => setIsJoining(true)} className="bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-gray-800 hover:-translate-y-1 transition-all shadow-md hover:shadow-lg">
                <Plus size={18} /> Tham gia bằng mã
              </button>
            )}
          </div>
        )}
      </div>

      {myClasses.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-200 shadow-sm animate-pop">
          <BookOpen className="mx-auto text-gray-200 mb-4" size={64} />
          <p className="text-gray-500 font-bold text-lg mb-2">Bạn chưa có lớp học nào.</p>
          {currentUser.role === 'student' && <p className="text-gray-400 text-sm">Hãy xin mã lớp từ giáo viên hoặc bấm vào link chia sẻ để tham gia nhé!</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {myClasses.map((cls, idx) => (
            <div key={cls.id} onClick={() => navigate('class', { cls })} 
                 className="bg-white border border-gray-200 p-6 rounded-3xl hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group"
                 style={{ animationDelay: `${idx * 0.1}s` }}>
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 border border-blue-100 group-hover:scale-110 transition-transform duration-300">
                <BookOpen size={28} />
              </div>
              <h3 className="text-xl font-black mb-2 truncate text-gray-800">{cls.name}</h3>
              {currentUser.role === 'teacher' && (
                <p className="text-gray-500 text-sm mb-5 font-medium">Mã chia sẻ: <span className="font-mono font-bold bg-gray-100 text-black px-2 py-1 rounded-md">{cls.code}</span></p>
              )}
              <div className="flex items-center text-sm text-gray-400 font-bold group-hover:text-black transition-colors mt-4">
                Vào lớp <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassDetail({ currentUser, cls, exams, enrollments, allUsers, results, navigate, setExams, supabase }) {
  const [activeTab, setActiveTab] = useState('exams'); 
  const [extendingExam, setExtendingExam] = useState(null); // Trạng thái bài nào đang được gia hạn
  const [newDeadline, setNewDeadline] = useState(''); // Lưu thời gian mới

  const joinLink = `${window.location.origin}${window.location.pathname}?join=${cls.code}`;
  const classStudents = enrollments.filter(e => e.class_id === cls.id).map(e => allUsers.find(u => u.id === e.student_id)).filter(Boolean); 

  // Danh sách bài tập hiển thị (Loại bỏ các bài đã XÓA)
  const visibleExams = exams.filter(e => !e.is_hidden);

  const copyLink = () => { navigator.clipboard.writeText(joinLink); alert('Đã copy link mời tham gia lớp!'); };
  const exportPDF = () => { window.print(); };

  // XÓA ĐỀ THI VÀ XÓA FILE PDF
  const handleDeleteExam = async (exam) => {
    if(!window.confirm(`Bạn có chắc muốn xóa đề "${exam.title}" không? \nTệp PDF sẽ bị xóa vĩnh viễn để giải phóng dung lượng máy chủ.\n(Điểm của học sinh vẫn sẽ được giữ lại trong Bảng điểm).`)) return;

    // 1. Vào nhà kho (Storage) xé bỏ tờ giấy PDF
    if (exam.fileUrl && exam.fileUrl !== 'fake-url') {
      const fileName = exam.fileUrl.split('/').pop();
      await supabase.storage.from('exams').remove([fileName]);
    }

    // 2. Đánh dấu Đề thi này là "Đã xóa" và dọn dẹp fileUrl
    await supabase.from('edu_exams').update({ fileUrl: null, is_hidden: true }).eq('id', exam.id);
    
    // Cập nhật lại giao diện ngay lập tức
    setExams(prev => prev.map(e => e.id === exam.id ? { ...e, fileUrl: null, is_hidden: true } : e));
    alert('Đã dọn dẹp file và xóa bài tập thành công!');
  };

  // GIA HẠN THỜI GIAN
  const handleSaveDeadline = async () => {
    await supabase.from('edu_exams').update({ deadline: newDeadline }).eq('id', extendingExam.id);
    setExams(prev => prev.map(e => e.id === extendingExam.id ? { ...e, deadline: newDeadline } : e));
    setExtendingExam(null);
    setNewDeadline('');
  };

  return (
    <div className="space-y-6 print-section page-transition">
      <button onClick={() => navigate('dashboard')} className="flex items-center text-sm text-gray-500 hover:text-black transition-colors font-bold no-print group">
        <ArrowLeft size={16} className="mr-1.5 group-hover:-translate-x-1 transition-transform"/> Quay lại bảng tin
      </button>

      {/* Modal Gia Hạn Thời Gian */}
      {extendingExam && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity no-print">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-pop">
            <h3 className="text-2xl font-black mb-2">Gia hạn thời gian</h3>
            <p className="text-gray-500 font-bold mb-6 text-sm">Chỉnh sửa hạn nộp bài: <span className="text-black">{extendingExam.title}</span></p>
            
            <input 
              type="datetime-local" 
              className="w-full border-2 border-gray-200 p-4 rounded-xl mb-6 outline-none focus:border-black font-bold transition-colors bg-gray-50"
              value={newDeadline} onChange={(e) => setNewDeadline(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setExtendingExam(null)} className="px-6 py-3 rounded-xl bg-gray-100 font-bold hover:bg-gray-200 transition-colors">Hủy</button>
              <button onClick={handleSaveDeadline} className="px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-gray-800 transition-transform hover:scale-105 active:scale-95">Lưu thay đổi</button>
            </div>
          </div>
        </div>
      )}

      {/* Bảng tên lớp */}
      <div className="bg-black text-white p-8 sm:p-10 rounded-[2rem] shadow-xl relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">{cls.name}</h1>
          {currentUser.role === 'teacher' && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gray-400 font-medium text-sm">Mã tham gia: <span className="text-white font-mono font-bold bg-white/20 px-3 py-1.5 rounded-lg ml-1">{cls.code}</span></span>
              <button onClick={copyLink} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors no-print">
                <LinkIcon size={14} /> Copy Link Mời
              </button>
            </div>
          )}
        </div>
      </div>

      {currentUser.role === 'teacher' && (
        <div className="flex gap-4 border-b border-gray-200 no-print">
          <button onClick={() => setActiveTab('exams')} className={`pb-3 font-black text-lg border-b-4 transition-all duration-300 ${activeTab === 'exams' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            Bài tập & Đề thi
          </button>
          <button onClick={() => setActiveTab('students')} className={`pb-3 font-black text-lg border-b-4 transition-all duration-300 flex items-center gap-2 ${activeTab === 'students' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            Quản lý học sinh <span className={`text-xs px-2 py-0.5 rounded-full transition-colors ${activeTab === 'students' ? 'bg-black text-white' : 'bg-gray-100 text-black'}`}>{classStudents.length}</span>
          </button>
        </div>
      )}

      {/* --- TAB BÀI TẬP (Chỉ hiển thị bài chưa bị xóa) --- */}
      {activeTab === 'exams' && (
        <div className="space-y-6 no-print animate-fade-in-down">
          {currentUser.role === 'teacher' && (
            <div className="flex justify-end">
              <button onClick={() => navigate('create_exam', { cls })} className="bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-md hover:bg-gray-800 hover:-translate-y-1 transition-all">
                <Plus size={18} /> Soạn Bài mới
              </button>
            </div>
          )}
          <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm">
            {visibleExams.length === 0 ? (
              <div className="p-16 text-center text-gray-400 font-bold text-lg">Chưa có bài tập nào.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {visibleExams.map((exam) => {
                  const isExpired = exam.deadline && new Date(exam.deadline) < new Date();
                  const deadlineText = exam.deadline ? new Date(exam.deadline).toLocaleString('vi-VN') : 'Không giới hạn';

                  return (
                    <div key={exam.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors gap-4 group">
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border group-hover:scale-110 transition-transform ${isExpired ? 'bg-red-50 text-red-500 border-red-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {isExpired ? <Clock size={28} /> : <FileText size={28} />}
                        </div>
                        <div>
                          <h3 className="font-black text-lg text-gray-800 mb-1 group-hover:text-black transition-colors">{exam.title}</h3>
                          <div className="flex gap-4">
                            <p className="text-sm text-gray-500 font-bold">{exam.questions?.length || 0} câu hỏi</p>
                            <p className={`text-sm font-bold flex items-center gap-1 ${isExpired ? 'text-red-500' : 'text-blue-500'}`}>
                              <Calendar size={14}/> Hạn nộp: {deadlineText}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* KHU VỰC NÚT BẤM (HỌC SINH VÀ GIÁO VIÊN) */}
                      <div className="flex gap-2">
                        {currentUser.role === 'student' ? (
                          isExpired ? (
                            <button disabled className="bg-gray-200 text-gray-400 px-8 py-3 rounded-xl text-sm font-bold cursor-not-allowed">Đã hết hạn</button>
                          ) : (
                            <button onClick={() => navigate('exam_taker', { exam })} className="bg-black text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 hover:scale-105 shadow-md transition-all">Làm bài</button>
                          )
                        ) : (
                          // Nút công cụ dành cho Giáo viên
                          <>
                            <button onClick={() => {setExtendingExam(exam); setNewDeadline(exam.deadline || '');}} className="text-blue-600 font-bold flex items-center gap-1.5 bg-blue-50 px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-all hover:scale-105" title="Gia hạn thời gian">
                              <Clock size={16} /> Gia hạn
                            </button>
                            <button onClick={() => handleDeleteExam(exam)} className="text-red-500 font-bold flex items-center gap-1.5 bg-red-50 px-4 py-2.5 rounded-xl hover:bg-red-100 transition-all hover:scale-105" title="Xóa đề giải phóng dung lượng">
                              <Trash2 size={16} /> Xóa
                            </button>
                            <button onClick={() => navigate('exam_taker', { exam })} className="text-gray-600 font-bold flex items-center gap-1.5 bg-gray-100 px-4 py-2.5 rounded-xl hover:bg-gray-200 hover:text-black transition-all hover:scale-105" title="Xem thử giao diện học sinh">
                              <Eye size={16} /> Xem trước
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- TAB BẢNG ĐIỂM (Hiển thị CẢ BÀI ĐÃ XÓA) --- */}
      {activeTab === 'students' && currentUser.role === 'teacher' && (
        <div className="space-y-6 animate-fade-in-down">
          <div className="flex justify-between items-center no-print">
            <h2 className="text-2xl font-black">Bảng điểm tổng hợp</h2>
            <button onClick={exportPDF} className="bg-white border-2 border-gray-200 px-4 py-2 rounded-xl flex items-center gap-2 hover:border-black hover:bg-gray-50 font-bold transition-all hover:-translate-y-0.5">
              <Download size={16} /> Xuất file (PDF)
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm">
                    <th className="p-4 font-black border-b border-gray-200">Học sinh</th>
                    {exams.map(exam => (
                      <th key={exam.id} className="p-4 font-black border-b border-gray-200 whitespace-nowrap text-center min-w-[120px]">
                        {exam.title}
                        {exam.is_hidden && <div className="text-[10px] text-red-400 mt-1 uppercase tracking-wider">(Đã xóa PDF)</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classStudents.length === 0 ? (
                    <tr><td colSpan={exams.length + 1} className="p-8 text-center text-gray-400 font-bold">Chưa có học sinh nào tham gia lớp.</td></tr>
                  ) : (
                    classStudents.map(student => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div className="font-black text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-500 font-bold">{student.username}</div>
                        </td>
                        {exams.map(exam => {
                          const hsResult = results.find(r => r.exam_id === exam.id && r.student_id === student.id);
                          return (
                            <td key={exam.id} className="p-4 text-center font-bold">
                              {hsResult ? (
                                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg">
                                  {hsResult.score} / {hsResult.total}
                                </span>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExamCreator({ cls, navigate, setExams, exams, supabase }) {
  const [title, setTitle] = useState('');
  const [fileUploaded, setFileUploaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); 
  const [questions, setQuestions] = useState([]);
  const [deadline, setDeadline] = useState(''); // Đồng hồ hẹn giờ
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
    if (!fileUploaded || !selectedFile) return alert('Vui lòng đính kèm file đề bài (PDF)!');
    if (questions.length === 0) return alert('Vui lòng thêm ít nhất 1 câu hỏi!');

    setIsSaving(true);
    let finalFileUrl = '';
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `exam_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage.from('exams').upload(fileName, selectedFile);
    if (uploadError) { alert('Lỗi tải file: ' + uploadError.message); setIsSaving(false); return; }
    
    const { data: urlData } = supabase.storage.from('exams').getPublicUrl(fileName);
    finalFileUrl = urlData.publicUrl;

    // Lưu vào Database kèm deadline (hạn chót) và is_hidden mặc định là false
    const newExam = { 
      id: 'e_' + Date.now(), 
      classId: cls.id, 
      title, 
      fileUrl: finalFileUrl, 
      questions,
      deadline: deadline || null,
      is_hidden: false
    };
    
    await supabase.from('edu_exams').insert([newExam]);
    setExams([...exams, newExam]);
    navigate('class', { cls });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 pb-20 page-transition">
      <div className="flex justify-between items-center">
        <button onClick={() => navigate('class', { cls })} className="text-gray-500 font-bold hover:text-black transition-colors flex items-center gap-1 group">
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform"/> Hủy tạo đề
        </button>
        <button onClick={handleSave} disabled={isSaving} className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 hover:-translate-y-1 transition-all shadow-md disabled:bg-gray-400">
          {isSaving ? 'Đang lưu...' : 'Lưu & Phát hành'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md space-y-6">
           <div>
             <label className="font-black text-sm uppercase text-gray-700">1. Tên bài kiểm tra</label>
             <input type="text" className="w-full border-2 border-gray-200 p-4 rounded-xl mt-2 font-bold text-lg outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white" value={title} onChange={e => setTitle(e.target.value)} placeholder="Nhập tên bài..." />
           </div>

           <div>
             <label className="font-black text-sm uppercase text-gray-700">2. Hạn nộp bài (Tùy chọn)</label>
             <input type="datetime-local" className="w-full border-2 border-gray-200 p-4 rounded-xl mt-2 font-bold outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white" value={deadline} onChange={e => setDeadline(e.target.value)} />
             <p className="text-xs font-bold text-gray-400 mt-2">Bỏ trống nếu bạn không muốn giới hạn thời gian.</p>
           </div>
           
           <div>
             <label className="font-black text-sm uppercase text-gray-700">3. Đính kèm File Đề (PDF)</label>
             <div className={`border-2 border-dashed p-10 text-center mt-2 flex flex-col items-center rounded-2xl transition-colors duration-300 ${fileUploaded ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}>
                <input type="file" accept=".pdf" onChange={(e) => { 
                  if(e.target.files.length) {
                    setFileUploaded(true);
                    setSelectedFile(e.target.files[0]);
                  }
                }} className="cursor-pointer" />
                {fileUploaded && <span className="mt-3 font-bold text-green-600">Đã chọn: {selectedFile?.name}</span>}
             </div>
           </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm h-[75vh] flex flex-col transition-shadow hover:shadow-md">
          <h3 className="font-black text-sm uppercase mb-4 text-gray-700">4. Thiết lập Phiếu Trả Lời</h3>
          <div className="flex gap-2 mb-4 border-b border-gray-100 pb-4">
            <button onClick={() => addQuestion('mcq4')} className="bg-gray-100 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 hover:-translate-y-0.5 transition-all">+ A-B-C-D</button>
            <button onClick={() => addQuestion('tf')} className="bg-gray-100 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 hover:-translate-y-0.5 transition-all">+ Đúng/Sai</button>
            <button onClick={() => addQuestion('short')} className="bg-gray-100 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 hover:-translate-y-0.5 transition-all">+ Điền đáp án</button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
             {questions.length === 0 && <div className="text-center text-gray-400 font-bold mt-10">Chưa có câu hỏi nào. Bấm nút phía trên để thêm nhé!</div>}
             {questions.map((q, i) => (
                <div key={q.id} className="p-5 bg-gray-50 border border-gray-100 rounded-2xl relative animate-pop">
                  <button onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                  <h4 className="font-black mb-3 text-gray-800">Câu {i + 1}</h4>
                  <input type="text" placeholder="Nhập đáp án đúng..." className="p-3 border-2 border-gray-200 rounded-xl font-bold w-full mb-3 outline-none focus:border-black transition-colors" value={q.correct} onChange={e => updateQuestion(q.id, 'correct', e.target.value)} />
                  <input type="text" placeholder="Link video giải (tùy chọn)" className="p-3 border-2 border-gray-200 rounded-xl text-sm w-full outline-none focus:border-blue-500 transition-colors" value={q.videoUrl} onChange={e => updateQuestion(q.id, 'videoUrl', e.target.value)} />
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamTaker({ exam, navigate, currentUser, resultsState, setResultsState, supabase }) {
  const [answers, setAnswers] = useState({});
  const [cheatWarning, setCheatWarning] = useState(false);
  const [cheatCount, setCheatCount] = useState(0);

  useEffect(() => {
    const handleVis = () => { if (document.hidden) { setCheatWarning(true); setCheatCount(prev => prev + 1); } };
    document.addEventListener("visibilitychange", handleVis);
    window.addEventListener("blur", handleVis);
    return () => { document.removeEventListener("visibilitychange", handleVis); window.removeEventListener("blur", handleVis); };
  }, []);

  const handleSelect = (qId, val) => {
    setAnswers({ ...answers, [qId]: val });
  };

  const submitExam = async () => {
    let score = 0;
    const questionsList = exam.questions || [];
    const details = questionsList.map(q => {
      const isCorrect = String(answers[q.id] || '').toLowerCase().trim() === String(q.correct).toLowerCase().trim();
      if (isCorrect) score++;
      return { questionId: q.id, userAnswer: answers[q.id] || '', isCorrect };
    });

    const results = { score, total: questionsList.length, details, cheatCount };
    
    if (currentUser.role === 'student') {
      const newResult = {
        id: 'res_' + Date.now(),
        exam_id: exam.id,
        student_id: currentUser.id,
        class_id: exam.classId,
        score,
        total: questionsList.length,
        cheat_count: cheatCount,
        details
      };
      await supabase.from('edu_results').insert([newResult]);
      setResultsState([...resultsState, newResult]);
    }

    navigate('exam_result', { exam: { ...exam, results } });
  };

  return (
    <div className="h-[calc(100vh-64px)] flex bg-gray-100 overflow-hidden absolute inset-0 top-16 page-transition">
      {cheatWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 transition-opacity backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm text-center animate-pop shadow-2xl">
            <AlertTriangle size={64} className="text-red-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-2xl font-black text-red-600 mb-2">Cảnh báo gian lận!</h3>
            <p className="font-bold text-gray-600 mb-6">Bạn vừa thoát màn hình (Lần {cheatCount})</p>
            <button onClick={() => setCheatWarning(false)} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:scale-105 transition-transform active:scale-95">Quay lại làm bài</button>
          </div>
        </div>
      )}
      
      <div className="w-2/3 p-4">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm h-full flex flex-col items-center justify-center text-gray-300 font-bold hover:shadow-md transition-shadow relative overflow-hidden">
          {exam.fileUrl && exam.fileUrl !== 'fake-url' ? (
            <iframe src={exam.fileUrl} className="absolute inset-0 w-full h-full rounded-3xl" title="Đề thi PDF" />
          ) : (
            <>
              <FileText size={80} className="mb-4 text-gray-200" />
              <p className="mt-4">Đề thi này không có file đính kèm hoặc đã bị giáo viên dọn dẹp.</p>
            </>
          )}
        </div>
      </div>

      <div className="w-1/3 bg-white border-l border-gray-200 h-full flex flex-col shadow-2xl relative z-10">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <div>
             <h3 className="font-black text-lg text-gray-800 line-clamp-1">{exam.title}</h3>
             {currentUser.role === 'teacher' && <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full mt-1 inline-block">Chế độ xem trước (Không lưu điểm)</span>}
          </div>
          <button onClick={submitExam} className="bg-black text-white px-5 py-2.5 rounded-xl font-black hover:bg-gray-800 hover:-translate-y-0.5 transition-all shadow-md hover:shadow-lg">NỘP BÀI</button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50/50">
          {(exam.questions || []).map((q, i) => (
            <div key={q.id} className="p-5 border-2 border-gray-100 rounded-2xl bg-white shadow-sm hover:border-gray-300 transition-colors">
              <h4 className="font-black mb-4 text-gray-800">Câu {i + 1}</h4>
              
              {q.type === 'mcq4' && (
                <div className="flex gap-4 justify-center">
                  {['A', 'B', 'C', 'D'].map(opt => (
                    <button
                      key={opt} onClick={() => handleSelect(q.id, opt)}
                      className={`w-14 h-14 rounded-full border-2 font-black text-xl transition-all duration-300 ${answers[q.id] === opt ? 'bg-black text-white border-black scale-110 shadow-lg' : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-400'}`}
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
                      className={`flex-1 py-3 rounded-xl border-2 font-black text-lg transition-all duration-300 ${answers[q.id] === opt ? 'bg-black text-white border-black shadow-lg scale-105' : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-400'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
              {q.type === 'short' && (
                <input 
                  type="text" placeholder="Nhập đáp án..." 
                  className="w-full border-2 border-gray-200 p-4 rounded-xl font-black text-center text-xl outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white shadow-inner" 
                  value={answers[q.id]||''} onChange={e=>setAnswers({...answers, [q.id]: e.target.value})}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExamResult({ exam, results, navigate, currentUser }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10 page-transition">
      <button onClick={() => navigate('class', { cls: { id: exam.classId } })} className="font-bold text-gray-500 hover:text-black flex items-center gap-1.5 transition-colors group">
         <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Về Lớp học
      </button>
      
      <div className="bg-white border border-gray-200 p-12 rounded-[2.5rem] text-center shadow-xl relative overflow-hidden group hover:shadow-2xl transition-shadow">
        <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-gray-900 to-black"></div>
        <h2 className="text-3xl font-black mb-6 text-gray-800">KẾT QUẢ</h2>
        <div className="inline-flex items-center justify-center w-40 h-40 rounded-full border-[12px] border-black text-6xl font-black text-black group-hover:scale-110 transition-transform duration-500">
           {results.score}/{results.total}
        </div>
        {currentUser.role === 'teacher' && <p className="mt-6 font-bold text-orange-500 bg-orange-50 inline-block px-4 py-2 rounded-xl border border-orange-100">Bản làm thử (Không lưu vào bảng điểm)</p>}
      </div>

      <div className="flex items-center gap-3 mt-12 mb-6">
        <div className="w-2 h-8 bg-black rounded-full"></div>
        <h3 className="text-2xl font-black tracking-tight">Chi tiết & Video Chữa Bài</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {(exam.questions || []).map((q, index) => {
          const detail = results.details.find(d => d.questionId === q.id);
          const isCorrect = detail?.isCorrect;

          return (
            <div key={q.id} className={`bg-white border-2 p-6 rounded-3xl flex flex-col justify-between shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 ${isCorrect ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h4 className="font-black text-xl">Câu {index + 1}</h4>
                  {isCorrect ? <CheckCircle className="text-green-500 shrink-0" size={28} /> : <XCircle className="text-red-500 shrink-0" size={28} />}
                </div>
                <div className="text-base font-medium space-y-2 mb-6">
                  <p className="text-gray-600">Bạn đã chọn: <span className={`font-black ml-1 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{detail?.userAnswer || '(Không điền)'}</span></p>
                  {!isCorrect && <p className="text-gray-600">Đáp án chính xác: <span className="font-black text-black ml-1 bg-gray-100 px-2 py-1 rounded">{q.correct}</span></p>}
                </div>
              </div>

              {q.videoUrl ? (
                <a href={q.videoUrl} target="_blank" rel="noopener noreferrer" className="mt-auto inline-flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-5 py-3 rounded-xl text-sm font-black hover:bg-blue-600 hover:text-white transition-colors duration-300">
                  <PlayCircle size={20} /> XEM VIDEO CHỮA BÀI
                </a>
              ) : (
                <div className="mt-auto text-center text-xs text-gray-400 font-bold py-3 bg-gray-50 rounded-xl border border-gray-100">
                  KHÔNG CÓ VIDEO
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold text-gray-600 animate-pulse">Đang tải dữ liệu...</p>
    </div>
  );
}

function AuthScreen({ authMode, setAuthMode, authForm, setAuthForm, handleAuth }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-2xl w-full max-w-md animate-pop border border-gray-100">
        <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6 transform rotate-3 hover:rotate-6 transition-transform">
           <Layout size={32} />
        </div>
        <h1 className="text-3xl font-black text-center mb-2 tracking-tight">EduSheet</h1>
        <p className="text-gray-500 font-bold text-center mb-8">{authMode === 'login' ? 'Đăng nhập an toàn' : 'Tạo tài khoản mới'}</p>
        
        <div className="space-y-4">
          {authMode === 'signup' && <input type="text" placeholder="Họ và tên" className="w-full border-2 border-gray-200 p-4 rounded-xl font-bold outline-none focus:border-black bg-gray-50 focus:bg-white transition-colors" onChange={e=>setAuthForm({...authForm, name: e.target.value})}/>}
          <input type="email" placeholder="Email" className="w-full border-2 border-gray-200 p-4 rounded-xl font-bold outline-none focus:border-black bg-gray-50 focus:bg-white transition-colors" onChange={e=>setAuthForm({...authForm, email: e.target.value})}/>
          <input type="password" placeholder="Mật khẩu" className="w-full border-2 border-gray-200 p-4 rounded-xl font-bold outline-none focus:border-black bg-gray-50 focus:bg-white transition-colors" onChange={e=>setAuthForm({...authForm, password: e.target.value})}/>
          
          {authMode === 'signup' && (
             <div className="flex gap-4 p-4 bg-gray-100 rounded-xl justify-center mt-2 border border-gray-200">
               <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="role" checked={authForm.role==='student'} onChange={()=>setAuthForm({...authForm, role:'student'})} className="w-5 h-5 text-black accent-black"/> 
                 <span className="font-black text-sm">Học sinh</span>
               </label>
               <label className="flex items-center gap-2 cursor-pointer ml-4">
                 <input type="radio" name="role" checked={authForm.role==='teacher'} onChange={()=>setAuthForm({...authForm, role:'teacher'})} className="w-5 h-5 text-black accent-black"/> 
                 <span className="font-black text-sm">Giáo viên</span>
               </label>
             </div>
          )}
          <button onClick={handleAuth} className="w-full bg-black text-white p-4 rounded-xl font-black text-lg hover:bg-gray-800 hover:-translate-y-1 transition-all shadow-lg mt-4">
            {authMode === 'login' ? 'ĐĂNG NHẬP' : 'TẠO TÀI KHOẢN'}
          </button>
        </div>

        <div className="mt-8 text-center text-sm font-bold text-gray-500">
           {authMode === 'login' ? (
             <>Chưa có tài khoản? <button onClick={() => setAuthMode('signup')} className="text-black font-black hover:underline">Đăng ký ngay</button></>
           ) : (
             <>Đã có tài khoản? <button onClick={() => setAuthMode('login')} className="text-black font-black hover:underline">Đăng nhập</button></>
           )}
        </div>
      </div>
    </div>
  );
}