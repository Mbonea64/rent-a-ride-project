const DEMO_CLOCK_KEY = "rent_a_ride_demo_clock";
export const DEMO_CLOCK_EVENT = "rent-a-ride-demo-clock-updated";

const readClockState = () => {
  if (typeof window === "undefined") return { mode: "live", offsetMs: 0 };
  try {
    return {
      mode: "live",
      offsetMs: 0,
      ...JSON.parse(window.localStorage.getItem(DEMO_CLOCK_KEY) || "{}"),
    };
  } catch {
    return { mode: "live", offsetMs: 0 };
  }
};

const writeClockState = (state) => {
  if (typeof window === "undefined") return state;
  const next = {
    mode: state.mode || "live",
    label: state.label || "Live time",
    offsetMs: Number(state.offsetMs || 0),
    updatedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(DEMO_CLOCK_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(DEMO_CLOCK_EVENT));
  return next;
};

const getDateValue = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getBookingWindow = (booking = {}) => {
  const details = booking.bookingDetails || booking;
  return {
    pickup: getDateValue(details.pickupDate || booking.pickupDate),
    dropoff: getDateValue(details.dropOffDate || booking.dropOffDate),
  };
};

const getReferenceBooking = (bookings = []) =>
  bookings.find((booking) => {
    const { pickup, dropoff } = getBookingWindow(booking);
    return pickup && dropoff && dropoff > pickup;
  });

const scenarioTargetTime = (booking, scenario) => {
  const { pickup, dropoff } = getBookingWindow(booking);
  if (!pickup || !dropoff) return null;
  const duration = Math.max(dropoff.getTime() - pickup.getTime(), 60 * 60 * 1000);

  if (scenario === "pickup-soon") return pickup.getTime() - 45 * 60 * 1000;
  if (scenario === "after-pickup") return pickup.getTime() + 20 * 60 * 1000;
  if (scenario === "return-soon") return dropoff.getTime() - 60 * 60 * 1000;
  if (scenario === "boundary-watch") return pickup.getTime() + duration * 0.84;
  if (scenario === "overdue") return dropoff.getTime() + 25 * 60 * 1000;
  return Date.now();
};

const scenarioLabels = {
  "pickup-soon": "Pickup reminder due",
  "after-pickup": "Vehicle collected",
  "return-soon": "Return reminder due",
  "boundary-watch": "Boundary watch",
  overdue: "Return overdue",
};

export const getDemoClockState = () => readClockState();

export const getDemoNow = () => Date.now() + Number(readClockState().offsetMs || 0);

export const resetDemoClock = () =>
  writeClockState({ mode: "live", label: "Live time", offsetMs: 0 });

export const jumpDemoClockToScenario = (bookings = [], scenario) => {
  const booking = getReferenceBooking(bookings);
  if (!booking) return resetDemoClock();
  const targetTime = scenarioTargetTime(booking, scenario);
  if (!targetTime) return resetDemoClock();
  return writeClockState({
    mode: scenario,
    label: scenarioLabels[scenario] || "Demo time",
    offsetMs: targetTime - Date.now(),
  });
};

export const subscribeDemoClock = (callback) => {
  if (typeof window === "undefined") return () => {};
  const handler = () => callback(readClockState());
  window.addEventListener(DEMO_CLOCK_EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(DEMO_CLOCK_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
};
