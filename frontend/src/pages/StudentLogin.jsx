import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Delete } from "lucide-react";

export default function StudentLogin() {
  const [step, setStep] = useState(1);
  const [classroomUsername, setClassroomUsername] = useState("");
  const [classroomName, setClassroomName] = useState("");
  const [students, setStudents] = useState([]);
  const [studentId, setStudentId] = useState("");
  const [studentName, setStudentName] = useState("");
  const [pin, setPin] = useState("");
  const navigate = useNavigate();

  const findClassroom = async () => {
    if (!classroomUsername.trim()) return toast.error("Enter classroom code");
    try {
      const r = await api.get(`/auth/students-by-classroom/${classroomUsername.trim().toLowerCase()}`);
      setClassroomName(r.data.classroom_name);
      setStudents(r.data.students);
      setStep(2);
    } catch (e) {
      toast.error("Classroom not found");
    }
  };

  const submitPin = useCallback(async (pinValue) => {
    if (pinValue.length !== 4) return toast.error("Enter 4 digits");
    try {
      await api.post("/auth/student/login", {
        classroom_username: classroomUsername.trim().toLowerCase(),
        student_id: studentId,
        pin: pinValue,
      });
      navigate("/student");
      window.location.reload();
    } catch (e) {
      toast.error("Wrong PIN. Try again!");
      setPin("");
    }
  }, [classroomUsername, studentId, navigate]);

  useEffect(() => {
    if (pin.length === 4 && studentId) submitPin(pin);
  }, [pin, studentId, submitPin]);

  return (
    <div className="min-h-screen bg-yellow-100 font-student p-6 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-black/70 mb-4 hover:text-black">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        {step === 1 && (
          <div className="card-brutal p-7 bg-white">
            <h1 className="text-3xl font-bold mb-1">Hey, student! 👋</h1>
            <p className="text-black/70 mb-5">Enter your classroom code</p>
            <input
              data-testid="classroom-code-input"
              autoFocus
              placeholder="e.g. mrsmith"
              value={classroomUsername}
              onChange={(e) => setClassroomUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && findClassroom()}
              className="input-brutal w-full text-lg mb-4"
            />
            <button data-testid="find-classroom-btn" onClick={findClassroom} className="btn-brutal w-full text-lg">Find my class</button>
          </div>
        )}
        {step === 2 && (
          <div className="card-brutal p-7 bg-white">
            <h2 className="text-2xl font-bold mb-1">{classroomName}</h2>
            <p className="text-black/70 mb-4">Pick your name</p>
            <div className="grid gap-2 max-h-72 overflow-auto no-scrollbar">
              {students.map((s) => (
                <button
                  key={s.student_id}
                  data-testid={`student-pick-${s.student_id}`}
                  onClick={() => { setStudentId(s.student_id); setStudentName(s.name); setStep(3); }}
                  className="card-brutal bg-yellow-200 px-4 py-3 text-left font-bold hover:bg-yellow-300 transition"
                >
                  {s.name}
                </button>
              ))}
              {students.length === 0 && <div className="text-black/60">No students added yet. Ask your teacher!</div>}
            </div>
            <button onClick={() => setStep(1)} className="mt-4 text-sm underline">Wrong class?</button>
          </div>
        )}
        {step === 3 && (
          <div className="card-brutal p-7 bg-white">
            <h2 className="text-2xl font-bold mb-1">Hi, {studentName}!</h2>
            <p className="text-black/70 mb-4">Enter your 4-digit PIN</p>
            <div className="flex justify-center gap-3 mb-5">
              {[0,1,2,3].map(i=>(
                <div key={i} className={`w-12 h-14 grid place-items-center text-3xl font-bold border-[3px] border-black rounded-xl ${pin.length>i?'bg-green-300':'bg-white'}`}>
                  {pin[i] ? "•" : ""}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["1","2","3","4","5","6","7","8","9"].map(d=>(
                <button key={d} data-testid={`pin-${d}`} onClick={()=>pin.length<4 && setPin(pin+d)} className="btn-brutal text-2xl">{d}</button>
              ))}
              <button onClick={()=>setPin("")} className="btn-brutal bg-red-300 text-sm">Clear</button>
              <button data-testid="pin-0" onClick={()=>pin.length<4 && setPin(pin+"0")} className="btn-brutal text-2xl">0</button>
              <button onClick={()=>setPin(pin.slice(0,-1))} className="btn-brutal bg-blue-200 grid place-items-center"><Delete className="w-5 h-5"/></button>
            </div>
            <button onClick={()=>{setStep(2); setPin("");}} className="mt-4 text-sm underline">Not me?</button>
          </div>
        )}
      </div>
    </div>
  );
}
