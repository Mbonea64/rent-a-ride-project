import { useEffect, useMemo, useState } from "react";
import {
  FiBarChart2,
  FiDownload,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiTrendingUp,
  FiRefreshCcw,
} from "react-icons/fi";
import { formatTZS } from "../../../data/localData";
import {
  addManualSale,
  deleteManualSale,
  exportSalesCsv,
  getSalesRecords,
  getSalesSummary,
  resetDemoActivityRecords,
} from "../../../services/salesService";

const defaultSaleForm = {
  customerName: "",
  productName: "",
  category: "Vehicle rental",
  quantity: 1,
  unitPrice: "",
  costPrice: "",
  paymentMethod: "Cash",
  status: "Completed",
  createdAt: new Date().toISOString().slice(0, 10),
  notes: "",
};

const statusClass = {
  Completed: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-800",
  Cancelled: "bg-red-100 text-red-700",
  Refunded: "bg-slate-100 text-slate-700",
};

const MetricCard = ({ label, value, note, icon }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      </div>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">{icon}</span>
    </div>
    <p className="mt-3 text-xs text-slate-500">{note}</p>
  </div>
);

const SalesDashboard = () => {
  const [records, setRecords] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(defaultSaleForm);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const loadSales = () => {
    return getSalesRecords()
      .then(setRecords)
      .catch((error) => console.error("Could not load sales records", error));
  };

  useEffect(() => {
    loadSales();
  }, []);

  const filteredRecords = useMemo(() => {
    const searchValue = search.toLowerCase();
    return records.filter((record) => {
      const matchesSearch = [record.orderId, record.productName, record.customerName, record.paymentMethod]
        .join(" ")
        .toLowerCase()
        .includes(searchValue);
      const matchesStatus = statusFilter === "all" || record.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || record.category === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, records, search, statusFilter]);

  const summary = getSalesSummary(filteredRecords);
  const categories = [...new Set(records.map((record) => record.category).filter(Boolean))];
  const products = Object.values(
    filteredRecords.reduce((acc, record) => {
      const key = record.productName;
      acc[key] = acc[key] || { name: key, revenue: 0, units: 0, profit: 0 };
      acc[key].revenue += record.revenue;
      acc[key].units += record.quantity;
      acc[key].profit += record.profit;
      return acc;
    }, {})
  ).sort((left, right) => right.revenue - left.revenue);
  const maxProductRevenue = Math.max(...products.map((product) => product.revenue), 1);

  const paymentBreakdown = Object.values(
    filteredRecords.reduce((acc, record) => {
      acc[record.paymentMethod] = acc[record.paymentMethod] || { method: record.paymentMethod, total: 0 };
      acc[record.paymentMethod].total += record.revenue;
      return acc;
    }, {})
  );
  const maxPayment = Math.max(...paymentBreakdown.map((payment) => payment.total), 1);

  const handleSubmit = (event) => {
    event.preventDefault();
    addManualSale({
      ...form,
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
      costPrice: Number(form.costPrice),
      createdAt: new Date(form.createdAt).toISOString(),
    });
    setForm(defaultSaleForm);
    setIsModalOpen(false);
    loadSales();
  };

  const handleDelete = (record) => {
    if (record.source !== "manual") return;
    deleteManualSale(record.id);
    loadSales();
  };

  const handleResetDemoRecords = async () => {
    const confirmed = window.confirm(
      "Reset all demo activity? This removes visible bookings, sales records, message logs, and notification badges across admin, vendor, and customer dashboards."
    );
    if (!confirmed) return;
    try {
      setIsResetting(true);
      setResetMessage("");
      const clearedBookings = await resetDemoActivityRecords();
      await loadSales();
      setResetMessage(
        `Demo reset complete. Cleared ${clearedBookings} booking${clearedBookings === 1 ? "" : "s"} plus sales, messages, and notifications.`
      );
    } catch (error) {
      console.error("Could not reset demo activity", error);
      setResetMessage("Reset could not finish. Please try again before recording.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="mt-6 max-w-7xl pb-16">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Revenue operations</p>
          <h1 className="text-3xl font-semibold text-slate-950">Sales Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Monitor rental revenue, profit, payment performance, and recent sales activity.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
            onClick={() => exportSalesCsv(filteredRecords)}
            type="button"
          >
            <FiDownload />
            Export report
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 shadow-sm disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isResetting}
            onClick={handleResetDemoRecords}
            type="button"
          >
            <FiRefreshCcw />
            {isResetting ? "Resetting demo..." : "Reset demo data"}
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm"
            onClick={() => setIsModalOpen(true)}
            type="button"
          >
            <FiPlus />
            Add sale
          </button>
        </div>
      </div>
      {resetMessage && (
        <div className="mb-6 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {resetMessage}
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total revenue" value={formatTZS(summary.totalRevenue)} note="Completed and pending sales" icon={<FiTrendingUp />} />
        <MetricCard label="Company net" value={formatTZS(summary.companyNetRevenue)} note="Company fleet revenue plus vendor commissions" icon={<FiBarChart2 />} />
        <MetricCard label="Vendor payouts" value={formatTZS(summary.vendorPayout)} note="Amount payable to vendor fleet owners" icon={<FiPlus />} />
        <MetricCard label="Average order value" value={formatTZS(summary.averageOrderValue)} note="Revenue per sale" icon={<FiTrendingUp />} />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Sales by product</h2>
              <p className="text-sm text-slate-500">Revenue contribution by vehicle or sale item</p>
            </div>
          </div>
          <div className="space-y-4">
            {products.slice(0, 6).map((product) => (
              <div key={product.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-800">{product.name}</span>
                  <span className="text-slate-500">{formatTZS(product.revenue)}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-950"
                    style={{ width: `${Math.max((product.revenue / maxProductRevenue) * 100, 5)}%` }}
                  />
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="text-sm text-slate-500">No product sales yet.</p>}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-950">Payment methods</h2>
          <p className="mb-5 text-sm text-slate-500">Revenue by payment channel</p>
          <div className="space-y-4">
            {paymentBreakdown.map((payment) => (
              <div key={payment.method}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-medium text-slate-800">{payment.method}</span>
                  <span className="text-slate-500">{formatTZS(payment.total)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: `${Math.max((payment.total / maxPayment) * 100, 5)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Sales records</h2>
            <p className="text-sm text-slate-500">Search, filter, export, and manage sales activity.</p>
          </div>
          <div className="flex flex-col gap-2 md:flex-row">
            <label className="relative">
              <FiSearch className="absolute left-3 top-3 text-slate-400" />
              <input
                className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm md:w-64"
                placeholder="Search sales"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">All statuses</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Refunded">Refunded</option>
            </select>
            <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
              <option value="all">All categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3">Revenue</th>
                <th className="px-4 py-3">Profit</th>
                <th className="px-4 py-3">Ownership</th>
                <th className="px-4 py-3">Rent a Ride cut</th>
                <th className="px-4 py-3">Vendor payout</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr className="hover:bg-slate-50" key={record.id}>
                  <td className="px-4 py-4 font-semibold text-slate-950">{record.orderId}</td>
                  <td className="px-4 py-4 text-slate-600">{new Date(record.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-4 text-slate-800">{record.productName}</td>
                  <td className="px-4 py-4 text-slate-600">{record.category}</td>
                  <td className="px-4 py-4 text-slate-600">{record.quantity}</td>
                  <td className="px-4 py-4 font-medium text-slate-950">{formatTZS(record.revenue)}</td>
                  <td className="px-4 py-4 font-medium text-emerald-700">{formatTZS(record.profit)}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${record.ownershipType === "Vendor fleet" ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-700"}`}>
                      {record.ownershipType || "Company fleet"}
                    </span>
                    {record.ownershipType === "Vendor fleet" && (
                      <p className="mt-1 text-xs text-slate-500">{record.vendorName}</p>
                    )}
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-950">{formatTZS(record.platformCommission || record.revenue)}</td>
                  <td className="px-4 py-4 font-medium text-sky-700">{formatTZS(record.vendorPayout || 0)}</td>
                  <td className="px-4 py-4 text-slate-600">{record.customerName}</td>
                  <td className="px-4 py-4 text-slate-600">{record.paymentMethod}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[record.status] || statusClass.Pending}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    {record.source === "manual" ? (
                      <button
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-700"
                        onClick={() => handleDelete(record)}
                        title="Delete sale"
                        type="button"
                      >
                        <FiTrash2 />
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Booking</span>
                    )}
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={14}>
                    No sales records yet. Complete a customer booking and confirm payment to populate this report.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/50 p-4">
          <form className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-2xl" onSubmit={handleSubmit}>
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-slate-950">Add Sale</h2>
                <p className="text-sm text-slate-500">Record a manual sale or adjustment.</p>
              </div>
              <button className="text-slate-500" onClick={() => setIsModalOpen(false)} type="button">Close</button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ["customerName", "Customer name"],
                ["productName", "Product"],
                ["category", "Category"],
                ["paymentMethod", "Payment method"],
              ].map(([key, label]) => (
                <label className="text-sm font-medium text-slate-700" key={key}>
                  {label}
                  <input
                    className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm"
                    required
                    value={form[key]}
                    onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))}
                  />
                </label>
              ))}
              <label className="text-sm font-medium text-slate-700">
                Quantity
                <input className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm" min="1" required type="number" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Selling price
                <input className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm" min="0" required type="number" value={form.unitPrice} onChange={(event) => setForm((current) => ({ ...current, unitPrice: event.target.value }))} />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Cost price
                <input className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm" min="0" required type="number" value={form.costPrice} onChange={(event) => setForm((current) => ({ ...current, costPrice: event.target.value }))} />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Sale date
                <input className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm" required type="date" value={form.createdAt} onChange={(event) => setForm((current) => ({ ...current, createdAt: event.target.value }))} />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Status
                <select className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm" value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
                  <option>Completed</option>
                  <option>Pending</option>
                  <option>Cancelled</option>
                  <option>Refunded</option>
                </select>
              </label>
              <label className="text-sm font-medium text-slate-700 md:col-span-2">
                Notes
                <textarea className="mt-1 min-h-24 w-full rounded-lg border border-slate-200 p-3 text-sm" value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700" onClick={() => setIsModalOpen(false)} type="button">Cancel</button>
              <button className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white" type="submit">Save sale</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default SalesDashboard;
