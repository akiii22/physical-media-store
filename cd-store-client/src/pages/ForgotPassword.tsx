
import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const resetMutation = useMutation<void, Error, string>({
    mutationFn: async (emailAddress) => {
      const { error } = await supabase.auth.resetPasswordForEmail(
        emailAddress,
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Check your inbox", {
        description:
          "If an account exists for that email, a password reset link should arrive shortly. Check your spam folder too.",
        duration: 6000,
      });
    },
    onError: (error) => {
      toast.error("Unable to request password reset", {
        description: error.message || "Please try again later.",
      });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (resetMutation.isPending) return;

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      toast.error("Please enter your email address.");
      return;
    }

    resetMutation.mutate(normalizedEmail);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Forgot your password?
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Enter the email address associated with your account.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-2xl border border-slate-100 sm:px-10">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
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
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-slate-900 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 sm:text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={resetMutation.isPending}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {resetMutation.isPending
                ? "Sending..."
                : "Send reset link"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Remember your password?{" "}
            <Link
              to="/login"
              className="font-semibold text-slate-900 hover:underline"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
