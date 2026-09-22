import { useDispatch, useSelector } from "react-redux";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  signOut,
} from "../redux/user/userSlice";
import { useEffect, useState } from "react";
import { SiShopware } from "react-icons/si";
import { TooltipComponent } from "@syncfusion/ej2-react-popups";
import { MdOutlineCancel } from "react-icons/md";
import { links } from "./UserSidebarContent";
import { showSidebarOrNot } from "../redux/adminSlices/adminDashboardSlice/DashboardSlice";
import { CiLogout } from "react-icons/ci";
import { signOutFromSupabase } from "../services/authService";
import SidebarNotificationLink from "./SidebarNotificationLink";
import { getCustomerActionCounts } from "../services/actionCenterService";


const UserProfileSidebar = () => {
  const { activeMenu, screenSize } = useSelector(
    (state) => state.adminDashboardSlice
  );
  const { currentUser } = useSelector((state) => state.user);
  const [actionCounts, setActionCounts] = useState({});

  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    let active = true;
    const loadActionCounts = () =>
      getCustomerActionCounts(currentUser?._id || currentUser?.id)
        .then((counts) => {
          if (active) setActionCounts(counts || {});
        })
        .catch(() => {
          if (active) setActionCounts({});
        });

    loadActionCounts();
    const interval = window.setInterval(loadActionCounts, 30000);
    window.addEventListener("rent-a-ride-payment-updated", loadActionCounts);
    window.addEventListener("rent-a-ride-bookings-updated", loadActionCounts);
    window.addEventListener("rent-a-ride-demo-reset", loadActionCounts);
    window.addEventListener("storage", loadActionCounts);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("rent-a-ride-payment-updated", loadActionCounts);
      window.removeEventListener("rent-a-ride-bookings-updated", loadActionCounts);
      window.removeEventListener("rent-a-ride-demo-reset", loadActionCounts);
      window.removeEventListener("storage", loadActionCounts);
    };
  }, [currentUser?._id, currentUser?.id]);

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
              to={`/`}
              onClick={() => {}}
              className="items-center flex gap-3 mt-4 ml-3 text-xl font-extrabold text-black tracking-tight "
            >
              <SiShopware />
              Rent a Ride
            </Link>
            {/* hide sidebar button */}
            <TooltipComponent content={"menu"} position="BottomCenter">
              <button
                className="text-xl rounded-full p-3 mt-4 block  hover:bg-gray-500"
                onClick={() => {dispatch(showSidebarOrNot(false))}}
              >
                <MdOutlineCancel />
              </button>
            </TooltipComponent>
          </div>
          <div className="mt-10">
            {links.map((cur, idx) => (
              <div key={idx}>
                {cur.links.map((link) => (
                  <NavLink
                    to={`/profile/${link.name}`}
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
                    <span className="text-gray-600">
                      {link.label || link.name}
                    </span>
                    {Number(actionCounts[link.name] || 0) > 0 && (
                      <span className="ml-auto mr-3 rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                        {actionCounts[link.name]}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            ))}
            <SidebarNotificationLink role="customer" />

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

export default UserProfileSidebar;
