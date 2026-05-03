import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Transactions() {
  const { user } = useAuth();
  const [txns, setTxns] = useState([]);
  const [students, setStudents] = useState([]);
  const sym = user?.currency_symbol || "$";

  useEffect(() => {
    Promise.all([api.get("/transactions"), api.get("/students")]).then(([t, s]) => {
      setTxns(t.data); setStudents(s.data);
    });
  }, []);
  const nameOf = (id) => students.find(s=>s.student_id===id)?.name || "—";

  return (
    <div className="max-w-5xl">
      <h1 className="font-teacher-heading text-3xl font-bold text-slate-900 mb-6">Transactions</h1>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-600">
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {txns.map(t=>(
              <tr key={t.txn_id} className="border-b border-slate-100">
                <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap">{new Date(t.created_at).toLocaleString()}</td>
                <td className="px-4 py-2.5 font-medium text-slate-900">{nameOf(t.student_id)}</td>
                <td className="px-4 py-2.5 text-slate-600 capitalize">{t.type}</td>
                <td className="px-4 py-2.5 text-slate-600">{t.category}</td>
                <td className={`px-4 py-2.5 text-right font-medium ${t.amount>=0?'text-emerald-600':'text-red-600'}`}>{t.amount>=0?'+':''}{sym}{t.amount.toFixed(2)}</td>
              </tr>
            ))}
            {txns.length===0 && <tr><td colSpan={5} className="text-center py-12 text-slate-400">No transactions yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
