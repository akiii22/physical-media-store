
import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Printer,
  RefreshCw,
  PhilippinePeso,
  ShoppingBag,
  Package,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const API_URL = import.meta.env.VITE_API_URL;

type SalesRow = {
  paymentId: string;
  orderId: string;
  orderDate: string | null;
  paidAt: string | null;
  customerName: string;
  paymentMethod: string;
  amount: number;
  itemsSold: number;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
};

type SalesReport = {
  startDate: string;
  endDate: string;
  totalSales: number;
  orderCount: number;
  itemsSold: number;
  rows: SalesRow[];
};

type ReportPeriod = "week" | "month" | "custom";

const getDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const getInitialDates = () => {
  const today = new Date();

  return {
    startDate: getDateString(
      new Date(today.getFullYear(), today.getMonth(), 1)
    ),
    endDate: getDateString(today),
  };
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
  }).format(amount);

const formatDate = (date: string | null) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const AdminSalesReports = () => {
  const initialDates = getInitialDates();

  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [startDate, setStartDate] = useState(initialDates.startDate);
  const [endDate, setEndDate] = useState(initialDates.endDate);

  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const setPeriodDates = (nextPeriod: ReportPeriod) => {
    setPeriod(nextPeriod);

    if (nextPeriod === "custom") return;

    const today = new Date();
    let start: Date;

    if (nextPeriod === "week") {
      // Monday is the first day of the week.
      const day = today.getDay();
      const daysSinceMonday = (day + 6) % 7;

      start = new Date(today);
      start.setDate(today.getDate() - daysSinceMonday);
    } else {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    }

    setStartDate(getDateString(start));
    setEndDate(getDateString(today));
  };

  const loadReport = useCallback(async () => {
    if (!startDate || !endDate) {
      setError("Please select both dates.");
      return;
    }

    if (startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!session?.access_token) {
        throw new Error("Your session has expired. Please log in again.");
      }

      const params = new URLSearchParams({
        startDate,
        endDate,
      });

      const response = await fetch(
        `${API_URL}/orders/admin/sales-reports?${params}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Failed to load sales report."
        );
      }

      setReport(result.data as SalesReport);
    } catch (err) {
      console.error("Sales report error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load sales report."
      );
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <p className="text-sm font-medium text-gray-500">
              Admin Panel
            </p>

            <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
              Sales Reports
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Review confirmed product sales for your selected period.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            disabled={!report || loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Printer size={18} />
            Print Report
          </button>
        </div>

        {/* Filters */}
        <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm print:hidden">
          <div className="mb-4 flex items-center gap-2">
            <CalendarDays size={20} className="text-gray-600" />

            <h2 className="font-semibold text-gray-900">
              Report Period
            </h2>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {(
              [
                ["week", "This Week"],
                ["month", "This Month"],
                ["custom", "Custom Range"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setPeriodDates(value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  period === value
                    ? "bg-gray-950 text-white"
                    : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
            <div>
              <label
                htmlFor="startDate"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Start Date
              </label>

              <input
                id="startDate"
                type="date"
                value={startDate}
                max={endDate}
                onChange={(event) => {
                  setPeriod("custom");
                  setStartDate(event.target.value);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                End Date
              </label>

              <input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate}
                max={getDateString(new Date())}
                onChange={(event) => {
                  setPeriod("custom");
                  setEndDate(event.target.value);
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-gray-500"
              />
            </div>

            <button
              type="button"
              onClick={() => void loadReport()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Generate Report
            </button>
          </div>
        </section>

        {/* Printable report content */}
        <div id="sales-report-print">
          <div className="mb-6 hidden print:block">
            <h1 className="text-2xl font-bold">Physical Media Store</h1>
            <h2 className="mt-1 text-xl font-semibold">Sales Report</h2>
            <p className="mt-2 text-sm">
              Period: {startDate} to {endDate}
            </p>
            <p className="text-sm">
              Generated: {new Date().toLocaleString("en-PH")}
            </p>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 print:hidden">
              {error}
            </div>
          )}

          {/* Summary cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Confirmed Sales</p>
                <div className="rounded-xl bg-green-50 p-3">
                  <PhilippinePeso
                    size={21}
                    className="text-green-700"
                  />
                </div>
              </div>

              <p className="mt-3 text-2xl font-bold text-gray-900">
                {loading
                  ? "Loading..."
                  : formatCurrency(report?.totalSales ?? 0)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Product payments confirmed in this period
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Paid Orders</p>
                <div className="rounded-xl bg-blue-50 p-3">
                  <ShoppingBag size={21} className="text-blue-700" />
                </div>
              </div>

              <p className="mt-3 text-2xl font-bold text-gray-900">
                {loading ? "Loading..." : report?.orderCount ?? 0}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Orders with confirmed product payments
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Items Sold</p>
                <div className="rounded-xl bg-purple-50 p-3">
                  <Package size={21} className="text-purple-700" />
                </div>
              </div>

              <p className="mt-3 text-2xl font-bold text-gray-900">
                {loading ? "Loading..." : report?.itemsSold ?? 0}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Units in confirmed orders
              </p>
            </div>
          </div>

          {/* Report table */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5">
              <h2 className="font-semibold text-gray-900">
                Sales Transactions
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {report
                  ? `${report.rows.length} payment record(s) found`
                  : "Transactions for the selected date range"}
              </p>
            </div>

            {loading ? (
              <div className="p-10 text-center text-sm text-gray-500 print:hidden">
                Loading sales report...
              </div>
            ) : report && report.rows.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-4">Order</th>
                      <th className="px-5 py-4">Customer</th>
                      <th className="px-5 py-4">Paid Date</th>
                      <th className="px-5 py-4">Payment Method</th>
                      <th className="px-5 py-4">Items</th>
                      <th className="px-5 py-4 text-right">Amount</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {report.rows.map((row) => (
                      <tr key={row.paymentId} className="hover:bg-gray-50">
                        <td className="px-5 py-4 font-medium text-gray-900">
                          #{row.orderId.slice(0, 8).toUpperCase()}
                        </td>

                        <td className="px-5 py-4 text-gray-700">
                          {row.customerName}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {formatDate(row.paidAt)}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          {row.paymentMethod.replaceAll("_", " ")}
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          <div>{row.itemsSold} unit(s)</div>
                          <div className="mt-1 text-xs text-gray-400">
                            {row.items
                              .map(
                                (item) =>
                                  `${item.productName} × ${item.quantity}`
                              )
                              .join(", ")}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right font-semibold text-gray-900">
                          {formatCurrency(row.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-4 text-right font-semibold text-gray-700"
                      >
                        Total Confirmed Sales
                      </td>
                      <td className="px-5 py-4 text-right font-bold text-gray-900">
                        {formatCurrency(report.totalSales)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            ) : (
              <div className="p-10 text-center">
                <ShoppingBag
                  size={32}
                  className="mx-auto text-gray-300"
                />
                <p className="mt-3 font-medium text-gray-700">
                  No confirmed sales found
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  Try selecting another date range.
                </p>
              </div>
            )}
          </section>

          <p className="mt-4 text-xs text-gray-500 print:hidden">
            Sales are based on confirmed product payments. Delivery fees
            are excluded.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSalesReports;
