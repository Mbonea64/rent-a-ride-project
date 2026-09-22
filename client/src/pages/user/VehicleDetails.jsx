import { GrSecure } from "react-icons/gr";
import { FaStar } from "react-icons/fa";
import { CiCalendarDate } from "react-icons/ci";
import { GiGearStickPattern } from "react-icons/gi";
import { FaCarSide } from "react-icons/fa";
import { MdAirlineSeatReclineExtra } from "react-icons/md";
import { BsFillFuelPumpFill } from "react-icons/bs";

import { FaCarAlt } from "react-icons/fa";
import { FaBuilding } from "react-icons/fa";
import styles from "../..";
import { IoArrowBackCircleSharp } from "react-icons/io5";
import { TooltipComponent } from "@syncfusion/ej2-react-popups";

import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { formatTZS } from "../../data/localData";
import CarNotFound from "./CarNotFound";
import VehicleArtwork from "../../components/VehicleArtwork";
import useSelectedVehicle from "../../hooks/useSelectedVehicle";
import { getVehicleImage } from "../../utils/vehicleImages";
// import { signOut } from "../../redux/user/userSlice";

const VehicleDetails = () => {
  const navigate = useNavigate();
  const { vehicle, isLoading, error } = useSelectedVehicle();
  const { availableCars } = useSelector((state) => state.selectRideSlice);
  const backPath = availableCars?.length ? "/availableVehicles" : "/vehicles";

  const handleBook = async (navigate) => {
    try {
      navigate(`/checkoutPage/${vehicle._id}`);
    } catch (error) {
      console.log(error);
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center">Loading vehicle...</div>;
  }

  if (error || !vehicle) return <CarNotFound />;

  const primaryImage = getVehicleImage(vehicle);
  const galleryImages = Array.isArray(vehicle.image)
    ? vehicle.image.filter(Boolean)
    : primaryImage
      ? [primaryImage]
      : [];

  return (
    <div>
      <section className="py-12 sm:py-8 lg:py-0 bg-white">
        <div className="container mx-auto px-4">
          <div className="lg:col-gap-12 xl:col-gap-16  grid grid-cols-1 gap-12  lg:grid-cols-5 lg:gap-16">
            <div className="lg:col-span-3 lg:row-end-1">
              <div className="lg:flex lg:items-start mt-[100px]">
                <div className="lg:order-2 lg:ml-5">
                  <VehicleArtwork
                    src={primaryImage}
                    alt={vehicle.name}
                    loading="eager"
                    className="aspect-video max-w-xl rounded-[24px]"
                  />
                </div>
                <div className="absolute top-2 left-5 md:left-10">
                  <TooltipComponent content={"back"} position="BottomCenter">
                    <Link to={backPath}>
                      <IoArrowBackCircleSharp
                        style={{ fontSize: "40", hover: "fill-red-700" }}
                        className="hover:fill-slate-500"
                      />
                    </Link>
                  </TooltipComponent>
                </div>
                <div className="mt-2 w-full lg:order-1 lg:w-32 lg:flex-shrink-0">
                  <div className="flex flex-row items-start lg:flex-col">
                    {galleryImages.length > 1 && galleryImages.map((cur, idx) => (
                        <button
                          type="button"
                          className="mb-3 w-32 overflow-hidden rounded-lg border-2 border-gray-900 text-center"
                          key={idx}
                        >
                          <VehicleArtwork
                            src={cur}
                            alt={`${vehicle.name} view ${idx + 1}`}
                            className="aspect-video w-full"
                          />
                        </button>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2 bg-slate-50 px-10 min-h-screen  pb-5 pt-10 ">
              <h1 className="sm: text-2xl font-bold text-gray-900 sm:text-3xl capitalize">
                {vehicle.name}
              </h1>

              <div className="mt-3 flex flex-col justify-center items-start select-none flex-wrap  gap-4 font-mono text-[14px]">
                <div
                  className={`${styles.iconFlex} capitalize border border-slate-200 p-2 rounded-md`}
                >
                  <span>
                    <FaCarAlt />{" "}
                  </span>
                  Model - {vehicle.model}
                </div>
                <div
                  className={`${styles.iconFlex} capitalize border border-slate-200 p-2 rounded-md`}
                >
                  <span>
                    <FaBuilding />
                  </span>
                  Company - {vehicle.company}
                </div>
                <div
                  className={`${styles.iconFlex} capitalize border border-slate-200 p-2 rounded-md`}
                >
                  <span>
                    <CiCalendarDate />
                  </span>
                  Year model : {vehicle.year_made}
                </div>
                <div
                  className={`${styles.iconFlex} capitalize border border-slate-200 p-2 rounded-md`}
                >
                  <span>
                    <GiGearStickPattern />
                  </span>
                  Transmission : {vehicle.transmition}
                </div>
                <div
                  className={`${styles.iconFlex} capitalize border border-slate-200 p-2 rounded-md`}
                >
                  <span>
                    <FaCarSide />
                  </span>
                  Car Type : {vehicle.car_type}
                </div>
                <div
                  className={`${styles.iconFlex} capitalize border border-slate-200 p-2 rounded-md`}
                >
                  <span>
                    <MdAirlineSeatReclineExtra />
                  </span>
                  Seats : {vehicle.seats}
                </div>
                <div
                  className={`${styles.iconFlex} capitalize border border-slate-200 p-2 rounded-md`}
                >
                  <span>
                    <BsFillFuelPumpFill />
                  </span>
                  Fuel type : {vehicle.fuel_type}
                </div>
                <div
                  className={`${styles.iconFlex} capitalize border border-slate-200 p-2 rounded-md`}
                >
                  Registeration Number :{" "}
                  {vehicle.registeration_number}
                </div>
                <div
                  className={`${styles.iconFlex} capitalize border border-slate-200 p-2 rounded-md`}
                >
                  Rating: {vehicle.ratting}{" "}
                  <span style={{ color: "gold" }}>
                    <FaStar />
                  </span>
                </div>
              </div>

              <div className="mt-3 flex select-none flex-wrap items-center gap-1"></div>

              <div className="mt-10 flex flex-col items-center justify-between space-y-4 border-t border-b py-4 sm:flex-row sm:space-y-0">
                <div className="flex items-end">
                  <h1 className="text-3xl font-bold flex items-center justify-center">
                    {formatTZS(vehicle.price)}
                  </h1>
                  <span className="text-base">/Day</span>
                </div>

                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md border-2 border-transparent bg-gray-900 bg-none px-12 py-3 text-center text-base font-bold text-white transition-all duration-200 ease-in-out focus:shadow hover:bg-gray-800 gap-2"
                  onClick={() => {
                    handleBook(navigate);
                  }}
                >
                  <span>
                    <GrSecure />
                  </span>
                  Book Ride
                </button>
              </div>

              <ul className="mt-8 space-y-2">
                <li className="flex items-center text-left text-sm font-medium text-gray-600">
                  <svg
                    className="mr-2 block h-5 w-5 align-middle text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      className=""
                    ></path>
                  </svg>
                  Pickup support available at selected Tanzania locations
                </li>

                <li className="flex items-center text-left text-sm font-medium text-gray-600">
                  <svg
                    className="mr-2 block h-5 w-5 align-middle text-gray-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                      className=""
                    ></path>
                  </svg>
                  Cancel Anytime
                </li>
              </ul>
            </div>

            <div className="lg:col-span-3">
              <div className="border-b border-gray-300">
                <nav className="flex gap-4">
                  <a
                    href="#"
                    title=""
                    className="border-b-2 border-gray-900 py-4 text-sm font-medium text-gray-900 hover:border-gray-400 hover:text-gray-800"
                  >
                    {" "}
                    Description{" "}
                  </a>
                </nav>
              </div>

              <div className="mt-0 flow-root sm:mt-6">
                <h1 className=" text-3xl font-bold">
                  {vehicle.car_title}
                </h1>
                <p className="mt-4 text-justify">
                  {vehicle.car_description}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VehicleDetails;
