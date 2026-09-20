import { useDispatch, useSelector } from "react-redux";
import { CiCalendarDate } from "react-icons/ci";
import { IoMdTime } from "react-icons/io";
import { MdVerifiedUser } from "react-icons/md";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { setIsSweetAlert, setPageLoading } from "../../redux/user/userSlice";
import { setLatestBooking } from "../../redux/user/LatestBookingsSlice";
import {toast, Toaster} from "sonner";
import {
  formatTZS,
  paymentMethods,
} from "../../data/localData";
import { createBooking, getRentalAddOns, quoteBooking } from "../../services/bookingService";
import CarNotFound from "./CarNotFound";
import VehicleArtwork from "../../components/VehicleArtwork";
import useSelectedVehicle from "../../hooks/useSelectedVehicle";
import { getVehicleImage } from "../../utils/vehicleImages";
// import { toast, Toaster } from "sonner";

const schema = z.object({
  email: z
    .string()
    .min(1, { message: "email required" })
    .refine((value) => /\S+@\S+\.\S+/.test(value), {
      message: "Invalid email address",
    }),
  phoneNumber: z.string().min(8, { message: "phoneNumber required" }),
  adress: z.string().min(4, { message: "adress required" }),
  paymentMethod: z.string().min(1, { message: "payment method required" }),
  // pickup_district: z.string().min(1),
});

