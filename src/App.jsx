import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import Dashboard from "./pages/Dashboard";
import BottomNav from "./components/BottomNav";

export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Fungsi untuk mengecek dan membuat sesi anonim
    const checkUser = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        // Otomatis buat ID Anonim di latar belakang tanpa disadari pengguna
        await supabase.auth.signInAnonymously();
      } else {
        setSession(data.session);
      }
    };

    checkUser();

    // Pantau jika ada perubahan status login
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Tampilan loading (sangat singkat) sebelum masuk Dashboard
  if (!session)
    return (
      <div className="flex h-screen items-center justify-center bg-bg-utama">
        <span className="text-biru-azure font-bold animate-pulse">
          Menyiapkan Tadbira...
        </span>
      </div>
    );

  return (
    <div className="max-w-md mx-auto relative min-h-screen bg-bg-utama shadow-2xl overflow-hidden font-sans">
      {/* Kirim data user ke Dashboard */}
      <Dashboard user={session.user} />
      <BottomNav />
    </div>
  );
}
