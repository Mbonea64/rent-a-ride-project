import { IoHomeOutline } from "react-icons/io5";
import { FiCalendar } from "react-icons/fi";

export const links = [
  {
    title: "Profile",
    links: [
      {
        name: "profiles",
        label: "Profile",
        icon: <IoHomeOutline />,
      },
      {
        name: "orders",
        label: "Bookings",
        icon: <FiCalendar />
      },
    ],
  },
];
