import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function StudentProfile() {
  const [data, setData] = useState(null);
  const [txns, setTxns] = useState([]);
  useEffect(() => {
    Promise.all([api.get("/me/student"), api.get("/transactions")])
      .then(([m,t]) => { setData(m.data); setTxns(t.data); });
  }, []);
  if (!data) return <div className="text-center py-20 font-bold">Loading…</div>;
  const { student, job } = data;

  return (
    <div>
      <div className="card-brutal bg-white p-6 mb-5">
        <h2 className="font-bold text-3xl">{student.name}</h2>
        <div className="text-black/70 mt-1">Balance ${student.balance.toFixed(2)} · {job ? `Working as ${job.title}` : "No job yet"}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card-brutal bg-white p-5">
          <h3 className="font-bold text-xl mb-3">Job history</h3>
          <div className="space-y-2">
            {(student.job_history || []).map((h,i)=>(
              <div key={`${h.job_id}-${h.started_at}-${i}`} className="border-b-2 border-dashed border-black/20 pb-2 last:border-0">
                <div className="font-bold">{h.title}</div>
                <div className="text-xs text-black/50">{new Date(h.started_at).toLocaleDateString()} · ${h.salary}/wk</div>
              </div>
            ))}
            {(!student.job_history || student.job_history.length===0) && <div className="text-black/50">No jobs yet</div>}
          </div>
        </div>
        <div className="card-brutal bg-white p-5">
          <h3 className="font-bold text-xl mb-3">All transactions</h3>
          <div className="space-y-2 max-h-80 overflow-auto">
            {txns.map(t=>(
              <div key={t.txn_id} className="flex justify-between items-center border-b-2 border-dashed border-black/20 pb-1.5">
                <div>
                  <div className="font-bold text-sm">{t.category}</div>
                  <div className="text-xs text-black/50">{new Date(t.created_at).toLocaleDateString()}</div>
                </div>
                <div className={`font-bold ${t.amount>=0?'text-green-700':'text-red-700'}`}>{t.amount>=0?'+':''}${t.amount.toFixed(2)}</div>
              </div>
            ))}
            {txns.length===0 && <div className="text-black/50">Nothing yet</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
