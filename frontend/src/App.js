import "./App.css";

import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import { Toaster } from "sonner";

import Landing from "./pages/Landing";
import StudentLogin from "./pages/StudentLogin";
import TeacherApp from "./pages/teacher/TeacherApp";
import StudentApp from "./pages/student/StudentApp";

function ProtectedTeacher({ children }) {
  return children;
}

function ProtectedStudent({ children }) {
  return children;
}

function AppRouter() {
  const location = useLocation();
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/student-login" element={<StudentLogin />} />
      <Route path="/teacher/*" element={<TeacherApp />} />
      <Route path="/student/*" element={<StudentApp />} />
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
