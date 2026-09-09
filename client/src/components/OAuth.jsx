import { signInSuccess } from "../redux/user/userSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { demoUser } from "../data/localData";

function OAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleDemoSocialLogin = () => {
    dispatch(signInSuccess(demoUser));
    navigate("/");
  };
  return (
    <div className={`px-5`}>
      <button
        className="flex w-full gap-3 justify-center border  py-3 rounded-md  items-center  border-black mb-4"
        type="button"
        onClick={handleDemoSocialLogin}
      >
        <span className="icon-[devicon--google]"></span>
        <span>Continue with Google</span>
      </button>
      <button
        className="flex w-full gap-3 justify-center pl-4 border  py-3 rounded-md  items-center border-black"
        type="button"
        onClick={handleDemoSocialLogin}
      >
        <span className="icon-[logos--facebook]"></span>
        <span>Continue with Facebook</span>
      </button>
    </div>
  );
}

export default OAuth;
