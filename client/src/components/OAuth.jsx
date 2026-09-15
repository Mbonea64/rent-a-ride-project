import { signInWithProvider } from "../services/authService";

function OAuth() {

  const handleSocialLogin = async (provider) => {
    try {
      await signInWithProvider(provider, "customer");
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <div className={`px-5`}>
      <button
        className="flex w-full gap-3 justify-center border  py-3 rounded-md  items-center  border-black mb-4"
        type="button"
        onClick={() => handleSocialLogin("google")}
      >
        <span className="icon-[devicon--google]"></span>
        <span>Continue with Google</span>
      </button>
      <button
        className="flex w-full gap-3 justify-center pl-4 border  py-3 rounded-md  items-center border-black"
        type="button"
        onClick={() => handleSocialLogin("facebook")}
      >
        <span className="icon-[logos--facebook]"></span>
        <span>Continue with Facebook</span>
      </button>
    </div>
  );
}

export default OAuth;
