import {
  setCompanyData,
  setDistrictData,
  setLocationData,
  setModelData,
} from "../redux/adminSlices/adminDashboardSlice/CarModelDataSlice";
import { setWholeData } from "../redux/user/selectRideSlice";
import { getCatalogMetadata } from "../services/vehicleService";

export const loadCatalogMetadata = async (dispatch) => {
  const data = await getCatalogMetadata();
  const cars = data.filter((item) => item.type === "car");
  const locations = data.filter((item) => item.type === "location");

  dispatch(setModelData([...new Set(cars.map((item) => item.model))]));
  dispatch(setCompanyData([...new Set(cars.map((item) => item.brand))]));
  dispatch(setLocationData(locations.map((item) => item.location)));
  dispatch(setDistrictData([...new Set(locations.map((item) => item.district))]));
  dispatch(setWholeData(locations));
};
