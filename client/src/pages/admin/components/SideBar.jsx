import { SiShopware } from "react-icons/si";
import { MdOutlineCancel } from "react-icons/md";
import { TooltipComponent } from "@syncfusion/ej2-react-popups";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { links } from "../data/SidebarContents.jsx";
import { CiLogout } from "react-icons/ci";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { signOut } from "../../../redux/user/userSlice.jsx";
import { showSidebarOrNot } from "../../../redux/adminSlices/adminDashboardSlice/DashboardSlice.jsx";
import { signOutFromSupabase } from "../../../services/authService";
import SidebarNotificationLink from "../../../components/SidebarNotificationLink.jsx";
import { getAdminActionCounts } from "../../../services/actionCenterService.js";

const SideBar = () => {
  const { activeMenu, screenSize } = useSelector(
    (state) => state.adminDashboardSlice
  );

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [actionCounts, setActionCounts] = useState({});

  useEffect(() => {
    let active = true;
    const loadActionCounts = () =>
      getAdminActionCounts()
        .then((counts) => {
          if (active) setActionCounts(counts || {});
        })
        .catch(() => {
          if (active) setActionCounts({});
        });

    loadActionCounts();
    const interval = window.setInterval(loadActionCounts, 30000);
    window.addEventListener("rent-a-ride-vehicle-requests-updated", loadActionCounts);
    window.addEventListener("rent-a-ride-vehicle-issues-updated", loadActionCounts);
    window.addEventListener("rent-a-ride-vehicle-change-requests-updated", loadActionCounts);
    window.addEventListener("rent-a-ride-payment-updated", loadActionCounts);
    window.addEventListener("rent-a-ride-bookings-updated", loadActionCounts);
    window.addEventListener("rent-a-ride-demo-reset", loadActionCounts);
    window.addEventListener("storage", loadActionCounts);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("rent-a-ride-vehicle-requests-updated", loadActionCounts);
      window.removeEventListener("rent-a-ride-vehicle-issues-updated", loadActionCounts);
      window.removeEventListener("rent-a-ride-vehicle-change-requests-updated", loadActionCounts);
      window.removeEventListener("rent-a-ride-payment-updated", loadActionCounts);
      window.removeEventListener("rent-a-ride-bookings-updated", loadActionCounts);
      window.removeEventListener("rent-a-ride-demo-reset", loadActionCounts);
      window.removeEventListener("storage", loadActionCounts);
    };
  }, []);

  const activeLink =
    "flex items-center gap-5 pl-4 pt-3 pb-2.5 rounded-lg text-black bg-blue-50 text-md  m-2";
    //in normal mode there was dark:text-gray-200 i removed it
  const normalLink =
    "flex items-center gap-5 pl-4 pt-3 pb-2.5 rounded-lg  text-md text-gray-700   dark:hover:text-black hover:bg-slate-100 m-2";

  //SignOut
  const handleSignout = async () => {
    await signOutFromSupabase();
    dispatch(signOut());
    navigate("/signin");
  };

  return (
    <div className="ml-3 h-screen md:overflow-hidden overflow-auto md:hover:overflow-auto pb-10">
      {activeMenu && (
        <>
          <div className="flex justify-between items-center">
            <Link
              to={`/adminDashboard`}
              onClick={() => {}}
              className="items-center flex gap-3 mt-4 ml-3 text-xl font-extrabold text-blue-500 tracking-tight "
            >
              <SiShopware />
              Rent a Ride
            </Link>
            <TooltipComponent content={"menu"} position="BottomCenter">
              <button
                className="text-xl rounded-full p-3 mt-4 block md:hidden hover:bg-gray-500"
                onClick={() => {}}
              >
                <MdOutlineCancel />
              </button>
            </TooltipComponent>
          </div>
          <div className="mt-10">
            {links.map((cur, idx) => (
              <div key={idx}>
                <p className="text-gray-700 m-3 mt-4 text-uppercase">{cur.title}</p>
                {cur.links.map((link) => (
                  <NavLink
                    to={`/adminDashboard/${link.name}`}
                    key={link.name}
                    onClick={() => {
                      if (screenSize <= 900 && activeMenu) {
                        dispatch(showSidebarOrNot(false));
                      }
                    }}
                    className={({ isActive }) =>
                      isActive ? activeLink : normalLink
                    }
                  >
                    {link.icon}
                    <span className="text-gray-600">{link.label || link.name}</span>
                    {Number(actionCounts[link.name] || 0) > 0 && (
                      <span className="ml-auto mr-3 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                        {actionCounts[link.name]}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
            <SidebarNotificationLink role="admin" />
            <div className="flex items-center mt-10 gap-2">
              <button
                type="button"
                className="ml-4 text-red-400"
                onClick={handleSignout}
              >
                SignOut
              </button>
              <CiLogout />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SideBar;