const CheckoutPage = () => {
  const {
    handleSubmit,
    formState: { errors },
    register,
    watch,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      coupon: "",
      protectionPackage: "standard",
      mileagePackageKm: "",
    },
  });
  const navigate = useNavigate();

  const {
    pickup_district,
    pickup_location,
    dropoff_location,
    pickupDate,
    dropoffDate,
  } = useSelector((state) => state.bookingDataSlice);

  const currentUser = useSelector((state) => state.user.currentUser);
  const {
    vehicle: singleVehicleDetail,
    isLoading: isVehicleLoading,
    error: vehicleError,
  } = useSelectedVehicle();
  const { isPageLoading } = useSelector((state) => state.user);
  const dispatch = useDispatch();

  const { email, phoneNumber, adress } = currentUser || {};
  const { price = 0 } = singleVehicleDetail || {};

  const vehicle_id = singleVehicleDetail?._id;

  const defaultPickupDate = new Date();
  const defaultDropoffDate = new Date(defaultPickupDate);
  defaultDropoffDate.setDate(defaultDropoffDate.getDate() + 1);

  const pickupDateValue = pickupDate?.humanReadable || defaultPickupDate.toISOString();
  const dropoffDateValue = dropoffDate?.humanReadable || defaultDropoffDate.toISOString();

  const start = new Date(pickupDateValue);
  const end = new Date(dropoffDateValue);
  const displayPickupDate = new Date(pickupDateValue);
  const displayDropoffDate = new Date(dropoffDateValue);

  const diffMilliseconds = end - start;
  const Days = Math.ceil(diffMilliseconds / (1000 * 3600 * 24));

  //settting and checking coupon
  const [wrongCoupon, setWrongCoupon] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [rentalAddOns, setRentalAddOns] = useState([]);
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [bookingQuote, setBookingQuote] = useState(null);
  const [quoteError, setQuoteError] = useState("");

  const couponValue = watch("coupon");
  const protectionPackage = watch("protectionPackage") || "standard";
  const mileagePackageKm = Number(watch("mileagePackageKm") || 0);

  useEffect(() => {
    let active = true;
    getRentalAddOns()
      .then((addOns) => active && setRentalAddOns(addOns))
      .catch(() => active && setRentalAddOns([]));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!vehicle_id || !pickupDateValue || !dropoffDateValue) return undefined;

    let active = true;
    setQuoteError("");
    quoteBooking({
      vehicle_id,
      pickupDate: pickupDateValue,
      dropoffDate: dropoffDateValue,
      pickup_district: pickup_district || singleVehicleDetail?.district,
      pickup_location: pickup_location || singleVehicleDetail?.location,
      dropoff_location: dropoff_location || singleVehicleDetail?.location,
      dailyPrice: price,
      coupon: couponValue,
      addOnCodes: selectedAddOns,
      mileagePackageKm,
      protectionPackage,
    })
      .then((quote) => active && setBookingQuote(quote))
      .catch((error) => {
        if (!active) return;
        setBookingQuote(null);
        setQuoteError(error.message || "Could not calculate this booking");
      });

    return () => {
      active = false;
    };
  }, [
    vehicle_id,
    pickupDateValue,
    dropoffDateValue,
    pickup_district,
    pickup_location,
    dropoff_location,
    singleVehicleDetail?.district,
    singleVehicleDetail?.location,
    couponValue,
    selectedAddOns,
    mileagePackageKm,
    protectionPackage,
  ]);

  const handleCoupon = () => {
    setWrongCoupon(false);
    if (couponValue === "KARIBU10000") {
      setDiscount(10000);
    } else {
      setDiscount(0);
      setWrongCoupon(true);
    }
  };

  //calculateing total price after coupon
  const rentalDays = bookingQuote?.rental_days || (Number.isFinite(Days) && Days > 0 ? Days : 1);
  const deliveryFee = Number(bookingQuote?.delivery_fee ?? 10000);
  const oneWayFee = Number(bookingQuote?.one_way_fee || 0);
  const addOnsTotal = Number(bookingQuote?.add_ons_total || 0);
  const protectionFee = Number(bookingQuote?.protection_fee || 0);
  const mileageFee = Number(bookingQuote?.mileage_fee || 0);
  const quoteDiscount = Number(bookingQuote?.discount ?? discount);
  const totalPrice = Number(bookingQuote?.total_price ?? price * rentalDays + deliveryFee - discount);

  const toggleAddOn = (code) => {
    setSelectedAddOns((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code]
    );
  };

  //handle place order data
  const handlePlaceOrder = async (formValues) => {
    const orderData = {
      vehicle_id,
      totalPrice,
      pickupDate: pickupDateValue,
      dropoffDate: dropoffDateValue,
      pickup_district: pickup_district || singleVehicleDetail?.district,
      pickup_location: pickup_location || singleVehicleDetail?.location,
      dropoff_location: dropoff_location || singleVehicleDetail?.location,
      dailyPrice: price,
      ...formValues,
      addOnCodes: selectedAddOns,
      mileagePackageKm,
      protectionPackage,
    };

    try {
      dispatch(setPageLoading(true));
      const booking = await createBooking(orderData);
      dispatch(setLatestBooking(booking));
      dispatch(setIsSweetAlert(true));
      toast.success("Booking created. Payment is pending.");
      navigate("/");
    } catch (error) {
      console.log(error);
      toast.error(error.message || "Could not create this booking");
      dispatch(setPageLoading(false));
    }finally{
      dispatch(setPageLoading(false))
    }
  };

  if (isVehicleLoading) {
    return <div className="p-12 text-center">Loading vehicle...</div>;
  }

  if (!currentUser || vehicleError || !singleVehicleDetail) return <CarNotFound />;

  const primaryImage = getVehicleImage(singleVehicleDetail);

  return (
    <>
      <Toaster
        toastOptions={{
          classNames: {
            error: "bg-red-500 p-5",
            success: "text-green-400 p-5",
            warning: "text-yellow-400 p-5",
            info: "bg-blue-400 p-5",
          },
        }}
      />
      <div className="grid w-full absolute top-0  sm:px-10 lg:grid-cols-2 lg:px-20 xl:px-[120px] xl:pl-[100px] gap-10 xl:mt-20 ">
        <div className="px-4  bg-gray w-full h-full drop-shadow-md">
          <div
            className="pt-8 space-y-3 rounded-lg border border-none drop-shadow-md  px-2 py-4 sm:px-6 md:min-h-[600px]  Properties backdrop-blur-sm
             bg-white 
            flex flex-col justify-between"
          >
            <p className="text-xl font-medium">Order Summary</p>
            <p className="text-gray-400">
              Check your rental and select a Tanzania payment method
            </p>
            <div className="flex flex-col rounded-lg bg-white sm:flex-row">
              <VehicleArtwork
                src={primaryImage}
                alt={singleVehicleDetail.name}
                fit="auto"
                className="m-1 mt-2 aspect-video w-full rounded-[20px] border drop-shadow-md sm:w-[240px]"
              />
              <div className="flex w-full flex-col px-4 py-4">
                <span className="font-semibold capitalize">
                  <span></span> {singleVehicleDetail.model}
                </span>
                <span className="float-right text-gray-400">
                  <span>Package : </span>
                  {singleVehicleDetail.base_package}
                </span>
                <span className="float-right text-gray-400">
                  <span></span>
                  {singleVehicleDetail.fuel_type}
                </span>
                <span className="float-right text-gray-400">
                  <span></span>
                  {singleVehicleDetail.transmition}
                </span>
                <span className="float-right text-gray-400">
                  <span></span>
                  {singleVehicleDetail.registeration_number}
                </span>
                <p className="text-lg font-bold flex justify-start items-center">
                  {formatTZS(singleVehicleDetail.price)}
                  <span className="text-[8px] ml-1 mt-1"> /per day</span>
                </p>
              </div>
            </div>
            <div className=" cursor-pointer  rounded-lg drop-shadow-sm  border border-slate-50  p-4 mt-40 pt-10">
              <div className="flex justify-around">
                <div className="md:ml-5 min-h-[300px] ">
                  <div className="mt-2 font-medium underline underline-offset-4 mb-5">
                    Pick up
                  </div>
                  <div className="mt-2 capitalize">
                    <p className="text-black text-[14px] mt-2 leading-6">
                      {pickup_district
                        ? pickup_district
                        : singleVehicleDetail.district}
                    </p>
                    <p className=" text-[14px] mt-2">
                      {pickup_location
                        ? pickup_location
                        : singleVehicleDetail.location}
                    </p>
                    <div className="text-[14px] flex flex-col justify-start items-start  pr-2 gap-2 mt-2">
                      <div className="flex justify-between gap-2 items-center">
                        <span>
                          <CiCalendarDate style={{ fontSize: 15 }} />
                        </span>
                          <>
                            <span>
                              {" "}
                              {displayPickupDate.getDate()} :{" "}
                            </span>
                            <span>
                              {" "}
                              {displayPickupDate.getMonth() + 1}{" "}
                              :{" "}
                            </span>
                            <span>
                              {" "}
                              {displayPickupDate.getFullYear()}
                            </span>
                          </>
                      </div>
                      <div className="flex justify-center items-center gap-2">
                        <span>
                          <IoMdTime style={{ fontSize: 16 }} />
                        </span>
                        <span>
                          {displayPickupDate.getHours()}
                        </span>
                        :
                        <span>
                          {displayPickupDate.getMinutes()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ml-5">
                  <div className="mt-2 font-medium underline underline-offset-4 mb-5">
                    Drop off
                  </div>

                  <div className="mt-2">
                    <p className="text-black text-[14px] leading-6 mt-2">
                      {pickup_district
                        ? pickup_district
                        : singleVehicleDetail.district}
                    </p>
                    <p className=" text-[14px] mt-2">
                      {dropoff_location
                        ? dropoff_location
                        : singleVehicleDetail.location}
                    </p>
                    <div className="text-[14px] flex flex-col justify-start items-start pr-2 gap-2 mt-2">
                      <div className="flex  justify-between gap-2 items-center">
                        <span>
                          <CiCalendarDate style={{ fontSize: 15 }} />
                        </span>
                        <span> {displayDropoffDate.getDate()} : </span>
                        <span>
                          {" "}
                          {displayDropoffDate.getMonth() + 1}{" "}
                          :{" "}
                        </span>
                        <span> {displayDropoffDate.getFullYear()} </span>
                        {errors?.pickup_district && (
                          <p className="text-red-500 text-[10px]">
                            {errors.pickup_district.message || "error"}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-center items-center gap-2">
                        <span>
                          <IoMdTime style={{ fontSize: 16 }} />
                        </span>
                        <span> {displayDropoffDate.getHours()}</span>:
                        <span> {displayDropoffDate.getMinutes()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className=" rounded-lg flex justify-center items-center gap-2 text-[8px] drop-shadow-md  border border-sm  p-4">
                <div>
                  <MdVerifiedUser
                    style={{ fontSize: 50, color: "green", fill: "green" }}
                  />
                </div>
                <div>
                  <p>Downtime charges: as per local rental policy</p>
                  <p>
                    Insurance support covers minor body damage except major
                    accidents, tyre misuse, or off-road restriction breaches
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* details */}
        <div className="mt-10 bg-gray-50 px-4 pt-8 lg:mt-0 drop-shadow-md ">
          <p className="text-xl font-medium">Payment Details</p>
          <p className="text-gray-400">
            Complete your order by providing your payment details.
          </p>

          <form onSubmit={handleSubmit(handlePlaceOrder)}>
            <div className="flex flex-col gap-y-8 my-4">
              {/* email */}

              <div>
                <TextField
                  id="email"
                  label="Email"
                  variant="outlined"
                  className="w-full"
                  defaultValue={email ? email : ""}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-500 text-[10px]">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* phone */}
              <div>
                <TextField
                  id="phoneNumber"
                  label="Phone"
                  variant="outlined"
                  className="w-full"
                  defaultValue={phoneNumber ? phoneNumber : ""}
                  {...register("phoneNumber")}
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-[10px]">
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              {/* adress */}
              <div>
                <TextField
                  id="adress"
                  label="Address"
                  multiline
                  rows={4}
                  defaultValue={adress ? adress : ""}
                  {...register("adress")}
                  className="w-full"
                />
                {errors.adress && (
                  <p className="text-red-500 text-[10px]">
                    {errors.adress.message}
                  </p>
                )}
              </div>

              <div>
                <TextField
                  id="paymentMethod"
                  label="Payment Method"
                  variant="outlined"
                  select
                  defaultValue={paymentMethods[0]}
                  {...register("paymentMethod")}
                  className="w-full"
                >
                  {paymentMethods.map((method) => (
                    <MenuItem value={method} key={method}>
                      {method}
                    </MenuItem>
                  ))}
                </TextField>
                {errors.paymentMethod && (
                  <p className="text-red-500 text-[10px]">
                    {errors.paymentMethod.message}
                  </p>
                )}
              </div>

              <div>
                <TextField
                  id="protectionPackage"
                  label="Protection Package"
                  variant="outlined"
                  select
                  defaultValue="standard"
                  {...register("protectionPackage")}
                  className="w-full"
                >
                  <MenuItem value="standard">Standard included</MenuItem>
                  <MenuItem value="plus">Plus protection</MenuItem>
                  <MenuItem value="premium">Premium protection</MenuItem>
                </TextField>
              </div>

              <div>
                <TextField
                  id="mileagePackageKm"
                  label="Mileage Package"
                  variant="outlined"
                  select
                  defaultValue=""
                  {...register("mileagePackageKm")}
                  className="w-full"
                >
                  <MenuItem value="">Standard mileage</MenuItem>
                  <MenuItem value="1000">1,000 km package</MenuItem>
                  <MenuItem value="2000">2,000 km package</MenuItem>
                </TextField>
              </div>

              {rentalAddOns.length > 0 && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="mb-3 text-sm font-semibold text-gray-900">Trip add-ons</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {rentalAddOns.map((addOn) => (
                      <label
                        className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-100 p-3 text-sm"
                        key={addOn.code}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selectedAddOns.includes(addOn.code)}
                          onChange={() => toggleAddOn(addOn.code)}
                        />
                        <span>
                          <span className="block font-medium text-gray-900">{addOn.name}</span>
                          <span className="block text-xs text-gray-500">
                            {formatTZS(addOn.price_amount)}
                            {addOn.price_type === "per_day" ? " / day" : ""}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* PinCode */}
              <div>
                <div className="flex gap-6">
                  <TextField
                    rows={4}
                    id="coupon"
                    // defaultValue={Address}
                    label={"Coupon"}
                    value={couponValue}
                    {...register("coupon")}
                    className="w-full border-none"
                    placeholder="KARIBU10000 is a valid coupon"
                  />
                  <button
                    onClick={(e) => {
                      e.preventDefault(), handleCoupon();
                    }}
                  >
                    <div className="bg-black text-white px-8 py-4 rounded-md">
                      Apply
                    </div>
                  </button>
                </div>
                {wrongCoupon && (
                  <p className="text-red-500 text-[8px]">Not a valid coupon</p>
                )}
              </div>
            </div>

            {quoteError && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {quoteError}
              </div>
            )}

            {/* Total */}
            <div className="mt-6 border-t border-b py-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">Rent</p>
                <p className="font-semibold text-gray-900">{formatTZS(price)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">Days</p>
                <p className="font-semibold text-gray-900">{rentalDays}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">Pickup support</p>
                <p className="font-semibold text-gray-900">{formatTZS(deliveryFee)}</p>
              </div>
              {oneWayFee > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Different return location</p>
                  <p className="font-semibold text-gray-900">{formatTZS(oneWayFee)}</p>
                </div>
              )}
              {protectionFee > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Protection package</p>
                  <p className="font-semibold text-gray-900">{formatTZS(protectionFee)}</p>
                </div>
              )}
              {mileageFee > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Mileage package</p>
                  <p className="font-semibold text-gray-900">{formatTZS(mileageFee)}</p>
                </div>
              )}
              {addOnsTotal > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Add-ons</p>
                  <p className="font-semibold text-gray-900">{formatTZS(addOnsTotal)}</p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">Discounts</p>
                <p className="font-semibold text-gray-900">{formatTZS(quoteDiscount)}</p>
              </div>
              {bookingQuote?.deposit_amount > 0 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">Refundable deposit estimate</p>
                  <p className="font-semibold text-gray-900">{formatTZS(bookingQuote.deposit_amount)}</p>
                </div>
              )}
              {bookingQuote?.rental_product === "long_term" && (
                <div className="mt-2 rounded-md bg-green-50 p-2 text-xs text-green-700">
                  Long-term rental pricing is active for this booking.
                </div>
              )}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">Total</p>
              <p className="text-2xl font-semibold text-gray-900 flex items-center justify-center">
                {formatTZS(totalPrice)}
              </p>
            </div>

            {isPageLoading ? (
              <button
                className={`mt-4 mb-8 w-full rounded-md bg-gray-400 px-6 py-3 font-medium text-black`}
                disabled
              >
                Processing ...
              </button>
            ) : (
              <button
                className={`mt-4 mb-8 w-full rounded-md bg-gray-900 px-6 py-3 font-medium text-white`}
              >
                {"Place Order"}
              </button>
            )}
          </form>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
