import React, { useState, useEffect, useRef } from 'react';

// ⚠️ QUAN TRỌNG: KHI BẠN DÁN CODE NÀY VÀO VS CODE, HÃY XÓA DẤU "//" Ở ĐẦU DÒNG DƯỚI ĐÂY NHÉ:
// import { createClient } from '@supabase/supabase-js';

import { 
  BookOpen, Users, FileText, Upload, Plus, LogOut, 
  CheckCircle, XCircle, PlayCircle, AlertTriangle, 
  ChevronRight, ArrowLeft, Eye, Layout, Trash2, Save, Cloud, 
  Link as LinkIcon, Download, GraduationCap
} from 'lucide-react';

// ==========================================
// ĐOẠN MÔ PHỎNG (CHỈ DÙNG ĐỂ XEM TRƯỚC TRÊN TRÌNH DUYỆT)
const createClient = (url, key) => ({
  auth: {
    getSession: () => Promise.resolve({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.resolve({ error: new Error('Đây là bản xem trước. Hãy chạy trên máy tính để đăng nhập thật!') }),
    signUp: () => Promise.resolve({ data: { user: { id: '1' } }, error: null }),
    signOut: () => Promise.resolve()
  },
  from: () => ({
    select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null }) }), then: (cb) => cb({ data: [] }) }),
    insert: () => Promise.resolve({ error: null })
  })
});
// ==========================================

