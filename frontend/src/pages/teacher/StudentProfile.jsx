import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "./lib/api";
import { useAuth } from "../../context/AuthContext";
import { ArrowLeft, User, Briefcase } from "lucide-react";

export default function StudentProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [txns, setTxns] = useState([]);
  const [jobs, setJobs] = useState([]);
  const sym = user?.currency_symbol || "$";

  useEffect(() => {
    Promise.all([api.get(`/students/${id}`), api.get(`/transactions?student_id=${id}`), api.get("/jobs")])
      .then(([s,t,j]) => { setStudent(s.data); setTxns(t.data); setJobs(j.data); });
  }, [id]);

  if (!student) return <div className="text-slate-400">Loading…</div>;
  const currentJob = jobs.find(j=>j.job_id===student.job_id);

  return (
    <div className="max-w-4xl">
      <Link to="/teacher/students" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 mb-4"><ArrowLeft className="w-4 h-4"/> Back to students</Link>
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-slate-100 grid place-items-center"><User className="w-7 h-7 text-slate-500"/></div>
        <div className="flex-1">
          <h1 className="font-teacher-heading text-2xl font-bold text-slate-900">{student.name}</h1>
          <div className="text-sm text-slate-500">PIN <span className="font-mono">{student.pin}</span> · Current job: {currentJob?.title || "—"}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-slate-500">Balance</div>
          <div className="font-teacher-heading text-3xl font-bold text-slate-900">{sym}{(student.balance||0).toFixed(2)}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-teacher-heading font-semibold text-slate-900 mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4"/> Job history</h3>
          <div className="space-y-2">
            {(student.job_history || []).map((h,i)=>(
              <div key={`${h.job_id}-${h.started_at}-${i}`} className="text-sm flex justify-between border-b border-slate-100 pb-2 last:border-0">
                <div><div className="font-medium text-slate-900">{h.title}</div><div className="text-xs text-slate-500">{new Date(h.started_at).toLocaleDateString()}</div></div>
                <div className="text-emerald-600 text-sm font-medium">+{sym}{h.salary}/wk</div>
              </div>
            ))}
            {(!student.job_history || student.job_history.length===0) && <div className="text-sm text-slate-400">No previous jobs</div>}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-teacher-heading font-semibold text-slate-900 mb-3">Recent transactions</h3>
          <div className="space-y-1.5 max-h-72 overflow-auto">
            {txns.slice(0,30).map(t=>(
              <div key={t.txn_id} className="flex justify-between text-sm border-b border-slate-50 pb-1.5 last:border-0">
                <div><div className="text-slate-700">{t.category}</div><div className="text-xs text-slate-400">{new Date(t.created_at).toLocaleDateString()}</div></div>
                <div className={`font-medium ${t.amount>=0?'text-emerald-600':'text-red-600'}`}>{t.amount>=0?'+':''}{sym}{t.amount.toFixed(2)}</div>
              </div>
            ))}
            {txns.length===0 && <div className="text-sm text-slate-400">None yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
