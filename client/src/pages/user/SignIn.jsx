import styles from "../../index";
import { Link, useNavigate } from "react-router-dom";
import {
  loadingEnd,
  signInFailure,
  signInStart,
  signInSuccess,
  signOut,
} from "../../redux/user/userSlice";
import { useDispatch, useSelector } from "react-redux";
import OAuth from "../../components/OAuth";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { signInWithPassword, signOutFromSupabase } from "../../services/authService";
import { FiEye, FiEyeOff } from "react-icons/fi";

const schema = z.object({
  email: z
    .string()
    .min(1, { message: "email required" })
    .refine((value) => /\S+@\S+\.\S+/.test(value), {
      message: "Invalid email address",
    }),
  password: z.string().min(6, { message: "minimum 6 characters required" }),
});

function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const { isLoading, isError } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onSubmit = async (formData, e) => {
    e.preventDefault();
    try {
      dispatch(signInStart());
      const data = await signInWithPassword(formData);

      if (data.isAdmin) {
        await signOutFromSupabase();
        dispatch(signOut());
        dispatch(loadingEnd());
        dispatch(signInFailure(new Error("Use the secure admin gateway for this account.")));
        navigate("/admin-login");
      } else if (data.isUser) {
        dispatch(signInSuccess(data));
        dispatch(loadingEnd());
        navigate("/");
      } else {
        dispatch(loadingEnd());
        dispatch(signInFailure(new Error("Use the vendor sign-in page for this account.")));
      }
    } catch (error) {
      dispatch(loadingEnd());
      dispatch(signInFailure(error));
    }
  };

  return (
    <>
      <div
        className={`max-w-[340px] pb-10 md:max-w-md min-h-[500px] mx-auto mt-[70px] md:mt-[80px] rounded-lg overflow-hidden  shadow-2xl`}
      >
        <div
          className={` green px-6 py-2   rounded-t-lg flex justify-between items-center`}
        >
          <h1 className={`${styles.heading2}  text-normal `}>Sign In</h1>
          <Link to={"/"} onClick={() => dispatch(loadingEnd())}>
            <div className=" px-3  font-bold  hover:bg-green-300 rounded-md  shadow-inner">
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
            className={`${styles.button}  disabled:bg-slate-500 text-black disabled:text-white`}
            disabled={isLoading}
          >
            {isLoading ? "Loading ..." : "Login"}
          </button>
          <div className="flex justify-between">
            <div className="flex justify-between">
              <p className="text-[10px] border-r border-black">
                No account?{" "}
                <span className="text-blue-600 pr-2">
                  {" "}
                  <Link to={`/signup`}>Sign Up</Link>
                </span>
              </p>
              <p className="text-[10px] pl-2 text-blue-600">forgot password</p>
            </div>

            <p className="text-[10px] text-red-600">
              {isError ? isError.message || "something went wrong" : " "}
            </p>
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

          <OAuth />
        </div>
      </div>
    </>
  );
}

export default SignIn;
