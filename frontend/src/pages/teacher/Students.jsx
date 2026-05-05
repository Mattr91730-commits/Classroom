import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { api } from "./lib/api";
import { useAuth } from "./context/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, UserPlus, Eye } from "lucide-react";

export default function Students() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [start, setStart] = useState(0);
  const sym = user?.currency_symbol || "$";

  const load = useCallback(async () => {
    const [s, j] = await Promise.all([api.get("/students"), api.get("/jobs")]);
    setStudents(s.data); setJobs(j.data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!name) return toast.error("Name required");
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) return toast.error("PIN must be 4 digits");
    try {
      await api.post("/students", { name, pin, starting_balance: Number(start) || 0 });
      toast.success("Added"); setName(""); setPin(""); setStart(0); setShow(false); load();
    } catch (e) { toast.error("Failed"); }
  };

  const assign = async (sid, jid) => {
    await api.post("/jobs/assign", { student_id: sid, job_id: jid || null });
    toast.success("Updated"); load();
  };

  const del = async (sid) => {
    if (!confirm("Delete this student?")) return;
    await api.delete(`/students/${sid}`); load();
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-teacher-heading text-3xl font-bold text-slate-900">Students</h1>
        <button data-testid="add-student-btn" onClick={() => setShow(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"><UserPlus className="w-4 h-4"/> Add student</button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-600">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">PIN</th>
              <th className="px-4 py-3 font-medium">Balance</th>
              <th className="px-4 py-3 font-medium">Job</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {students.map(s=>(
              <tr key={s.student_id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-3 font-mono text-slate-600">{s.pin}</td>
                <td className="px-4 py-3 font-teacher-heading font-semibold">{sym}{(s.balance||0).toFixed(2)}</td>
                <td className="px-4 py-3">
                  <select data-testid={`assign-job-${s.student_id}`} value={s.job_id || ""} onChange={(e)=>assign(s.student_id, e.target.value)} className="border border-slate-200 rounded-md px-2 py-1.5 bg-white text-sm">
                    <option value="">Unemployed</option>
                    {jobs.map(j=><option key={j.job_id} value={j.job_id}>{j.title} (+{sym}{j.salary})</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/teacher/students/${s.student_id}`} data-testid={`view-student-${s.student_id}`} className="inline-flex items-center gap-1 text-slate-600 hover:text-slate-900 mr-3"><Eye className="w-4 h-4"/></Link>
                  <button data-testid={`delete-student-${s.student_id}`} onClick={()=>del(s.student_id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4"/></button>
                </td>
              </tr>
            ))}
            {students.length === 0 && <tr><td colSpan={5} className="text-center py-12 text-slate-400">No students yet</td></tr>}
          </tbody>
        </table>
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={()=>setShow(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e)=>e.stopPropagation()}>
            <h3 className="font-teacher-heading text-xl font-bold mb-4">Add student</h3>
            <div className="space-y-3">
              <Field label="Name"><input data-testid="new-student-name" value={name} onChange={e=>setName(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"/></Field>
              <Field label="4-digit PIN"><input data-testid="new-student-pin" maxLength={4} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,""))} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm font-mono"/></Field>
              <Field label="Starting balance"><input data-testid="new-student-balance" type="number" value={start} onChange={e=>setStart(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"/></Field>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={()=>setShow(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button data-testid="submit-new-student" onClick={create} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"><Plus className="w-4 h-4"/> Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Field({label,children}){return <div><div className="text-xs text-slate-500 mb-1 font-medium">{label}</div>{children}</div>;}
