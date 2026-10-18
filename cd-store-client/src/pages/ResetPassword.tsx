
import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

type PasswordVariables = {
  password: string;
};

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isUpdated, setIsUpdated] = useState(false);

  useEffect(() => {
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY" && session) {
        setIsRecovery(true);
        setIsChecking(false);
      } else if (event === "SIGNED_OUT") {
        setIsRecovery(false);
        setIsChecking(false);
      }
    });

    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error || !data.session) {
        setIsRecovery(false);
      } else {
        setIsRecovery(true);
      }

      setIsChecking(false);
    };

    void checkSession();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const passwordMutation = useMutation<void, Error, PasswordVariables>({
    mutationFn: async ({ password }) => {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;
    },

    onSuccess: async () => {
      // Preserve the success screen even after signing out.
      setIsUpdated(true);
      setPassword("");
      setConfirmPassword("");

      toast.success("Password updated successfully!", {
        description: "You can now sign in using your new password.",
      });

      try {
        const { error } = await supabase.auth.signOut();

        if (error) {
          console.error("Sign-out after password reset failed:", error);
        }
      } catch (error) {
        console.error("Sign-out after password reset failed:", error);
      }
    },

    onError: (error) => {
      toast.error("Unable to update password", {
        description: error.message || "Please try again.",
      });
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (passwordMutation.isPending) return;

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("The passwords do not match.");
      return;
    }

    passwordMutation.mutate({ password });
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Verifying your recovery link...
      </div>
    );
  }

  if (isUpdated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <div className="w-full max-w-md rounded-2xl border border-slate-100 bg-white px-6 py-8 shadow-xl">
          <h1 className="text-2xl font-bold text-slate-900">
            Password updated
          </h1>

          <p className="mt-3 text-sm text-slate-600">
            Your password has been changed successfully. Please sign in
            using your new password.
          </p>

          <Link
            to="/login"
            className="mt-5 inline-block font-semibold text-slate-900 hover:underline"
          >
            Continue to login
          </Link>
        </div>
      </div>
    );
  }

  if (!isRecovery) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          Recovery link unavailable
        </h1>

        <p className="mt-2 max-w-md text-sm text-slate-600">
          This link may have expired or already been used. Request a new
          one to continue.
        </p>

        <Link
          to="/forgot-password"
          className="mt-5 font-semibold text-slate-900 hover:underline"
        >
          Request another reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-6 py-12">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-100 bg-white px-6 py-8 shadow-xl sm:px-10">
        <h1 className="text-center text-3xl font-extrabold text-slate-900">
          Reset password
        </h1>

        <p className="mt-2 text-center text-sm text-slate-600">
          Choose a new password for your account.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              New password
            </label>

            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-11 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />

              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 hover:text-slate-900"
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Confirm new password
            </label>

            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 pr-11 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              />

              <button
                type="button"
                onClick={() =>
                  setShowConfirmPassword((previous) => !previous)
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 hover:text-slate-900"
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
                aria-pressed={showConfirmPassword}
              >
                {showConfirmPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordMutation.isPending}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {passwordMutation.isPending
              ? "Updating..."
              : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;


