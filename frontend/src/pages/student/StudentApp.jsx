import { Routes, Route, NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Home, Briefcase, Store, User, LogOut } from "lucide-react";
import StudentHome from "./StudentHome";
import StudentJobs from "./StudentJobs";
import StudentStore from "./StudentStore";
import StudentProfile from "./StudentProfile";

export default function StudentApp() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-yellow-100 font-student">
      <header className="border-b-[3px] border-black bg-white">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <div className="font-bold text-xl sm:text-2xl">🪙 My Classroom Economy</div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:block px-3 py-1.5 bg-yellow-300 border-[3px] border-black rounded-xl text-sm font-bold">Hi, {user?.name}!</div>
            <button data-testid="student-logout" onClick={logout} className="btn-brutal bg-red-300 text-sm px-3 py-2 inline-flex items-center gap-1"><LogOut className="w-4 h-4"/> Out</button>
          </div>
        </div>
        <nav className="max-w-5xl mx-auto px-5 pb-3 flex gap-2 overflow-auto no-scrollbar">
          {[
            {to:"/student", end:true, label:"Home", icon:Home, testid:"snav-home"},
            {to:"/student/jobs", label:"Jobs", icon:Briefcase, testid:"snav-jobs"},
            {to:"/student/store", label:"Store", icon:Store, testid:"snav-store"},
            {to:"/student/profile", label:"Profile", icon:User, testid:"snav-profile"},
          ].map(n=>(
            <NavLink key={n.to} to={n.to} end={n.end} data-testid={n.testid} className={({isActive})=>`btn-brutal text-sm whitespace-nowrap ${isActive?'bg-green-300':'bg-white'}`}>
              <n.icon className="w-4 h-4 inline mr-1" strokeWidth={3}/> {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="max-w-5xl mx-auto p-5">
        <Routes>
          <Route index element={<StudentHome/>}/>
          <Route path="jobs" element={<StudentJobs/>}/>
          <Route path="store" element={<StudentStore/>}/>
          <Route path="profile" element={<StudentProfile/>}/>
        </Routes>
      </main>
    </div>
  );
}
