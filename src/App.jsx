import React, { useState, useEffect } from 'react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { 
  BookOpen, Users, FileText, Upload, Plus, LogOut, 
  CheckCircle, XCircle, PlayCircle, AlertTriangle, 
  ChevronRight, ArrowLeft, Eye, Layout, Trash2, Save, 
  Link as LinkIcon, Download, Clock, Calendar, ShieldAlert, 
  UserMinus, Info, Flag, BarChart3, Trophy, TrendingUp, Medal, Star, Award
} from 'lucide-react';

// ==========================================
// KẾT NỐI SUPABASE CHÍNH THỨC CỦA BẠN
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
  
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [enrollments, setEnrollments] = useState([]); 
  const [results, setResults] = useState([]); 
  const [allUsers, setAllUsers] = useState([]); 
  
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '', role: 'student', remember: true });
  const [isLoading, setIsLoading] = useState(true);

  // --- HỆ THỐNG THÔNG BÁO MƯỢT MÀ ---
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const showConfirm = (message, onConfirm) => {
    setConfirmDialog({ 
      message, 
      onConfirm: async () => { 
        await onConfirm(); 
        setConfirmDialog(null); 
      } 
    });
  };

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
    const { data } = await supabase.from('edu_users').select('*').eq('id', userId).single();
    if (data) {
      setCurrentUser(data);
      setCurrentView(prevView => prevView === 'login' ? 'dashboard' : prevView);
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
    if (!authForm.email || !authForm.password) return showToast('Vui lòng điền đủ Email và Mật khẩu!', 'error');
    setIsLoading(true);
    try {
      if (authMode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email: authForm.email, password: authForm.password });
        if (error) throw error; 
        showToast('Đăng nhập thành công!', 'success');
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
        showToast('Đăng ký thành công! Hãy đăng nhập nhé.', 'success');
        setAuthMode('login'); 
      }
    } catch (error) {
      showToast(error.message || 'Có lỗi xảy ra!', 'error');
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
    showToast('Đã đăng xuất an toàn.', 'info');
  };

  const navigate = (view, data = {}) => {
    if (data.cls) setSelectedClass(data.cls);
    if (data.exam) setSelectedExam(data.exam);
    setCurrentView(view);
  };

  if (isLoading) return <LoadingScreen />;
  if (!session || !currentUser) return (
    <>
      <Toast toast={toast} />
      <AuthScreen authMode={authMode} setAuthMode={setAuthMode} authForm={authForm} setAuthForm={setAuthForm} handleAuth={handleAuth} />
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
      <Toast toast={toast} />
      <ConfirmModal confirmDialog={confirmDialog} setConfirmDialog={setConfirmDialog} />

      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40 shrink-0 shadow-sm no-print animate-fade-in-down">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-black text-xl cursor-pointer tracking-tight hover:scale-105 transition-transform" onClick={() => navigate('dashboard')}>
            <Layout size={24} /> EduSheet
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-black text-gray-600 bg-gray-100 px-4 py-2 rounded-xl hidden sm:inline-block border border-gray-200">
              {currentUser.name} ({currentUser.role === 'teacher' ? 'Giáo viên' : 'Học sinh'})
            </span>
            <button onClick={() => showConfirm('Bạn có chắc chắn muốn đăng xuất?', handleLogout)} className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-xl hover:bg-red-50 border border-transparent hover:border-red-100" title="Đăng xuất">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 relative">
        {currentView === 'dashboard' && <Dashboard currentUser={currentUser} classes={classes} setClasses={setClasses} enrollments={enrollments} setEnrollments={setEnrollments} navigate={navigate} supabase={supabase} showToast={showToast} showConfirm={showConfirm} results={results} exams={exams} allUsers={allUsers} />}
        {currentView === 'class' && <ClassDetail currentUser={currentUser} cls={selectedClass} exams={exams.filter(e => e.classId === selectedClass.id)} enrollments={enrollments} setEnrollments={setEnrollments} allUsers={allUsers} results={results} navigate={navigate} setExams={setExams} supabase={supabase} showToast={showToast} showConfirm={showConfirm} />}
        {currentView === 'create_exam' && <ExamCreator cls={selectedClass} navigate={navigate} setExams={setExams} exams={exams} supabase={supabase} showToast={showToast} />}
        {currentView === 'exam_taker' && <ExamTaker exam={selectedExam} navigate={navigate} currentUser={currentUser} resultsState={results} setResultsState={setResults} supabase={supabase} showToast={showToast} />}
        {currentView === 'exam_result' && <ExamResult exam={selectedExam} results={selectedExam.results} navigate={navigate} currentUser={currentUser} />}
      </main>

      {/* DẤU ẤN NHÀ PHÁT TRIỂN (BÊN TRONG ỨNG DỤNG) */}
      <footer className="py-6 text-center text-sm font-bold text-gray-400 no-print border-t border-gray-200 mt-auto bg-gray-50/80">
        <p>
          Được thiết kế và phát triển bởi <span className="text-black font-black hover:underline cursor-pointer transition-colors" title="Nhà phát triển hệ thống">TÊN CỦA BẠN</span>
        </p>
        <p className="text-xs mt-1.5 font-medium">EduSheet © 2026 - Nền tảng Giáo dục Tối giản</p>
      </footer>

      <style>{`
        @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.95); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(50px); } to { opacity: 1; transform: translateX(0); } }
        
        .page-transition { animation: fadeSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in-down { animation: fadeInDown 0.4s ease-out forwards; }
        .animate-pop { animation: popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-toast { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @media print { body * { visibility: hidden; } .print-section, .print-section * { visibility: visible; } .print-section { position: absolute; left: 0; top: 0; width: 100%; padding: 0; } .no-print { display: none !important; } }
        html { scroll-behavior: smooth; }
      `}</style>
    </div>
  );
}

// ================= COMPONENT TIỆN ÍCH =================
function Toast({ toast }) {
  if (!toast) return null;
  const bgColors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
  return (
    <div className={`fixed bottom-6 right-6 ${bgColors[toast.type]} text-white px-6 py-4 rounded-2xl shadow-2xl z-[200] animate-toast font-bold flex items-center gap-3 border border-white/20`}>
      {toast.type === 'success' ? <CheckCircle size={20} /> : toast.type === 'error' ? <AlertTriangle size={20} /> : <Info size={20} />}
      {toast.message}
    </div>
  );
}

