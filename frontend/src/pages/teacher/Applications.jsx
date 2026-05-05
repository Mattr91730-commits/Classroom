import { useEffect, useState, useCallback } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Plus, Trash2, ClipboardList, ChevronDown } from "lucide-react";

export default function Applications() {
  const [apps, setApps] = useState([]);
  const [responses, setResponses] = useState([]);
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState([{ id: "q1", text: "" }]);
  const [openId, setOpenId] = useState(null);

  const load = useCallback(async () => {
    const [a, r] = await Promise.all([api.get("/applications"), api.get("/applications/responses/all")]);
    setApps(a.data); setResponses(r.data);
  }, []);
  useEffect(()=>{ load(); },[load]);

  const create = async () => {
    const qs = questions.map(q=>q.text.trim()).filter(Boolean);
    if (!title || qs.length===0) return toast.error("Title and at least 1 question");
    await api.post("/applications",{title, questions: qs});
    setTitle(""); setQuestions([{ id: `q-${Date.now()}`, text: "" }]); setShow(false); load();
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-teacher-heading text-3xl font-bold text-slate-900">Applications</h1>
        <button data-testid="new-application-btn" onClick={()=>setShow(true)} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2"><Plus className="w-4 h-4"/> New application</button>
      </div>

      <div className="space-y-3">
        {apps.map(a=>{
          const resp = responses.filter(r=>r.application_id===a.application_id);
          const open = openId === a.application_id;
          return (
            <div key={a.application_id} className="bg-white border border-slate-200 rounded-xl">
              <button onClick={()=>setOpenId(open?null:a.application_id)} className="w-full px-5 py-4 flex items-center justify-between text-left">
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-5 h-5 text-slate-400"/>
                  <div>
                    <div className="font-teacher-heading font-semibold text-slate-900">{a.title}</div>
                    <div className="text-xs text-slate-500">{a.questions.length} questions · {resp.length} response{resp.length!==1?'s':''}</div>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition ${open?'rotate-180':''}`}/>
              </button>
              {open && (
                <div className="border-t border-slate-100 px-5 py-4 space-y-3">
                  <div className="text-xs text-slate-500 font-medium">QUESTIONS</div>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700">{a.questions.map((q,i)=><li key={`${a.application_id}-q-${i}`}>{q}</li>)}</ol>
                  <div className="text-xs text-slate-500 font-medium pt-3">RESPONSES</div>
                  {resp.length===0 ? <div className="text-sm text-slate-400">No responses yet</div> : resp.map(r=>(
                    <div key={r.response_id} className="bg-slate-50 rounded-lg p-3">
                      <div className="font-medium text-sm text-slate-900 mb-2">{r.student_name} <span className="text-xs text-slate-400 font-normal">{new Date(r.submitted_at).toLocaleString()}</span></div>
                      <div className="space-y-1 text-sm">
                        {a.questions.map((q,i)=>(
                          <div key={`${r.response_id}-a-${i}`}><span className="text-slate-500">{q}:</span> <span className="text-slate-800">{r.answers[i] || "—"}</span></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {apps.length===0 && <div className="text-center py-12 text-slate-400">No applications yet</div>}
      </div>

      {show && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={()=>setShow(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg" onClick={(e)=>e.stopPropagation()}>
            <h3 className="font-teacher-heading text-xl font-bold mb-4">New application</h3>
            <div className="space-y-3">
              <Field label="Title (e.g. Banker application)"><input data-testid="app-title" value={title} onChange={e=>setTitle(e.target.value)} className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm"/></Field>
              <div>
                <div className="text-xs text-slate-500 mb-1 font-medium">Questions</div>
                {questions.map((q,i)=>(
                  <div key={q.id} className="flex gap-2 mb-2">
                    <input data-testid={`app-q-${i}`} value={q.text} onChange={e=>setQuestions(questions.map(x=>x.id===q.id?{...x,text:e.target.value}:x))} placeholder={`Question ${i+1}`} className="flex-1 border border-slate-200 rounded-md px-3 py-2 text-sm"/>
                    {questions.length>1 && <button onClick={()=>setQuestions(questions.filter(x=>x.id!==q.id))} className="px-2 text-red-500"><Trash2 className="w-4 h-4"/></button>}
                  </div>
                ))}
                <button data-testid="add-question" onClick={()=>setQuestions([...questions,{ id: `q-${Date.now()}-${questions.length}`, text: "" }])} className="text-sm text-slate-700 underline">+ Add question</button>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={()=>setShow(false)} className="px-4 py-2 text-sm text-slate-600">Cancel</button>
              <button data-testid="save-app-btn" onClick={create} className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium">Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function Field({label,children}){return <div><div className="text-xs text-slate-500 mb-1 font-medium">{label}</div>{children}</div>;}
