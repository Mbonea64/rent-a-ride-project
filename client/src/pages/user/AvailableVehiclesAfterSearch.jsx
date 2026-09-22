import { useDispatch, useSelector } from "react-redux";
import { FaCarSide } from "react-icons/fa";
import { MdAirlineSeatReclineNormal } from "react-icons/md";

import CarNotFound from "./CarNotFound";
import { useNavigate } from "react-router-dom";

import { setVariants } from "../../redux/user/listAllVehicleSlice";
import { setFilteredData } from "../../redux/user/sortfilterSlice";
import { formatTZS } from "../../data/localData";
import { getAvailableVariants } from "../../services/vehicleService";
import VehicleArtwork from "../../components/VehicleArtwork";
import { onVehicleDetail } from "../../utils/openVehicleDetails";

const AvailableVehiclesAfterSearch = () => {
  const { availableCars } = useSelector((state) => state.selectRideSlice);
  const { pickup_district, pickup_location, pickupDate, dropoffDate } =
    useSelector((state) => state.bookingDataSlice);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const selectVehicle = async (vehicle) => {
    try {
      const variants = await getAvailableVariants({
        model: vehicle.model,
        pickupDate: pickupDate.humanReadable,
        dropOffDate: dropoffDate.humanReadable,
        pickUpDistrict: pickup_district,
        pickUpLocation: pickup_location,
      });
      const exactVehicle = variants.find((item) => item._id === vehicle._id) || variants[0] || vehicle;
      dispatch(setVariants(variants));
      dispatch(setFilteredData(variants));
      onVehicleDetail(exactVehicle, dispatch, navigate);
    } catch (error) {
      console.log(error);
      onVehicleDetail(vehicle, dispatch, navigate);
    }
  };

  return (
    <div>
      {availableCars && availableCars.length > 0 && (
        <div className="text-center flex flex-col  mt-10 justify-center items-center sm:max-w-[500px] mx-auto">
          <h2 className="text-[18px] lg:text-[24px]">Choose From Options</h2>
          <p className="text-center text-[8px] px-6  lg:text-[12px]  lg:w-[550px]">
            Choose from locally available cars near your selected Tanzania
            pickup point for the dates you selected.
          </p>
        </div>
      )}

      <div className=" mx-auto flex sm:flex-row  w-full  lg:grid lg:max-w-[1000px]  lg:grid-cols-3 justify-center items-center gap-5 flex-wrap mt-10 drop-shadow-md">
        {availableCars &&
          availableCars.map(
            (cur, idx) =>
              cur.isDeleted === "false" && (
                <div
                  className="bg-white box-shadow rounded-lg  drop-shadow "
                  key={idx}
                >
                  <div className="mx-auto max-w-[320px] px-4 py-2 sm:px-6 sm:py-0 lg:max-w-7xl lg:px-8">
                    <VehicleArtwork
                      src={cur.image[0]}
                      alt={cur.name}
                      className="mb-3 aspect-video w-full rounded-[20px] transition-opacity group-hover:opacity-90"
                    />
                    <div className="flex justify-between items-start">
                      <h2 className="text-[14px] capitalize font-semibold tracking-tight text-gray-900">
                        <span></span>
                        {cur.name}
                      </h2>

                      <div className="text-[14px]  flex flex-col items-end">
                        <p className="font-semibold">{formatTZS(cur.price)}</p>
                        <div className="text-[6px] relative bottom-[3px]">
                          Per Day
                        </div>
                      </div>
                    </div>

                    <div className="my-2 font-mono">
                      <div className="flex justify-between items-center mb-5 mt-5">
                        <h3 className="text-[12px] flex justify-between items-center gap-1 ">
                          <span>
                            <FaCarSide />
                          </span>
                          {cur.company}
                        </h3>
                        <p className=" text-end text-[12px] flex justify-between items-center gap-1">
                          <span>
                            <MdAirlineSeatReclineNormal />
                          </span>
                          {cur.seats}
                        </p>
                      </div>
                      <div className="flex justify-between items-center text-[12px] mb-5 ">
                        <p className="flex items-center justify-center gap-1">
                          <FaCarSide />
                          {cur.car_type}
                        </p>
                        <p className="flex justify-between items-center gap-1">
                          <>
                            <button
                              className="bg-green-500 rounded-sm text-black px-6 py-2"
                              onClick={() => selectVehicle(cur)}
                            >
                              View
                            </button>
                          </>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
          )}
      </div>
      {!availableCars || (availableCars.length == 0 && <CarNotFound />)}
    </div>
  );
};

export default AvailableVehiclesAfterSearch;
