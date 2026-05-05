import { useEffect, useState, useCallback } from "react";
import { api } from "./lib/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Briefcase, BookOpen, Library, Calculator, Coins, Hammer, Wrench, Pen, Mail, Star, Crown, Heart, Sun, Music, Trees, Beaker, Gamepad2, Trophy, Megaphone, Computer, ChefHat, Truck, Stethoscope } from "lucide-react";

export const JOB_ICONS = { Briefcase, BookOpen, Library, Calculator, Coins, Hammer, Wrench, Pen, Mail, Star, Crown, Heart, Sun, Music, Trees, Beaker, Gamepad2, Trophy, Megaphone, Computer, ChefHat, Truck, Stethoscope };

const COLORS = ["#FDE047","#86EFAC","#93C5FD","#FCA5A5","#FCD34D","#A5B4FC","#F9A8D4","#5EEAD4"];

export default function Jobs() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [apps, setApps] = useState([]);
  const [editing, setEditing] = useState(null);
  const sym = user?.currency_symbol || "$";

  const load = useCallback(async () => {
    const [j, a] = await Promise.all([api.get("/jobs"), api.get("/applications")]);
    setJobs(j.data); setApps(a.data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async (data) => {
    if (data.job_id) await api.put(`/jobs/${data.job_id}`, data);
    else await api.post("/jobs", data);
    toast.success("Saved"); setEditing(null); load();
  };
  const del = async (id) => { if(confirm("Delete job?")){ await api.delete(`/jobs/${id}`); load(); } };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-teacher-heading text-3xl font-bold text-slate-900">Jobs</h1>
        <button data-testid="new-job-btn" onClick={()=>setEditing({title:"",description:"",salary:10,icon:"Briefcase",color:"#FDE047",slots:1,application_id:null})} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"><Plus className="w-4 h-4"/> New job</button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map(j=>{
          const Icon = JOB_ICONS[j.icon] || Briefcase;
          return (
            <div key={j.job_id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-11 h-11 rounded-xl grid place-items-center" style={{background: j.color}}><Icon className="w-5 h-5 text-slate-900" strokeWidth={2.4}/></div>
                <div className="flex gap-1">
                  <button data-testid={`edit-job-${j.job_id}`} onClick={()=>setEditing(j)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600"><Pencil className="w-4 h-4"/></button>
                  <button data-testid={`delete-job-${j.job_id}`} onClick={()=>del(j.job_id)} className="p-1.5 hover:bg-red-50 rounded text-red-500"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
              <div className="font-teacher-heading font-semibold text-slate-900">{j.title}</div>
              <div className="text-xs text-slate-500 mt-0.5 line-clamp-2">{j.description || "—"}</div>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-emerald-600 font-semibold">{sym}{j.salary}/wk</span>
                <span className="text-slate-500">{j.slots} slot{j.slots>1?'s':''}</span>
              </div>
            </div>
          );
        })}
        {jobs.length === 0 && <div className="col-span-3 text-center py-12 text-slate-400">No jobs yet</div>}
      </div>

      {editing && <JobEditor job={editing} apps={apps} onClose={()=>setEditing(null)} onSave={save}/>}
    </div>
  );
}

function JobEditor({ job, apps, onClose, onSave }) {
  const [data, setData] = useState(job);
  return (
    <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-auto" onClick={(e)=>e.stopPropagation()}>
        <h3 className="font-teacher-heading text-xl font-bold mb-4">{job.job_id?'Edit job':'New job'}</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Title"><input data-testid="job-title" value={data.title} onChange={e=>setData({...data,title:e.target.value})} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"/></Field>
          <Field label="Salary (per pay cycle)"><input data-testid="job-salary" type="number" value={data.salary} onChange={e=>setData({...data,salary:Number(e.target.value)})} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"/></Field>
          <Field label="Slots"><input type="number" value={data.slots} onChange={e=>setData({...data,slots:Number(e.target.value)})} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"/></Field>
          <Field label="Required application">
            <select value={data.application_id||""} onChange={e=>setData({...data,application_id:e.target.value||null})} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm bg-white">
              <option value="">— None —</option>
              {apps.map(a=><option key={a.application_id} value={a.application_id}>{a.title}</option>)}
            </select>
          </Field>
          <div className="sm:col-span-2"><Field label="Description"><textarea value={data.description} onChange={e=>setData({...data,description:e.target.value})} rows={2} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"/></Field></div>
          <div className="sm:col-span-2">
            <div className="text-xs text-slate-500 mb-1 font-medium">Icon</div>
            <div className="flex flex-wrap gap-2">
              {Object.keys(JOB_ICONS).map(k=>{
                const I = JOB_ICONS[k];
                return <button key={k} data-testid={`icon-${k}`} onClick={()=>setData({...data,icon:k})} className={`w-10 h-10 rounded-lg grid place-items-center border-2 ${data.icon===k?'border-slate-900 bg-slate-100':'border-slate-200 hover:border-slate-300'}`}><I className="w-4 h-4"/></button>;
              })}
            </div>
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs text-slate-500 mb-1 font-medium">Color</div>
            <div className="flex gap-2">
              {COLORS.map(c=><button key={c} onClick={()=>setData({...data,color:c})} className={`w-8 h-8 rounded-full border-2 ${data.color===c?'border-slate-900':'border-transparent'}`} style={{background:c}}/>)}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
          <button data-testid="save-job-btn" onClick={()=>onSave(data)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium">Save</button>
        </div>
      </div>
    </div>
  );
}
function Field({label,children}){return <div><div className="text-xs text-slate-500 mb-1 font-medium">{label}</div>{children}</div>;}