function ConfirmModal({ confirmDialog, setConfirmDialog }) {
  if (!confirmDialog) return null;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-pop text-center">
        <AlertTriangle size={56} className="text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-black mb-6 text-gray-800 leading-tight">{confirmDialog.message}</h3>
        <div className="flex gap-3 justify-center">
          <button onClick={() => setConfirmDialog(null)} className="px-6 py-3 rounded-xl bg-gray-100 font-bold hover:bg-gray-200 transition-colors flex-1">Hủy</button>
          <button onClick={confirmDialog.onConfirm} className="px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors flex-1 shadow-md">Đồng ý</button>
        </div>
      </div>
    </div>
  );
}

// ================= CÁC COMPONENT GIAO DIỆN CON =================

function Dashboard({ currentUser, classes, setClasses, enrollments, setEnrollments, navigate, supabase, showToast, showConfirm, results, exams, allUsers }) {
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  // ----------------------------------------------------
  // DỮ LIỆU THỐNG KÊ (DÀNH CHO HỌC SINH)
  // ----------------------------------------------------
  const myResults = results?.filter(r => r.student_id === currentUser.id) || [];
  const totalExamsTaken = myResults.length;
  const avgScore = totalExamsTaken > 0 
    ? (myResults.reduce((acc, curr) => acc + (curr.score / curr.total) * 10, 0) / totalExamsTaken).toFixed(1)
    : 0;

  const studentStats = allUsers?.filter(u => u.role === 'student').map(student => {
    const stuResults = results?.filter(r => r.student_id === student.id) || [];
    const avg = stuResults.length > 0
        ? stuResults.reduce((acc, curr) => acc + (curr.score / curr.total) * 10, 0) / stuResults.length
        : 0;
    return { ...student, avg, totalExams: stuResults.length };
  }).filter(s => s.totalExams > 0).sort((a, b) => b.avg - a.avg) || [];

  const myRank = studentStats.findIndex(s => s.id === currentUser.id) + 1;
  const topStudents = studentStats.slice(0, 5);
  const chartData = myResults.slice(-10);

  // ----------------------------------------------------
  // DỮ LIỆU THỐNG KÊ MỚI (DÀNH CHO GIÁO VIÊN)
  // ----------------------------------------------------
  const myClasses = currentUser.role === 'teacher' 
    ? classes.filter(c => c.teacherId === currentUser.id) 
    : classes.filter(c => enrollments.some(e => e.class_id === c.id && e.student_id === currentUser.id));

  // Gom nhóm các lớp của giáo viên
  const myClassIds = myClasses.map(c => c.id);
  
  // Tính tổng số học sinh duy nhất trong tất cả các lớp
  const uniqueStudentsCount = new Set(enrollments.filter(e => myClassIds.includes(e.class_id)).map(e => e.student_id)).size;
  // Tính tổng số đề thi đã tạo (không tính đề bị ẩn)
  const teacherExamsCount = exams.filter(e => myClassIds.includes(e.classId) && !e.is_hidden).length;
  // Tính tổng số lượt nộp bài của học sinh
  const teacherResults = results.filter(r => myClassIds.includes(r.class_id));
  
  // Radar quét kẻ địch (Lấy top 5 gian lận mới nhất)
  const cheatIncidents = teacherResults
    .filter(r => r.cheat_count > 0)
    .sort((a, b) => {
      // Lấy thời gian từ ID (vd: res_1699999999) để xếp mới nhất lên đầu
      const timeA = parseInt(a.id.split('_')[1]) || 0;
      const timeB = parseInt(b.id.split('_')[1]) || 0;
      return timeB - timeA;
    })
    .slice(0, 5)
    .map(r => {
      const student = allUsers.find(u => u.id === r.student_id);
      const exam = exams.find(e => e.id === r.exam_id);
      const cls = classes.find(c => c.id === r.class_id);
      return { 
        ...r, 
        studentName: student?.name || 'Học sinh ẩn danh', 
        examTitle: exam?.title || 'Bài thi đã xóa', 
        className: cls?.name || 'Lớp đã xóa' 
      };
    });


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeFromLink = params.get('join');
    if (codeFromLink && currentUser.role === 'student') {
      handleJoinClass(codeFromLink.toUpperCase());
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleCreateClass = async () => {
    if (!newClassName.trim()) return showToast('Vui lòng nhập tên lớp!', 'error');
    const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const newClass = { id: 'c_' + Date.now(), name: newClassName, code: newCode, teacherId: currentUser.id };
    await supabase.from('edu_classes').insert([newClass]);
    setClasses([...classes, newClass]);
    setShowCreateClass(false);
    setNewClassName('');
    showToast('Đã tạo lớp học thành công!');
  };

  const handleJoinClass = async (codeToJoin = joinCode) => {
    const found = classes.find(c => c.code === codeToJoin);
    if (!found) return showToast('Mã lớp không chính xác!', 'error');
    const alreadyJoined = enrollments.some(e => e.class_id === found.id && e.student_id === currentUser.id);
    if (alreadyJoined) { navigate('class', { cls: found }); return; }

    const newEnroll = { id: 'en_' + Date.now(), class_id: found.id, student_id: currentUser.id };
    await supabase.from('edu_enrollments').insert([newEnroll]);
    setEnrollments([...enrollments, newEnroll]);
    showToast(`Chào mừng bạn đến với lớp ${found.name}!`);
    navigate('class', { cls: found });
  };

  const handleDeleteClass = (e, classObj) => {
    e.stopPropagation(); 
    showConfirm(`CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn lớp "${classObj.name}" không?\nMọi dữ liệu liên quan sẽ bị ẩn đi.`, async () => {
      await supabase.from('edu_classes').delete().eq('id', classObj.id);
      setClasses(prev => prev.filter(c => c.id !== classObj.id));
      showToast('Đã xóa lớp thành công!');
    });
  };

  return (
    <>
      {showCreateClass && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm transition-opacity">
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

      <div className="space-y-8 page-transition">
        
        {/* TÍNH NĂNG MỚI: BẢNG TỔNG KẾT VÀ THỐNG KÊ (CHỈ DÀNH CHO HỌC SINH) */}
        {currentUser.role === 'student' && (
          <div className="space-y-6">
            {/* 3 Thẻ Chỉ số */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-3xl p-6 text-gray-900 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all">
                <BarChart3 className="absolute top-4 right-4 text-gray-100 group-hover:text-gray-200 transition-colors" size={80} />
                <h3 className="font-bold text-gray-500 mb-1 relative z-10">Điểm Trung Bình</h3>
                <div className="text-5xl font-black relative z-10">{avgScore} <span className="text-2xl text-gray-400">/10</span></div>
              </div>
              <div className="bg-white border border-gray-200 rounded-3xl p-6 text-gray-900 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all">
                <CheckCircle className="absolute top-4 right-4 text-gray-100 group-hover:text-gray-200 transition-colors" size={80} />
                <h3 className="font-bold text-gray-500 mb-1 relative z-10">Tổng Số Bài Đã Làm</h3>
                <div className="text-5xl font-black relative z-10">{totalExamsTaken}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-3xl p-6 text-gray-900 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all">
                <Trophy className="absolute top-4 right-4 text-gray-100 group-hover:text-gray-200 transition-colors" size={80} />
                <h3 className="font-bold text-gray-500 mb-1 relative z-10">Thứ Hạng (Server)</h3>
                <div className="text-5xl font-black relative z-10">{myRank > 0 ? `#${myRank}` : '-'}</div>
              </div>
            </div>

            {/* Biểu đồ & BXH */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Biểu đồ học tập */}
              <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="text-black" />
                  <h3 className="text-xl font-black text-gray-800">Biểu đồ Tiến độ</h3>
                </div>
                {chartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-gray-400 font-bold bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">Bạn chưa làm bài nào. Khởi động ngay thôi!</div>
                ) : (
                  <div className="flex items-end gap-3 sm:gap-6 h-56 mt-4 border-b-2 border-gray-100 pb-2 overflow-x-auto pt-8">
                    {chartData.map((r, i) => {
                      const heightPercent = (r.score / r.total) * 100;
                      const examInfo = exams.find(e => e.id === r.exam_id);
                      const displayScore = ((r.score / r.total) * 10).toFixed(1);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center justify-end group min-w-[40px] h-full">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-black mb-2 text-black bg-gray-100 px-2 py-1 rounded-md">{displayScore}</div>
                          <div className="w-full max-w-[40px] bg-gradient-to-t from-gray-900 to-gray-700 rounded-t-xl transition-all duration-500 shadow-md group-hover:from-black group-hover:to-gray-800 relative overflow-hidden" style={{ height: `${heightPercent}%` }}>
                             <div className="absolute top-0 left-0 w-full h-2 bg-white/20"></div>
                          </div>
                          <div className="text-[10px] mt-3 text-gray-400 font-bold truncate w-full text-center group-hover:text-black transition-colors" title={examInfo?.title}>{examInfo?.title || 'Bài thi'}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Bảng Vàng (Leaderboard) */}
              <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="text-black" />
                  <h3 className="text-xl font-black text-gray-800">Bảng Vàng </h3>
                </div>
                {topStudents.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400 font-bold">Chưa có ai ghi danh...</div>
                ) : (
                  <div className="space-y-4">
                    {topStudents.map((s, index) => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors border border-gray-100 relative overflow-hidden">
                        {index === 0 && <div className="absolute top-0 left-0 w-1 h-full bg-black"></div>}
                        
                        <div className="flex items-center gap-4">
                          <div className={`font-black text-xl w-6 text-center ${index === 0 ? 'text-black' : index === 1 ? 'text-gray-400' : index === 2 ? 'text-gray-400' : 'text-gray-300'}`}>
                            {index === 0 ? <Star className="fill-black inline" size={20}/> : index + 1}
                          </div>
                          <div>
                            <div className="font-black text-gray-800 text-sm sm:text-base truncate max-w-[120px]">{s.name}</div>
                            <div className="text-xs text-gray-500 font-bold">{s.totalExams} bài</div>
                          </div>
                        </div>
                        <div className="font-black text-lg text-black">{s.avg.toFixed(1)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}


        {/* ==================================================== */}
        {/* TÍNH NĂNG MỚI: BẢNG TIN DÀNH RIÊNG CHO GIÁO VIÊN */}
        {/* ==================================================== */}
        {currentUser.role === 'teacher' && (
          <div className="space-y-6">
            {/* 1. Thẻ Sức Mạnh (Thống kê Tổng quan) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-gray-200 rounded-3xl p-6 text-gray-900 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all">
                <Users className="absolute top-4 right-4 text-gray-100 group-hover:text-gray-200 transition-colors" size={80} />
                <h3 className="font-bold text-gray-500 mb-1 relative z-10">Tổng Số Học Sinh</h3>
                <div className="text-5xl font-black relative z-10">{uniqueStudentsCount}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-3xl p-6 text-gray-900 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all">
                <FileText className="absolute top-4 right-4 text-gray-100 group-hover:text-gray-200 transition-colors" size={80} />
                <h3 className="font-bold text-gray-500 mb-1 relative z-10">Tổng Số Đề Đã Giao</h3>
                <div className="text-5xl font-black relative z-10">{teacherExamsCount}</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-3xl p-6 text-gray-900 shadow-sm relative overflow-hidden group hover:shadow-md hover:-translate-y-1 transition-all">
                <CheckCircle className="absolute top-4 right-4 text-gray-100 group-hover:text-gray-200 transition-colors" size={80} />
                <h3 className="font-bold text-gray-500 mb-1 relative z-10">Tổng Lượt Nộp Bài</h3>
                <div className="text-5xl font-black relative z-10">{teacherResults.length}</div>
              </div>
            </div>

            {/* 2. Radar Quét Kẻ Địch (Cảnh Báo Gian Lận) */}
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-black"></div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="text-black" />
                    <h3 className="text-xl font-black text-gray-800">Cảnh Báo Gian Lận</h3>
                    {cheatIncidents.length > 0 && <span className="ml-2 bg-gray-100 text-black border border-gray-200 text-xs font-black px-2.5 py-1 rounded-full animate-pulse tracking-wide uppercase">Có phát hiện mới</span>}
                  </div>
                </div>
                
                {cheatIncidents.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-400 py-6 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                    <CheckCircle size={40} className="mb-2 text-gray-300" />
                    <p className="font-bold">Không phát hiện học sinh nào có dấu hiệu gian lận.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cheatIncidents.map((incident, i) => (
                      <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all gap-4">
                        <div className="flex items-start sm:items-center gap-4">
                            <div className="w-12 h-12 bg-gray-50 text-black border border-gray-200 rounded-full flex items-center justify-center shrink-0 shadow-sm">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <div className="font-bold text-gray-800 text-base">
                                    Học sinh <span className="text-black font-black bg-gray-100 px-2 py-0.5 rounded shadow-sm border border-gray-200 mx-1">{incident.studentName}</span> vừa thoát màn hình
                                </div>
                                <div className="text-sm text-gray-500 font-medium mt-1.5 flex items-center gap-1.5 flex-wrap">
                                    <span>Lớp: <span className="font-black text-gray-700">{incident.className}</span></span>
                                    <span className="text-gray-300">•</span>
                                    <span>Bài thi: <span className="font-black text-gray-700">{incident.examTitle}</span></span>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white text-red-500 border border-red-200 font-black text-lg px-4 py-2 rounded-xl shadow-sm whitespace-nowrap self-end sm:self-auto shrink-0">
                           {incident.cheat_count} lần
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t border-gray-200 pt-8">
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-2">
            <BookOpen size={28}/> Lớp học của tôi
          </h2>
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
                <button onClick={() => setIsJoining(true)} className="bg-white border-2 border-black text-black px-5 py-2.5 rounded-xl flex items-center gap-2 font-bold hover:bg-gray-50 hover:-translate-y-1 transition-all shadow-sm">
                  <Plus size={18} /> Tham gia bằng mã
                </button>
              )}
            </div>
          )}
        </div>

        {myClasses.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-200 shadow-sm animate-pop">
            <BookOpen className="mx-auto text-gray-200 mb-4" size={64} />
            <p className="text-gray-500 font-bold text-lg mb-2">Bạn chưa có lớp học nào.</p>
            {currentUser.role === 'student' && <p className="text-gray-400 text-sm">Hãy xin mã lớp từ giáo viên hoặc bấm vào link chia sẻ để tham gia nhé!</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {myClasses.map((cls, idx) => (
              <div key={cls.id} onClick={() => navigate('class', { cls })} 
                   className="bg-white border border-gray-200 p-6 rounded-3xl hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group relative"
                   style={{ animationDelay: `${idx * 0.1}s` }}>
                
                {currentUser.role === 'teacher' && (
                  <button onClick={(e) => handleDeleteClass(e, cls)} className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Xóa lớp học">
                    <Trash2 size={20} />
                  </button>
                )}

                <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md">
                  <BookOpen size={28} />
                </div>
                <h3 className="text-xl font-black mb-2 truncate text-gray-800 pr-8">{cls.name}</h3>
                {currentUser.role === 'teacher' && (
                  <p className="text-gray-500 text-sm mb-5 font-medium">Mã chia sẻ: <span className="font-mono font-bold bg-gray-100 text-black px-2 py-1 rounded-md">{cls.code}</span></p>
                )}
                <div className="flex items-center text-sm text-gray-400 font-bold group-hover:text-blue-600 transition-colors mt-4">
                  Vào lớp <ChevronRight size={18} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function ClassDetail({ currentUser, cls, exams, enrollments, setEnrollments, allUsers, results, navigate, setExams, supabase, showToast, showConfirm }) {
  const [activeTab, setActiveTab] = useState('exams'); 
  const [extendingExam, setExtendingExam] = useState(null); 
  const [newDeadline, setNewDeadline] = useState(''); 

  const joinLink = `${window.location.origin}${window.location.pathname}?join=${cls.code}`;
  const classStudents = enrollments.filter(e => e.class_id === cls.id).map(e => allUsers.find(u => u.id === e.student_id)).filter(Boolean); 
  const visibleExams = exams.filter(e => !e.is_hidden);

  const copyLink = () => { 
    navigator.clipboard.writeText(joinLink); 
    showToast('Đã chép link mời tham gia lớp!'); 
  };
  
  const exportPDF = () => { window.print(); };

  const handleDeleteExam = (exam) => {
    showConfirm(`Bạn có chắc muốn xóa đề "${exam.title}" không? \nTệp PDF sẽ bị xóa vĩnh viễn để giải phóng dung lượng.`, async () => {
      if (exam.fileUrl && exam.fileUrl !== 'fake-url') {
        const fileName = exam.fileUrl.split('/').pop();
        await supabase.storage.from('exams').remove([fileName]);
      }
      await supabase.from('edu_exams').update({ fileUrl: null, is_hidden: true }).eq('id', exam.id);
      setExams(prev => prev.map(e => e.id === exam.id ? { ...e, fileUrl: null, is_hidden: true } : e));
      showToast('Đã dọn dẹp file và xóa bài tập thành công!');
    });
  };

  const handleSaveDeadline = async () => {
    await supabase.from('edu_exams').update({ deadline: newDeadline }).eq('id', extendingExam.id);
    setExams(prev => prev.map(e => e.id === extendingExam.id ? { ...e, deadline: newDeadline } : e));
    setExtendingExam(null);
    setNewDeadline('');
    showToast('Đã gia hạn thời gian thành công!');
  };

  const handleRemoveStudent = (student) => {
    showConfirm(`Bạn có chắc muốn mời học sinh "${student.name}" ra khỏi lớp không?`, async () => {
      await supabase.from('edu_enrollments').delete().match({ class_id: cls.id, student_id: student.id });
      setEnrollments(prev => prev.filter(e => !(e.class_id === cls.id && e.student_id === student.id)));
      showToast(`Đã mời học sinh ${student.name} ra khỏi lớp!`);
    });
  };

  return (
    <>
      {extendingExam && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm transition-opacity no-print">
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

      <div className="space-y-6 print-section page-transition">
        <button onClick={() => navigate('dashboard')} className="flex items-center text-sm text-gray-500 hover:text-black transition-colors font-bold no-print group">
          <ArrowLeft size={16} className="mr-1.5 group-hover:-translate-x-1 transition-transform"/> Quay lại bảng tin
        </button>

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

        {/* TAB BÀI TẬP */}
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
                    const isExamMode = exam.exam_type === 'exam';

                    const attemptsCount = results.filter(r => r.exam_id === exam.id && r.student_id === currentUser.id).length;
                    const hasReachedMaxAttempts = exam.maxAttempts && attemptsCount >= exam.maxAttempts;

                    return (
                      <div key={exam.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-gray-50 transition-colors gap-4 group">
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border group-hover:scale-110 transition-transform ${isExpired ? 'bg-red-50 text-red-500 border-red-100' : isExamMode ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-green-50 text-green-600 border-green-200'}`}>
                            {isExpired ? <Clock size={28} /> : isExamMode ? <ShieldAlert size={28} /> : <FileText size={28} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                               <h3 className="font-black text-lg text-gray-800 group-hover:text-black transition-colors">{exam.title}</h3>
                               {isExamMode ? (
                                 <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Thi thật {exam.duration ? `(${exam.duration}p)` : ''}</span>
                               ) : (
                                 <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Luyện tập</span>
                               )}
                            </div>
                            <div className="flex gap-4">
                              <p className="text-sm text-gray-500 font-bold">{exam.questions?.length || 0} câu hỏi</p>
                              <p className={`text-sm font-bold flex items-center gap-1 ${isExpired ? 'text-red-500' : 'text-blue-500'}`}>
                                <Calendar size={14}/> Hạn: {deadlineText}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {currentUser.role === 'student' ? (
                            isExpired ? (
                              <button disabled className="bg-gray-200 text-gray-400 px-8 py-3 rounded-xl text-sm font-bold cursor-not-allowed">Đã hết hạn</button>
                            ) : hasReachedMaxAttempts ? (
                              <button disabled className="bg-red-100 text-red-500 px-6 py-3 rounded-xl text-sm font-bold cursor-not-allowed border border-red-200">Đã hết {exam.maxAttempts} lượt</button>
                            ) : (
                              <div className="flex flex-col items-end gap-1">
                                <button onClick={() => navigate('exam_taker', { exam })} className="bg-black text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 hover:scale-105 shadow-md transition-all w-full">Làm bài</button>
                                {exam.maxAttempts && <span className="text-[10px] text-gray-500 font-bold">Lượt: {attemptsCount}/{exam.maxAttempts}</span>}
                              </div>
                            )
                          ) : (
                            <>
                              <button onClick={() => {setExtendingExam(exam); setNewDeadline(exam.deadline || '');}} className="text-blue-600 font-bold flex items-center gap-1.5 bg-blue-50 px-4 py-2.5 rounded-xl hover:bg-blue-100 transition-all hover:scale-105" title="Gia hạn thời gian">
                                <Clock size={16} /> Gia hạn
                              </button>
                              <button onClick={() => handleDeleteExam(exam)} className="text-red-500 font-bold flex items-center gap-1.5 bg-red-50 px-4 py-2.5 rounded-xl hover:bg-red-100 transition-all hover:scale-105" title="Xóa đề giải phóng dung lượng">
                                <Trash2 size={16} /> Xóa
                              </button>
                              <button onClick={() => navigate('exam_taker', { exam })} className="text-gray-600 font-bold flex items-center gap-1.5 bg-gray-100 px-4 py-2.5 rounded-xl hover:bg-gray-200 hover:text-black transition-all hover:scale-105" title="Xem thử">
                                <Eye size={16} /> Xem
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

        {/* TAB BẢNG ĐIỂM */}
        {activeTab === 'students' && currentUser.role === 'teacher' && (
          <div className="space-y-6 animate-fade-in-down">
            <div className="flex justify-between items-center no-print">
              <h2 className="text-2xl font-black">Bảng điểm & Học sinh</h2>
              <button onClick={exportPDF} className="bg-white border-2 border-gray-200 px-4 py-2 rounded-xl flex items-center gap-2 hover:border-black hover:bg-gray-50 font-bold transition-all hover:-translate-y-0.5 shadow-sm">
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
                          <div className="flex justify-center gap-1 mt-1">
                            {exam.exam_type === 'exam' && <span className="text-[10px] text-purple-500 bg-purple-50 px-1 rounded uppercase tracking-wider">Thi thật</span>}
                            {exam.is_hidden && <span className="text-[10px] text-red-400 uppercase tracking-wider">(Đã xóa)</span>}
                          </div>
                        </th>
                      ))}
                      <th className="p-4 font-black border-b border-gray-200 text-right no-print">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {classStudents.length === 0 ? (
                      <tr><td colSpan={exams.length + 2} className="p-8 text-center text-gray-400 font-bold">Chưa có học sinh nào tham gia lớp.</td></tr>
                    ) : (
                      classStudents.map(student => (
                        <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                          <td className="p-4">
                            <div className="font-black text-gray-900">{student.name}</div>
                            <div className="text-xs text-gray-500 font-bold">{student.username}</div>
                          </td>
                          {exams.map(exam => {
                            const hsResult = results.find(r => r.exam_id === exam.id && r.student_id === student.id);
                            return (
                              <td key={exam.id} className="p-4 text-center font-bold">
                                {hsResult ? (
                                  <div className="flex flex-col items-center justify-center gap-1">
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg">
                                      {hsResult.score} / {hsResult.total}
                                    </span>
                                    {exam.exam_type === 'exam' && hsResult.cheat_count > 0 && (
                                      <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded flex items-center gap-1 shadow-sm animate-pulse" title={`Thoát màn hình ${hsResult.cheat_count} lần`}>
                                        <AlertTriangle size={10} /> Gian lận: {hsResult.cheat_count}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-gray-300">-</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="p-4 text-right no-print">
                             <button onClick={() => handleRemoveStudent(student)} className="text-gray-400 hover:text-red-500 bg-white hover:bg-red-50 p-2 rounded-lg transition-colors border border-transparent hover:border-red-100 opacity-0 group-hover:opacity-100" title="Mời ra khỏi lớp">
                               <UserMinus size={18} />
                             </button>
                          </td>
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
    </>
  );
}

function ExamCreator({ cls, navigate, setExams, exams, supabase, showToast }) {
  const [title, setTitle] = useState('');
  const [examType, setExamType] = useState('practice'); 
  const [fileUploaded, setFileUploaded] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null); 
  const [questions, setQuestions] = useState([]);
  const [deadline, setDeadline] = useState(''); 
  const [duration, setDuration] = useState(''); 
  const [maxAttempts, setMaxAttempts] = useState(''); 
  const [isSaving, setIsSaving] = useState(false);

  const [bulkCounts, setBulkCounts] = useState({ mcq4: '', tf: '', short: '' });

  const addQuestion = (type) => {
    const defaultCorrect = type === 'mcq4' ? 'A' : type === 'tf' ? 'Đúng' : '';
    setQuestions([...questions, { id: 'q_' + Date.now(), type, correct: defaultCorrect, videoUrl: '' }]);
  };

  const handleBulkAdd = () => {
    let newQs = [];
    const timestamp = Date.now();
    
    const countMcq = parseInt(bulkCounts.mcq4) || 0;
    const countTf = parseInt(bulkCounts.tf) || 0;
    const countShort = parseInt(bulkCounts.short) || 0;

    if (countMcq === 0 && countTf === 0 && countShort === 0) {
      return showToast('Vui lòng nhập số lượng câu hỏi muốn tạo!', 'info');
    }

    for(let i=0; i<countMcq; i++) newQs.push({ id: `q_${timestamp}_mcq_${i}`, type: 'mcq4', correct: 'A', videoUrl: '' });
    for(let i=0; i<countTf; i++) newQs.push({ id: `q_${timestamp}_tf_${i}`, type: 'tf', correct: 'Đúng', videoUrl: '' });
    for(let i=0; i<countShort; i++) newQs.push({ id: `q_${timestamp}_sh_${i}`, type: 'short', correct: '', videoUrl: '' });

    setQuestions([...questions, ...newQs]);
    setBulkCounts({ mcq4: '', tf: '', short: '' }); 
    showToast(`Đã tạo nhanh ${newQs.length} câu hỏi!`, 'success');
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleSave = async () => {
    if (!title.trim()) return showToast('Vui lòng nhập tiêu đề bài kiểm tra!', 'error');
    if (!fileUploaded || !selectedFile) return showToast('Vui lòng đính kèm file đề bài (PDF)!', 'error');
    if (questions.length === 0) return showToast('Vui lòng thêm ít nhất 1 câu hỏi!', 'error');

    setIsSaving(true);
    let finalFileUrl = '';
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `exam_${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage.from('exams').upload(fileName, selectedFile);
    if (uploadError) { showToast('Lỗi tải file: ' + uploadError.message, 'error'); setIsSaving(false); return; }
    
    const { data: urlData } = supabase.storage.from('exams').getPublicUrl(fileName);
    finalFileUrl = urlData.publicUrl;

    const newExam = { 
      id: 'e_' + Date.now(), 
      classId: cls.id, 
      title, 
      fileUrl: finalFileUrl, 
      questions,
      deadline: deadline || null,
      is_hidden: false,
      exam_type: examType,
      duration: examType === 'exam' && duration ? parseInt(duration) : null,
      maxAttempts: examType === 'exam' && maxAttempts ? parseInt(maxAttempts) : null 
    };
    
    await supabase.from('edu_exams').insert([newExam]);
    setExams([...exams, newExam]);
    showToast('Đã phát hành bài thi thành công!');
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
             <label className="font-black text-sm uppercase text-gray-700">2. Phân loại bài tập</label>
             <div className="flex gap-4 mt-2">
               <div onClick={() => setExamType('practice')} className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${examType === 'practice' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                 <div className="flex items-center gap-2 font-black text-green-700 mb-1"><BookOpen size={18}/> Luyện tập tự do</div>
                 <p className="text-xs font-bold text-gray-500">Học sinh làm bài thoải mái, không bật giám sát.</p>
               </div>
               <div onClick={() => setExamType('exam')} className={`flex-1 p-4 rounded-xl border-2 cursor-pointer transition-all ${examType === 'exam' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50'}`}>
                 <div className="flex items-center gap-2 font-black text-purple-700 mb-1"><ShieldAlert size={18}/> Thi nghiêm ngặt</div>
                 <p className="text-xs font-bold text-gray-500">Giám sát thoát màn hình và cho phép tính giờ.</p>
               </div>
             </div>
             
             {examType === 'exam' && (
               <div className="mt-4 space-y-4 animate-fade-in-down">
                 <input type="number" placeholder="Thời gian làm bài (Phút) - Để trống nếu không tính giờ" className="w-full border-2 border-purple-200 p-4 rounded-xl font-bold outline-none focus:border-purple-500 transition-colors bg-purple-50 focus:bg-white text-purple-900 placeholder:text-purple-300" value={duration} onChange={e => setDuration(e.target.value)} min="1" />
                 <input type="number" placeholder="Số lần làm bài tối đa (VD: 1) - Để trống = Vô hạn" className="w-full border-2 border-purple-200 p-4 rounded-xl font-bold outline-none focus:border-purple-500 transition-colors bg-purple-50 focus:bg-white text-purple-900 placeholder:text-purple-300" value={maxAttempts} onChange={e => setMaxAttempts(e.target.value)} min="1" />
               </div>
             )}
           </div>

           <div>
             <label className="font-black text-sm uppercase text-gray-700">3. Hạn chót nộp bài (Tùy chọn)</label>
             <input type="datetime-local" className="w-full border-2 border-gray-200 p-4 rounded-xl mt-2 font-bold outline-none focus:border-black transition-colors bg-gray-50 focus:bg-white" value={deadline} onChange={e => setDeadline(e.target.value)} />
           </div>
           
           <div>
             <label className="font-black text-sm uppercase text-gray-700">4. Đính kèm File Đề (PDF)</label>
             <div className={`border-2 border-dashed p-10 text-center mt-2 flex flex-col items-center rounded-2xl transition-colors duration-300 ${fileUploaded ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}`}>
                <input type="file" accept=".pdf" onChange={(e) => { 
                  if(e.target.files.length) {
                    setFileUploaded(true);
                    setSelectedFile(e.target.files[0]);
                  }
                }} className="cursor-pointer" />
                {fileUploaded && <span className="mt-3 font-bold text-blue-600">Đã chọn: {selectedFile?.name}</span>}
             </div>
           </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm h-[85vh] flex flex-col transition-shadow hover:shadow-md">
          <h3 className="font-black text-sm uppercase mb-4 text-gray-700">5. Thiết lập Phiếu Trả Lời</h3>
          
          <div className="bg-gray-50 p-4 rounded-2xl mb-4 border border-gray-200">
            <h4 className="font-bold text-sm mb-3 text-gray-600 flex items-center gap-2">Tạo nhanh số lượng lớn:</h4>
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">A-B-C-D</label>
                <input type="number" min="0" value={bulkCounts.mcq4} onChange={e => setBulkCounts({...bulkCounts, mcq4: e.target.value})} className="w-20 p-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-black font-black text-center transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Đúng/Sai</label>
                <input type="number" min="0" value={bulkCounts.tf} onChange={e => setBulkCounts({...bulkCounts, tf: e.target.value})} className="w-20 p-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-black font-black text-center transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Trả lời ngắn</label>
                <input type="number" min="0" value={bulkCounts.short} onChange={e => setBulkCounts({...bulkCounts, short: e.target.value})} className="w-20 p-2.5 border-2 border-gray-200 rounded-xl outline-none focus:border-black font-black text-center transition-colors" />
              </div>
              <button onClick={handleBulkAdd} className="bg-black text-white px-5 py-2.5 rounded-xl font-bold hover:bg-gray-800 transition-transform hover:scale-105 active:scale-95 h-[46px]">
                TẠO NGAY
              </button>
            </div>
          </div>

          <div className="flex gap-2 mb-4 border-b border-gray-100 pb-4">
            <button onClick={() => addQuestion('mcq4')} className="bg-gray-100 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 hover:-translate-y-0.5 transition-all">+ Thêm 1 câu A-B-C-D</button>
            <button onClick={() => addQuestion('tf')} className="bg-gray-100 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 hover:-translate-y-0.5 transition-all">+ Thêm 1 câu Đúng/Sai</button>
            <button onClick={() => addQuestion('short')} className="bg-gray-100 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 hover:-translate-y-0.5 transition-all">+ Thêm 1 câu Điền đáp án</button>
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
             {questions.length === 0 && <div className="text-center text-gray-400 font-bold mt-10">Chưa có câu hỏi nào. Dùng công cụ phía trên để tạo nhé!</div>}
             {questions.map((q, i) => (
                <div key={q.id} className="p-5 bg-gray-50 border border-gray-100 rounded-2xl relative animate-pop">
                  <button onClick={() => setQuestions(questions.filter(item => item.id !== q.id))} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                  <h4 className="font-black mb-3 text-gray-800">Câu {i + 1}</h4>
                  
                  {q.type === 'mcq4' && (
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-bold text-sm text-gray-600">Đáp án đúng:</span>
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <button key={opt} onClick={() => updateQuestion(q.id, 'correct', opt)} className={`w-10 h-10 rounded-full border-2 font-black transition-all ${q.correct === opt ? 'bg-black text-white border-black scale-110 shadow-md' : 'border-gray-200 text-gray-400 hover:bg-gray-200 hover:text-gray-600'}`}>{opt}</button>
                      ))}
                    </div>
                  )}

                  {q.type === 'tf' && (
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-bold text-sm text-gray-600">Đáp án đúng:</span>
                      {['Đúng', 'Sai'].map(opt => (
                        <button key={opt} onClick={() => updateQuestion(q.id, 'correct', opt)} className={`px-4 py-2 rounded-xl border-2 font-black transition-all ${q.correct === opt ? 'bg-black text-white border-black scale-105 shadow-md' : 'border-gray-200 text-gray-400 hover:bg-gray-200 hover:text-gray-600'}`}>{opt}</button>
                      ))}
                    </div>
                  )}

                  {q.type === 'short' && (
                    <input type="text" placeholder="Nhập đáp án (Dùng dấu | nếu có nhiều đáp án. VD: A|B)" className="p-3 border-2 border-gray-200 rounded-xl font-bold w-full mb-3 outline-none focus:border-black transition-colors" value={q.correct} onChange={e => updateQuestion(q.id, 'correct', e.target.value)} />
                  )}

                  <input type="text" placeholder="Link video giải (tùy chọn)" className="p-3 border-2 border-gray-200 rounded-xl text-sm w-full outline-none focus:border-blue-500 transition-colors bg-white" value={q.videoUrl} onChange={e => updateQuestion(q.id, 'videoUrl', e.target.value)} />
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamTaker({ exam, navigate, currentUser, resultsState, setResultsState, supabase, showToast }) {
  const [answers, setAnswers] = useState({});
  const [cheatWarning, setCheatWarning] = useState(false);
  const [cheatCount, setCheatCount] = useState(0);
  const [flagged, setFlagged] = useState({}); 
  const isExamMode = exam.exam_type === 'exam'; 

  const [timeLeft, setTimeLeft] = useState(() => {
    if (isExamMode && exam.duration && currentUser?.role === 'student') {
      const storageKey = `endTime_${exam.id}_${currentUser.id}`;
      const storedEndTime = localStorage.getItem(storageKey);
      
      if (storedEndTime) {
        const remaining = Math.floor((parseInt(storedEndTime) - Date.now()) / 1000);
        return remaining > 0 ? remaining : 0;
      } else {
        const endTime = Date.now() + exam.duration * 60 * 1000;
        localStorage.setItem(storageKey, endTime.toString());
        return exam.duration * 60;
      }
    } else if (isExamMode && exam.duration) {
      return exam.duration * 60; 
    }
    return null;
  });

  useEffect(() => {
    if (currentUser?.role === 'student') {
      const draft = localStorage.getItem(`draft_${exam.id}_${currentUser.id}`);
      if (draft) setAnswers(JSON.parse(draft));
      
      const flaggedDraft = localStorage.getItem(`flagged_${exam.id}_${currentUser.id}`);
      if (flaggedDraft) setFlagged(JSON.parse(flaggedDraft));
    }
  }, []);

  useEffect(() => {
    if (timeLeft === null) return;
    
    if (timeLeft <= 0) {
      showToast('Đã hết thời gian! Hệ thống tự động thu bài.', 'info');
      submitExam(); 
      return;
    }
    
    const timerId = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  useEffect(() => {
    if (isExamMode) {
      const handleVis = () => { if (document.hidden) { setCheatWarning(true); setCheatCount(prev => prev + 1); } };
      document.addEventListener("visibilitychange", handleVis);
      window.addEventListener("blur", handleVis);
      return () => { document.removeEventListener("visibilitychange", handleVis); window.removeEventListener("blur", handleVis); };
    }
  }, [isExamMode]);

  const handleSelect = (qId, val) => {
    const newAns = { ...answers, [qId]: val };
    setAnswers(newAns);
    if (currentUser?.role === 'student') {
      localStorage.setItem(`draft_${exam.id}_${currentUser.id}`, JSON.stringify(newAns));
    }
  };

  const toggleFlag = (qId) => {
    const newFlagged = { ...flagged, [qId]: !flagged[qId] };
    setFlagged(newFlagged);
    if (currentUser?.role === 'student') {
      localStorage.setItem(`flagged_${exam.id}_${currentUser.id}`, JSON.stringify(newFlagged));
    }
  };

  const submitExam = async () => {
    let score = 0;
    const questionsList = exam.questions || [];
    const details = questionsList.map(q => {
      const userAnswer = String(answers[q.id] || '').toLowerCase().trim();
      const correctAnswers = String(q.correct).toLowerCase().split('|').map(s => s.trim());
      
      const isCorrect = correctAnswers.includes(userAnswer);
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
        cheat_count: isExamMode ? cheatCount : 0, 
        details
      };
      await supabase.from('edu_results').insert([newResult]);
      setResultsState([...resultsState, newResult]);
      
      try { 
        localStorage.removeItem(`draft_${exam.id}_${currentUser.id}`); 
        localStorage.removeItem(`flagged_${exam.id}_${currentUser.id}`); 
        localStorage.removeItem(`endTime_${exam.id}_${currentUser.id}`); 
      } catch(e){}
    }

    showToast('Nộp bài thành công!');
    navigate('exam_result', { exam: { ...exam, results } });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <>
      {cheatWarning && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 transition-opacity backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm text-center animate-pop shadow-2xl">
            <AlertTriangle size={64} className="text-red-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-2xl font-black text-red-600 mb-2">Cảnh báo gian lận!</h3>
            <p className="font-bold text-gray-600 mb-6">Bạn vừa thoát màn hình (Lần {cheatCount}).<br/>Hành động này sẽ bị báo cáo!</p>
            <button onClick={() => setCheatWarning(false)} className="w-full bg-black text-white py-3 rounded-xl font-bold hover:scale-105 transition-transform active:scale-95">Quay lại làm bài</button>
          </div>
        </div>
      )}
      
      <div className="h-[calc(100vh-64px)] flex bg-gray-100 overflow-hidden absolute inset-0 top-16 page-transition">
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
               {currentUser.role === 'teacher' ? (
                 <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full mt-1 inline-block">Xem trước (Không lưu)</span>
               ) : (
                 <div className="flex items-center gap-2 mt-1">
                   {isExamMode ? (
                     <span className="text-[10px] font-bold text-purple-600 bg-purple-100 px-2 py-0.5 rounded flex items-center gap-1 w-max"><ShieldAlert size={12}/> Giám sát</span>
                   ) : (
                     <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded flex items-center gap-1 w-max"><BookOpen size={12}/> Luyện tập</span>
                   )}
                   
                   {timeLeft !== null && (
                     <span className={`text-[11px] font-black px-2 py-0.5 rounded flex items-center gap-1 w-max transition-colors ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-200 text-gray-800'}`}>
                       <Clock size={12}/> {formatTime(timeLeft)}
                     </span>
                   )}
                 </div>
               )}
            </div>
            <button onClick={submitExam} className="bg-black text-white px-5 py-2.5 rounded-xl font-black hover:bg-gray-800 hover:-translate-y-0.5 transition-all shadow-md hover:shadow-lg">NỘP BÀI</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-50/50">
            {(exam.questions || []).map((q, i) => (
              <div key={q.id} className={`p-5 border-2 rounded-2xl bg-white shadow-sm transition-colors ${flagged[q.id] ? 'border-orange-400 bg-orange-50/30' : 'border-gray-100 hover:border-gray-300'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black text-gray-800">Câu {i + 1}</h4>
                  <button onClick={() => toggleFlag(q.id)} className={`p-2 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-bold ${flagged[q.id] ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400 hover:text-orange-500 hover:bg-orange-50'}`} title="Cắm cờ câu này để xem lại sau">
                    <Flag size={16} className={flagged[q.id] ? "fill-orange-500" : ""} /> {flagged[q.id] ? 'Đã cắm cờ' : 'Cắm cờ'}
                  </button>
                </div>
                
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
    </>
  );
}

function ExamResult({ exam, results, navigate, currentUser }) {
  const [playingVideo, setPlayingVideo] = useState(null);

  const getEmbedUrl = (url) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}?autoplay=1` : url;
  };

  return (
    <>
      {playingVideo && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-black rounded-3xl w-full max-w-4xl shadow-2xl animate-pop overflow-hidden relative border border-gray-800">
            <button onClick={() => setPlayingVideo(null)} className="absolute top-4 right-4 text-white hover:text-red-500 z-10 bg-black/50 p-2 rounded-full transition-colors"><XCircle size={24} /></button>
            <div className="aspect-video w-full bg-gray-900">
              <iframe src={getEmbedUrl(playingVideo)} className="w-full h-full border-0" allow="autoplay; fullscreen" allowFullScreen title="Video Chữa Bài"></iframe>
            </div>
          </div>
        </div>
      )}

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
                  <button onClick={() => setPlayingVideo(q.videoUrl)} className="mt-auto flex items-center justify-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-5 py-3 rounded-xl text-sm font-black hover:bg-blue-600 hover:text-white transition-colors duration-300 w-full">
                    <PlayCircle size={20} /> XEM VIDEO CHỮA BÀI
                  </button>
                ) : (
                  <div className="mt-auto text-center text-xs text-gray-400 font-bold py-3 bg-gray-50 rounded-xl border border-gray-100 w-full">
                    KHÔNG CÓ VIDEO
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
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
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative">
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
          
          {authMode === 'login' && (
            <div className="flex items-center gap-2 mt-2 px-1">
              <input type="checkbox" id="remember" className="w-4 h-4 accent-black cursor-pointer" checked={authForm.remember} onChange={e => setAuthForm({...authForm, remember: e.target.checked})} />
              <label htmlFor="remember" className="text-sm font-bold text-gray-600 cursor-pointer select-none">Ghi nhớ đăng nhập (Auto-login)</label>
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

      {/* DẤU ẤN NHÀ PHÁT TRIỂN (TRANG ĐĂNG NHẬP) */}
      <div className="absolute bottom-8 text-center text-sm font-bold text-gray-400 animate-fade-in-down">
        Phát triển bởi <span className="text-gray-800 font-black">Hong Quang Tech</span>
      </div>
    </div>
  );
}