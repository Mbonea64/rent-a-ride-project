import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import { setVehicleDetail } from "../redux/user/listAllVehicleSlice";
import { getVehicle } from "../services/vehicleService";

const useSelectedVehicle = () => {
  const { vehicleId } = useParams();
  const dispatch = useDispatch();
  const storedVehicle = useSelector(
    (state) => state.userListVehicles.singleVehicleDetail
  );
  const storedVehicleMatches =
    Boolean(storedVehicle) && (!vehicleId || storedVehicle._id === vehicleId);
  const [isLoading, setIsLoading] = useState(
    Boolean(vehicleId && !storedVehicleMatches)
  );
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!vehicleId || storedVehicleMatches) {
      setIsLoading(false);
      setError(null);
      return undefined;
    }

    let active = true;
    setIsLoading(true);
    setError(null);

    getVehicle(vehicleId)
      .then((vehicle) => {
        if (active) dispatch(setVehicleDetail(vehicle));
      })
      .catch((loadError) => {
        if (active) setError(loadError);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dispatch, storedVehicleMatches, vehicleId]);

  return {
    vehicle: storedVehicleMatches ? storedVehicle : null,
    isLoading,
    error,
  };
};

export default useSelectedVehicle;
