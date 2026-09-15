import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getCurrentUser, completePendingRole, onAuthStateChange } from "../services/authService";
import { signInSuccess, signOut } from "../redux/user/userSlice";
import { isSupabaseConfigured } from "../lib/supabase";

const AuthSession = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;

    let active = true;
    const syncUser = async () => {
      try {
        await completePendingRole();
        const user = await getCurrentUser();
        if (!active) return;
        dispatch(user ? signInSuccess(user) : signOut());
      } catch (error) {
        console.error("Could not restore the Supabase session", error);
        if (active) dispatch(signOut());
      }
    };

    syncUser();
    const unsubscribe = onAuthStateChange((session) => {
      if (!session) dispatch(signOut());
      else window.setTimeout(syncUser, 0);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [dispatch]);

  return null;
};

export default AuthSession;
