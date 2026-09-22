import { Routes, Route } from "react-router-dom";
import { Navbar, SideBar } from "../components/index.jsx";
import {
  AllVehicles,
  AllUsers,
  AllVendors,
  Calender,
  ColorPicker,
  Customers,
  Editor,
  VenderVehicleRequests,
} from "../pages";
import { useSelector } from "react-redux";
import AdminHomeMain from "../pages/AdminHomeMain.jsx";
import Bookings from "../components/Bookings.jsx";
import NotificationsPage from "../../../components/NotificationsPage.jsx";
import SalesDashboard from "../pages/SalesDashboard.jsx";

function AdminDashNew() {
  const { activeMenu } = useSelector((state) => state.adminDashboardSlice);

  return (
    <div>
      <div className="flex relative dark:bg-main-dark-bg">
      
        {activeMenu ? (
          <div className="w-72 fixed sidebar dark:bg-secondary-dark-bg">
            <SideBar />
          </div>
        ) : (
          <div className="w-0 dark:bg-secondary-dark-bg">
            <SideBar />
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
              <Route path="/" element={<AdminHomeMain/>}/>
              <Route path="/adminHome" element={<AdminHomeMain />} />
              <Route path="/allProduct" element={<AllVehicles />} />
              <Route path="/allUsers" element={<AllUsers />} />
              <Route path="/allVendors" element={<AllVendors />} />
              <Route path="/calender" element={<Calender />} />
              <Route path="/colorPicker" element={<ColorPicker />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/editor" element={<Editor />} />
              <Route path="/vendorVehicleRequests" element={<VenderVehicleRequests />} />
              <Route path="/orders" element={<Bookings />} />
              <Route path="/sales" element={<SalesDashboard />} />
              <Route path="/notifications" element={<NotificationsPage role="admin" />} />

            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashNew;
