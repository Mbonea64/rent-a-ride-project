import { useEffect, useMemo, useState } from "react";
import { FiDownload, FiSearch, FiTrendingUp } from "react-icons/fi";
import { formatTZS } from "../../../data/localData";
import { exportSalesCsv, getSalesSummary, getVendorSalesRecords, vendorCommissionRate } from "../../../services/salesService";

const statusClass = {
  Completed: "bg-emerald-100 text-emerald-700",
  Pending: "bg-amber-100 text-amber-800",
  Cancelled: "bg-red-100 text-red-700",
  Refunded: "bg-slate-100 text-slate-700",
};

const MetricCard = ({ label, value, note }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm text-slate-500">{label}</p>
    <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
    <p className="mt-3 text-xs text-slate-500">{note}</p>
  </div>
);

const VendorSalesDashboard = () => {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    getVendorSalesRecords()
      .then(setRecords)
      .catch((error) => console.error("Could not load vendor sales records", error));
  }, []);

  const filteredRecords = useMemo(() => {
    const searchValue = search.toLowerCase();
    return records.filter((record) => {
      const matchesSearch = [record.orderId, record.productName, record.customerName, record.paymentMethod]
        .join(" ")
        .toLowerCase()
        .includes(searchValue);
      const matchesStatus = statusFilter === "all" || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [records, search, statusFilter]);

  const summary = getSalesSummary(filteredRecords);

  return (
    <div className="mt-6 w-full max-w-none pb-16">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Vendor revenue</p>
          <h1 className="text-3xl font-semibold text-slate-950">Sales and Payouts</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Track customer payments, Rent a Ride commission, and payouts for bookings made on your fleet.
          </p>
        </div>
        <button
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm"
          onClick={() => exportSalesCsv(filteredRecords)}
          type="button"
        >
          <FiDownload />
          Export report
        </button>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Gross bookings" value={formatTZS(summary.totalRevenue)} note="Total paid or pending customer amount" />
        <MetricCard label="Vendor payout" value={formatTZS(summary.vendorPayout)} note="Estimated amount payable to you" />
        <MetricCard label="Rent a Ride cut" value={formatTZS(summary.platformCommission)} note={`${Math.round(vendorCommissionRate * 100)}% platform commission`} />
        <MetricCard label="Bookings" value={summary.totalSales} note="Active sales records from your fleet" />
      </div>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <FiTrendingUp className="text-slate-700" />
          <h2 className="text-lg font-semibold text-slate-950">Payout split</h2>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full bg-sky-500"
            style={{
              width: `${summary.totalRevenue > 0 ? (summary.vendorPayout / summary.totalRevenue) * 100 : 0}%`,
            }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
          <span>Vendor share: {formatTZS(summary.vendorPayout)}</span>
          <span>Rent a Ride commission: {formatTZS(summary.platformCommission)}</span>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Sales records</h2>
            <p className="text-sm text-slate-500">Customer receipts stay unchanged; commission is handled internally here.</p>
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
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1120px] w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Customer paid</th>
                <th className="px-4 py-3">Rent a Ride cut</th>
                <th className="px-4 py-3">Vendor payout</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Payout status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr className="hover:bg-slate-50" key={record.id}>
                  <td className="px-4 py-4 font-semibold text-slate-950">{record.orderId}</td>
                  <td className="px-4 py-4 text-slate-600">{new Date(record.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-4 text-slate-800">{record.productName}</td>
                  <td className="px-4 py-4 font-medium text-slate-950">{formatTZS(record.revenue)}</td>
                  <td className="px-4 py-4 font-medium text-slate-700">{formatTZS(record.platformCommission)}</td>
                  <td className="px-4 py-4 font-semibold text-sky-700">{formatTZS(record.vendorPayout)}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass[record.status] || statusClass.Pending}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{record.payoutStatus}</td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td className="px-4 py-10 text-center text-slate-500" colSpan={8}>No vendor sales match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default VendorSalesDashboard;
