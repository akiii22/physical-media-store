
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  LockKeyhole,
  LogOut,
  Mail,
  Package,
  ShieldCheck,
  User,
  Phone,
  Save,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import {
  getMyProfile,
  updateMyProfile,
} from "../services/customerProfileService";

const Account = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
const [loadingProfile, setLoadingProfile] = useState(
  () => Boolean(user && role === "CUSTOMER"),
);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");


useEffect(() => {
  if (!user || role !== "CUSTOMER") {
    return;
  }

  let active = true;

  const loadProfile = async () => {
    try {
      setErrorMessage("");

      const profile = await getMyProfile();

      if (!active) return;

      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    } catch (error) {
      if (!active) return;

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load your profile.",
      );
    } finally {
      if (active) {
        setLoadingProfile(false);
      }
    }
  };

  void loadProfile();

  return () => {
    active = false;
  };
}, [user, role]);


  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    setSaving(true);

    try {
      const updatedProfile = await updateMyProfile(
        fullName.trim(),
        phone.trim(),
      );

      setFullName(updatedProfile.full_name ?? "");
      setPhone(updatedProfile.phone ?? "");
      setSuccessMessage("Your profile has been updated successfully.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      setErrorMessage("Unable to log out. Please try again.");
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
                  Update your personal information.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="account-email"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Email Address
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4">
                  <Mail size={18} className="shrink-0 text-gray-500" />

                  <input
                    id="account-email"
                    type="email"
                    value={user.email ?? ""}
                    readOnly
                    className="w-full bg-transparent py-3 text-sm text-gray-600 outline-none"
                  />
                </div>

                <p className="mt-1 text-xs text-gray-500">
                  Your email address cannot be changed here.
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label
                  htmlFor="account-full-name"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 focus-within:border-gray-500">
                  <User size={18} className="shrink-0 text-gray-500" />

                  <input
                    id="account-full-name"
                    type="text"
                    autoComplete="name"
                    maxLength={100}
                    value={fullName}
                    onChange={(event) => {
                      setFullName(event.target.value);
                      setSuccessMessage("");
                    }}
                    placeholder="Enter your full name"
                    disabled={loadingProfile || saving || role !== "CUSTOMER"}
                    required
                    className="w-full py-3 text-sm text-gray-900 outline-none disabled:cursor-not-allowed disabled:bg-white"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="account-phone"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Phone Number
                </label>

                <div className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 focus-within:border-gray-500">
                  <Phone size={18} className="shrink-0 text-gray-500" />

                  <input
                    id="account-phone"
                    type="tel"
                    autoComplete="tel"
                    maxLength={30}
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      setSuccessMessage("");
                    }}
                    placeholder="Enter your phone number"
                    disabled={loadingProfile || saving || role !== "CUSTOMER"}
                    className="w-full py-3 text-sm text-gray-900 outline-none disabled:cursor-not-allowed disabled:bg-white"
                  />
                </div>
              </div>

              {loadingProfile && (
                <p role="status" className="text-sm text-gray-500">
                  Loading your profile...
                </p>
              )}

              {errorMessage && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                >
                  {errorMessage}
                </p>
              )}

              {successMessage && (
                <p
                  role="status"
                  className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-700"
                >
                  {successMessage}
                </p>
              )}

              {role === "CUSTOMER" && (
                <button
                  type="submit"
                  disabled={loadingProfile || saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save size={17} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              )}
            </form>

            {/* Account Type */}
            <div className="mt-6 flex items-center gap-4 border-t border-gray-100 pt-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <ShieldCheck size={18} className="text-gray-600" />
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
          </section>

          {/* Quick Actions */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-950">
              Quick Actions
            </h2>

            <div className="mt-5 space-y-3">
              {role === "CUSTOMER" && (
                <button
                  type="button"
                  onClick={() => navigate("/my-orders")}
                  className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 p-4 text-left transition hover:border-gray-400 hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <Package size={18} className="text-gray-700" />
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

              <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <LockKeyhole size={18} className="text-gray-700" />
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
