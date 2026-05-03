import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { JOB_ICONS } from "@/pages/teacher/Jobs";
import { Briefcase } from "lucide-react";

export default function StudentJobs() {
  const [jobs, setJobs] = useState([]);
  const [me, setMe] = useState(null);
  const [applying, setApplying] = useState(null);
  const [application, setApplication] = useState(null);
  const [answers, setAnswers] = useState([]);

  const load = async () => {
    const [j, m] = await Promise.all([api.get("/me/jobs-available"), api.get("/me/student")]);
    setJobs(j.data); setMe(m.data);
  };
  useEffect(()=>{ load(); },[]);

  const openApply = async (job) => {
    setApplying(job);
    if (job.application_id) {
      const r = await api.get(`/applications/${job.application_id}`);
      setApplication(r.data);
      setAnswers(new Array(r.data.questions.length).fill(""));
    } else {
      setApplication(null);
    }
  };

  const submitApplication = async () => {
    if (!application) { toast.success("Application submitted! Wait for teacher."); setApplying(null); return; }
    await api.post("/applications/submit", { application_id: application.application_id, answers });
    toast.success("Submitted! Your teacher will review it.");
    setApplying(null); setApplication(null); setAnswers([]);
  };

  return (
    <div>
      <h2 className="font-bold text-3xl mb-4">Jobs board</h2>
      {me?.job && (
        <div className="card-brutal bg-green-200 p-4 mb-5">
          <div className="font-bold">Your current job: {me.job.title} · +${me.job.salary}/week</div>
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {jobs.map(j=>{
          const Icon = JOB_ICONS[j.icon] || Briefcase;
          return (
            <div key={j.job_id} className="card-brutal bg-white p-5">
              <div className="w-14 h-14 rounded-xl border-[3px] border-black grid place-items-center mb-3" style={{background: j.color}}><Icon className="w-6 h-6 text-black" strokeWidth={3}/></div>
              <div className="font-bold text-lg">{j.title}</div>
              <div className="text-sm text-black/70 mt-1 line-clamp-3 min-h-10">{j.description || "—"}</div>
              <div className="mt-3 flex items-center justify-between">
                <div className="font-bold text-green-700">+${j.salary}/wk</div>
                <button data-testid={`apply-job-${j.job_id}`} onClick={()=>openApply(j)} className="btn-brutal text-sm">Apply</button>
              </div>
            </div>
          );
        })}
        {jobs.length===0 && <div className="col-span-3 text-center py-12 font-bold text-black/50">No jobs yet</div>}
      </div>

      {applying && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center z-50 p-4" onClick={()=>setApplying(null)}>
          <div className="card-brutal bg-white p-6 w-full max-w-lg max-h-[90vh] overflow-auto" onClick={(e)=>e.stopPropagation()}>
            <h3 className="font-bold text-2xl mb-2">Apply: {applying.title}</h3>
            {!application ? (
              <p className="mb-4">No questions for this job. Tap submit to apply!</p>
            ) : (
              <div className="space-y-3">
                {application.questions.map((q,i)=>(
                  <div key={`${application.application_id}-q-${i}`}>
                    <div className="font-bold text-sm mb-1">{i+1}. {q}</div>
                    <textarea data-testid={`answer-${i}`} value={answers[i]} onChange={e=>setAnswers(answers.map((a,j)=>j===i?e.target.value:a))} rows={2} className="input-brutal w-full"/>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={()=>setApplying(null)} className="btn-brutal bg-white">Cancel</button>
              <button data-testid="submit-application" onClick={submitApplication} className="btn-brutal bg-green-300">Submit</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
