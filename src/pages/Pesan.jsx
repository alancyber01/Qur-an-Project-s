import { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  Loader2,
  Quote,
  BarChart2,
  Calendar,
  Award,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { GoogleGenerativeAI } from "@google/generative-ai";
import ReactMarkdown from "react-markdown";

export default function Pesan() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([
    {
      id: 1,
      text: "Assalamu'alaikum! Gunakan tombol menu cepat di atas untuk meminta laporan berkala, atau mengobrol langsung denganku ya.",
      sender: "ai",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [userContext, setUserContext] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats]);

  useEffect(() => {
    const fetchContext = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      const { data: progress } = await supabase
        .from("daily_progress")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(7);

      let contextString = `Nama User: ${profile?.display_name || "Hamba Allah"}\n`;
      contextString += `Target Hafalan: ${profile?.target_halaman} Halaman, Fokus di Juz ${profile?.target_juz}\n`;
      contextString += `Tingkat Kemampuan: ${profile?.tingkat_kemampuan}, Metode Pilihan: ${profile?.preferensi_metode}\n\n`;
      contextString += `Data Skor 7 Hari Terakhir:\n`;
      progress?.forEach((p) => {
        contextString += `- ${p.date}: Fajar(${p.fajar_score}), Siang(${p.siang_score}), Malam(${p.malam_score})\n`;
      });

      setUserContext(contextString);
    };
    fetchContext();
  }, []);

  const triggerAIResponse = async (triggeredMsg) => {
    setIsTyping(true);
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `Kamu adalah Mentor Ahli Murojaah Qur'an. JAWABAN HARUS SINGKAT, PADAT, DAN JELAS (Maksimal 2 paragraf pendek atau poin-poin singkat). Selalu berikan 1 kalimat motivasi bakar semangat di akhir. Gunakan data ini:\n\n${userContext}`,
      });

      const result = await model.generateContent(triggeredMsg);
      const responseText = result.response.text();
      setChats((prev) => [
        ...prev,
        { id: Date.now() + 1, text: responseText, sender: "ai" },
      ]);
    } catch (e) {
      setChats((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "Gagal memproses data analitik.",
          sender: "ai",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = () => {
    if (!message.trim()) return;
    const userMsg = message;
    setMessage("");
    setChats((prev) => [
      ...prev,
      { id: Date.now(), text: userMsg, sender: "user" },
    ]);
    triggerAIResponse(userMsg);
  };

  return (
    <div className="flex flex-col h-screen bg-emerald-50/20 font-sans pb-16 overflow-hidden">
      {/* HEADER UTAMA & KAPSUL MOTIVASI */}
      <div className="bg-white border-b border-emerald-100 p-4 shadow-sm z-10 flex flex-col gap-2.5 shrink-0 pt-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-full flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xs font-bold text-gray-800">
              Gemini Mentor AI
            </h1>
            <p className="text-[9px] text-emerald-600 font-semibold flex items-center gap-1">
              ● Penganalisis Hafalan Aktif
            </p>
          </div>
        </div>

        {/* Kapsul Motivasi Harian Otomatis */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-2.5 flex items-center gap-2">
          <Quote className="w-4 h-4 text-emerald-600 shrink-0 transform rotate-180" />
          <p className="text-[10px] text-emerald-800 font-medium italic leading-tight">
            "Satu huruf Al-Qur'an adalah sepuluh kebaikan. Bayangkan limpahan
            pahala saat kamu jatuh bangun mengulanginya hari ini!"
          </p>
        </div>

        {/* Toolbar Trigger Laporan Otomatis */}
        <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-gray-50">
          <button
            onClick={() => {
              setChats((p) => [
                ...p,
                {
                  id: Date.now(),
                  text: "Buatkan Analisis Progres Harian",
                  sender: "user",
                },
              ]);
              triggerAIResponse(
                "Berikan evaluasi harian berdasarkan data skor hari terakhir",
              );
            }}
            className="p-1.5 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 rounded-lg border border-gray-100 text-[10px] font-bold flex items-center justify-center gap-1"
          >
            <BarChart2 className="w-3 h-3 text-emerald-600" /> Harian
          </button>
          <button
            onClick={() => {
              setChats((p) => [
                ...p,
                {
                  id: Date.now(),
                  text: "Minta Laporan Mingguan",
                  sender: "user",
                },
              ]);
              triggerAIResponse(
                "Berikan kesimpulan pola grafik mingguan saya, di mana kelemahan dan kekuatannya",
              );
            }}
            className="p-1.5 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 rounded-lg border border-gray-100 text-[10px] font-bold flex items-center justify-center gap-1"
          >
            <Calendar className="w-3 h-3 text-blue-500" /> Mingguan
          </button>
          <button
            onClick={() => {
              setChats((p) => [
                ...p,
                {
                  id: Date.now(),
                  text: "Evaluasi Performa Bulanan",
                  sender: "user",
                },
              ]);
              triggerAIResponse(
                "Berikan strategi murojaah jangka panjang 1 bulan ke depan berdasarkan data tingkat kemampuan saya",
              );
            }}
            className="p-1.5 bg-gray-50 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 rounded-lg border border-gray-100 text-[10px] font-bold flex items-center justify-center gap-1"
          >
            <Award className="w-3 h-3 text-amber-500" /> Bulanan
          </button>
        </div>
      </div>

      {/* AREA LIVE CHAT */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`flex ${chat.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] p-3 rounded-2xl text-[12px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                chat.sender === "user"
                  ? "bg-emerald-600 text-white rounded-br-sm"
                  : "bg-white text-gray-800 border border-emerald-50 rounded-bl-sm"
              }`}
            >
              {chat.sender === "user" ? (
                chat.text
              ) : (
                <div className="markdown-container">
                  <ReactMarkdown>{chat.text}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-3 rounded-2xl flex items-center gap-1.5 shadow-sm">
              <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
              <span className="text-[10px] text-gray-400 font-medium">
                Gemini memilah ayat...
              </span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* INPUT BAR */}
      <div className="bg-white border-t border-gray-100 p-2.5 pb-safe shrink-0">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full p-1 pl-4">
          <input
            type="text"
            placeholder="Tanya hal bebas atau diskusikan kelancaran..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            disabled={isTyping}
            className="flex-1 bg-transparent outline-none text-xs text-gray-700 placeholder-gray-400"
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !message.trim()}
            className="w-8 h-8 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white rounded-full flex items-center justify-center flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
