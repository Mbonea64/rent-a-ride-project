import alto from "../Assets/booking-alto.png";
import ignis from "../Assets/booking ignis.png";
import swift from "../Assets/booking swift lxi.jpeg";
import wagonr from "../Assets/booking waganor.png";
import wagonrBlue from "../Assets/booking waganor blue.png";
import model1 from "../Assets/vehicleModel1.png";
import model2 from "../Assets/vehicleModel2.png";
import model3 from "../Assets/vehicleModel3.png";
import model4 from "../Assets/vehicleModel4.png";

export const LOCAL_BOOKINGS_KEY = "rent-a-ride-local-bookings";

export const demoUser = {
  _id: "usr-dar-demo",
  username: "Asha Mwakyusa",
  email: "asha.mwakyusa@example.co.tz",
  phoneNumber: "0744 220 118",
  adress: "Masaki, Dar es Salaam",
  profilePicture:
    "https://api.dicebear.com/8.x/initials/svg?seed=Asha%20Mwakyusa&backgroundColor=22c55e",
  isUser: true,
  isAdmin: false,
  isVendor: false,
};

export const demoVendor = {
  _id: "vnd-arusha-demo",
  username: "Kilimanjaro Fleet Partners",
  email: "vendor@rent-a-ride.co.tz",
  phoneNumber: "0755 410 410",
  adress: "Clocktower, Arusha",
  profilePicture:
    "https://api.dicebear.com/8.x/initials/svg?seed=Kilimanjaro%20Fleet&backgroundColor=111827",
  isUser: false,
  isAdmin: false,
  isVendor: true,
};

export const demoAdmin = {
  _id: "adm-rar-demo",
  username: "Rent a Ride Admin",
  email: "admin@rent-a-ride.co.tz",
  phoneNumber: "0713 000 001",
  adress: "Mikocheni, Dar es Salaam",
  profilePicture:
    "https://api.dicebear.com/8.x/initials/svg?seed=Rent%20Ride%20Admin&backgroundColor=0f172a",
  isUser: false,
  isAdmin: true,
  isVendor: false,
};

export const tanzaniaLocations = [
  { type: "location", district: "Dar es Salaam", location: "Julius Nyerere International Airport" },
  { type: "location", district: "Dar es Salaam", location: "Masaki" },
  { type: "location", district: "Dar es Salaam", location: "Mlimani City" },
  { type: "location", district: "Dar es Salaam", location: "Kariakoo" },
  { type: "location", district: "Arusha", location: "Arusha Airport" },
  { type: "location", district: "Arusha", location: "Clocktower" },
  { type: "location", district: "Arusha", location: "Njiro" },
  { type: "location", district: "Zanzibar", location: "Abeid Amani Karume Airport" },
  { type: "location", district: "Zanzibar", location: "Stone Town" },
  { type: "location", district: "Mwanza", location: "Mwanza Airport" },
  { type: "location", district: "Mwanza", location: "Rock City Mall" },
  { type: "location", district: "Dodoma", location: "Dodoma Airport" },
  { type: "location", district: "Dodoma", location: "Nyerere Square" },
];