// ==========================================
// ⚠️ DÁN URL VÀ KEY SUPABASE CỦA BẠN VÀO ĐÂY
// ==========================================
const SUPABASE_URL = 'https://dfffduygecpoalejrpfc.supabase.co/rest/v1/';
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
  const [enrollments, setEnrollments] = useState([]); // Ai đã tham gia lớp nào
  const [results, setResults] = useState([]); // Điểm số
  const [allUsers, setAllUsers] = useState([]); // Dùng để tra cứu tên học sinh
  
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', role: 'student' });
  const [isLoading, setIsLoading] = useState(false); 

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
      else {
        setCurrentUser(null);
        setCurrentView('login');
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
  };

  const navigate = (view, data = {}) => {
    if (data.cls) setSelectedClass(data.cls);
    if (data.exam) setSelectedExam(data.exam);
    setCurrentView(view);
  };

  const bypassLoginForDemo = () => {
    setCurrentUser({ id: 'demo_t1', name: 'Tài khoản Demo', role: 'teacher' });
    setSession(true);
    setCurrentView('dashboard');
  };

  if (isLoading) return <LoadingScreen />;

  if (!session || !currentUser) return <AuthScreen authMode={authMode} setAuthMode={setAuthMode} authForm={authForm} setAuthForm={setAuthForm} handleAuth={handleAuth} bypassLoginForDemo={bypassLoginForDemo} />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      {/* Ẩn Header khi in PDF */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shrink-0 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl cursor-pointer tracking-tight" onClick={() => navigate('dashboard')}>
            <Layout size={24} /> EduSheet
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-black text-gray-600 bg-gray-100 px-4 py-2 rounded-xl hidden sm:inline-block border border-gray-200">
              {currentUser.name} ({currentUser.role === 'teacher' ? 'Giáo viên' : 'Học sinh'})
            </span>
            <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition p-2 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {currentView === 'dashboard' && <Dashboard currentUser={currentUser} classes={classes} setClasses={setClasses} enrollments={enrollments} setEnrollments={setEnrollments} navigate={navigate} />}
        {currentView === 'class' && <ClassDetail currentUser={currentUser} cls={selectedClass} exams={exams.filter(e => e.classId === selectedClass.id)} enrollments={enrollments} allUsers={allUsers} results={results} navigate={navigate} />}
        {currentView === 'create_exam' && <ExamCreator cls={selectedClass} navigate={navigate} setExams={setExams} exams={exams} />}
        {currentView === 'exam_taker' && <ExamTaker exam={selectedExam} navigate={navigate} currentUser={currentUser} resultsState={results} setResultsState={setResults} />}
        {currentView === 'exam_result' && <ExamResult exam={selectedExam} results={selectedExam.results} navigate={navigate} />}
      </main>

      {/* CSS Dùng riêng cho việc xuất PDF */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-section, .print-section * { visibility: visible; }
          .print-section { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

// ================= COMPONENT CHỨC NĂNG =================

function Dashboard({ currentUser, classes, setClasses, enrollments, setEnrollments, navigate }) {
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  // TỰ ĐỘNG THAM GIA BẰNG LINK
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromLink = params.get('join');
    if (codeFromLink && currentUser.role === 'student') {
      handleJoinClass(codeFromLink.toUpperCase());
      // Xóa link sau khi join để tránh join lại khi F5
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Lọc lớp: GV thấy lớp mình tạo, HS thấy lớp mình ĐÃ JOIN
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

    // KTra xem đã join chưa
    const alreadyJoined = enrollments.some(e => e.class_id === found.id && e.student_id === currentUser.id);
    if (alreadyJoined) {
      navigate('class', { cls: found });
      return;
    }

    // Tham gia lớp
    const newEnroll = { id: 'en_' + Date.now(), class_id: found.id, student_id: currentUser.id };
    await supabase.from('edu_enrollments').insert([newEnroll]);
    setEnrollments([...enrollments, newEnroll]);
    navigate('class', { cls: found });
  };

  return (
    <div className="space-y-6">
      {/* Modal Tạo Lớp */}
      {showCreateClass && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-black mb-6">Tạo lớp học mới</h3>
            <input 
              type="text" placeholder="Nhập tên lớp..." 
              className="w-full border-2 border-gray-200 p-4 rounded-xl mb-6 outline-none focus:border-black font-medium transition"
              value={newClassName} onChange={(e) => setNewClassName(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreateClass(false)} className="px-6 py-3 rounded-xl bg-gray-100 font-bold hover:bg-gray-200 transition">Hủy</button>
              <button onClick={handleCreateClass} className="px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-gray-800 transition">Tạo Lớp</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-3xl font-black tracking-tight">Bảng tin Lớp học</h2>
        {currentUser.role === 'teacher' ? (
          <button onClick={() => setShowCreateClass(true)} className="bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold transition">
            <Plus size={18} /> Tạo lớp mới
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {isJoining ? (
              <div className="flex gap-2 w-full sm:w-auto">
                <input 
                  type="text" placeholder="Nhập mã lớp..." 
                  className="border-2 border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-black font-bold uppercase w-40"
                  value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                />
                <button onClick={() => handleJoinClass(joinCode)} className="bg-black text-white px-6 py-2 rounded-xl font-bold hover:bg-gray-800 transition">Vào</button>
                <button onClick={() => setIsJoining(false)} className="px-5 py-2 rounded-xl bg-gray-100 font-bold hover:bg-gray-200 transition">Hủy</button>
              </div>
            ) : (
              <button onClick={() => setIsJoining(true)} className="bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-gray-800 transition">
                <Plus size={18} /> Tham gia bằng mã
              </button>
            )}
          </div>
        )}
      </div>

      {myClasses.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-gray-200 shadow-sm">
          <BookOpen className="mx-auto text-gray-200 mb-4" size={64} />
          <p className="text-gray-500 font-bold text-lg mb-2">Bạn chưa có lớp học nào.</p>
          {currentUser.role === 'student' && <p className="text-gray-400 text-sm">Hãy xin mã lớp từ giáo viên hoặc bấm vào link chia sẻ để tham gia nhé!</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {myClasses.map(cls => (
            <div key={cls.id} onClick={() => navigate('class', { cls })} className="bg-white border border-gray-200 p-6 rounded-3xl hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 border border-blue-100">
                <BookOpen size={28} />
              </div>
              <h3 className="text-xl font-black mb-2 truncate text-gray-800">{cls.name}</h3>
              {currentUser.role === 'teacher' && (
                <p className="text-gray-500 text-sm mb-5 font-medium">Mã chia sẻ: <span className="font-mono font-bold bg-gray-100 text-black px-2 py-1 rounded-md">{cls.code}</span></p>
              )}
              <div className="flex items-center text-sm text-gray-400 font-bold group-hover:text-black transition-colors mt-4">
                Vào lớp <ChevronRight size={18} className="ml-1" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ClassDetail({ currentUser, cls, exams, enrollments, allUsers, results, navigate }) {
  const [activeTab, setActiveTab] = useState('exams'); // 'exams' | 'students'
  
  // Link mời tham gia lớp học
  const joinLink = `${window.location.origin}${window.location.pathname}?join=${cls.code}`;
  
  // Danh sách học sinh trong lớp
  const classStudents = enrollments
    .filter(e => e.class_id === cls.id)
    .map(e => allUsers.find(u => u.id === e.student_id))
    .filter(Boolean); // Lọc bỏ giá trị rỗng

  const copyLink = () => {
    navigator.clipboard.writeText(joinLink);
    alert('Đã copy link mời tham gia lớp!');
  };

  const exportPDF = () => {
    window.print(); // Gọi tính năng In của trình duyệt (Xuất PDF)
  };

  return (
    <div className="space-y-6 print-section">
      <button onClick={() => navigate('dashboard')} className="flex items-center text-sm text-gray-500 hover:text-black transition font-bold no-print">
        <ArrowLeft size={16} className="mr-1.5"/> Quay lại bảng tin
      </button>

      {/* Thông tin lớp */}
      <div className="bg-black text-white p-8 sm:p-10 rounded-[2rem] shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">{cls.name}</h1>
          {currentUser.role === 'teacher' && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-gray-400 font-medium text-sm">Mã tham gia: <span className="text-white font-mono font-bold bg-white/20 px-3 py-1.5 rounded-lg ml-1">{cls.code}</span></span>
              <button onClick={copyLink} className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-sm font-bold transition no-print">
                <LinkIcon size={14} /> Copy Link Mời
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs Menu (Chỉ giáo viên mới có tab Quản lý) */}
      {currentUser.role === 'teacher' && (
        <div className="flex gap-4 border-b border-gray-200 no-print">
          <button onClick={() => setActiveTab('exams')} className={`pb-3 font-black text-lg border-b-4 transition ${activeTab === 'exams' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            Bài tập & Đề thi
          </button>
          <button onClick={() => setActiveTab('students')} className={`pb-3 font-black text-lg border-b-4 transition flex items-center gap-2 ${activeTab === 'students' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            Quản lý học sinh <span className="bg-gray-100 text-black text-xs px-2 py-0.5 rounded-full">{classStudents.length}</span>
          </button>
        </div>
      )}

      {/* === TAB 1: BÀI TẬP VÀ ĐỀ THI === */}
      {activeTab === 'exams' && (
        <div className="space-y-6 no-print">
          {currentUser.role === 'teacher' && (
            <div className="flex justify-end">
              <button onClick={() => navigate('create_exam', { cls })} className="bg-black text-white px-5 py-2.5 rounded-xl flex items-center gap-2 hover:bg-gray-800 font-bold shadow-md transition">
                <Plus size={18} /> Soạn Bài mới
              </button>
            </div>
          )}
          <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm">
            {exams.length === 0 ? (
              <div className="p-16 text-center text-gray-400 font-bold text-lg">Chưa có bài tập nào.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {exams.map(exam => (
                  <div key={exam.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-gray-50 text-gray-600 rounded-2xl flex items-center justify-center shrink-0 border border-gray-200">
                        <FileText size={28} />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-gray-800 mb-1">{exam.title}</h3>
                        <p className="text-sm text-gray-500 font-bold">{exam.questions?.length || 0} câu hỏi</p>
                      </div>
                    </div>
                    {currentUser.role === 'student' ? (
                      <button onClick={() => navigate('exam_taker', { exam })} className="bg-black text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 shadow-md">
                        Làm bài
                      </button>
                    ) : (
                      <button className="text-gray-500 font-bold flex items-center gap-1.5 bg-gray-100 px-4 py-2 rounded-lg">
                        <Eye size={16} /> Xem
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* === TAB 2: QUẢN LÝ HỌC SINH & BẢNG ĐIỂM (CHỈ GIÁO VIÊN) === */}
      {activeTab === 'students' && currentUser.role === 'teacher' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center no-print">
            <h2 className="text-2xl font-black">Bảng điểm tổng hợp</h2>
            <button onClick={exportPDF} className="bg-white border-2 border-gray-200 px-4 py-2 rounded-xl flex items-center gap-2 hover:border-black font-bold transition">
              <Download size={16} /> Xuất file (PDF)
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm">
                    <th className="p-4 font-black border-b border-gray-200">Học sinh</th>
                    {exams.map(exam => (
                      <th key={exam.id} className="p-4 font-black border-b border-gray-200 whitespace-nowrap text-center">
                        {exam.title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {classStudents.length === 0 ? (
                    <tr><td colSpan={exams.length + 1} className="p-8 text-center text-gray-400 font-bold">Chưa có học sinh nào tham gia lớp.</td></tr>
                  ) : (
                    classStudents.map(student => (
                      <tr key={student.id} className="hover:bg-gray-50 transition">
                        <td className="p-4">
                          <div className="font-black text-gray-900">{student.name}</div>
                          <div className="text-xs text-gray-500 font-bold">{student.username}</div>
                        </td>
                        {exams.map(exam => {
                          // Tìm bài làm của học sinh này cho đề thi này
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

// ... CÁC COMPONENT SAU GIỮ NGUYÊN (ExamCreator, ExamResult) CHỈ SỬA LẠI ExamTaker ĐỂ LƯU KẾT QUẢ ...

function ExamCreator({ cls, navigate, setExams, exams }) {
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
    const newExam = { id: 'e_' + Date.now(), classId: cls.id, title, fileUrl: 'fake-url', questions };
    
    await supabase.from('edu_exams').insert([newExam]);
    setExams([...exams, newExam]);
    navigate('class', { cls });
    setIsSaving(false);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex justify-between">
        <button onClick={() => navigate('class', { cls })} className="text-gray-500 font-bold">Hủy tạo đề</button>
        <button onClick={handleSave} className="bg-black text-white px-8 py-3 rounded-xl font-bold">{isSaving ? 'Đang lưu...' : 'Lưu & Phát hành'}</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-3xl border shadow-sm">
           <label className="font-black text-sm uppercase">1. Tên bài kiểm tra</label>
           <input type="text" className="w-full border-2 p-3 rounded-xl mt-2 mb-6 font-bold" value={title} onChange={e => setTitle(e.target.value)} />
           <label className="font-black text-sm uppercase">2. Đính kèm File Đề (PDF)</label>
           <div className="border-2 border-dashed p-8 text-center mt-2 rounded-2xl">
              <input type="file" onChange={(e) => { if(e.target.files.length) setFileUploaded(true) }} />
           </div>
        </div>
        <div className="bg-white p-8 rounded-3xl border shadow-sm h-[75vh] flex flex-col">
          <h3 className="font-black text-sm uppercase mb-4">3. Thiết lập Phiếu Trả Lời</h3>
          <div className="flex gap-2 mb-4 border-b pb-4">
            <button onClick={() => addQuestion('mcq4')} className="bg-gray-100 px-3 py-2 rounded-lg font-bold text-sm">+ A-B-C-D</button>
            <button onClick={() => addQuestion('tf')} className="bg-gray-100 px-3 py-2 rounded-lg font-bold text-sm">+ Đúng/Sai</button>
            <button onClick={() => addQuestion('short')} className="bg-gray-100 px-3 py-2 rounded-lg font-bold text-sm">+ Điền đáp án</button>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
             {questions.map((q, i) => (
                <div key={q.id} className="p-4 bg-gray-50 border rounded-xl relative">
                  <button onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="absolute top-4 right-4 text-gray-400"><Trash2 size={16}/></button>
                  <h4 className="font-black mb-2">Câu {i + 1}</h4>
                  <input type="text" placeholder="Nhập đáp án đúng..." className="p-2 border rounded font-bold w-full mb-2" value={q.correct} onChange={e => updateQuestion(q.id, 'correct', e.target.value)} />
                  <input type="text" placeholder="Link video giải (tùy chọn)" className="p-2 border rounded text-sm w-full" value={q.videoUrl} onChange={e => updateQuestion(q.id, 'videoUrl', e.target.value)} />
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamTaker({ exam, navigate, currentUser, resultsState, setResultsState }) {
  const [answers, setAnswers] = useState({});
  const [cheatWarning, setCheatWarning] = useState(false);
  const [cheatCount, setCheatCount] = useState(0);

  useEffect(() => {
    const handleVis = () => { if (document.hidden) { setCheatWarning(true); setCheatCount(prev => prev + 1); } };
    document.addEventListener("visibilitychange", handleVis);
    window.addEventListener("blur", handleVis);
    return () => { document.removeEventListener("visibilitychange", handleVis); window.removeEventListener("blur", handleVis); };
  }, []);

  const submitExam = async () => {
    let score = 0;
    const questionsList = exam.questions || [];
    const details = questionsList.map(q => {
      const isCorrect = String(answers[q.id] || '').toLowerCase().trim() === String(q.correct).toLowerCase().trim();
      if (isCorrect) score++;
      return { questionId: q.id, userAnswer: answers[q.id] || '', isCorrect };
    });

    const results = { score, total: questionsList.length, details, cheatCount };
    
    // Lưu kết quả lên Supabase
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
    setResultsState([...resultsState, newResult]); // Cập nhật state ở App

    navigate('exam_result', { exam: { ...exam, results } });
  };

  return (
    <div className="h-[calc(100vh-64px)] flex bg-gray-100 overflow-hidden absolute inset-0 top-16">
      {cheatWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm text-center">
            <AlertTriangle size={64} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-black text-red-600 mb-2">Cảnh báo gian lận!</h3>
            <button onClick={() => setCheatWarning(false)} className="w-full bg-black text-white py-3 rounded-xl mt-4">Quay lại làm bài</button>
          </div>
        </div>
      )}
      <div className="w-2/3 p-4"><div className="bg-white rounded-3xl border h-full flex items-center justify-center text-gray-300 font-bold"><FileText size={64}/> Khu Vực PDF</div></div>
      <div className="w-1/3 bg-white border-l h-full flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-black text-lg">{exam.title}</h3>
          <button onClick={submitExam} className="bg-black text-white px-4 py-2 rounded-xl font-bold">NỘP BÀI</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {(exam.questions || []).map((q, i) => (
            <div key={q.id} className="p-4 border-2 rounded-xl">
              <h4 className="font-black mb-3">Câu {i + 1}</h4>
              <input type="text" placeholder="Nhập đáp án..." className="w-full border-2 p-3 rounded-lg font-bold" value={answers[q.id]||''} onChange={e=>setAnswers({...answers, [q.id]: e.target.value})}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExamResult({ exam, results, navigate }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <button onClick={() => navigate('class', { cls: { id: exam.classId } })} className="font-bold text-gray-500">Về Lớp học</button>
      <div className="bg-white border-2 p-10 rounded-3xl text-center">
        <h2 className="text-3xl font-black mb-4">KẾT QUẢ</h2>
        <div className="text-6xl font-black">{results.score}/{results.total}</div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="font-bold text-gray-600">Đang tải dữ liệu...</p>
    </div>
  );
}

function AuthScreen({ authMode, setAuthMode, authForm, setAuthForm, handleAuth, bypassLoginForDemo }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-black text-center mb-6">EduSheet</h1>
        <div className="space-y-4">
          {authMode === 'signup' && <input type="text" placeholder="Họ và tên" className="w-full border-2 p-4 rounded-xl font-bold" onChange={e=>setAuthForm({...authForm, name: e.target.value})}/>}
          <input type="email" placeholder="Email" className="w-full border-2 p-4 rounded-xl font-bold" onChange={e=>setAuthForm({...authForm, email: e.target.value})}/>
          <input type="password" placeholder="Mật khẩu" className="w-full border-2 p-4 rounded-xl font-bold" onChange={e=>setAuthForm({...authForm, password: e.target.value})}/>
          {authMode === 'signup' && (
             <div className="flex gap-4 p-4 bg-gray-100 rounded-xl justify-center">
               <label><input type="radio" name="role" checked={authForm.role==='student'} onChange={()=>setAuthForm({...authForm, role:'student'})}/> Học sinh</label>
               <label><input type="radio" name="role" checked={authForm.role==='teacher'} onChange={()=>setAuthForm({...authForm, role:'teacher'})}/> Giáo viên</label>
             </div>
          )}
          <button onClick={handleAuth} className="w-full bg-black text-white p-4 rounded-xl font-black">XÁC NHẬN</button>
          <button onClick={bypassLoginForDemo} className="w-full bg-gray-100 p-4 rounded-xl font-black text-gray-600 mt-2">VÀO DEMO NHANH</button>
        </div>
      </div>
    </div>
  );
}