import { useEffect, useState } from "react";
import { BarChart3, Target, Calendar, Award, Flame } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Tracker({ user }) {
  const [history, setHistory] = useState([]);
  const [targetJuz, setTargetJuz] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrackerData = async () => {
      setLoading(true);
      // 1. Ambil target Juz dari profil pengguna
      const { data: profile } = await supabase
        .from("profiles")
        .select("target_juz")
        .eq("id", user.id)
        .single();
      if (profile) setTargetJuz(profile.target_juz);

      // 2. Ambil log performa harian dari database
      const { data: progressLog } = await supabase
        .from("daily_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(7);

      if (progressLog) setHistory(progressLog);
      setLoading(false);
    };

    if (user) fetchTrackerData();
  }, [user]);

  // Fungsi utilitas untuk menghitung skor rata-rata harian
  const getDayAverage = (day) => {
    const total =
      (day.fajar_score || 0) + (day.siang_score || 0) + (day.malam_score || 0);
    const count = [day.fajar_score, day.siang_score, day.malam_score].filter(
      (s) => s > 0,
    ).length;
    return count > 0 ? (total / count).toFixed(1) : 0;
  };

  // Menentukan warna badge berdasarkan kualitas skor hafalan
  const getColorStatus = (avg) => {
    if (avg >= 4.5)
      return { bg: "bg-emerald-600 text-white", text: "Sangat Mutqin" };
    if (avg >= 3.0) return { bg: "bg-amber-500 text-white", text: "Lancar" };
    if (avg > 0) return { bg: "bg-rose-500 text-white", text: "Banyak Lupa" };
    return { bg: "bg-gray-100 text-gray-400", text: "Belum Diisi" };
  };

  return (
    <div className="h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] flex flex-col justify-between px-5 pt-4 pb-2 font-sans overflow-hidden bg-emerald-50/10 text-slate-800">
      {/* BAGIAN ATAS: Statistik Ringkasan Performa */}
      <div className="space-y-3 shrink-0">
        <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" /> Progres Analitik
        </h1>

        {/* Mini Scoreboard */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-[0_4px_12px_rgba(16,185,129,0.04)] text-center">
            <Flame className="w-4 h-4 text-amber-500 mx-auto mb-1" />
            <p className="text-[9px] text-gray-400 font-bold uppercase">
              Streak
            </p>
            <p className="text-base font-black text-slate-800">7 Hari</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-[0_4px_12px_rgba(16,185,129,0.04)] text-center">
            <Award className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-[9px] text-gray-400 font-bold uppercase">
              Kualitas
            </p>
            <p className="text-base font-black text-slate-800">Mutqin</p>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-[0_4px_12px_rgba(16,185,129,0.04)] text-center">
            <Target className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
            <p className="text-[9px] text-gray-400 font-bold uppercase">
              Fokus
            </p>
            <p className="text-base font-black text-slate-800">
              Juz {targetJuz}
            </p>
          </div>
        </div>
      </div>

      {/* BAGIAN TENGAH: Log Kalender Kualitas Mingguan (Dinamis dari Supabase) */}
      <div className="flex-1 my-3 bg-white rounded-2xl border border-emerald-100 p-4 shadow-sm overflow-hidden flex flex-col">
        <div className="flex items-center gap-1.5 border-b border-gray-50 pb-2 mb-2 shrink-0">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold text-slate-700">
            Log Evaluasi Kalender Berkala
          </h3>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-xs text-gray-400 animate-pulse">
            Menghubungkan rekam data...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
            {history.map((day) => {
              const avg = getDayAverage(day);
              const status = getColorStatus(avg);
              return (
                <div
                  key={day.id}
                  className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-xl transition-all hover:border-emerald-200"
                >
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {new Date(day.date).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Fajar: {day.fajar_score || 0} • Siang:{" "}
                      {day.siang_score || 0} • Malam: {day.malam_score || 0}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg tracking-wide uppercase ${status.bg}`}
                  >
                    {status.text}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BAGIAN BAWAH: Peta Sebaran 30 Juz Al-Qur'an */}
      <div className="bg-white border border-emerald-100 rounded-2xl p-3 shadow-sm shrink-0">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-0.5">
          Peta Navigasi 30 Juz
        </p>
        <div className="grid grid-cols-10 gap-1 overflow-y-auto max-h-20 pr-0.5">
          {[...Array(30)].map((_, i) => {
            const juzNum = i + 1;
            const isCurrentTarget = juzNum === targetJuz;
            return (
              <div
                key={juzNum}
                className={`text-[10px] font-bold h-6 rounded-md flex items-center justify-center transition-all ${
                  isCurrentTarget
                    ? "bg-emerald-600 text-white shadow-[0_2px_6px_rgba(16,185,129,0.4)] scale-105 border border-emerald-500"
                    : "bg-slate-50 text-slate-400 border border-slate-100"
                }`}
              >
                {juzNum}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
