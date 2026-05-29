import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Tracker from "./pages/Tracker"; // Import baru
import Pesan from "./pages/Pesan"; // Import baru
import BottomNav from "./components/BottomNav";

export default function App() {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState("home");

  useEffect(() => {
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        await supabase.auth.signInAnonymously();
      } else {
        setSession(data.session);
      }
    };
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!session)
    return (
      <div className="flex h-screen items-center justify-center bg-bg-utama">
        <span className="text-biru-azure font-bold animate-pulse tracking-widest">
          Menyiapkan Murojaah Tracker...
        </span>
      </div>
    );

  return (
    <div className="max-w-md mx-auto relative min-h-screen bg-bg-utama shadow-2xl overflow-hidden font-sans">
      {/* Sistem Render Halaman Dinamis */}
      <div>
        {activeTab === "home" && <Dashboard user={session.user} />}
        {activeTab === "tracker" && <Tracker user={session.user} />}
        {activeTab === "pesan" && <Pesan />}
        {activeTab === "profile" && <Profile user={session.user} />}
      </div>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}
