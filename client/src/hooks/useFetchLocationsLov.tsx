import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { setCompanyData, setDistrictData, setLocationData, setModelData } from "../redux/adminSlices/adminDashboardSlice/CarModelDataSlice";
import { setWholeData } from "../redux/user/selectRideSlice";
import { getCatalogMetadata } from "../services/vehicleService";

const useFetchLocationsLov = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  const fetchLov = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getCatalogMetadata();

      const models = data.filter((cur) => cur.type === "car").map((cur) => cur.model);
      dispatch(setModelData(models));

      const brand = data.filter((cur) => cur.type === "car").map((cur) => cur.brand);
      const uniqueBrand = brand.filter((cur, index) => {
        return brand.indexOf(cur) === index;
      });
      dispatch(setCompanyData(uniqueBrand));

      const locations = data.filter((cur) => cur.type === "location").map((cur) => cur.location);
      dispatch(setLocationData(locations));

      const districts = data.filter((cur) => cur.type === "location").map((cur) => cur.district);
      const uniqueDistricts = districts.filter((cur, idx) => {
        return districts.indexOf(cur) === idx;
      });
      dispatch(setDistrictData(uniqueDistricts));

      const wholeData = data.filter((cur) => cur.type === "location");
      dispatch(setWholeData(wholeData));
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  return { fetchLov, isLoading };
};

export default useFetchLocationsLov;
