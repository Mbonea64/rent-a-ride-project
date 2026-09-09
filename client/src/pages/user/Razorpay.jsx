import { Link } from "react-router-dom";
import { paymentMethods } from "../../data/localData";

const Razorpay = () => {
  return (
    <div className="mx-auto mt-20 max-w-xl px-6 py-10">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-lg">
        <p className="text-xl font-semibold">Local Payment Preview</p>
        <p className="mt-2 text-sm text-slate-500">
          Backend payment integration is disabled for this frontend phase. Use
          checkout to preview Tanzania payment choices and save a demo booking
          locally.
        </p>

        <div className="mt-6 grid gap-3">
          {paymentMethods.map((method) => (
            <div
              className="rounded-md border border-slate-200 px-4 py-3 text-sm font-medium"
              key={method}
            >
              {method}
            </div>
          ))}
        </div>

        <Link to="/checkoutPage">
          <button className="mt-8 w-full rounded-md bg-green-500 px-6 py-3 font-semibold text-black">
            Back to Checkout
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Razorpay;
