import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  Mail,
  Plus,
  Search,
  ShieldCheck,
  UserPlus,
  Users,
  X,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Power,
  AlertTriangle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type TeamRole = "ADMIN" | "STAFF";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  is_active: boolean;
  createdAt: string | null;
};

type TeamFormData = {
  name: string;
  email: string;
  password: string;
  role: TeamRole;
};

const API_URL = import.meta.env.VITE_API_URL;

const emptyForm: TeamFormData = {
  name: "",
  email: "",
  password: "",
  role: "STAFF",
};

const formatDate = (date: string | null) => {
  if (!date) return "Not available";
  return new Date(date).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const AdminManagement = () => {
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | TeamRole>("ALL");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<TeamFormData>(emptyForm);
  const [memberToChange, setMemberToChange] = useState<StaffMember | null>(null);
  const [showCreatedModal, setShowCreatedModal] = useState(false);

  const {
    data: staff = [],
    isLoading: loading,
    refetch: loadTeamMembers,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["admin-team-members"],
    queryFn: async (): Promise<StaffMember[]> => {
      if (!API_URL) throw new Error("VITE_API_URL is not configured.");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.access_token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const response = await fetch(`${API_URL}/users/admin/team`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to load team members.");
      }

      return result.data ?? [];
    },
  });

  const createMemberMutation = useMutation({
    mutationFn: async (payload: TeamFormData & { name: string; email: string }) => {
      if (!API_URL) throw new Error("VITE_API_URL is not configured.");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.access_token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const response = await fetch(`${API_URL}/users/admin/team`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to create the team account.");
      }

      return result;
    },
    onSuccess: async (result) => {
      setSuccess(result.message || "Team account created successfully.");
      setFormData(emptyForm);
      setShowModal(false);
      setShowCreatedModal(true);
      toast.success(result.message || "Team account created successfully.");
      await queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to create the team account.");
      toast.error(err.message || "Failed to create the team account.");
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ member, isActive }: { member: StaffMember; isActive: boolean }) => {
      if (!API_URL) throw new Error("VITE_API_URL is not configured.");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;
      if (!session?.access_token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const response = await fetch(`${API_URL}/users/admin/team/${member.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_active: isActive }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${isActive ? "reactivate" : "deactivate"} team member.`);
      }

      return { result, isActive };
    },
    onSuccess: async ({ result, isActive }) => {
      const message = result.message || `Team member ${isActive ? "reactivated" : "deactivated"} successfully.`;
      setSuccess(message);
      setMemberToChange(null);
      toast.success(message);
      await queryClient.invalidateQueries({ queryKey: ["admin-team-members"] });
    },
    onError: (err: Error) => {
      setError(err.message || "Failed to update team member status.");
      toast.error(err.message || "Failed to update team member status.");
    },
  });

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const closeModal = () => {
    if (createMemberMutation.isPending) return;
    setShowModal(false);
    setFormData(emptyForm);
  };

  const requestStatusChange = (member: StaffMember) => {
    setMemberToChange(member);
  };

  const handleAddStaff = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();

    if (!name || !email || !formData.password) {
      setError("Please complete all required fields.");
      toast.error("Please complete all required fields.");
      return;
    }

    if (formData.password.length < 8) {
      setError("The password must contain at least 8 characters.");
      toast.error("The password must contain at least 8 characters.");
      return;
    }

    createMemberMutation.mutate({ ...formData, name, email });
  };

  const handleToggleStatus = (member: StaffMember) => {
    statusMutation.mutate({ member, isActive: !member.is_active });
  };

  const submitting = createMemberMutation.isPending;
  const changingMemberId = statusMutation.isPending
    ? statusMutation.variables?.member.id ?? null
    : null;

  const filteredStaff = useMemo(() => {
    const query = search.trim().toLowerCase();
    return staff.filter((member) => {
      const matchesSearch =
        member.name.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query);
      const matchesRole = roleFilter === "ALL" || member.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staff, search, roleFilter]);

  const adminCount = staff.filter((member) => member.role === "ADMIN").length;
  const staffCount = staff.filter((member) => member.role === "STAFF").length;

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">Admin Panel</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Team Management
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage administrator and staff accounts.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
              setShowModal(true);
            }}
            className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <Plus size={18} />
            Add Team Member
          </button>
        </div>

        {/* Feedback */}
        {(error || isError) && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p>{error || (queryError instanceof Error ? queryError.message : "Unable to load team members. Try refreshing.")}</p>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
          >
            <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Total Team Members"
            value={staff.length}
            icon={<Users size={22} />}
            loading={loading}
          />
          <StatCard
            title="Administrators"
            value={adminCount}
            icon={<ShieldCheck size={22} />}
            loading={loading}
          />
          <StatCard
            title="Staff Members"
            value={staffCount}
            icon={<UserPlus size={22} />}
            loading={loading}
          />
        </div>

        {/* Search and filters */}
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email..."
                className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as "ALL" | TeamRole)
              }
              aria-label="Filter by role"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-gray-900"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
            </select>
            <button
              type="button"
              onClick={() => void loadTeamMembers()}
              disabled={loading || changingMemberId !== null}
              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Team Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Role
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Added
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-14 text-center">
                      <LoaderCircle
                        size={24}
                        className="mx-auto animate-spin text-gray-400"
                      />
                      <p className="mt-3 text-sm text-gray-500">
                        Loading team members...
                      </p>
                    </td>
                  </tr>
                ) : filteredStaff.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-14 text-center text-sm text-gray-500"
                    >
                      {error
                        ? "Unable to load team members. Try refreshing."
                        : "No team members found."}
                    </td>
                  </tr>
                ) : (
                  filteredStaff.map((member) => (
                    <tr
                      key={member.id}
                      className="transition hover:bg-gray-50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={member.name} />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900">
                              {member.name}
                            </p>
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                              <Mail size={13} />
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={member.role} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge isActive={member.is_active} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(member.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusActionButton
                          member={member}
                          busy={changingMemberId === member.id}
                          disabled={changingMemberId !== null}
                          onClick={() => requestStatusChange(member)}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {loading ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
              <LoaderCircle
                size={24}
                className="mx-auto animate-spin text-gray-400"
              />
              <p className="mt-3 text-sm text-gray-500">
                Loading team members...
              </p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
              {error
                ? "Unable to load team members. Try refreshing."
                : "No team members found."}
            </div>
          ) : (
            filteredStaff.map((member) => (
              <div
                key={member.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={member.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-gray-900">
                      {member.name}
                    </p>
                    <p className="mt-1 break-all text-xs text-gray-500">
                      {member.email}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <RoleBadge role={member.role} />
                      <StatusBadge isActive={member.is_active} />
                    </div>
                    <p className="mt-3 text-xs text-gray-400">
                      Added: {formatDate(member.createdAt)}
                    </p>
                    <StatusActionButton
                      member={member}
                      busy={changingMemberId === member.id}
                      disabled={changingMemberId !== null}
                      onClick={() => requestStatusChange(member)}
                      fullWidth
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create team member modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="team-modal-title"
            className="my-8 w-full max-w-md rounded-2xl bg-white shadow-xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2
                  id="team-modal-title"
                  className="font-semibold text-gray-900"
                >
                  Add Team Member
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Create a real administrator or staff account.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={submitting}
                aria-label="Close dialog"
                className="cursor-pointer rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddStaff}>
              <div className="space-y-4 p-5">
                <FormField label="Full Name">
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    autoComplete="name"
                    required
                    maxLength={100}
                    placeholder="Enter full name"
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Email Address">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                    required
                    maxLength={254}
                    placeholder="name@example.com"
                    className={inputClass}
                  />
                </FormField>
                <FormField label="Temporary Password">
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    className={inputClass}
                  />
                  <p className="mt-1.5 text-xs text-gray-500">
                    Provide the initial password securely. Do not reuse your
                    own password.
                  </p>
                </FormField>
                <FormField label="Role">
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </FormField>
                <div className="rounded-lg bg-blue-50 px-3 py-2.5 text-xs leading-5 text-blue-700">
                  This creates an actual Supabase Auth account and assigns its
                  application role. Only create accounts for authorized team
                  members.
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 p-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  {submitting ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {memberToChange && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget && changingMemberId === null) {
              setMemberToChange(null);
            }
          }}
        >
          <section role="alertdialog" aria-modal="true" aria-labelledby="status-confirm-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <AlertTriangle size={24} />
            </div>
            <h2 id="status-confirm-title" className="mt-4 text-lg font-semibold text-gray-900">
              {memberToChange.is_active ? "Deactivate account?" : "Reactivate account?"}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              {memberToChange.is_active
                ? `This will prevent ${memberToChange.email} from using their account until it is reactivated.`
                : `This will restore access for ${memberToChange.email}.`}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setMemberToChange(null)} disabled={changingMemberId !== null} className="cursor-pointer rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                Cancel
              </button>
              <button type="button" onClick={() => void handleToggleStatus(memberToChange)} disabled={changingMemberId !== null} className={`cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${memberToChange.is_active ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>
                {changingMemberId === memberToChange.id && <LoaderCircle size={16} className="animate-spin" />}
                {changingMemberId === memberToChange.id ? "Updating..." : memberToChange.is_active ? "Deactivate Account" : "Reactivate Account"}
              </button>
            </div>
          </section>
        </div>
      )}

      {showCreatedModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <section role="dialog" aria-modal="true" aria-labelledby="created-modal-title" className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
              <CheckCircle2 size={30} />
            </div>
            <h2 id="created-modal-title" className="mt-4 text-xl font-semibold text-gray-900">Team member created</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">The account has been created successfully and is now listed in team management.</p>
            <button type="button" onClick={() => setShowCreatedModal(false)} className="mt-6 w-full cursor-pointer rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800">
              Continue
            </button>
          </section>
        </div>
      )}
    </div>
  );
};

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-gray-900 focus:ring-1 focus:ring-gray-900";

function FormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function RoleBadge({ role }: { role: TeamRole }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        role === "ADMIN"
          ? "bg-blue-50 text-blue-700"
          : "bg-gray-100 text-gray-700"
      }`}
    >
      {role}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        isActive
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-700"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function StatusActionButton({
  member,
  busy,
  disabled,
  onClick,
  fullWidth = false,
}: {
  member: StaffMember;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer ${
        fullWidth ? "mt-4 w-full" : ""
      } cursor-pointer inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        member.is_active
          ? "border-red-200 text-red-700 hover:bg-red-50"
          : "border-green-200 text-green-700 hover:bg-green-50"
      }`}
    >
      {busy ? (
        <LoaderCircle size={16} className="cursor-pointer animate-spin" />
      ) : (
        <Power size={16} />
      )}
      {member.is_active ? "Deactivate" : "Reactivate"}
    </button>
  );
}

function StatCard({
  title,
  value,
  icon,
  loading,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {loading ? "—" : value}
          </p>
        </div>
        <div className="rounded-xl bg-gray-100 p-3">{icon}</div>
      </div>
    </div>
  );
}

export default AdminManagement;