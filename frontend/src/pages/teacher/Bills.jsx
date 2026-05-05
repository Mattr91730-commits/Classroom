import { useEffect, useState, useCallback } from "react";
import { api } from "./lib/api";
import { useAuth } from "./context/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, Receipt, Send } from "lucide-react";

export default function Bills() {
  const { user } = useAuth();
  const [bills, setBills] = useState([]);
  const [students, setStudents] = useState([]);
  const [show, setShow] = useState(false);
  const [name, setName] = useState(""); const [amount, setAmount] = useState(0); const [desc, setDesc] = useState("");
  const [charging, setCharging] = useState(null);
  const [selected, setSelected] = useState({});
  const sym = user?.currency_symbol || "$";

  const load = useCallback(async () => {
    const [b,s] = await Promise.all([api.get("/bills"), api.get("/students")]);
    setBills(b.data); setStudents(s.data);
  }, []);
  useEffect(()=>{ load(); },[load]);

  const create = async () => { await api.post("/bills",{name,amount:Number(amount),description:desc}); setName("");setAmount(0);setDesc("");setShow(false); load(); };
  const del = async (id) => { if(confirm("Delete?")){await api.delete(`/bills/${id}`); load();} };

  const charge = async () => {
    const ids = Object.keys(selected).filter(k=>selected[k]);
    if (ids.length===0) return toast.error("Select students");
    await api.post("/bills/charge",{bill_id: charging.bill_id, student_ids: ids});
    toast.success(`Charged ${ids.length}`); setCharging(null); setSelected({}); load();
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-teacher-heading text-3xl font-bold text-slate-900">Bills & Rent</h1>
        <button data-testid="new-bill-btn" onClick={()=>setShow(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"><Plus className="w-4 h-4"/> New bill</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bills.map(b=>(
          <div key={b.bill_id} className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-11 h-11 rounded-xl bg-red-50 grid place-items-center"><Receipt className="w-5 h-5 text-red-500"/></div>
              <button data-testid={`delete-bill-${b.bill_id}`} onClick={()=>del(b.bill_id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-4 h-4"/></button>
            </div>
            <div className="font-teacher-heading font-semibold text-slate-900">{b.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">{b.description}</div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-teacher-heading text-xl font-bold text-red-600">-{sym}{b.amount}</span>
              <button data-testid={`charge-bill-${b.bill_id}`} onClick={()=>{setCharging(b); setSelected(Object.fromEntries(students.map(s=>[s.student_id,true])));}} className="bg-slate-900 text-white px-3 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1"><Send className="w-3.5 h-3.5"/> Charge</button>
            </div>
          </div>
        ))}
        {bills.length===0 && <div className="col-span-3 text-center py-12 text-slate-400">No bills yet</div>}
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={()=>setShow(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e)=>e.stopPropagation()}>
            <h3 className="font-teacher-heading text-xl font-bold mb-4">New bill</h3>
            <div className="space-y-3">
              <Field label="Name (e.g. Desk Rent)"><input data-testid="bill-name" value={name} onChange={e=>setName(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"/></Field>
              <Field label="Amount"><input data-testid="bill-amount" type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"/></Field>
              <Field label="Description"><textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={2} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"/></Field>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={()=>setShow(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button data-testid="save-bill-btn" onClick={create} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium">Save</button>
            </div>
          </div>
        </div>
      )}

      {charging && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={()=>setCharging(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[85vh] flex flex-col" onClick={(e)=>e.stopPropagation()}>
            <h3 className="font-teacher-heading text-xl font-bold">Charge {charging.name} ({sym}{charging.amount})</h3>
            <div className="flex items-center gap-2 my-3 text-sm">
              <button onClick={()=>setSelected(Object.fromEntries(students.map(s=>[s.student_id,true])))} className="text-slate-700 underline">Select all</button>
              <button onClick={()=>setSelected({})} className="text-slate-700 underline">Clear</button>
            </div>
            <div className="overflow-auto flex-1 divide-y divide-slate-100 border border-slate-200 rounded-lg">
              {students.map(s=>(
                <label key={s.student_id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer text-sm">
                  <input type="checkbox" checked={!!selected[s.student_id]} onChange={(e)=>setSelected({...selected,[s.student_id]:e.target.checked})}/>
                  <span className="font-medium text-slate-900 flex-1">{s.name}</span>
                  <span className="text-slate-500">{sym}{(s.balance||0).toFixed(2)}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={()=>setCharging(null)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button data-testid="confirm-charge-bill" onClick={charge} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Charge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Field({label,children}){return <div><div className="text-xs text-slate-500 mb-1 font-medium">{label}</div>{children}</div>;}
