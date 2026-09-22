import { Link, useNavigate } from "react-router-dom";
import styles from "../../..";
import { useState } from "react";
import VendorOAuth from "../../../components/VendorAuth";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch } from "react-redux";
import { signInSuccess } from "../../../redux/user/userSlice";
import { signUpWithPassword } from "../../../services/authService";
import { FiEye, FiEyeOff } from "react-icons/fi";

const schema = z.object({
  username: z.string().min(3, { message: "minimum 3 characters required" }),
  email: z
    .string()
    .min(1, { message: "email required" })
    .refine((value) => /\S+@\S+\.\S+/.test(value), {
      message: "Invalid email address",
    }),
  password: z.string().min(6, { message: "minimum 6 characters required" }),
});

function VendorSignup() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const [isError, setError] = useState(false);
  const [notice, setNotice] = useState("");
  const [isLoading, setLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onSubmit = async (formData, e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await signUpWithPassword({ ...formData, role: "vendor" });
      setLoading(false);
      if (data.requiresEmailConfirmation) {
        setNotice("Check your email to confirm your vendor account, then sign in.");
        setError(false);
        return;
      }
      setError(false);
      dispatch(signInSuccess(data));
      navigate("/vendorDashboard");
    } catch (error) {
      setLoading(false);
      setError(error);
    }
  };

  return (
    <>
      <div
        className={`pb-10 max-w-lg mx-auto mt-16   rounded-lg overflow-hidden  shadow-2xl`}
      >
        <div
          className={`  bg-slate-950 px-6 py-2   rounded-t-lg flex justify-between items-center`}
        >
          <h1 className={`${styles.heading2} text-[28px] text-white`}>
            Sign Up <span className="text-[6px] text-white">as vendor</span>
          </h1>
          <Link to={"/"}>
            <div className=" px-3  font-bold  hover:bg-slate-700 rounded-md  shadow-inner text-white">
              x
            </div>
          </Link>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 pt-10 px-5"
        >
          <div>
            <input
              type="text"
              id="username"
              className="text-black bg-slate-100 p-3 rounded-md w-full"
              placeholder="UserName"
              {...register("username")}
            />
            {errors.username && (
              <p className="text-red-500 text-[10px]">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <input
              type="email"
              id="email"
              className="text-black bg-slate-100 p-3 rounded-md w-full"
              placeholder="Email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-red-500 text-[10px]">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className="w-full rounded-md bg-slate-100 p-3 pr-12 text-black"
              placeholder="Password"
              {...register("password")}
            />
            <button
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-600 hover:bg-slate-200"
              onClick={() => setShowPassword((current) => !current)}
              type="button"
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-[10px]">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            className={`${styles.button} bg-slate-950 text-white  disabled:bg-slate-500 disabled:text-white`}
            disabled={isLoading}
          >
            {isLoading ? "Loading ..." : "Register"}
          </button>
          <div className="flex justify-between">
            <p className="text-[10px]">
              Have a account?{" "}
              <span className="text-blue-600">
                {" "}
                <Link to={`/vendorSignin`}>Sign in</Link>
              </span>
            </p>
            <p className="text-[10px] text-red-600">
              {isError && (isError.message || "something went wrong")}
            </p>
            {notice && <p className="text-[10px] text-green-700">{notice}</p>}
          </div>
        </form>
        <div>
          <h3 className="text-center text-slate-700 pt-3 pb-3 text-[10px]">
            OR
          </h3>
          <div className="flex justify-center items-center gap-3 pb-6">
            <span className="bg-green-300 w-20 h-[.1px]"></span>
            <span className="text-[10px] sm:text-[12px] text-slate-500">
              Continue with social login
            </span>
            <span className="bg-green-300 w-20 h-[.1px]"> </span>
          </div>

          <VendorOAuth />
        </div>
      </div>
    </>
  );
}

export default VendorSignup;
