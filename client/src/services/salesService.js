import { getBookings, resetDemoBookingState } from "./bookingService";
import { clearCompanyDispatchLog } from "./companyNotificationService";
import { clearDemoOpsChannel, shouldShowInVendorDashboard } from "./demoOpsService";
import { clearAllNotificationReadState } from "./notificationService";
import { clearVehicleIssueReports } from "./vehicleIssueService";
import { getVendorVehicles } from "./vehicleService";

const manualSalesKey = "rent_a_ride_manual_sales_records";
export const vendorCommissionRate = 0.15;

const safeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const getVehicleName = (booking) =>
  [booking.vehicleDetails?.company, booking.vehicleDetails?.model || booking.vehicleDetails?.name]
    .filter(Boolean)
    .join(" ") || "Vehicle rental";

const getPaymentMethod = (booking) =>
  booking.paymentProvider && booking.paymentProvider !== "Pending" ? booking.paymentProvider : "Pending";

export const calculateSale = (sale) => {
  const quantity = safeNumber(sale.quantity || 1);
  const unitPrice = safeNumber(sale.unitPrice);
  const costPrice = safeNumber(sale.costPrice);
  const revenue = unitPrice * quantity;
  const cost = costPrice * quantity;
  const profit = revenue - cost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  return {
    ...sale,
    quantity,
    unitPrice,
    costPrice,
    revenue,
    cost,
    profit,
    margin,
  };
};

const readManualSales = () => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(manualSalesKey) || "[]");
  } catch {
    return [];
  }
};

const writeManualSales = (sales) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(manualSalesKey, JSON.stringify(sales));
};

export const addManualSale = (sale) => {
  const current = readManualSales();
  const record = calculateSale({
    id: `manual-${crypto.randomUUID()}`,
    source: "manual",
    orderId: `SALE-${String(current.length + 1).padStart(4, "0")}`,
    createdAt: new Date().toISOString(),
    ...sale,
  });
  writeManualSales([record, ...current]);
  return record;
};

export const deleteManualSale = (id) => {
  writeManualSales(readManualSales().filter((sale) => sale.id !== id));
};

export const clearManualSales = () => {
  writeManualSales([]);
};

export const resetDemoActivityRecords = async () => {
  clearManualSales();
  clearCompanyDispatchLog();
  clearAllNotificationReadState();
  clearDemoOpsChannel();
  clearVehicleIssueReports();
  const clearedBookings = await resetDemoBookingState();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("rent-a-ride-demo-reset"));
    window.dispatchEvent(new Event("rent-a-ride-payment-updated"));
    window.dispatchEvent(new Event("storage"));
  }
  return clearedBookings;
};

const bookingToSale = (booking) => {
  const revenue = safeNumber(booking.totalPrice);
  const estimatedCost = Math.round(revenue * 0.62);
  const isVendorFleet = Boolean(booking.vehicleDetails?.addedBy && !booking.vehicleDetails?.isAdminAdded);
  const commissionRate = isVendorFleet ? vendorCommissionRate : 1;
  const platformCommission = isVendorFleet ? Math.round(revenue * vendorCommissionRate) : revenue;
  const vendorPayout = isVendorFleet ? Math.max(revenue - platformCommission, 0) : 0;
  const companyNetRevenue = isVendorFleet ? platformCommission : revenue;
  return calculateSale({
    id: `booking-${booking._id}`,
    source: "booking",
    orderId: String(booking._id).slice(0, 8).toUpperCase(),
    createdAt: booking.created_at || booking.pickupDate,
    productName: getVehicleName(booking),
    category: booking.rentalProduct === "long_term" ? "Long-term rental" : "Vehicle rental",
    quantity: 1,
    unitPrice: revenue,
    costPrice: estimatedCost,
    customerName: booking.contact_email || booking.bookingDetails?.contactPhone || "Customer",
    paymentMethod: getPaymentMethod(booking),
    status: booking.status === "canceled" ? "Cancelled" : booking.paymentStatus === "paid" ? "Completed" : "Pending",
    ownershipType: isVendorFleet ? "Vendor fleet" : "Company fleet",
    vendorId: booking.vehicleDetails?.addedBy || null,
    vendorName: isVendorFleet ? booking.vehicleDetails?.ownerProfile?.username || "Vendor account" : "Rent a Ride",
    commissionRate,
    platformCommission,
    vendorPayout,
    companyNetRevenue,
    payoutStatus: booking.paymentStatus === "paid" && isVendorFleet ? "Payable" : isVendorFleet ? "Pending payment" : "Not applicable",
    notes: "Generated from booking record",
  });
};

export const getSalesRecords = async () => {
  const bookings = await getBookings().catch(() => []);
  return [...bookings.map(bookingToSale), ...readManualSales()].sort(
    (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
  );
};

export const getVendorSalesRecords = async () => {
  const [bookings, vendorVehicles] = await Promise.all([
    getBookings().catch(() => []),
    getVendorVehicles().catch(() => []),
  ]);
  return bookings
    .filter((booking) => shouldShowInVendorDashboard(booking, vendorVehicles))
    .map(bookingToSale)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
};

export const getSalesSummary = (records = []) => {
  const completed = records.filter((record) => record.status !== "Cancelled");
  const totalRevenue = completed.reduce((sum, record) => sum + safeNumber(record.revenue), 0);
  const totalProfit = completed.reduce((sum, record) => sum + safeNumber(record.profit), 0);
  const totalCost = completed.reduce((sum, record) => sum + safeNumber(record.cost), 0);
  const unitsSold = completed.reduce((sum, record) => sum + safeNumber(record.quantity), 0);
  const averageOrderValue = completed.length ? totalRevenue / completed.length : 0;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return {
    totalRevenue,
    totalProfit,
    totalCost,
    totalSales: completed.length,
    unitsSold,
    averageOrderValue,
    margin,
    platformCommission: completed.reduce((sum, record) => sum + safeNumber(record.platformCommission), 0),
    vendorPayout: completed.reduce((sum, record) => sum + safeNumber(record.vendorPayout), 0),
    companyNetRevenue: completed.reduce((sum, record) => sum + safeNumber(record.companyNetRevenue), 0),
  };
};

export const exportSalesCsv = (records = []) => {
  const headers = [
    "Order ID",
    "Date",
    "Product",
    "Category",
    "Quantity",
    "Unit Price",
    "Cost Price",
    "Revenue",
    "Profit",
    "Ownership",
    "Vendor",
    "Platform Commission",
    "Vendor Payout",
    "Customer",
    "Payment Method",
    "Status",
  ];
  const rows = records.map((record) => [
    record.orderId,
    new Date(record.createdAt).toLocaleDateString(),
    record.productName,
    record.category,
    record.quantity,
    record.unitPrice,
    record.costPrice,
    record.revenue,
    record.profit,
    record.ownershipType || "Company fleet",
    record.vendorName || "Rent a Ride",
    record.platformCommission || 0,
    record.vendorPayout || 0,
    record.customerName,
    record.paymentMethod,
    record.status,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `rent-a-ride-sales-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};
