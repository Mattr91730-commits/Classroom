import "./App.css";

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "sonner";

import Landing from "./pages/Landing";
import StudentLogin from "./pages/StudentLogin";
import TeacherApp from "./pages/teacher/TeacherApp";
import StudentApp from "./pages/student/StudentApp";

function ProtectedTeacher({ children }) {
  const { loading, role } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>;
  if (role !== "teacher") return <Navigate to="/" replace />;
  return children;
}

function ProtectedStudent({ children }) {
  const { loading, role } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading…</div>;
  if (role !== "student") return <Navigate to="/student-login" replace />;
  return children;
}

function AppRouter() {
  const location = useLocation();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/student-login" element={<StudentLogin />} />
      <Route path="/teacher/*" element={<ProtectedTeacher><TeacherApp /></ProtectedTeacher>} />
      <Route path="/student/*" element={<ProtectedStudent><StudentApp /></ProtectedStudent>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <AppRouter />
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
