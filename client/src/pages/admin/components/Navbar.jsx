import { useDispatch, useSelector } from "react-redux";
import {
  openPages,
  setScreenSize,
  showSidebarOrNot,
  toggleSidebar,
} from "../../../redux/adminSlices/adminDashboardSlice/DashboardSlice";
import { AiOutlineMenu } from "react-icons/ai";
import { BsChatLeft } from "react-icons/bs";
import { RiNotification3Line } from "react-icons/ri";
import { MdKeyboardArrowDown } from "react-icons/md";
import { TooltipComponent } from "@syncfusion/ej2-react-popups";
import {  Chat, Notification, UserProfile } from ".";
import { useEffect } from "react";
import PropTypes from "prop-types";
import ProfileAvatar from "../../../components/ProfileAvatar";

const Navbar = () => {
  const dispatch = useDispatch();
  const {  chat, notification, userProfile, screenSize } = useSelector(
    (state) => state.adminDashboardSlice
  );
  const currentUser = useSelector((state) => state.user.currentUser);
  const displayName = currentUser?.username || "Admin";

  useEffect(() => {
    const handleResize = () => dispatch(setScreenSize(window.innerWidth));

    window.addEventListener("resize", handleResize);

    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  useEffect(() => {
    if (screenSize <= 900) {
      dispatch(showSidebarOrNot(false));
    } else {
      dispatch(showSidebarOrNot(true));
    }
  }, [screenSize, dispatch]);

  const NavButton = ({ title, customFunc, icon, color, dotColor }) => (
    <TooltipComponent content={title} position={"BottomCenter"}>
      <button
        type="button"
        onClick={customFunc}
        style={{ color, dotColor }}
        className="relative text-xl p-3  hover:bg-gray-100  rounded-full mb-2"
      >
        <span
          style={{ background: dotColor }}
          className="absolute inline-flex rounded-full right-[8px] top-2  h-2 w-2"
        ></span>
        {icon}
      </button>
    </TooltipComponent>
  );

  NavButton.propTypes = {
    title: PropTypes.string.isRequired,
    customFunc: PropTypes.func.isRequired,
    icon: PropTypes.node, // assuming icon can be any renderable component
    color: PropTypes.string,
    dotColor: PropTypes.string,
  };

  return (
    <div className="flex justify-between p-2 md:mx-6 relative">
      <div>
        <NavButton
          title="Menu"
          customFunc={() => dispatch(toggleSidebar())}
          color={"blue"}
          icon={<AiOutlineMenu />}
        />
      </div>

      <div className="flex justify-between">
       

        <NavButton
          title="Chat"
          customFunc={() => dispatch(openPages("chat"))}
          color={"blue"}
          dotColor={"cyan"}
          icon={<BsChatLeft />}
        />

        <NavButton
          title="Notification"
          customFunc={() => dispatch(openPages("notification"))}
          color={"blue"}
          dotColor={"gold"}
          icon={<RiNotification3Line />}
        />
        <TooltipComponent content="profile" position="BottomCenter">
          <div
            className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-100 rounded-lg mt-2"
            onClick={() => dispatch(openPages("userProfile"))}
          >
            <ProfileAvatar
              email={currentUser?.email}
              name={displayName}
              role={currentUser?.isVendor ? "vendor" : "admin"}
              src={currentUser?.profilePicture}
              size={24}
            />
            <p>
              <span className="text-[12px] text-gray-400">Hi,</span>{" "}
              <span className="text-gray-400 font-semi-bold  text-[12px]">
                {displayName}
              </span>
            </p>
            <MdKeyboardArrowDown />
          </div>
        </TooltipComponent>

        
        {chat && <div className="relative top-9 right-0"><Chat /></div>}
        {notification && <div className="relative top-9 right-0"><Notification /></div>}
        {userProfile && <div className="relative top-9 right-0"><UserProfile /></div>}
      </div>
    </div>
  );
};

export default Navbar;
