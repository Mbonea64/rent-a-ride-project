import {
  demoAdmin,
  demoUser,
  demoVendor,
  filterVehicles,
  findVehicleById,
  getAvailableVehicleModels,
  getLocalBookings,
  getVehiclesByModel,
  localMasterData,
  localVehicles,
  saveLocalBooking,
} from "./localData";

const jsonResponse = (body, init = {}) =>
  new Response(JSON.stringify(body), {
    status: init.status || 200,
    headers: { "Content-Type": "application/json" },
  });

const readJson = async (request) => {
  try {
    return await request.json();
  } catch {
    return {};
  }
};

const seededBookings = () => {
  const bookings = getLocalBookings();
  if (bookings.length > 0) return bookings;

  return [
    {
      _id: "RAR-DEMO-001",
      userId: demoUser._id,
      vehicleId: localVehicles[0]._id,
      status: "booked",
      totalPrice: 180000,
      pickupDate: new Date().toISOString(),
      dropOffDate: new Date(Date.now() + 86400000).toISOString(),
      pickUpDistrict: "Dar es Salaam",
      pickUpLocation: "Julius Nyerere International Airport",
      dropOffLocation: "Masaki",
      bookingDetails: {
        _id: "BK-1001",
        status: "Confirmed",
        paymentMethod: "M-Pesa",
        totalPrice: 180000,
        pickupDate: new Date().toISOString(),
        dropOffDate: new Date(Date.now() + 86400000).toISOString(),
        pickUpDistrict: "Dar es Salaam",
        pickUpLocation: "Julius Nyerere International Airport",
        dropOffLocation: "Masaki",
      },
      vehicleDetails: localVehicles[0],
    },
  ];
};

export const installMockApi = () => {
  if (typeof window === "undefined" || window.__rentARideMockApiInstalled) {
    return;
  }

  const originalFetch = window.fetch.bind(window);
  window.__rentARideMockApiInstalled = true;

  window.fetch = async (input, init = {}) => {
    const request = new Request(input, init);
    const url = new URL(request.url, window.location.origin);
    const isApiCall =
      url.pathname.startsWith("/api/") || request.url.startsWith("api/");

    if (!isApiCall) {
      return originalFetch(input, init);
    }

    const body = await readJson(request);
    const path = url.pathname.replace(/^\/?api/, "/api");

    if (path.includes("/auth/signin")) return jsonResponse(demoUser);
    if (path.includes("/auth/signup")) return jsonResponse({ succes: true });
    if (path.includes("/auth/google")) return jsonResponse(demoUser);
    if (path.includes("/vendor/vendorsignin")) return jsonResponse(demoVendor);
    if (path.includes("/vendor/vendorsignup")) return jsonResponse({ succes: true });
    if (path.includes("/vendor/vendorgoogle")) return jsonResponse(demoVendor);
    if (path.includes("/admin/signout")) return jsonResponse({ succes: true });

    if (path.includes("/admin/getVehicleModels")) return jsonResponse(localMasterData);
    if (path.includes("/user/listAllVehicles")) return jsonResponse(localVehicles);
    if (path.includes("/user/showVehicleDetails")) return jsonResponse(findVehicleById(body.id));
    if (path.includes("/admin/showVehicles")) return jsonResponse(localVehicles);
    if (path.includes("/vendor/showVendorVehilces")) return jsonResponse(localVehicles);

    if (path.includes("/user/showSingleofSameModel")) {
      return jsonResponse(getAvailableVehicleModels(body));
    }

    if (path.includes("/user/getVehiclesWithoutBooking")) {
      return jsonResponse(
        getVehiclesByModel(body.model, body.pickUpDistrict, body.pickUpLocation)
      );
    }

    if (path.includes("/user/filterVehicles")) {
      return jsonResponse({
        data: { filteredVehicles: filterVehicles(localVehicles, body) },
      });
    }

    if (path.includes("/user/bookCar")) {
      const vehicle = findVehicleById(body.vehicle_id);
      const booking = saveLocalBooking({
        user: demoUser,
        vehicle,
        bookingDetails: body,
      });
      return jsonResponse({ ok: true, booking });
    }

    if (path.includes("/user/latestbookings")) {
      return jsonResponse(seededBookings()[0]);
    }

    if (path.includes("/user/findBookingsOfUser") || path.includes("/admin/allBookings")) {
      return jsonResponse(seededBookings());
    }

    if (
      path.includes("/admin/changeStatus") ||
      path.includes("/admin/addProduct") ||
      path.includes("/admin/editVehicle") ||
      path.includes("/admin/deleteVehicle") ||
      path.includes("/vendor/vendorAddVehicle") ||
      path.includes("/vendor/vendorDeleteVehicles") ||
      path.includes("/vendor/editVendorVehicle") ||
      path.includes("/admin/approveVendorVehicleRequest") ||
      path.includes("/admin/rejectVendorVehicleRequest")
    ) {
      return jsonResponse({ succes: true, ok: true, data: localVehicles });
    }

    if (path.includes("/admin/fetchVendorVehilceRequests")) {
      return jsonResponse(localVehicles.map((vehicle) => ({ ...vehicle, requestedBy: demoVendor.username })));
    }

    return jsonResponse({ ok: true, data: [] });
  };
};
