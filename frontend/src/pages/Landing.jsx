// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
import { Link } from "react-router-dom";
import { Coins, GraduationCap, Sparkles, Wallet, Briefcase, Store } from "lucide-react";
import { api } from "../lib/api";

export default function Landing() {

  const handleTeacherLogin = async () => {
    await api.post("/auth/google/session", { session_id: "test123" });
    window.location.href = "/teacher";
  };

  return (
    <div className="min-h-screen bg-slate-50 grid-bg font-teacher-body">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-slate-900 grid place-items-center">
              <Coins className="w-5 h-5 text-yellow-300" strokeWidth={2.4} />
            </div>
            <span className="font-teacher-heading font-bold text-xl text-slate-900">
              My Classroom Economy
            </span>
          </div>

          <Link
            to="/student-login"
            data-testid="student-portal-link"
            className="text-sm font-medium text-slate-700 hover:text-slate-900"
          >
            Student portal →
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-slate-600 bg-white border border-slate-200 rounded-full px-3 py-1 mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            Classroom economy, simplified
          </div>

          <h1 className="font-teacher-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.05]">
            Turn your classroom into a real-world economy.
          </h1>

          <p className="mt-5 text-base text-slate-600 max-w-lg">
            Issue salaries, run a store, charge bills, and reward positive behavior.
            Students learn money skills while you cut the paperwork.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={handleTeacherLogin}
              data-testid="teacher-google-signin"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-medium px-5 py-3 rounded-lg transition-colors"
            >
              <GraduationCap className="w-4 h-4" />
              Sign in as Teacher (Google)
            </button>

            <Link
              to="/student-login"
              data-testid="student-cta"
              className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-900 font-medium px-5 py-3 rounded-lg transition-colors"
            >
              I'm a student
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
            {[
              { icon: Briefcase, label: "Jobs & salaries" },
              { icon: Store, label: "Classroom store" },
              { icon: Wallet, label: "Bills & budgeting" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="bg-white border border-slate-200 rounded-xl p-3"
              >
                <Icon className="w-5 h-5 text-slate-700 mb-2" />
                <div className="text-xs text-slate-600 font-medium">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 bg-gradient-to-br from-yellow-200/50 to-blue-200/40 rounded-[2rem] blur-2xl" />

          <div className="relative card-brutal p-8 font-student bg-yellow-300">
            <div className="text-sm font-bold text-black/70">
              YOUR BALANCE
            </div>

            <div className="text-7xl font-bold text-black mt-1 leading-none">
              $ 248
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              {[
                { l: "Salary", v: "+25" },
                { l: "Bonus", v: "+10" },
                { l: "Rent", v: "-5" },
              ].map((t) => (
                <div
                  key={t.l}
                  className="card-brutal bg-white p-3 text-center"
                >
                  <div className="text-xs font-bold text-black/60">
                    {t.l}
                  </div>

                  <div className="text-lg font-bold">
                    {t.v}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 inline-block btn-brutal">
              Spend at the store →
            </div>
          </div>

          <div className="absolute -bottom-6 -left-6 coin-bob text-5xl">
            🪙
          </div>
        </div>
      </main>
    </div>
  );
}
