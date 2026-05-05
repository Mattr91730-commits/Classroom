import { useState } from "react";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { X } from "lucide-react";

const PRESETS = ["Homework Complete","Class Participation","Helpful Behavior","Teamwork","Perfect Attendance","On-task","Bonus","Custom"];

export default function PayAllModal({ students, onClose, onDone }) {
  const { user } = useAuth();
  const [category, setCategory] = useState("Homework Complete");
  const [customCat, setCustomCat] = useState("");
  const [amount, setAmount] = useState(5);
  const [isFine, setIsFine] = useState(false);
  const [note, setNote] = useState("");
  const [selected, setSelected] = useState({});
  const sym = user?.currency_symbol || "$";

  const allSelected = students.length > 0 && students.every(s=>selected[s.student_id]);
  const toggleAll = () => setSelected(allSelected ? {} : Object.fromEntries(students.map(s=>[s.student_id,true])));

  const submit = async () => {
    const ids = Object.keys(selected).filter(k=>selected[k]);
    if (ids.length===0) return toast.error("Select students");
    if (!amount || amount <= 0) return toast.error("Enter amount");
    const cat = category === "Custom" ? customCat || "Custom" : category;
    await api.post("/pay-all",{ category: cat, amount: Number(amount), student_ids: ids, is_fine: isFine, note });
    toast.success(`${isFine?'Fined':'Paid'} ${ids.length} students`);
    onDone(); onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e)=>e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-teacher-heading text-xl font-bold">Pay All</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X className="w-5 h-5"/></button>
        </div>
        <div className="px-6 py-4 space-y-3 border-b border-slate-200">
          <Field label="What are you paying for?">
            <select data-testid="pay-all-category" value={category} onChange={e=>setCategory(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
              {PRESETS.map(p=><option key={p}>{p}</option>)}
            </select>
            {category==="Custom" && <input value={customCat} onChange={e=>setCustomCat(e.target.value)} placeholder="Enter category" className="mt-2 w-full border border-slate-200 rounded-md px-3 py-2 text-sm"/>}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Amount"><input data-testid="pay-all-amount" type="number" value={amount} onChange={e=>setAmount(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"/></Field>
            <Field label="Type">
              <div className="flex gap-2 mt-0.5">
                <button data-testid="pay-all-bonus" onClick={()=>setIsFine(false)} className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border ${!isFine?'bg-emerald-600 text-white border-emerald-600':'bg-white border-slate-200 text-slate-600'}`}>Bonus</button>
                <button data-testid="pay-all-fine" onClick={()=>setIsFine(true)} className={`flex-1 px-3 py-2 rounded-md text-sm font-medium border ${isFine?'bg-red-600 text-white border-red-600':'bg-white border-slate-200 text-slate-600'}`}>Fine</button>
              </div>
            </Field>
          </div>
          <Field label="Note (optional)"><input value={note} onChange={e=>setNote(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"/></Field>
        </div>
        <div className="px-6 py-3 border-b border-slate-200 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input data-testid="select-all" type="checkbox" checked={allSelected} onChange={toggleAll}/>
            <span className="font-medium">Select all ({students.length})</span>
          </label>
          <span className="text-xs text-slate-500">{Object.values(selected).filter(Boolean).length} selected</span>
        </div>
        <div className="overflow-auto flex-1 divide-y divide-slate-100 px-6">
          {students.map(s=>(
            <label key={s.student_id} className="flex items-center gap-3 py-2 cursor-pointer">
              <input data-testid={`pay-all-check-${s.student_id}`} type="checkbox" checked={!!selected[s.student_id]} onChange={(e)=>setSelected({...selected,[s.student_id]:e.target.checked})}/>
              <span className="font-medium text-slate-900 flex-1">{s.name}</span>
              <span className="text-sm text-slate-500">{sym}{(s.balance||0).toFixed(2)}</span>
            </label>
          ))}
        </div>
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
          <button data-testid="pay-all-submit" onClick={submit} className={`px-5 py-2 rounded-lg text-sm font-medium text-white ${isFine?'bg-red-600 hover:bg-red-700':'bg-emerald-600 hover:bg-emerald-700'}`}>{isFine?'Apply Fines':'Pay Bonus'}</button>
        </div>
      </div>
    </div>
  );
}
function Field({label,children}){return <div><div className="text-xs text-slate-500 mb-1 font-medium">{label}</div>{children}</div>;}
