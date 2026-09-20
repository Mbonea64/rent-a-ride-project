import PropTypes from "prop-types";

const roleStyles = {
  admin: {
    bg: "#111827",
    accent: "#22c55e",
    soft: "#dcfce7",
  },
  vendor: {
    bg: "#1d4ed8",
    accent: "#f59e0b",
    soft: "#dbeafe",
  },
  customer: {
    bg: "#0f766e",
    accent: "#38bdf8",
    soft: "#ccfbf1",
  },
};

const getInitials = (name = "", email = "") => {
  const source = name || email || "User";
  const words = source
    .replace(/@.*/, "")
    .split(/\s+|[._-]+/)
    .filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("") || "U";
};

const ProfileAvatar = ({ src, name, email, role = "customer", className = "", size = 40 }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={`${name || "User"} profile`}
        referrerPolicy="no-referrer"
        className={`rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  const palette = roleStyles[role] || roleStyles.customer;
  const initials = getInitials(name, email);

  return (
    <svg
      aria-label={`${name || "User"} profile`}
      className={`rounded-full ${className}`}
      height={size}
      role="img"
      viewBox="0 0 64 64"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect fill={palette.bg} height="64" rx="32" width="64" />
      <circle cx="48" cy="16" fill={palette.accent} opacity="0.95" r="10" />
      <circle cx="18" cy="50" fill={palette.soft} opacity="0.22" r="18" />
      <path
        d="M20 45c2.9-6.2 7-9.3 12.1-9.3S41.4 38.8 44 45"
        fill="none"
        stroke="#fff"
        strokeLinecap="round"
        strokeWidth="4"
      />
      <circle cx="32" cy="25" fill="none" r="8" stroke="#fff" strokeWidth="4" />
      <text
        dominantBaseline="middle"
        fill="#fff"
        fontFamily="Inter, Arial, sans-serif"
        fontSize="13"
        fontWeight="700"
        textAnchor="middle"
        x="32"
        y="53"
      >
        {initials}
      </text>
    </svg>
  );
};

ProfileAvatar.propTypes = {
  className: PropTypes.string,
  email: PropTypes.string,
  name: PropTypes.string,
  role: PropTypes.oneOf(["admin", "vendor", "customer"]),
  size: PropTypes.number,
  src: PropTypes.string,
};

export default ProfileAvatar;
