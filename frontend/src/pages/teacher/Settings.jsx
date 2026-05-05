import { useState } from "react";
import { api } from "./lib/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";

export default function Settings() {
  const { user, refresh } = useAuth();
  const [classroomUsername, setU] = useState(user?.classroom_username || "");
  const [classroomName, setN] = useState(user?.classroom_name || "");
  const [currencySymbol, setC] = useState(user?.currency_symbol || "$");

  const save = async () => {
    if (!/^[a-z0-9_-]{3,30}$/.test(classroomUsername)) return toast.error("Use lowercase letters, digits, _ or - (3-30 chars)");
    try {
      await api.put("/classroom", { classroom_username: classroomUsername, classroom_name: classroomName, currency_symbol: currencySymbol });
      toast.success("Saved");
      await refresh();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  return (
    <div className="max-w-xl">
      <h1 className="font-teacher-heading text-3xl font-bold text-slate-900 mb-2">Classroom Settings</h1>
      <p className="text-sm text-slate-500 mb-6">Set up your classroom code so students can log in.</p>
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <Field label="Classroom code (students will type this)">
          <input data-testid="settings-classroom-username" value={classroomUsername} onChange={e=>setU(e.target.value.toLowerCase())} placeholder="e.g. mrsmith" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono"/>
        </Field>
        <Field label="Classroom name">
          <input data-testid="settings-classroom-name" value={classroomName} onChange={e=>setN(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"/>
        </Field>
        <Field label="Currency symbol">
          <input data-testid="settings-currency" value={currencySymbol} onChange={e=>setC(e.target.value)} maxLength={3} className="w-24 border border-slate-200 rounded-md px-3 py-2 text-sm font-mono"/>
        </Field>
        <button data-testid="save-settings-btn" onClick={save} className="bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium">Save settings</button>
      </div>
    </div>
  );
}
function Field({label,children}){return <div><div className="text-xs text-slate-500 mb-1 font-medium">{label}</div>{children}</div>;}
