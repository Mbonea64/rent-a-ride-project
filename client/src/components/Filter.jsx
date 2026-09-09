import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import { GoPlus } from "react-icons/go";

import { Controller, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { setFilteredData } from "../redux/user/sortfilterSlice";
import { useState } from "react";
import { filterVehicles } from "../data/localData";


const Filter = () => {
  const { control, handleSubmit } = useForm();
  const { userAllVehicles, allVariants } = useSelector(
    (state) => state.userListVehicles
  );
  const[filterOpen,setFilterOpen]  =  useState(false)

  const dispatch = useDispatch();
  let transformedData = [];

  const handleData = async (data) => {
    const typeMapping = {
      suv: "car_type",
      sedan: "car_type",
      hatchback: "car_type",
      automatic: "transmition",
      manual: "transmition",
    };

    // Transform the form data object into an array of objects with the desired structure
    transformedData = Object.entries(data)
      // eslint-disable-next-line no-unused-vars
      .filter(([key, value]) => value == true)
      .map(([key, value]) => ({ [key]: value, type: typeMapping[key] }));

    const sourceData = allVariants || userAllVehicles;

    if (transformedData.length <= 0) {
      dispatch(setFilteredData(sourceData));
      return;
    }

    const filtData = filterVehicles(sourceData, transformedData);
    dispatch(setFilteredData(filtData));
  };

  const handleClick =()=> {
    if (window.innerWidth <= 924) {
      // Only execute on mobile and tablet views
      setFilterOpen(!filterOpen);
    }

  }

  
  return (
    <div className="bg-white sticky top-5 scroll-m-9">
      <div className="sticky top-0 left-0 right-0  ">
        <div className="filterComponent flex h-full max-w-[320px] lg:max-w-[350px]  flex-col  bg-white  shadow-xl mx-auto">
          <div className="flex items-center justify-between px-4 py-2">
            <h2 className="text-lg font-medium text-gray-900">Filters</h2>
            <button
              type="button"
              className="-mr-2  flex h-10 w-10 items-center justify-center rounded-md bg-white p-2 text-gray-400"
              onClick={()=> setFilterOpen(!filterOpen) }
            >
             
              <div className={`plusicon ${filterOpen ? 'iconClose' : 'plusiconOpen'}`}><GoPlus className="plusicon"/></div>
            
            </button>
          </div>

          {/* <!-- Filters  form --> */}

         
          <div className={` border-t border-gray-200 dropdown-content ${filterOpen ? 'open opacity-100 fade-in' : 'opacity-0 fade-out'} `}>
            <h3 className="sr-only">Categories</h3>

            <div className="border-t border-gray-200 px-4 py-6">
              <div className="flex flex-col justify-center  items-start gap-y-4 w-full">
                <form className="w-full" onSubmit={handleSubmit(handleData)}>
                  <div className="w-full mb-7 ">
                    <div className="mb-5 flex justify-between items-center">
                      <div>Type</div>{" "}
                      <div>
                        <GoPlus color="gray" />
                      </div>
                    </div>
                    <div>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Controller
                              name="suv"
                              control={control}
                              render={({ field }) => (
                                <Checkbox
                                  {...field}
                                  checked={field["value"] ?? false}
                                />
                              )}
                            />
                          }
                          label="Suv"
                        />
                        <FormControlLabel
                          control={
                            <Controller
                              name="sedan"
                              control={control}
                              render={({ field }) => (
                                <Checkbox
                                  {...field}
                                  checked={field["value"] ?? false}
                                />
                              )}
                            />
                          }
                          label="Sedan"
                        />
                        <FormControlLabel
                          control={
                            <Controller
                              name="hatchback"
                              control={control}
                              render={({ field }) => (
                                <Checkbox
                                  {...field}
                                  checked={field["value"] ?? false}
                                />
                              )}
                            />
                          }
                          label="Hatchback"
                        />
                      </FormGroup>
                    </div>
                  </div>

                  <div className="w-full border-t border-t-gray-300 pt-7">
                    <div className="mb-5 flex justify-between items-center">
                      <div>Transmission</div>
                      <div>
                        <GoPlus color="gray" />
                      </div>
                    </div>
                    <div>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Controller
                              name="automatic"
                              control={control}
                              render={({ field }) => (
                                <Checkbox
                                  {...field}
                                  checked={field["value"] ?? false}
                                />
                              )}
                            />
                          }
                          label="Automatic"
                        />
                        <FormControlLabel
                          control={
                            <Controller
                              name="manual"
                              control={control}
                              render={({ field }) => (
                                <Checkbox
                                  {...field}
                                  checked={field["value"] ?? false}
                                />
                              )}
                            />
                          }
                          label="Manual"
                        />
                      </FormGroup>
                    </div>
                  </div>

                  <div className="mt-7 pt-7 border-t border-t-gray-300">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-black text-white rounded-md"
                      onClick={handleClick}
                    >
                      Apply
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filter;