export const localVehicles = [
  {
    _id: "veh-001",
    name: "Toyota IST Urban",
    model: "IST",
    company: "Toyota",
    brand: "Toyota",
    price: 85000,
    image: [alto, model1],
    seats: 5,
    car_type: "hatchback",
    fuel_type: "Petrol",
    transmition: "automatic",
    year_made: 2019,
    base_package: "City runabout",
    location: "Masaki",
    district: "Dar es Salaam",
    registeration_number: "T 482 DCE",
    ratting: 4.8,
    isDeleted: "false",
    isAdminApproved: true,
    car_title: "Easy Dar es Salaam city movement",
    car_description:
      "Compact automatic hatchback for errands, hotel transfers, and quick meetings around Masaki, Oysterbay, Kariakoo, and Mlimani City.",
  },
  {
    _id: "veh-002",
    name: "Toyota RAV4 Safari",
    model: "RAV4",
    company: "Toyota",
    brand: "Toyota",
    price: 165000,
    image: [model2, model4],
    seats: 5,
    car_type: "suv",
    fuel_type: "Petrol",
    transmition: "automatic",
    year_made: 2021,
    base_package: "Safari comfort",
    location: "Clocktower",
    district: "Arusha",
    registeration_number: "T 914 DQW",
    ratting: 4.9,
    isDeleted: "false",
    isAdminApproved: true,
    car_title: "Built for Arusha day trips",
    car_description:
      "A comfortable SUV for Kilimanjaro Airport pickups, Arusha town movement, and weekend routes toward Moshi, Tarangire, or Lake Manyara.",
  },
  {
    _id: "veh-003",
    name: "Suzuki Swift Zanzibar",
    model: "Swift",
    company: "Suzuki",
    brand: "Suzuki",
    price: 95000,
    image: [swift, ignis],
    seats: 5,
    car_type: "hatchback",
    fuel_type: "Petrol",
    transmition: "automatic",
    year_made: 2020,
    base_package: "Island day hire",
    location: "Stone Town",
    district: "Zanzibar",
    registeration_number: "Z 118 ABH",
    ratting: 4.7,
    isDeleted: "false",
    isAdminApproved: true,
    car_title: "Light, efficient island driving",
    car_description:
      "A small, easy car for Stone Town, airport transfers, beach routes, and hotel runs across Unguja.",
  },
  {
    _id: "veh-004",
    name: "Toyota Alphard Executive",
    model: "Alphard",
    company: "Toyota",
    brand: "Toyota",
    price: 280000,
    image: [model3, model2],
    seats: 7,
    car_type: "van",
    fuel_type: "Petrol",
    transmition: "automatic",
    year_made: 2022,
    base_package: "Executive transfer",
    location: "Julius Nyerere International Airport",
    district: "Dar es Salaam",
    registeration_number: "T 207 EAY",
    ratting: 5,
    isDeleted: "false",
    isAdminApproved: true,
    car_title: "Premium airport and corporate transfer",
    car_description:
      "Spacious executive van with room for family, luggage, and business guests arriving through JNIA or staying around city hotels.",
  },
  {
    _id: "veh-005",
    name: "Nissan X-Trail Mwanza",
    model: "X-Trail",
    company: "Nissan",
    brand: "Nissan",
    price: 155000,
    image: [wagonrBlue, model4],
    seats: 5,
    car_type: "suv",
    fuel_type: "Petrol",
    transmition: "manual",
    year_made: 2018,
    base_package: "Lake zone explorer",
    location: "Rock City Mall",
    district: "Mwanza",
    registeration_number: "T 650 DLR",
    ratting: 4.6,
    isDeleted: "false",
    isAdminApproved: true,
    car_title: "Confident around the Lake Zone",
    car_description:
      "Manual SUV suited for Mwanza town, airport pickups, and longer drives around the Lake Victoria region.",
  },
  {
    _id: "veh-006",
    name: "Suzuki WagonR Budget",
    model: "WagonR",
    company: "Suzuki",
    brand: "Suzuki",
    price: 70000,
    image: [wagonr, ignis],
    seats: 5,
    car_type: "hatchback",
    fuel_type: "Petrol",
    transmition: "manual",
    year_made: 2017,
    base_package: "Budget daily",
    location: "Nyerere Square",
    district: "Dodoma",
    registeration_number: "T 339 DDM",
    ratting: 4.4,
    isDeleted: "false",
    isAdminApproved: true,
    car_title: "Affordable Dodoma daily rental",
    car_description:
      "Simple, fuel-friendly hatchback for Dodoma errands, government-office visits, and short regional trips.",
  },
];

