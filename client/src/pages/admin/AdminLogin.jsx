import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import styles from "../../index";
import {
  loadingEnd,
  signInFailure,
  signInStart,
  signInSuccess,
} from "../../redux/user/userSlice";
import { signInWithPassword } from "../../services/authService";

const schema = z.object({
  email: z
    .string()
    .min(1, { message: "email required" })
    .refine((value) => /\S+@\S+\.\S+/.test(value), {
      message: "Invalid email address",
    }),
  password: z.string().min(6, { message: "minimum 6 characters required" }),
});

const AdminLogin = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const { isLoading, isError } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const onSubmit = async (formData, event) => {
    event.preventDefault();
    try {
      dispatch(signInStart());
      const data = await signInWithPassword(formData);

      if (!data.isAdmin) {
        dispatch(loadingEnd());
        dispatch(signInFailure(new Error("This gateway is restricted to Rent a Ride admins.")));
        return;
      }

      dispatch(signInSuccess(data));
      dispatch(loadingEnd());
      navigate("/adminDashboard");
    } catch (error) {
      dispatch(loadingEnd());
      dispatch(signInFailure(error));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12">
      <div className="mx-auto max-w-md overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="bg-black px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Rent a Ride secure gateway
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Admin Access</h1>
          <p className="mt-2 text-sm text-slate-300">
            Company operators only. Customer and vendor accounts are blocked here.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 px-6 py-8">
          <div>
            <input
              type="email"
              id="admin-email"
              className="w-full rounded-md bg-slate-100 p-3 text-black"
              placeholder="Admin email"
              {...register("email")}
            />
            {errors.email && <p className="text-[10px] text-red-500">{errors.email.message}</p>}
          </div>

          <div>
            <input
              type="password"
              id="admin-password"
              className="w-full rounded-md bg-slate-100 p-3 text-black"
              placeholder="Admin password"
              {...register("password")}
            />
            {errors.password && <p className="text-[10px] text-red-500">{errors.password.message}</p>}
          </div>

          <button className={`${styles.button} disabled:bg-slate-500 disabled:text-white`} disabled={isLoading}>
            {isLoading ? "Checking access ..." : "Enter Admin Dashboard"}
          </button>

          <div className="flex items-center justify-between text-[11px]">
            <Link to="/signin" className="text-blue-600">
              Customer sign in
            </Link>
            <Link to="/vendorSignin" className="text-blue-600">
              Vendor sign in
            </Link>
          </div>

          <p className="min-h-4 text-[11px] text-red-600">
            {isError ? isError.message || "something went wrong" : " "}
          </p>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
