import { useEffect, useState } from "react";
import {
  ShoppingBag,
  CreditCard,
  Clock3,
  Package,
  Plus,
  ShieldPlus,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import { getProducts } from "../../services/productServices";
import { supabase } from "../../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL;

type DashboardStats = {
  totalOrders: number;
  pendingPayments: number;
  processingOrders: number;
  totalProducts: number;
};

type AdminOrder = {
  id: string;
  status: string;
  total_amount: number;
  recipient_name: string;
  created_at: string;

  users?: {
    id: string;
    email: string;
    role: string;
  } | null;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalOrders: 0,
    pendingPayments: 0,
    processingOrders: 0,
    totalProducts: 0,
  });

  const [recentOrders, setRecentOrders] = useState<
    AdminOrder[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        // =====================================================
        // GET PRODUCTS
        // =====================================================

        const products = await getProducts();

        // =====================================================
        // GET AUTH SESSION
        // =====================================================

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Authentication required.");
        }

        const token = session.access_token;

        // =====================================================
        // GET ALL ADMIN ORDERS
        // =====================================================

        const ordersResponse = await fetch(
          `${API_URL}/orders/admin/all`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const ordersResult =
          await ordersResponse.json();

        if (!ordersResponse.ok) {
          throw new Error(
            ordersResult.message ||
              "Failed to fetch orders."
          );
        }

        const orders: AdminOrder[] =
          ordersResult.data || [];

        // =====================================================
        // GET PENDING PAYMENTS
        // =====================================================

        const paymentsResponse = await fetch(
          `${API_URL}/payments/pending`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const paymentsResult =
          await paymentsResponse.json();

        if (!paymentsResponse.ok) {
          throw new Error(
            paymentsResult.message ||
              "Failed to fetch pending payments."
          );
        }

        const pendingPayments =
          paymentsResult.data || [];

        // =====================================================
        // CALCULATE PROCESSING ORDERS
        // =====================================================

        const processingOrders = orders.filter(
          (order) =>
            order.status === "PROCESSING"
        );

        // =====================================================
        // SORT ORDERS BY NEWEST
        // =====================================================

        const sortedOrders = [...orders].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
        );

        // Keep only the latest 5
        setRecentOrders(
          sortedOrders.slice(0, 5)
        );

        // =====================================================
        // SET DASHBOARD STATS
        // =====================================================

        setStats({
          totalOrders: orders.length,
          pendingPayments: pendingPayments.length,
          processingOrders: processingOrders.length,
          totalProducts: products.length,
        });
      } catch (error) {
        console.error(
          "Error loading dashboard:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  // =========================================================
  // STATUS BADGE
  // =========================================================

  const getStatusClasses = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-50 text-green-700";

      case "PROCESSING":
        return "bg-purple-50 text-purple-700";

      case "READY_TO_SHIP":
        return "bg-orange-50 text-orange-700";

      case "SHIPPED":
        return "bg-blue-50 text-blue-700";

      case "DELIVERED":
        return "bg-green-50 text-green-700";

      case "READY_FOR_PICKUP":
        return "bg-indigo-50 text-indigo-700";

      case "PICKED_UP":
        return "bg-green-50 text-green-700";

      case "PENDING_PAYMENT":
        return "bg-yellow-50 text-yellow-700";

      case "PAYMENT_FAILED":
        return "bg-red-50 text-red-700";

      case "CANCELLED":
        return "bg-red-50 text-red-700";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  // =========================================================
  // FORMAT STATUS
  // =========================================================

  const formatStatus = (status: string) => {
    return status.replaceAll("_", " ");
  };

  // =========================================================
  // FORMAT CURRENCY
  // =========================================================

  const formatCurrency = (amount: number) => {
    return `₱${Number(amount).toLocaleString(
      "en-PH",
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }
    )}`;
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString(
      "en-PH",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-8">
          <p className="text-sm font-medium text-gray-500">
            Admin Panel
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-gray-600 sm:text-base">
            Manage orders, payments, products, and
            store operations.
          </p>
        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* TOTAL ORDERS */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-500">
                  Total Orders
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {loading
                    ? "—"
                    : stats.totalOrders}
                </p>
              </div>

              <div className="rounded-xl bg-gray-100 p-3">
                <ShoppingBag
                  size={22}
                  className="text-gray-700"
                />
              </div>

            </div>

            <p className="mt-4 text-xs text-gray-500">
              Orders from your store
            </p>
          </div>

          {/* PENDING PAYMENTS */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-500">
                  Pending Payments
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {loading
                    ? "—"
                    : stats.pendingPayments}
                </p>
              </div>

              <div className="rounded-xl bg-yellow-50 p-3">
                <CreditCard
                  size={22}
                  className="text-yellow-600"
                />
              </div>

            </div>

            <p className="mt-4 text-xs text-gray-500">
              Payments waiting for verification
            </p>
          </div>

          {/* PROCESSING */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-500">
                  Processing
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {loading
                    ? "—"
                    : stats.processingOrders}
                </p>
              </div>

              <div className="rounded-xl bg-purple-50 p-3">
                <Clock3
                  size={22}
                  className="text-purple-600"
                />
              </div>

            </div>

            <p className="mt-4 text-xs text-gray-500">
              Orders currently being prepared
            </p>
          </div>

          {/* PRODUCTS */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm text-gray-500">
                  Products
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {loading
                    ? "—"
                    : stats.totalProducts}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 p-3">
                <Package
                  size={22}
                  className="text-blue-600"
                />
              </div>

            </div>

            <p className="mt-4 text-xs text-gray-500">
              Products in your catalog
            </p>
          </div>

        </div>

        {/* =================================================
            QUICK ACTIONS
        ================================================= */}

        <section className="mt-8">

          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Common store management actions
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* ADD PRODUCT */}

            <Link
              to="/admin/products/new"
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">

                <div className="rounded-xl bg-gray-100 p-3">
                  <Plus size={21} />
                </div>

                <ArrowRight
                  size={18}
                  className="text-gray-400 transition group-hover:translate-x-1"
                />

              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                Add Product
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Add a new product to the store catalog.
              </p>

              <p className="mt-3 text-xs font-medium text-gray-900">
                Add product →
              </p>
            </Link>

            {/* ADD ADMIN */}

            <button
              type="button"
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">

                <div className="rounded-xl bg-gray-100 p-3">
                  <ShieldPlus size={21} />
                </div>

                <ArrowRight
                  size={18}
                  className="text-gray-400 transition group-hover:translate-x-1"
                />

              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                Add Admin
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Manage administrator accounts.
              </p>

              <p className="mt-3 text-xs font-medium text-gray-400">
                Coming soon
              </p>
            </button>

            {/* MANAGE ORDERS */}

            <Link
              to="/admin/orders"
              className="group rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">

                <div className="rounded-xl bg-gray-100 p-3">
                  <ShoppingBag size={21} />
                </div>

                <ArrowRight
                  size={18}
                  className="text-gray-400 transition group-hover:translate-x-1"
                />

              </div>

              <h3 className="mt-4 font-semibold text-gray-900">
                Manage Orders
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Review orders and manage fulfillment.
              </p>

              <p className="mt-3 text-xs font-medium text-gray-900">
                View orders →
              </p>
            </Link>

          </div>
        </section>

        {/* =================================================
            RECENT ORDERS
        ================================================= */}

        <section className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* HEADER */}

          <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="font-semibold text-gray-900">
                Recent Orders
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Your latest customer orders
              </p>
            </div>

            <Link
              to="/admin/orders"
              className="text-sm font-medium text-gray-900 hover:underline"
            >
              View all orders →
            </Link>

          </div>

          {/* ORDER LIST */}

          <div className="divide-y divide-gray-100">

            {/* LOADING */}

            {loading && (
              <div className="p-8 text-center">
                <p className="text-sm text-gray-500">
                  Loading recent orders...
                </p>
              </div>
            )}

            {/* EMPTY */}

            {!loading &&
              recentOrders.length === 0 && (
                <div className="p-8 text-center">

                  <ShoppingBag
                    size={32}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-3 text-sm text-gray-500">
                    No orders yet.
                  </p>

                </div>
              )}

            {/* ORDERS */}

            {!loading &&
              recentOrders.length > 0 &&
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-gray-50 sm:flex-row sm:items-center sm:justify-between"
                >

                  {/* LEFT */}

                  <div className="min-w-0">

                    <div className="flex flex-wrap items-center gap-2">

                      <p className="font-medium text-gray-900">
                        #
                        {order.id
                          .slice(0, 8)
                          .toUpperCase()}
                      </p>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                          order.status
                        )}`}
                      >
                        {formatStatus(
                          order.status
                        )}
                      </span>

                    </div>

                    <p className="mt-1 truncate text-sm font-medium text-gray-700">
                      {order.recipient_name}
                    </p>

                    {order.users?.email && (
                      <p className="mt-0.5 truncate text-xs text-gray-400">
                        {order.users.email}
                      </p>
                    )}

                  </div>

                  {/* RIGHT */}

                  <div className="flex items-center justify-between gap-6 sm:justify-end">

                    <div className="text-left sm:text-right">

                      <p className="font-semibold text-gray-900">
                        {formatCurrency(
                          order.total_amount
                        )}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {formatDate(
                          order.created_at
                        )}
                      </p>

                    </div>

                    <Link
                      to="/admin/orders"
                      className="shrink-0 text-sm font-medium text-gray-700 hover:text-gray-900 hover:underline"
                    >
                      View
                    </Link>

                  </div>

                </div>
              ))}

          </div>
        </section>

      </div>
    </div>
  );
};

export default AdminDashboard;