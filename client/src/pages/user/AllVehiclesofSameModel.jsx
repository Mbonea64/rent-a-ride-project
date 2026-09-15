import { useDispatch, useSelector } from "react-redux";
import { FaCarSide } from "react-icons/fa";
import { BsFillFuelPumpFill } from "react-icons/bs";
import { MdAirlineSeatReclineNormal } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { onVehicleDetail } from "../../utils/openVehicleDetails";
import CarNotFound from "./CarNotFound";
import Filter from "../../components/Filter";
import Sort from "../../components/Sort";
import Header from "../../components/Header";
import { setVariantModeOrNot } from "../../redux/user/sortfilterSlice";
import { useEffect } from "react";
import { formatTZS } from "../../data/localData";
import VehicleArtwork from "../../components/VehicleArtwork";

const AllVehiclesofSameModel = () => {
  const { allVariants } = useSelector((state) => state.userListVehicles);
  const { filterdData } = useSelector((state) => state.sortfilterSlice);
  const dispatch = useDispatch();
  const navigate = useNavigate();


  useEffect(() => {
    // Set variant mode to true when all variants are available
    if (allVariants) {
      dispatch(setVariantModeOrNot(true));
    }
  }, [allVariants, dispatch]);

  //i made this allVariant state to show is filter currently used by search from home page or by AllListed Vehicles in Navbar
  // if (allVariants) dispatch(setVariantModeOrNot(true));

  return (
    <>
      <Header />
      <div className=" lg:grid lg:grid-cols-12 gap-x-10 mx-28 justify-between">
        <div className=" mt-10 col-span-3   relative box-shadow-xl drop-shadow-xl ">
          <Filter />
        </div>
        <div className="col-span-9">
          <div className="mt-10  bg-blend-overlay  backdrop-blur-xl opacity-1 box-shadow-xl  top-5 z-40 drop-shadow-lg ">
            <Sort />
          </div>

          {filterdData && filterdData.length > 0 ? (
          <div
            className=" mx-auto flex sm:flex-row  w-full  lg:grid lg:max-w-[1000px]  lg:grid-cols-3 justify-center items-center gap-5 
    flex-wrap mt-10"
          >
            
              {filterdData.map(
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
                              <span>
                                <BsFillFuelPumpFill />
                              </span>
                              {cur.fuel_type}
                            </p>
                          </div>

                          <hr />

                          <div className="flex justify-center items-center gap-x-5  my-3">
                            <button
                              className="bg-green-500 px-4 py-2 w-[100px] rounded-sm"
                              onClick={() =>
                                onVehicleDetail(cur, dispatch, navigate)
                              }
                            >
                              <div className="text-[12px] ">Book Ride</div>
                            </button>

                            <button
                              className="bg-black px-4 py-2 w-[100px] rounded-sm"
                              onClick={() =>
                                onVehicleDetail(cur, dispatch, navigate)
                              }
                            >
                              <div className="text-[12px] text-white">
                                Details
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
              )}
              </div>
            ) 
            : (
              <div className="max-w-[400px] flex flex-col justify-center gap-y-4 items-center mx-auto mt-10">
                <img
                  src="/assets/vehicles/toyota-camry.png"
                  alt=""
                />
                <p className="text-md font-bold">No car found </p>
              </div>
            )}
          

          {!allVariants || (allVariants.length == 0 && <CarNotFound />)}
        </div>
      </div>
    </>
  );
};

export default AllVehiclesofSameModel;
