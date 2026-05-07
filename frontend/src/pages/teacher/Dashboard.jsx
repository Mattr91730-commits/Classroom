import { useEffect, useState, useCallback, useMemo } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { DollarSign, Users, Briefcase, ListTree, Banknote, Plus } from "lucide-react";
import PayAllModal from "../../components/PayAllModal";

export default function Dashboard() {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [txns, setTxns] = useState([]);
  const [showPayAll, setShowPayAll] = useState(false);
  const [paying, setPaying] = useState(false);

  const load = useCallback(async () => {
    const [s, j, t] = await Promise.all([
      api.get("/students"),
      api.get("/jobs"),
      api.get("/transactions"),
    ]);
    setStudents(s.data); setJobs(j.data); setTxns(t.data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const total = students.reduce((a, s) => a + (s.balance || 0), 0);
  const employed = students.filter(s => s.job_id).length;
  const sym = user?.currency_symbol || "$";
  const topStudents = useMemo(
    () => [...students].sort((a, b) => (b.balance || 0) - (a.balance || 0)).slice(0, 8),
    [students],
  );

  const paySalaries = async () => {
    if (!confirm("Pay weekly salary to all employed students?")) return;
    setPaying(true);
    try {
      const r = await api.post("/jobs/pay-salaries");
      toast.success(`Paid ${r.data.count} students`);
      load();
    } catch { toast.error("Failed"); }
    setPaying(false);
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="font-teacher-heading text-3xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-slate-500 mt-1">Manage your classroom economy</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button data-testid="pay-salaries-btn" onClick={paySalaries} disabled={paying} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2 disabled:opacity-50">
            <Banknote className="w-4 h-4"/> {paying ? "Paying…" : "Pay Weekly Salaries"}
          </button>
          <button data-testid="open-pay-all" onClick={() => setShowPayAll(true)} className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-lg text-sm font-medium inline-flex items-center gap-2">
            <Plus className="w-4 h-4"/> Pay All
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Stat icon={DollarSign} label="Total in circulation" value={`${sym}${total.toFixed(2)}`} />
        <Stat icon={Users} label="Students" value={students.length} />
        <Stat icon={Briefcase} label="Employed" value={`${employed}/${students.length}`} />
        <Stat icon={ListTree} label="Transactions" value={txns.length} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-teacher-heading font-semibold text-slate-900 mb-4">Top balances</h3>
          {students.length === 0 ? <Empty msg="No students yet. Add some in Students."/> : (
            <div className="divide-y divide-slate-100">
              {topStudents.map(s=>(
                <div key={s.student_id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-100 grid place-items-center text-slate-700 font-semibold">{s.name[0]?.toUpperCase()}</div>
                    <div>
                      <div className="font-medium text-slate-900">{s.name}</div>
                      <div className="text-xs text-slate-500">{jobs.find(j=>j.job_id===s.job_id)?.title || "No job"}</div>
                    </div>
                  </div>
                  <div className="font-teacher-heading font-bold text-slate-900">{sym}{(s.balance||0).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="font-teacher-heading font-semibold text-slate-900 mb-4">Recent activity</h3>
          {txns.length === 0 ? <Empty msg="No activity yet"/> : (
            <div className="space-y-2 max-h-80 overflow-auto">
              {txns.slice(0,15).map(t=>(
                <div key={t.txn_id} className="flex items-start justify-between text-sm">
                  <div>
                    <div className="text-slate-700">{t.category}</div>
                    <div className="text-xs text-slate-400">{new Date(t.created_at).toLocaleString()}</div>
                  </div>
                  <div className={`font-medium ${t.amount>=0?'text-emerald-600':'text-red-600'}`}>{t.amount>=0?'+':''}{sym}{t.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPayAll && <PayAllModal students={students} onClose={()=>setShowPayAll(false)} onDone={load} />}
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-2"><span className="text-xs text-slate-500 font-medium">{label}</span><Icon className="w-4 h-4 text-slate-400"/></div>
      <div className="font-teacher-heading text-2xl font-bold text-slate-900">{value}</div>
    </div>
  );
}
function Empty({ msg }) { return <div className="text-center py-8 text-slate-400 text-sm">{msg}</div>; }
