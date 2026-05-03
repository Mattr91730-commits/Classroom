import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { motion } from "framer-motion";
import { Coins, Receipt } from "lucide-react";

const HERO_INITIAL = { y: -10, opacity: 0 };
const HERO_ANIMATE = { y: 0, opacity: 1 };
const BALANCE_INITIAL = { scale: 0.92 };
const BALANCE_ANIMATE = { scale: 1 };

export default function StudentHome() {
  const [data, setData] = useState(null);
  const [bills, setBills] = useState([]);
  const [txns, setTxns] = useState([]);
  const load = useCallback(async () => {
    const [m, b, t] = await Promise.all([api.get("/me/student"), api.get("/me/bills-due"), api.get("/transactions")]);
    setData(m.data); setBills(b.data); setTxns(t.data);
  }, []);
  useEffect(() => { load(); }, [load]);
  if (!data) return <div className="text-center py-20 font-bold">Loading…</div>;
  const { student, job } = data;

  return (
    <div className="space-y-6">
      <motion.div initial={HERO_INITIAL} animate={HERO_ANIMATE} className="card-brutal bg-yellow-300 p-7 relative overflow-hidden">
        <div className="text-sm font-bold text-black/70">YOUR BALANCE</div>
        <motion.div key={student.balance} initial={BALANCE_INITIAL} animate={BALANCE_ANIMATE} className="text-7xl font-bold text-black mt-1 leading-none">${student.balance.toFixed(2)}</motion.div>
        <div className="mt-4 flex flex-wrap gap-2">
          {job ? <div className="card-brutal bg-white px-3 py-1.5 text-sm font-bold">💼 {job.title} · +${job.salary}/wk</div> : <div className="card-brutal bg-white px-3 py-1.5 text-sm font-bold">No job yet — apply!</div>}
        </div>
        <div className="absolute -right-4 -bottom-4 text-8xl coin-bob opacity-80">🪙</div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card-brutal bg-white p-5">
          <h3 className="font-bold text-xl mb-3 flex items-center gap-2"><Receipt className="w-5 h-5" strokeWidth={3}/> Bills due</h3>
          {bills.length===0 ? <div className="text-black/50">No bills right now</div> : (
            <div className="space-y-2">
              {bills.map(b=>(
                <div key={b.bill_id} className="flex justify-between items-center bg-red-100 border-[3px] border-black rounded-xl px-3 py-2">
                  <div className="font-bold">{b.name}</div>
                  <div className="font-bold text-red-700">-${b.amount}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="card-brutal bg-white p-5">
          <h3 className="font-bold text-xl mb-3 flex items-center gap-2"><Coins className="w-5 h-5" strokeWidth={3}/> Recent activity</h3>
          {txns.length===0 ? <div className="text-black/50">Nothing yet — go earn some coins!</div> : (
            <div className="space-y-2 max-h-72 overflow-auto">
              {txns.slice(0,15).map(t=>(
                <div key={t.txn_id} className="flex justify-between items-center border-b-2 border-dashed border-black/20 pb-1.5">
                  <div>
                    <div className="font-bold text-sm">{t.category}</div>
                    <div className="text-xs text-black/50">{new Date(t.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className={`font-bold ${t.amount>=0?'text-green-700':'text-red-700'}`}>{t.amount>=0?'+':''}${t.amount.toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
