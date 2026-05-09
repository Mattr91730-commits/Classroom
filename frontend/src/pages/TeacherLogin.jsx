import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";

export default function TeacherLogin() {

  const navigate = useNavigate();

  const [isSignup, setIsSignup] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = async () => {

    try {

      if (isSignup) {

        await api.post("/auth/teacher/signup", {
          name,
          email,
          password,
        });

      } else {

        await api.post("/auth/teacher/login", {
          email,
          password,
        });

      }

      navigate("/teacher");

    } catch (e) {

      alert(
        e?.response?.data?.detail || "Login failed"
      );

    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">

      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">

        <Link
          to="/"
          className="text-sm text-slate-500 hover:text-slate-700"
        >
          ← Back
        </Link>

        <h1 className="text-3xl font-bold mt-4 mb-6">
          {isSignup ? "Create Teacher Account" : "Teacher Login"}
        </h1>

        {isSignup && (
          <input
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-4 py-3 mb-4"
          />
        )}

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 mb-4"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 mb-4"
        />

        <button
          onClick={submit}
          className="w-full bg-slate-900 text-white rounded-lg py-3 font-medium"
        >
          {isSignup ? "Create Account" : "Login"}
        </button>

        <button
          onClick={() => setIsSignup(!isSignup)}
          className="w-full mt-4 text-sm text-slate-600 underline"
        >
          {isSignup
            ? "Already have an account?"
            : "Create an account"}
        </button>

      </div>
    </div>
  );
}
