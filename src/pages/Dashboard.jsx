import { useEffect, useState, useRef } from "react";
import {
  Sunrise,
  Sun,
  MoonStar,
  BookOpen,
  BellRing,
  PlayCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Star,
  Maximize2,
  X,
  ListMusic,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const toArabicNumber = (num) =>
  num.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);

export default function Dashboard({ user }) {
  const [profile, setProfile] = useState({
    display_name: "Hamba Allah",
    target_juz: 30,
    target_halaman: 1,
    tingkat_kemampuan: "Sedang",
  });

  const [progress, setProgress] = useState({
    fajar_score: 0,
    siang_score: 0,
    malam_score: 0,
  });

  const [loading, setLoading] = useState(true);
  const [activeWadah, setActiveWadah] = useState("fajar");
  const [inputHalaman, setInputHalaman] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [transitionAnim, setTransitionAnim] = useState("");

  const [quranData, setQuranData] = useState({
    ayahs: [],
    surahName: "",
    audioPlaylist: [],
    rasulData: {},
    loadingApi: false,
  });

  const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
  const todayStr = new Date().toISOString().split("T")[0];
  const audioRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profileData) {
          setProfile(profileData);
          setInputHalaman(profileData.target_halaman || 1);
        }

        let { data: progData, error: progError } = await supabase
          .from("daily_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("date", todayStr)
          .single();

        if (progError && progError.code === "PGRST116") {
          const { data: newRow } = await supabase
            .from("daily_progress")
            .insert([{ user_id: user.id, date: todayStr }])
            .select()
            .single();
          if (newRow) setProgress(newRow);
        } else if (progData) {
          setProgress(progData);
        }
      } catch (err) {
        console.error("Kesalahan memuat data user:", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchUserData();
  }, [user, todayStr]);

  useEffect(() => {
    const fetchDataQuranAPI = async () => {
      setQuranData((prev) => ({ ...prev, loadingApi: true }));
      try {
        const halamanTarget = profile.target_halaman || 1;

        const textRes = await fetch(
          `https://api.alquran.cloud/v1/page/${halamanTarget}/ar.alafasy`,
        );
        const textJson = await textRes.json();

        const rasulRes = await fetch(
          `https://api.quran.com/api/v4/verses/by_page/${halamanTarget}?language=id&words=true&word_fields=text_uthmani,line_number`,
        );
        const rasulJson = await rasulRes.json();

        const linesMap = {};
        if (rasulJson.verses) {
          rasulJson.verses.forEach((verse) => {
            if (!verse.words || verse.words.length === 0) return;
            const actualWords = verse.words.filter(
              (w) => w.char_type_name === "word",
            );
            if (actualWords.length === 0) return;

            const firstWord = actualWords[0];
            const lineNum = firstWord.line_number;
            const ayahNum = toArabicNumber(verse.verse_number);

            let text = firstWord.text_uthmani;
            if (actualWords.length > 1 && text.length <= 5)
              text += " " + actualWords[1].text_uthmani;

            if (!linesMap[lineNum]) linesMap[lineNum] = [];
            linesMap[lineNum].push({
              text,
              ayahNum,
              numberInSurah: verse.verse_number,
            });
          });
        }

        if (textJson.code === 200) {
          const dataAyat = textJson.data.ayahs;
          const infoSurah = dataAyat[0].surah;
          const playlist = dataAyat.map((a) => a.audio);

          setQuranData({
            ayahs: dataAyat,
            surahName: infoSurah.englishName,
            audioPlaylist: playlist,
            rasulData: linesMap,
            loadingApi: false,
          });
          setCurrentAudioIndex(0);
        }
      } catch (error) {
        setQuranData((prev) => ({ ...prev, loadingApi: false }));
      }
    };
    if (profile.target_halaman) fetchDataQuranAPI();
  }, [profile.target_halaman]);

  const updateHalaman = async (newPage) => {
    let validPage = parseInt(newPage);
    if (isNaN(validPage) || validPage < 1) validPage = 1;
    if (validPage > 604) validPage = 604;

    const currentPage = profile.target_halaman;

    if (validPage > currentPage) {
      if (currentPage % 2 !== 0) setTransitionAnim("anim-slide-left");
      else setTransitionAnim("anim-flip-next");
    } else if (validPage < currentPage) {
      if (currentPage % 2 === 0) setTransitionAnim("anim-slide-right");
      else setTransitionAnim("anim-flip-prev");
    } else {
      setTransitionAnim("");
    }

    setInputHalaman(validPage);
    setProfile((prev) => ({ ...prev, target_halaman: validPage }));

    try {
      await supabase
        .from("profiles")
        .update({ target_halaman: validPage })
        .eq("id", user.id);
    } catch (err) {
      console.log(err);
    }

    setTimeout(() => setTransitionAnim(""), 500);
  };

  const handleScoreChange = async (habitField, newScore) => {
    const finalScore = progress[habitField] === newScore ? 0 : newScore;
    setProgress((prev) => ({ ...prev, [habitField]: finalScore }));
    await supabase
      .from("daily_progress")
      .update({ [habitField]: finalScore })
      .eq("user_id", user.id)
      .eq("date", todayStr);
  };

  const handleAudioEnded = () => {
    if (currentAudioIndex < quranData.audioPlaylist.length - 1) {
      setCurrentAudioIndex((prev) => prev + 1);
      setTimeout(() => {
        if (audioRef.current) audioRef.current.play();
      }, 500);
    } else {
      setCurrentAudioIndex(0);
    }
  };

  const getTargetRepetisi = () =>
    profile.tingkat_kemampuan === "Pemula"
      ? 5
      : profile.tingkat_kemampuan === "Mutqin"
        ? 2
        : 3;
  const targetReps = getTargetRepetisi();
  const isFajarDone = progress.fajar_score > 0;
  const isSiangDone = progress.siang_score > 0;
  const isMalamDone = progress.malam_score > 0;

  const phasesDoneCount =
    (isFajarDone ? 1 : 0) + (isSiangDone ? 1 : 0) + (isMalamDone ? 1 : 0);
  const dailyProgressPercent = Math.round((phasesDoneCount / 3) * 100) || 0;

  const mushafImageUrl = `https://raw.githubusercontent.com/XredaX/Quran-Whatsapp-bot/main/quran-images/${profile.target_halaman || 1}.jpg`;

  // Deteksi Halaman Ganjil/Genap
  const isOddPage = profile.target_halaman % 2 !== 0;

  const ScoreEvaluator = ({ field, currentScore, title }) => (
    <div
      className={`flex flex-col gap-3 p-3.5 rounded-xl border mt-3 shrink-0 shadow-sm transition-colors ${currentScore > 0 ? "bg-emerald-50/80 border-emerald-200" : "bg-slate-50 border-slate-100"}`}
    >
      <div className="flex justify-between items-center w-full">
        <div>
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-widest block">
            Kualitas Muroja'ah
          </span>
          <span className="text-[9px] text-gray-500">{title}</span>
        </div>
        {currentScore > 0 && (
          <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
          </span>
        )}
      </div>

      <div className="flex gap-1.5 justify-between">
        {[1, 2, 3, 4, 5].map((s) => {
          const isSelected = currentScore === s;
          return (
            <button
              key={s}
              onClick={() => handleScoreChange(field, s)}
              title={`Bintang ${s}`}
              className={`flex-1 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all active:scale-90 ${isSelected ? "bg-amber-400 text-white shadow-md border-amber-500" : "bg-white border border-gray-200 text-gray-400 hover:bg-amber-50 hover:text-amber-500"}`}
            >
              <Star
                className={`w-4 h-4 ${isSelected ? "fill-white text-white" : "text-gray-300"}`}
              />
              <span className="ml-1 hidden sm:inline">{s}</span>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)] flex flex-col justify-between px-5 pt-4 pb-2 font-sans overflow-hidden bg-slate-50 text-slate-800">
      {/* CSS CUSTOM UNTUK FONT KEMENAG, QCF_BSML & ANIMASI */}
      <style>{`
        @font-face {
          font-family: 'LPMQ Isep Misbah';
          src: url('https://cdn.jsdelivr.net/gh/lpmq-kemenag/lpmq-isep-misbah@master/LPMQ_IsepMisbah.ttf') format('truetype');
        }
        @font-face {
          font-family: 'qcf_bsml';
          src: local('qcf_bsml'), url('https://cdn.jsdelivr.net/gh/quran/quran.com-images@master/fonts/qcf/qcf_bsml.ttf') format('truetype');
        }
        .font-kemenag {
          font-family: 'LPMQ Isep Misbah', 'Amiri Quran', serif;
        }
        .font-bsml {
          font-family: 'qcf_bsml', 'Amiri Quran', serif;
        }

        /* Animasi Slide & Flip Quran Fisik */
        @keyframes slideFromLeft {
          0% { transform: translateX(-20%); opacity: 0.5; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideFromRight {
          0% { transform: translateX(20%); opacity: 0.5; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes flipNextAnim {
          0% { transform: perspective(1500px) rotateY(90deg); transform-origin: left; opacity: 0.3; }
          100% { transform: perspective(1500px) rotateY(0deg); transform-origin: left; opacity: 1; }
        }
        @keyframes flipPrevAnim {
          0% { transform: perspective(1500px) rotateY(-90deg); transform-origin: right; opacity: 0.3; }
          100% { transform: perspective(1500px) rotateY(0deg); transform-origin: right; opacity: 1; }
        }
        .anim-slide-left { animation: slideFromLeft 0.4s ease-out forwards; }
        .anim-slide-right { animation: slideFromRight 0.4s ease-out forwards; }
        .anim-flip-next { animation: flipNextAnim 0.5s ease-out forwards; }
        .anim-flip-prev { animation: flipPrevAnim 0.5s ease-out forwards; }
      `}</style>

      {/* --- OVERLAY MODE FOKUS FULLSCREEN MULTI-FUNGSI --- */}
      {isFullscreen && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center animate-fade-in ${activeWadah === "malam" ? "bg-[#fcfcfc]" : "bg-black"}`}
        >
          <div className="absolute top-6 right-6 z-[110]">
            <button
              onClick={() => setIsFullscreen(false)}
              className={`p-3 backdrop-blur-md rounded-full transition-all border ${activeWadah === "malam" ? "bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 border-emerald-600/20" : "bg-white/10 hover:bg-white/20 text-white border-white/20"}`}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div
            className={`absolute top-6 left-6 z-[110] backdrop-blur-md font-bold px-4 py-2 rounded-full text-sm shadow-lg ${activeWadah === "malam" ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-black/50 text-emerald-400 border border-emerald-500/30"}`}
          >
            Halaman {profile.target_halaman}
          </div>

          <div
            className={`relative h-full w-full flex items-center justify-center ${activeWadah === "malam" ? (isOddPage ? "pr-[45px]" : "pl-[45px]") : ""} py-4`}
          >
            <div
              className={`relative h-full flex justify-center items-center ${transitionAnim}`}
            >
              <img
                src={mushafImageUrl}
                alt={`Mushaf Hal ${profile.target_halaman}`}
                className={`h-full w-auto max-w-full object-contain pointer-events-none ${activeWadah === "malam" ? "mix-blend-multiply" : ""}`}
                style={{
                  filter:
                    activeWadah === "malam"
                      ? "blur(1.5px) opacity(0.9) contrast(1.05)"
                      : "contrast(1.1) brightness(0.9)",
                }}
              />

              <div
                className="absolute top-0 bottom-0 left-0 w-[40%] z-20 cursor-pointer"
                onClick={() => updateHalaman(profile.target_halaman + 1)}
                title="Lanjut (Kiri)"
              ></div>
              <div
                className="absolute top-0 bottom-0 right-0 w-[40%] z-20 cursor-pointer"
                onClick={() => updateHalaman(profile.target_halaman - 1)}
                title="Kembali (Kanan)"
              ></div>

              {/* Teks Ra'sul Ayat Overlay untuk Layar Penuh (Khusus Malam) */}
              {activeWadah === "malam" &&
                !quranData.loadingApi &&
                quranData.rasulData &&
                Object.keys(quranData.rasulData).length > 0 && (
                  <div
                    className={`absolute top-0 h-full w-[45px] pointer-events-none z-10 ${isOddPage ? "-right-[45px]" : "-left-[45px]"}`}
                  >
                    {Object.keys(quranData.rasulData).map((lineNum) => {
                      // Margin direset ke 7.5 yang sempurna dan memanjang ke horizontal (flex-row)
                      const TOP_MARGIN = 7.5;
                      const BOTTOM_MARGIN = 7.5;
                      const TEXT_HEIGHT = 100 - TOP_MARGIN - BOTTOM_MARGIN;
                      const LINE_HEIGHT = TEXT_HEIGHT / 14;
                      const topPos = TOP_MARGIN + (lineNum - 1) * LINE_HEIGHT;
                      const items = quranData.rasulData[lineNum];

                      return (
                        <div
                          key={lineNum}
                          className={`absolute flex items-center transform -translate-y-1/2 w-max gap-1.5 drop-shadow-sm ${isOddPage ? "left-0.5" : "right-0.5"}`}
                          style={{ top: `${topPos}%` }}
                          dir={isOddPage ? "ltr" : "rtl"}
                        >
                          {items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1 whitespace-nowrap"
                              dir="rtl"
                            >
                              {isOddPage ? (
                                <>
                                  <span className="font-kemenag text-[10px] leading-tight font-bold px-1.5 py-px rounded-sm shadow-sm text-slate-800 bg-white/95 border border-emerald-100/50">
                                    {item.text}
                                  </span>
                                  <div className="font-bsml text-emerald-600 flex items-center justify-center relative w-5 h-5 shrink-0">
                                    <span className="text-[15px] absolute">
                                      ۝
                                    </span>
                                    <span className="text-[6px] font-bold font-sans pt-0.5 z-10">
                                      {item.ayahNum}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className="font-bsml text-emerald-600 flex items-center justify-center relative w-5 h-5 shrink-0">
                                    <span className="text-[15px] absolute">
                                      ۝
                                    </span>
                                    <span className="text-[6px] font-bold font-sans pt-0.5 z-10">
                                      {item.ayahNum}
                                    </span>
                                  </div>
                                  <span className="font-kemenag text-[10px] leading-tight font-bold px-1.5 py-px rounded-sm shadow-sm text-slate-800 bg-white/95 border border-emerald-100/50">
                                    {item.text}
                                  </span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}

              {activeWadah === "malam" && quranData.loadingApi && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-20">
                  <div className="text-[9px] font-bold text-emerald-600 bg-white px-3 py-1.5 rounded-full shadow-sm animate-pulse">
                    Sinkronisasi Posisi...
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* HEADER & GLOBAL PROGRESS BAR */}
      <div className="flex flex-col gap-3 flex-shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h2 className="text-[14px] font-black text-slate-800 tracking-wide">
              Hai, {profile.display_name.split(" ")[0]} 👋
            </h2>
            <div className="mt-1.5 pr-4">
              <div className="flex justify-between text-[9px] font-bold text-gray-500 mb-1">
                <span>Progress Misi Hari Ini</span>
                <span className="text-emerald-600">
                  {dailyProgressPercent}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden shadow-inner">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${dailyProgressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* BANNER TARGET HALAMAN */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-4 shadow-md relative overflow-hidden flex flex-col items-center">
          <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/10 rounded-full blur-xl pointer-events-none"></div>

          <div className="relative z-10 w-full flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-emerald-100 text-[9px] font-bold tracking-wider uppercase leading-none">
                  Posisi Aktif
                </p>
                <p className="text-xs text-white font-semibold">
                  Juz {profile.target_juz}
                </p>
              </div>
            </div>
            <div className="text-[9px] bg-white/20 border border-white/30 text-white px-2 py-1 rounded-md backdrop-blur-sm shadow-sm flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse"></div>{" "}
              Kiri Lanjut, Kanan Kembali
            </div>
          </div>

          <div className="relative z-10 flex items-center bg-black/20 p-1 rounded-xl backdrop-blur-md border border-white/20 shadow-inner w-full justify-between max-w-[200px]">
            <button
              onClick={() => updateHalaman(profile.target_halaman + 1)}
              className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors active:scale-95"
              title="Lanjut Halaman (Kiri)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 px-3">
              <span className="text-sm font-semibold text-emerald-100">
                Hal.
              </span>
              <input
                type="number"
                min="1"
                max="604"
                value={inputHalaman}
                onChange={(e) => setInputHalaman(e.target.value)}
                onBlur={() => updateHalaman(inputHalaman)}
                onKeyDown={(e) =>
                  e.key === "Enter" && updateHalaman(inputHalaman)
                }
                className="w-12 bg-transparent text-white text-lg font-black text-center focus:outline-none focus:bg-white/20 rounded py-0.5 transition-colors"
              />
            </div>

            <button
              onClick={() => updateHalaman(profile.target_halaman - 1)}
              className="p-2 hover:bg-white/20 rounded-lg text-white transition-colors active:scale-95"
              title="Kembali Halaman (Kanan)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col mt-4 overflow-hidden bg-white rounded-t-3xl border border-gray-100 shadow-sm">
        <div className="flex justify-between p-2 bg-white border-b border-gray-100 shrink-0">
          <button
            onClick={() => setActiveWadah("fajar")}
            className={`flex-1 py-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeWadah === "fajar"
                ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100"
                : "text-gray-400 hover:text-emerald-600"
            }`}
          >
            <Sunrise className="w-3.5 h-3.5" /> Fajar{" "}
            {isFajarDone && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            )}
          </button>
          <button
            onClick={() => setActiveWadah("siang")}
            className={`flex-1 py-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeWadah === "siang"
                ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100"
                : "text-gray-400 hover:text-emerald-600"
            }`}
          >
            <Sun className="w-3.5 h-3.5" /> Siang{" "}
            {isSiangDone && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            )}
          </button>
          <button
            onClick={() => setActiveWadah("malam")}
            className={`flex-1 py-2 text-[11px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              activeWadah === "malam"
                ? "bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100"
                : "text-gray-400 hover:text-emerald-600"
            }`}
          >
            <MoonStar className="w-3.5 h-3.5" /> Malam{" "}
            {isMalamDone && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            )}
          </button>
        </div>

        <div className="flex-1 overflow-hidden bg-white relative">
          {loading ? (
            <div className="h-full flex items-center justify-center text-xs text-emerald-600 animate-pulse">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat Data...
            </div>
          ) : (
            <div className="h-full p-4 overflow-y-auto">
              {/* FAJAR: GAMBAR */}
              {activeWadah === "fajar" && (
                <div className="h-full flex flex-col animate-fade-in">
                  {/* --- TOMBOL LAYAR PENUH DIPINDAH KE SINI --- */}
                  <div className="flex justify-end mb-2 shrink-0">
                    <button
                      onClick={() => setIsFullscreen(true)}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors shadow-sm"
                    >
                      <Maximize2 className="w-3.5 h-3.5" /> Layar Penuh
                    </button>
                  </div>

                  <div className="flex-1 rounded-xl overflow-hidden border border-gray-100 bg-[#fcfcfc] relative flex justify-center items-center shadow-inner p-1.5 group">
                    <div
                      className={`relative h-full w-full flex justify-center items-center ${transitionAnim}`}
                    >
                      <img
                        src={mushafImageUrl}
                        alt="Mushaf"
                        className="h-full w-auto max-w-full object-contain mix-blend-multiply filter contrast-105 pointer-events-none"
                      />

                      <div
                        className="absolute top-0 bottom-0 left-0 w-[40%] z-20 cursor-pointer"
                        onClick={() =>
                          updateHalaman(profile.target_halaman + 1)
                        }
                        title="Lanjut (Kiri)"
                      ></div>
                      <div
                        className="absolute top-0 bottom-0 right-0 w-[40%] z-20 cursor-pointer"
                        onClick={() =>
                          updateHalaman(profile.target_halaman - 1)
                        }
                        title="Kembali (Kanan)"
                      ></div>
                    </div>
                  </div>
                  <ScoreEvaluator
                    field="fajar_score"
                    currentScore={progress.fajar_score}
                    title="Ceklis Jika Sudah Selesai!"
                  />
                </div>
              )}

              {/* SIANG: PEMUTAR AUDIO */}
              {activeWadah === "siang" && (
                <div className="h-full flex flex-col animate-fade-in">
                  <div className="flex-1 flex flex-col items-center justify-center bg-emerald-50/30 border border-emerald-50 rounded-xl p-4 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-50 pointer-events-none -mr-10 -mt-10"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-teal-100 rounded-full blur-2xl opacity-50 pointer-events-none -ml-5 -mb-5"></div>

                    <div className="relative z-10 flex flex-col items-center w-full">
                      <PlayCircle
                        className="w-14 h-14 text-emerald-600 mb-4 cursor-pointer hover:scale-105 transition-transform drop-shadow-md"
                        onClick={() => audioRef.current?.play()}
                      />
                      <h3 className="text-sm font-black text-slate-800">
                        Syaikh Mishary Rasyid
                      </h3>
                      <p className="text-[10px] text-emerald-600 font-bold tracking-widest mt-1 mb-4 uppercase">
                        Surah {quranData.surahName}
                      </p>

                      <div className="w-full max-w-xs mb-4 flex items-center bg-white border border-gray-200 rounded-xl px-3 shadow-sm hover:border-emerald-300 transition-colors">
                        <ListMusic className="w-4 h-4 text-emerald-600 shrink-0" />
                        <select
                          value={currentAudioIndex}
                          onChange={(e) => {
                            setCurrentAudioIndex(Number(e.target.value));
                            setTimeout(() => audioRef.current?.play(), 200);
                          }}
                          className="flex-1 bg-transparent text-xs font-semibold text-slate-700 py-2.5 px-2 outline-none cursor-pointer"
                        >
                          {quranData.ayahs.map((ayah, idx) => (
                            <option key={idx} value={idx}>
                              Mulai Putar dari Ayat {ayah.numberInSurah}
                            </option>
                          ))}
                        </select>
                      </div>

                      <audio
                        ref={audioRef}
                        controls
                        onEnded={handleAudioEnded}
                        className="w-full max-w-xs shadow-sm rounded-full bg-white border border-gray-100"
                        src={quranData.audioPlaylist[currentAudioIndex]}
                      />
                    </div>
                  </div>
                  <ScoreEvaluator
                    field="siang_score"
                    currentScore={progress.siang_score}
                    title="Bagaimana Kualitas Simakanmu?"
                  />
                </div>
              )}

              {/* MALAM: MUSHAF BLUR 5% + RA'SUL AYAT DI SAMPINGNYA */}
              {activeWadah === "malam" && (
                <div className="h-full flex flex-col animate-fade-in">
                  {/* --- TOMBOL LAYAR PENUH DIPINDAH KE SINI --- */}
                  <div className="flex justify-end mb-2 shrink-0">
                    <button
                      onClick={() => setIsFullscreen(true)}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors shadow-sm"
                    >
                      <Maximize2 className="w-3.5 h-3.5" /> Layar Penuh
                    </button>
                  </div>

                  <div
                    className={`flex-1 rounded-xl overflow-hidden border border-gray-100 bg-[#fcfcfc] relative flex justify-center items-center shadow-inner py-1.5 ${isOddPage ? "pr-[45px]" : "pl-[45px]"}`}
                  >
                    <div
                      className={`relative h-full w-full flex justify-center items-center ${transitionAnim}`}
                    >
                      {/* Gambar Al-Quran blur disesuaikan ke 5% (sekitar 1.5px) */}
                      <img
                        src={mushafImageUrl}
                        alt="Mushaf Blur"
                        className="h-full w-auto max-w-full object-contain mix-blend-multiply pointer-events-none"
                        style={{
                          filter: "blur(1.5px) opacity(0.9) contrast(1.05)",
                        }}
                      />

                      <div
                        className="absolute top-0 bottom-0 left-0 w-[40%] z-20 cursor-pointer"
                        onClick={() =>
                          updateHalaman(profile.target_halaman + 1)
                        }
                      ></div>
                      <div
                        className="absolute top-0 bottom-0 right-0 w-[40%] z-20 cursor-pointer"
                        onClick={() =>
                          updateHalaman(profile.target_halaman - 1)
                        }
                      ></div>

                      {/* Teks Ra'sul Ayat Posisi Eksternal (Ganjil=Kanan, Genap=Kiri) */}
                      {!quranData.loadingApi &&
                        quranData.rasulData &&
                        Object.keys(quranData.rasulData).length > 0 && (
                          <div
                            className={`absolute top-0 h-full w-[45px] pointer-events-none z-10 ${isOddPage ? "-right-[-35px]" : "-left-[-35px]"}`}
                          >
                            {Object.keys(quranData.rasulData).map((lineNum) => {
                              // Trik margin dikembalikan utuh ke 7.5 agar aman
                              const TOP_MARGIN = 7.5;
                              const BOTTOM_MARGIN = 7.5;
                              const TEXT_HEIGHT =
                                100 - TOP_MARGIN - BOTTOM_MARGIN;
                              const LINE_HEIGHT = TEXT_HEIGHT / 14;
                              const topPos =
                                TOP_MARGIN + (lineNum - 1) * LINE_HEIGHT;
                              const items = quranData.rasulData[lineNum];

                              return (
                                <div
                                  key={lineNum}
                                  className={`absolute flex items-center transform -translate-y-1/2 w-max gap-1.5 drop-shadow-sm ${isOddPage ? "left-0.5" : "right-0.5"}`}
                                  style={{ top: `${topPos}%` }}
                                  dir={isOddPage ? "ltr" : "rtl"}
                                >
                                  {items.map((item, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center gap-1 whitespace-nowrap"
                                      dir="rtl"
                                    >
                                      {/* KOMPONEN KATA */}
                                      {isOddPage ? (
                                        <>
                                          <span className="font-kemenag text-[10px] leading-tight font-bold px-1.5 py-px rounded-sm shadow-sm text-slate-800 bg-white/95 border border-emerald-100/50">
                                            {item.text}
                                          </span>
                                          {/* KOMPONEN ANGKA KURUNGAN (QCF_BSML) */}
                                          <div className="font-bsml text-emerald-600 flex items-center justify-center relative w-5 h-5 shrink-0">
                                            <span className="text-[15px] absolute">
                                              ۝
                                            </span>
                                            <span className="text-[6px] font-bold font-sans pt-0.5 z-10">
                                              {item.ayahNum}
                                            </span>
                                          </div>
                                        </>
                                      ) : (
                                        <>
                                          {/* KOMPONEN ANGKA KURUNGAN (QCF_BSML) */}
                                          <div className="font-bsml text-emerald-600 flex items-center justify-center relative w-5 h-5 shrink-0">
                                            <span className="text-[15px] absolute">
                                              ۝
                                            </span>
                                            <span className="text-[6px] font-bold font-sans pt-0.5 z-10">
                                              {item.ayahNum}
                                            </span>
                                          </div>
                                          <span className="font-kemenag text-[10px] leading-tight font-bold px-1.5 py-px rounded-sm shadow-sm text-slate-800 bg-white/95 border border-emerald-100/50">
                                            {item.text}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        )}

                      {quranData.loadingApi && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-20">
                          <div className="text-[9px] font-bold text-emerald-600 bg-white px-3 py-1.5 rounded-full shadow-sm animate-pulse">
                            Sinkronisasi Posisi...
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <ScoreEvaluator
                    field="malam_score"
                    currentScore={progress.malam_score}
                    title="Seberapa Lancar Hafalanmu?"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
