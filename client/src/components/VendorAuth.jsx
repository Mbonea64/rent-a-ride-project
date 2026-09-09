import { signInSuccess } from "../redux/user/userSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { demoVendor } from "../data/localData";

function VendorOAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate()
  const handleVendorGoogleClick = () => {
    dispatch(signInSuccess(demoVendor));
    navigate('/vendorDashboard')
  };
  return (
    <div className={`px-5`}>
      <button
        className="flex w-full gap-3 justify-center border  py-3 rounded-md  items-center  border-black mb-4"
        type="button"
        onClick={handleVendorGoogleClick}
      >
        <span className="icon-[devicon--google]"></span>
        <span>Continue with Google</span>
      </button>
     
    </div>
  );
}

export default VendorOAuth;
