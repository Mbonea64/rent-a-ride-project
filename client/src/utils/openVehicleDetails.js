import { setVehicleDetail } from "../redux/user/listAllVehicleSlice";

export const onVehicleDetail = (vehicle, dispatch, navigate) => {
  if (!vehicle?._id) return;
  dispatch(setVehicleDetail(vehicle));
  navigate(`/vehicleDetails/${vehicle._id}`);
};
