import { FiSettings } from "react-icons/fi";
import { TooltipComponent } from "@syncfusion/ej2-react-popups";
import { Routes, Route } from "react-router-dom";
import { useSelector } from "react-redux";

import { Navbar } from "../../admin/components";

import VendorHomeMain from "../pages/VendorHomeMain";
import VendorAllVehicles from "../pages/VendorAllVehicles";
import VendorSidebar from "../Components/VendorSidebar";
import VendorBookings from "../Components/VendorBookings";
import NotificationsPage from "../../../components/NotificationsPage";
import VendorSalesDashboard from "../pages/VendorSalesDashboard";
import VendorEditProductComponent from "../Components/VendorEditProductComponent";

function VendorDashboard() {
  const { activeMenu } = useSelector((state) => state.adminDashboardSlice);

  return (
    <div>
      <div className="flex relative dark:bg-main-dark-bg">
        <div className="fixed right-4 bottom-4" style={{ zIndex: "1000" }}>
          <TooltipComponent content="Settings" position="Top">
            <button
              type="button"
              className="text-3xl p-3 hover:drop-shadow-xl hover:bg-gray-200 hover:radius text-white"
              style={{ background: "blue", borderRadius: "50%" }}
            >
              <FiSettings />
            </button>
          </TooltipComponent>
        </div>
        {activeMenu ? (
          <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg">
            <VendorSidebar />
          </div>
        ) : (
          <div className="w-0 dark:bg-secondary-dark-bg">
            <VendorSidebar />
          </div>
        )}

        <div
          className={`dark:bg-white bg-white min-h-screen min-w-0 ${
            activeMenu ? "ml-72 w-[calc(100%-18rem)] md:ml-72" : "w-full flex-1"
          } `}
        >
          <div className={`fixed md:static bg-white  w-full   `}>
            <Navbar />
          </div>

          <div className="main_section mx-4 min-w-0 overflow-x-hidden md:mx-8">
            <Routes>
              <Route path="/" element={<VendorHomeMain />} />
              <Route path="/adminHome" element={<VendorHomeMain />} />
              <Route path="/overview" element={<VendorHomeMain />} />
              <Route path="/vendorAllVeihcles" element={<VendorAllVehicles />} />
              <Route path="/vendorEditProductComponent" element={<VendorEditProductComponent />} />
              <Route path="/bookings" element={<VendorBookings />} />
              <Route path="/sales" element={<VendorSalesDashboard />} />
              <Route path="/notifications" element={<NotificationsPage role="vendor" />} />

            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorDashboard;
