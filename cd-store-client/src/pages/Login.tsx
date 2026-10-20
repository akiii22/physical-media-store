
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

type UserRole = "ADMIN" | "STAFF" | "CUSTOMER";

type LoginVariables = {
  email: string;
  password: string;
};

type LoginResult = {
  role: UserRole;
};

const API_URL = import.meta.env.VITE_API_URL;

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation<LoginResult, Error, LoginVariables>({
    mutationFn: async ({ email, password }) => {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) throw authError;

      const session = authData.session;

      if (!authData.user || !session) {
        throw new Error("Unable to retrieve your session.");
      }

      if (!API_URL) {
        throw new Error("The API URL is not configured.");
      }

      let response: Response;

      try {
        response = await fetch(
          `${API_URL.replace(/\/$/, "")}/users/me/role`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              Accept: "application/json",
            },
          }
        );
      } catch {
        throw new Error("Unable to connect to the server. Please try again.");
      }

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(
          result?.message || "Unable to retrieve your account role."
        );
      }

      const result: unknown = await response.json();

      if (
        typeof result !== "object" ||
        result === null ||
        !("role" in result) ||
        !["ADMIN", "STAFF", "CUSTOMER"].includes(
          String(result.role)
        )
      ) {
        throw new Error("Your account role is missing or unsupported.");
      }

      return { role: result.role as UserRole };
    },

    onSuccess: ({ role }) => {
      toast.success("Login successful!", {
        description: "Welcome back.",
      });

      if (role === "ADMIN" || role === "STAFF") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/products", { replace: true });
      }
    },

    onError: (error) => {
      toast.error("Login failed", {
        description: error.message || "Please check your credentials.",
      });
    },
  });

  const handleLogin = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    loginMutation.mutate({
      email: email.trim(),
      password,
    });
  };

  const isLoading = loginMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto h-12 w-12 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-lg">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <h2 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Please sign in to access your account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl border border-slate-100 sm:px-10">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 placeholder-slate-400 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-11 text-slate-900 placeholder-slate-400 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm font-semibold text-slate-700 hover:text-slate-900 hover:underline">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? "Logging in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold text-slate-900 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
