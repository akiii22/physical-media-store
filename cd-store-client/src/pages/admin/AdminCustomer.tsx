import { useMemo, useState } from "react";
import {
  Search,
  Users,
  ShoppingBag,
  UserCheck,
  UserPlus,
  Mail,
  Phone,
  X,
} from "lucide-react";

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  orders: number;
  totalSpent: number;
  status: "Active" | "New";
  joined: string;
};

const customers: Customer[] = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    email: "juan.delacruz@example.com",
    phone: "0917 123 4567",
    orders: 8,
    totalSpent: 4850,
    status: "Active",
    joined: "September 12, 2026",
  },
  {
    id: 2,
    name: "Maria Santos",
    email: "maria.santos@example.com",
    phone: "0918 234 5678",
    orders: 5,
    totalSpent: 3290,
    status: "Active",
    joined: "September 18, 2026",
  },
  {
    id: 3,
    name: "Pedro Reyes",
    email: "pedro.reyes@example.com",
    phone: "0919 345 6789",
    orders: 3,
    totalSpent: 2150,
    status: "Active",
    joined: "September 21, 2026",
  },
  {
    id: 4,
    name: "Ana Garcia",
    email: "ana.garcia@example.com",
    phone: "0920 456 7890",
    orders: 1,
    totalSpent: 850,
    status: "New",
    joined: "September 28, 2026",
  },
  {
    id: 5,
    name: "Mark Villanueva",
    email: "mark.v@example.com",
    phone: "0921 567 8901",
    orders: 6,
    totalSpent: 4120,
    status: "Active",
    joined: "September 15, 2026",
  },
  {
    id: 6,
    name: "Sofia Mendoza",
    email: "sofia.mendoza@example.com",
    phone: "0922 678 9012",
    orders: 2,
    totalSpent: 1490,
    status: "New",
    joined: "September 26, 2026",
  },
];

const money = (amount: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);

const AdminCustomers = () => {
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const filteredCustomers = useMemo(() => {
    const query = search.toLowerCase().trim();

    if (!query) return customers;

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone.toLowerCase().includes(query),
    );
  }, [search]);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active",
  ).length;
  const newCustomers = customers.filter(
    (customer) => customer.status === "New",
  ).length;
  const totalOrders = customers.reduce(
    (total, customer) => total + customer.orders,
    0,
  );

  return (
    <div className="min-h-full p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-pink-500">
            Customer Management
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            Customers
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            View and manage customers who shop at Physical Media Store.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total Customers
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {totalCustomers}
                </p>
              </div>

              <div className="rounded-xl bg-gray-100 p-3">
                <Users size={21} className="text-gray-700" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Active Customers
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {activeCustomers}
                </p>
              </div>

              <div className="rounded-xl bg-green-50 p-3">
                <UserCheck size={21} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  New Customers
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {newCustomers}
                </p>
              </div>

              <div className="rounded-xl bg-pink-50 p-3">
                <UserPlus size={21} className="text-pink-500" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">
                  Total Orders
                </p>
                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {totalOrders}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3">
                <ShoppingBag size={21} className="text-blue-600" />
              </div>
            </div>
          </div>

        </div>

        {/* Customer table */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Search */}
          <div className="border-b border-gray-200 p-4 sm:p-5">
            <div className="relative max-w-md">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search customers..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-gray-400 focus:bg-white"
              />
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Contact
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Orders
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total Spent
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>

                  <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Joined
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    onClick={() => setSelectedCustomer(customer)}
                    className="cursor-pointer transition hover:bg-gray-50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                          {customer.name
                            .split(" ")
                            .map((name) => name[0])
                            .slice(0, 2)
                            .join("")}
                        </div>

                        <div>
                          <p className="font-medium text-gray-900">
                            {customer.name}
                          </p>

                          <p className="text-xs text-gray-400">
                            Customer #{customer.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <p className="text-sm text-gray-700">
                        {customer.email}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {customer.phone}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-sm font-medium text-gray-900">
                      {customer.orders}
                    </td>

                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                      {money(customer.totalSpent)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          customer.status === "Active"
                            ? "bg-green-50 text-green-700"
                            : "bg-pink-50 text-pink-600"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-500">
                      {customer.joined}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y divide-gray-100 md:hidden">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                onClick={() => setSelectedCustomer(customer)}
                className="w-full p-4 text-left transition hover:bg-gray-50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white">
                    {customer.name
                      .split(" ")
                      .map((name) => name[0])
                      .slice(0, 2)
                      .join("")}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {customer.name}
                        </p>

                        <p className="mt-1 truncate text-xs text-gray-500">
                          {customer.email}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${
                          customer.status === "Active"
                            ? "bg-green-50 text-green-700"
                            : "bg-pink-50 text-pink-600"
                        }`}
                      >
                        {customer.status}
                      </span>
                    </div>

                    <div className="mt-3 flex gap-5 text-xs text-gray-500">
                      <span>{customer.orders} orders</span>
                      <span>{money(customer.totalSpent)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Empty state */}
          {filteredCustomers.length === 0 && (
            <div className="px-6 py-16 text-center">
              <Users
                size={32}
                className="mx-auto text-gray-300"
              />

              <h3 className="mt-4 font-semibold text-gray-900">
                No customers found
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Try searching with a different name or email.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* Customer drawer */}
      {selectedCustomer && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setSelectedCustomer(null)}
          />

          <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md overflow-y-auto bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-pink-500">
                  Customer Details
                </p>

                <h2 className="mt-1 text-lg font-bold text-gray-900">
                  {selectedCustomer.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">

              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-900 text-xl font-bold text-white">
                  {selectedCustomer.name
                    .split(" ")
                    .map((name) => name[0])
                    .slice(0, 2)
                    .join("")}
                </div>

                <div>
                  <h3 className="font-bold text-gray-900">
                    {selectedCustomer.name}
                  </h3>

                  <span
                    className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                      selectedCustomer.status === "Active"
                        ? "bg-green-50 text-green-700"
                        : "bg-pink-50 text-pink-600"
                    }`}
                  >
                    {selectedCustomer.status}
                  </span>
                </div>
              </div>

              {/* Contact */}
              <div className="rounded-xl border border-gray-200 p-4">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Contact Information
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail size={17} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {selectedCustomer.email}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone size={17} className="text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {selectedCustomer.phone}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Orders
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {selectedCustomer.orders}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs text-gray-500">
                    Total Spent
                  </p>

                  <p className="mt-1 text-xl font-bold text-gray-900">
                    {money(selectedCustomer.totalSpent)}
                  </p>
                </div>
              </div>

              {/* Account information */}
              <div className="rounded-xl border border-gray-200 p-4">
                <h3 className="mb-3 font-semibold text-gray-900">
                  Account Information
                </h3>

                <div className="flex justify-between border-b border-gray-100 py-2 text-sm">
                  <span className="text-gray-500">
                    Customer ID
                  </span>

                  <span className="font-medium text-gray-900">
                    #{selectedCustomer.id}
                  </span>
                </div>

                <div className="flex justify-between py-2 text-sm">
                  <span className="text-gray-500">
                    Joined
                  </span>

                  <span className="font-medium text-gray-900">
                    {selectedCustomer.joined}
                  </span>
                </div>
              </div>

            </div>
          </aside>
        </>
      )}
    </div>
  );
};

export default AdminCustomers;