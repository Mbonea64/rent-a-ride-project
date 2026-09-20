import { AiOutlineShoppingCart } from "react-icons/ai";
import { FiDollarSign, FiShoppingBag, FiShield, FiTruck, FiUsers } from "react-icons/fi";
import { IoHomeOutline } from "react-icons/io5";

export const links = [
  {
    title: "Operations",
    links: [
      {
        name: "adminHome",
        label: "Overview",
        icon: <IoHomeOutline />,
      },
      {
        name: "orders",
        label: "Bookings monitor",
        icon: <AiOutlineShoppingCart />,
      },
      {
        name: "sales",
        label: "Sales records",
        icon: <FiDollarSign />,
      },
      {
        name: "vendorVehicleRequests",
        label: "Vendor approvals",
        icon: <FiShield />,
      },
      {
        name: "allProduct",
        label: "Fleet",
        icon: <FiTruck />,
      },
    ],
  },
  {
    title: "Accounts",
    links: [
      {
        name: "allUsers",
        label: "Customers",
        icon: <FiUsers />,
      },
      {
        name: "allVendors",
        label: "Vendors",
        icon: <FiShoppingBag />,
      },
    ],
  },
];
