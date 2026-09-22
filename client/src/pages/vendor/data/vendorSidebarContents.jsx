import { FiCalendar, FiDollarSign, FiTruck } from "react-icons/fi";
import { IoHomeOutline } from "react-icons/io5";

export const links = [
  {
    title: "Vendor Flow",
    links: [
      {
        name: "overview",
        label: "Overview",
        icon: <IoHomeOutline />,
      },
      {
        name: "vendorAllVeihcles",
        label: "My cars",
        icon: <FiTruck />,
      },
      {
        name: "bookings",
        label: "Bookings",
        icon: <FiCalendar />,
      },
      {
        name: "sales",
        label: "Sales",
        icon: <FiDollarSign />,
      },
    ],
  },
];
