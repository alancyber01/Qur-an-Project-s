import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  UserCircle,
  Target,
  LogOut,
  Save,
  CheckCircle,
  Cloud, // <-- TELAH DIUBAH DARI Chrome MENJADI Cloud
} from "lucide-react";

export default function Profile({ user }) {
  const [profile, setProfile] = useState({
    display_name: "Hamba Allah",
    bio: "Murojaah adalah jalan ninja menuju syurga.",
    target_juz: 30,
    target_halaman: 1,
    tingkat_kemampuan: "Sedang",
    preferensi_metode: "Takrir",
  });
  const [saving, setSaving] = useState(false);
  const [savedNotif, setSavedNotif] = useState(false);

  const isAnonymous = user?.is_anonymous;

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) setProfile((prev) => ({ ...prev, ...data }));
    };
    if (user) fetchProfile();
  }, [user]);

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: profile.display_name,
        bio: profile.bio,
        target_juz: profile.target_juz,
        target_halaman: profile.target_halaman,
        tingkat_kemampuan: profile.tingkat_kemampuan,
      })
      .eq("id", user.id);

    setSaving(false);
    if (!error) {
      setSavedNotif(true);
      setTimeout(() => setSavedNotif(false), 2500);
    }
  };

  return (
    <div className="bg-emerald-50/10 min-h-screen pb-24 font-sans overflow-y-auto text-slate-800">
      {/* Top Profile Header (WhatsApp Style) */}
      <div className="bg-white pt-8 pb-6 px-6 border-b border-emerald-100 shadow-sm flex flex-col items-center text-center relative">
        {savedNotif && (
          <div className="absolute top-4 bg-emerald-600 text-white text-[11px] font-bold px-4 py-1.5 rounded-full flex items-center gap-1 shadow-md">
            <CheckCircle className="w-3.5 h-3.5" /> Konfigurasi Disimpan!
          </div>
        )}
        <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-100 shadow-sm rounded-full flex items-center justify-center mb-3">
          <UserCircle
            className="w-14 h-14 text-emerald-600"
            strokeWidth={1.5}
          />
        </div>

        <input
          type="text"
          value={profile.display_name}
          onChange={(e) =>
            setProfile({ ...profile, display_name: e.target.value })
          }
          className="text-base font-bold text-slate-800 text-center bg-transparent border-b border-transparent hover:border-gray-200 focus:border-emerald-600 focus:outline-none px-2 rounded font-sans"
          placeholder="Nama Pengguna"
        />
        <input
          type="text"
          value={profile.bio}
          onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
          className="text-xs text-gray-400 mt-1 bg-transparent text-center border-b border-transparent hover:border-gray-200 focus:border-emerald-600 focus:outline-none w-4/5 font-sans italic"
          placeholder="Set info status..."
        />
      </div>

      <div className="p-5 space-y-4">
        {/* BLOK SINKRONISASI AKUN GOOGLE (Selalu Tersedia/Sesuai Kondisi Login) */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
          {isAnonymous ? (
            <div className="text-center space-y-2.5">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 py-1.5 px-3 rounded-xl border border-amber-100 w-fit mx-auto">
                <Cloud className="w-3.5 h-3.5" /> {/* <-- TELAH DIUBAH */} Data
                Belum Disinkronisasi
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Amankan progres grafik kualitas hafalan harianmu agar tidak
                terhapus dari perangkat lokal.
              </p>
              <button
                onClick={handleGoogleLogin}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
              >
                <Cloud className="w-4 h-4" /> {/* <-- TELAH DIUBAH */} Hubungkan
                Ke Akun Google
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">
                  Metode Sinkronisasi
                </p>
                <p className="text-xs font-bold text-slate-700 mt-0.5">
                  {user.email}
                </p>
              </div>
              <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md">
                Google Aktif
              </span>
            </div>
          )}
        </div>

        {/* Pengaturan Parameter Murojaah */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-50 pb-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Kapasitas Target
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Fokus Utama Juz
              </label>
              <select
                value={profile.target_juz}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    target_juz: parseInt(e.target.value),
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2.5 font-bold focus:outline-none focus:border-emerald-600"
              >
                {[...Array(30)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Juz {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">
                Kuantitas Harian
              </label>
              <select
                value={profile.target_halaman}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    target_halaman: parseInt(e.target.value),
                  })
                }
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl p-2.5 font-bold focus:outline-none focus:border-emerald-600"
              >
                <option value="1">1 Halaman</option>
                <option value="2">2 Halaman</option>
                <option value="5">5 Halaman</option>
                <option value="10">10 Halaman</option>
              </select>
            </div>
          </div>
        </div>

        {/* Aksi Eksekusi Form */}
        <div className="space-y-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
          >
            <Save className="w-4 h-4" />{" "}
            {saving ? "Menyimpan data..." : "Simpan Perubahan"}
          </button>

          {!isAnonymous && (
            <button
              onClick={() => supabase.auth.signOut()}
              className="w-full bg-white border border-rose-100 text-rose-500 font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <LogOut className="w-4 h-4" /> Keluar dari Sesi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
