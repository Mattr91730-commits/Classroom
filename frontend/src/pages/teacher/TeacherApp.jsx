import { Routes, Route, NavLink, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, Users, Briefcase, Store, Receipt, ClipboardList, ListTree, Settings, LogOut, Coins } from "lucide-react";
import Dashboard from "./Dashboard";
import Students from "./Students";
import Jobs from "./Jobs";
import StoreManager from "./StoreManager";
import Bills from "./Bills";
import Applications from "./Applications";
import Transactions from "./Transactions";
import SettingsPage from "./Settings";
import StudentProfile from "./StudentProfile";

const navItems = [
  { to: "/teacher", end: true, label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/teacher/students", label: "Students", icon: Users, testid: "nav-students" },
  { to: "/teacher/jobs", label: "Jobs", icon: Briefcase, testid: "nav-jobs" },
  { to: "/teacher/store", label: "Store", icon: Store, testid: "nav-store" },
  { to: "/teacher/bills", label: "Bills", icon: Receipt, testid: "nav-bills" },
  { to: "/teacher/applications", label: "Applications", icon: ClipboardList, testid: "nav-applications" },
  { to: "/teacher/transactions", label: "Transactions", icon: ListTree, testid: "nav-transactions" },
  { to: "/teacher/settings", label: "Settings", icon: Settings, testid: "nav-settings" },
];

export default function TeacherApp() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const needsSetup = !user?.classroom_username && !location.pathname.startsWith("/teacher/settings");
  return (
    <div className="min-h-screen flex bg-slate-50 font-teacher-body">
      <aside className="w-60 border-r border-slate-200 bg-white sticky top-0 h-screen flex flex-col">
        <div className="px-5 py-5 border-b border-slate-200 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-900 grid place-items-center"><Coins className="w-4 h-4 text-yellow-300"/></div>
          <div>
            <div className="font-teacher-heading font-bold text-slate-900 text-sm leading-tight">My Classroom Economy</div>
            <div className="text-xs text-slate-500 truncate max-w-[140px]">{user?.classroom_name}</div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(it => (
            <NavLink key={it.to} to={it.to} end={it.end} data-testid={it.testid}
              className={({isActive}) => `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>
              <it.icon className="w-4 h-4"/> {it.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200">
          <div className="px-3 py-2 text-xs text-slate-500 truncate">{user?.email}</div>
          <button data-testid="logout-btn" onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-100">
            <LogOut className="w-4 h-4"/> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        {needsSetup ? <Navigate to="/teacher/settings" replace /> : (
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="students" element={<Students />} />
            <Route path="students/:id" element={<StudentProfile />} />
            <Route path="jobs" element={<Jobs />} />
            <Route path="store" element={<StoreManager />} />
            <Route path="bills" element={<Bills />} />
            <Route path="applications" element={<Applications />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="settings" element={<SettingsPage />} />
          </Routes>
        )}
      </main>
    </div>
  );
}