export const paymentMethods = [
  "M-Pesa",
  "Tigo Pesa",
  "Airtel Money",
  "HaloPesa",
  "NMB Bank Card",
  "CRDB Bank Card",
  "Cash on pickup",
];

export const localMasterData = [
  ...localVehicles.map((vehicle) => ({
    type: "car",
    model: vehicle.model,
    brand: vehicle.company,
  })),
  ...tanzaniaLocations,
];

export const formatTZS = (amount = 0) =>
  new Intl.NumberFormat("en-TZ", {
    style: "currency",
    currency: "TZS",
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0);

export const findVehicleById = (id) =>
  localVehicles.find((vehicle) => vehicle._id === id) || localVehicles[0];

export const filterVehicles = (vehicles, filters) => {
  if (!filters || filters.length === 0) return vehicles;

  return vehicles.filter((vehicle) =>
    filters.every((filter) => {
      const [value] = Object.keys(filter).filter((key) => key !== "type");
      return String(vehicle[filter.type]).toLowerCase() === value.toLowerCase();
    })
  );
};

export const getAvailableVehicleModels = ({ pickUpDistrict, pickUpLocation }) => {
  const matches = localVehicles.filter((vehicle) => {
    if (pickUpLocation) {
      return vehicle.location === pickUpLocation || vehicle.district === pickUpDistrict;
    }
    return vehicle.district === pickUpDistrict;
  });

  const seenModels = new Set();
  return matches.filter((vehicle) => {
    if (seenModels.has(vehicle.model)) return false;
    seenModels.add(vehicle.model);
    return true;
  });
};

export const getVehiclesByModel = (model, district, location) =>
  localVehicles.filter((vehicle) => {
    const modelMatches = vehicle.model === model;
    const placeMatches =
      !district || vehicle.district === district || vehicle.location === location;
    return modelMatches && placeMatches;
  });

export const getDemoUserForEmail = (email, fallbackName = "Rent a Ride Guest") => {
  const normalized = email?.toLowerCase() || "";
  if (normalized.includes("admin")) return demoAdmin;
  if (normalized.includes("vendor")) return demoVendor;

  return {
    ...demoUser,
    username: fallbackName,
    email: email || demoUser.email,
  };
};

export const getLocalBookings = (userId) => {
  const stored = JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || "[]");
  if (!userId) return stored;
  return stored.filter((booking) => booking.userId === userId);
};

export const saveLocalBooking = ({ user, vehicle, bookingDetails }) => {
  const stored = JSON.parse(localStorage.getItem(LOCAL_BOOKINGS_KEY) || "[]");
  const booking = {
    _id: `RAR-${Date.now()}`,
    userId: user._id,
    vehicleId: vehicle._id,
    status: "booked",
    totalPrice: bookingDetails.totalPrice,
    pickupDate: bookingDetails.pickupDate,
    dropOffDate: bookingDetails.dropoffDate,
    pickUpDistrict: bookingDetails.pickup_district,
    pickUpLocation: bookingDetails.pickup_location,
    dropOffLocation: bookingDetails.dropoff_location,
    paymentMethod: bookingDetails.paymentMethod,
    bookingDetails: {
      _id: `BK-${Date.now().toString().slice(-6)}`,
      status: "Confirmed",
      paymentMethod: bookingDetails.paymentMethod,
      totalPrice: bookingDetails.totalPrice,
      pickupDate: bookingDetails.pickupDate,
      dropOffDate: bookingDetails.dropoffDate,
      pickUpDistrict: bookingDetails.pickup_district,
      pickUpLocation: bookingDetails.pickup_location,
      dropOffLocation: bookingDetails.dropoff_location,
      contactPhone: bookingDetails.phoneNumber,
      contactAddress: bookingDetails.adress,
    },
    vehicleDetails: vehicle,
    createdAt: new Date().toISOString(),
  };

  localStorage.setItem(LOCAL_BOOKINGS_KEY, JSON.stringify([booking, ...stored]));
  return booking;
};
