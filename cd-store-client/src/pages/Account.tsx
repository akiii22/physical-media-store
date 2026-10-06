import {
  ArrowRight,
  LockKeyhole,
  LogOut,
  Mail,
  Package,
  ShieldCheck,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const Account = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
            <User size={24} className="text-gray-600" />
          </div>

          <h1 className="mt-5 text-xl font-bold text-gray-950">
            Sign in to view your account
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Please log in to access your account information and orders.
          </p>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="mt-6 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Go to Login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Page Header */}
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
            Account
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950 sm:text-4xl">
            My Account
          </h1>

          <p className="mt-3 text-gray-600">
            Manage your account information and view your orders.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Profile Card */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-100">
                <User size={22} className="text-gray-700" />
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-950">
                  Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Your account details.
                </p>
              </div>
            </div>

            <div className="mt-6 divide-y divide-gray-100 rounded-xl border border-gray-200">
              {/* Email */}
              <div className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Mail size={18} className="text-gray-600" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Email
                  </p>

                  <p className="mt-1 truncate text-sm font-medium text-gray-900">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Role */}
              <div className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <ShieldCheck
                    size={18}
                    className="text-gray-600"
                  />
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Account Type
                  </p>

                  <span className="mt-1 inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                    {role}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-950">
              Quick Actions
            </h2>

            <div className="mt-5 space-y-3">
              {/* Orders */}
              {role === "CUSTOMER" && (
                <button
                  type="button"
                  onClick={() => navigate("/my-orders")}
                  className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-4 text-left transition hover:border-gray-400 hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <Package
                      size={18}
                      className="text-gray-700"
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      My Orders
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500">
                      View your purchases
                    </p>
                  </div>

                  <ArrowRight
                    size={17}
                    className="text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-gray-700"
                  />
                </button>
              )}

              {/* Security */}
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <LockKeyhole
                    size={18}
                    className="text-gray-700"
                  />
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Security
                  </p>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Password managed through your account
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Account Actions */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3">
            <h2 className="text-lg font-semibold text-gray-950">
              Account Actions
            </h2>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Account;