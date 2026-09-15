export const paymentMethods = [
  "M-Pesa",
  "Mixx by Yas",
  "Airtel Money",
  "HaloPesa",
  "NMB Bank Card",
  "CRDB Bank Card",
  "Cash on pickup",
];

export const formatTZS = (amount = 0) =>
  new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export const filterVehicles = (vehicles, filters) => {
  if (!filters || filters.length === 0) return vehicles;

  return vehicles.filter((vehicle) =>
    filters.every((filter) => {
      const [value] = Object.keys(filter).filter((key) => key !== "type");
      return String(vehicle[filter.type]).toLowerCase() === value.toLowerCase();
    })
  );
};
