import { signInWithProvider } from "../services/authService";

function VendorOAuth() {
  const handleVendorGoogleClick = async () => {
    try {
      await signInWithProvider("google", "vendor");
    } catch (error) {
      console.error(error);
    }
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
