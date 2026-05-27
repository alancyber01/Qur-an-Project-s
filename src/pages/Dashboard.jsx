import { useEffect, useState } from "react";
import { Sunrise, Sun, MoonStar, BookOpen, BellRing } from "lucide-react";
import { supabase } from "../lib/supabase";
import TaskCard from "../components/TaskCard";

export default function Dashboard({ user }) {
  // State untuk menyimpan status checklist 3 waktu
  const [progress, setProgress] = useState({
    fajar_completed: false,
    siang_completed: false,
    malam_completed: false,
  });
  const [loading, setLoading] = useState(true);

  // Ambil tanggal hari ini dengan format standar database (YYYY-MM-DD)
  const getTodayDate = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - offset * 60 * 1000);
    return localToday.toISOString().split("T")[0];
  };

  const todayStr = getTodayDate();

  useEffect(() => {
    const fetchOrCreateTodayProgress = async () => {
      try {
        setLoading(true);

        // 1. Ambil data progress user berdasarkan ID anonim dan tanggal hari ini
        let { data, error } = await supabase
          .from("daily_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", todayStr)
          .single();

        // Error code 'PGRST116' berarti data hari ini belum ada di tabel
        if (error && error.code === "PGRST116") {
          // 2. Buat otomatis baris baru untuk hari ini
          const { data: newRow, error: insertError } = await supabase
            .from("daily_progress")
            .insert([{ user_id: user.id, date: todayStr }])
            .select()
            .single();

          // DETEKSI ERROR: Jika gagal membuat baris baru, tampilkan pesannya
          if (insertError) {
            console.error(
              "🚨 Gagal membuat baris baru di database:",
              insertError.message,
            );
          } else if (newRow) {
            setProgress(newRow);
          }
        } else if (error) {
          // Jika ada error lain selain data kosong
          console.error("🚨 Error mengambil data:", error.message);
        } else if (data) {
          // Jika data sudah ada, langsung masukkan ke state aplikasi
          setProgress(data);
        }
      } catch (err) {
        console.error("🚨 Gagal memuat data progress:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchOrCreateTodayProgress();
    }
  }, [user, todayStr]);

  // Fungsi interaktif untuk mengubah status centang di database
  const toggleHabit = async (habitField) => {
    const updatedValue = !progress[habitField];

    // Terapkan Optimistic UI Update (Ubah tampilan dulu di frontend agar terasa instan tanpa delay)
    setProgress((prev) => ({ ...prev, [habitField]: updatedValue }));

    try {
      // Kirim pembaruan data langsung ke cloud Supabase
      const { error } = await supabase
        .from("daily_progress")
        .update({ [habitField]: updatedValue })
        .eq("user_id", user.id)
        .eq("date", todayStr);

      if (error) {
        // Jika jaringan bermasalah atau gagal, kembalikan status tombol ke semula (Rollback)
        setProgress((prev) => ({ ...prev, [habitField]: !updatedValue }));
        console.error("🚨 Gagal sinkronisasi ke server:", error.message);
      }
    } catch (err) {
      setProgress((prev) => ({ ...prev, [habitField]: !updatedValue }));
      console.error("🚨 Terjadi kesalahan sistem:", err);
    }
  };

  // Format teks tanggal dinamis untuk header (Contoh: Kamis, 28 Mei)
  const formatDisplayDate = () => {
    const options = { weekday: "long", day: "numeric", month: "short" };
    return new Date().toLocaleDateString("id-ID", options);
  };

  return (
    <div className="min-h-screen bg-bg-utama text-teks-arang pb-24 font-sans">
      <div className="px-5 py-8">
        {/* Header Atas */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-[13px] font-bold text-teks-arang tracking-wide">
              Murojaah Tracker
            </h2>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              {formatDisplayDate()}
            </p>
          </div>
          <button className="bg-white border border-gray-200 text-biru-azure px-4 py-1.5 rounded-full text-xs font-bold shadow-sm flex items-center gap-2 active:scale-95 transition-transform">
            <BellRing className="w-3.5 h-3.5" />
            Asisten AI
          </button>
        </div>

        {/* Kartu Utama Target */}
        <div className="bg-gradient-to-br from-biru-azure to-blue-700 rounded-[2rem] p-6 mb-8 flex gap-5 items-center shadow-[0_15px_40px_-10px_rgba(0,127,255,0.4)] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>

          <div className="w-20 h-24 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 relative">
            <div className="absolute right-2 bottom-0 w-4 h-6 bg-kuning-emas rounded-t-sm shadow-[0_0_10px_rgba(244,196,48,0.5)]"></div>
            <BookOpen className="w-8 h-8 text-white" strokeWidth={1.2} />
          </div>

          <div className="relative z-10">
            <p className="text-blue-100 text-[11px] font-medium tracking-wide uppercase mb-1">
              Target Berkelanjutan
            </p>
            <h1 className="text-3xl font-extrabold text-white mb-3">
              1{" "}
              <span className="text-sm font-medium text-blue-100">Halaman</span>
            </h1>

            {/* Indikator Hari Aktif Otomatis */}
            <div className="flex gap-2">
              {["S", "S", "R", "K", "J", "S", "M"].map((day, i) => {
                const currentDayIndex = new Date().getDay();
                // Konversi indeks getDay() javascript agar Senin dimulai dari urutan 0
                const mappedIndex =
                  currentDayIndex === 0 ? 6 : currentDayIndex - 1;
                return (
                  <div key={i} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-3.5 h-3.5 rounded-[4px] ${i === mappedIndex ? "bg-kuning-emas shadow-[0_0_8px_rgba(244,196,48,0.6)]" : "bg-white/20"}`}
                    ></div>
                    <span className="text-[9px] font-medium text-blue-100">
                      {day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">
          Rutinitas Micro-Habits
        </h2>

        {/* Tampilan Kondisional saat Memuat Data Server */}
        {loading ? (
          <div className="text-center py-12 text-sm text-gray-400 animate-pulse tracking-wide">
            Sinkronisasi cloud Supabase...
          </div>
        ) : (
          <>
            {/* Hubungkan status selesai dan fungsi klik ke masing-masing kartu */}
            <TaskCard
              time="Fajar"
              Icon={Sunrise}
              title="Pemulihan Aktif"
              target="Baca 1 halaman dengan fokus"
              isCompleted={progress.fajar_completed}
              onClick={() => toggleHabit("fajar_completed")}
            />
            <TaskCard
              time="Siang"
              Icon={Sun}
              title="Penguatan Audio"
              target="Dengarkan murattal (pasif)"
              isCompleted={progress.siang_completed}
              onClick={() => toggleHabit("siang_completed")}
            />
            <TaskCard
              time="Malam"
              Icon={MoonStar}
              title="Muraja'ah Pengikat"
              target="Ulangi & siapkan teks besok"
              isCompleted={progress.malam_completed}
              onClick={() => toggleHabit("malam_completed")}
            />
          </>
        )}
      </div>
    </div>
  );
}
