import { Star } from "lucide-react";

export default function TaskCard({
  title,
  time,
  target,
  score,
  onScoreChange,
  Icon,
}) {
  // Array skala 1 sampai 5
  const scores = [1, 2, 3, 4, 5];
  const isCompleted = score > 0;

  return (
    <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] border border-gray-100 mb-3 transition-all hover:shadow-[0_4px_20px_-4px_rgba(0,127,255,0.1)]">
      <div className="flex items-center mb-3">
        <div
          className={`p-3 rounded-xl mr-4 transition-colors ${isCompleted ? "bg-gray-50" : "bg-emerald-50"}`}
        >
          <Icon
            className={`w-5 h-5 ${isCompleted ? "text-gray-300" : "text-emerald-600"}`}
            strokeWidth={1.5}
          />
        </div>

        <div className="flex-1">
          <h3
            className={`text-[14px] font-bold tracking-wide ${isCompleted ? "text-gray-400" : "text-teks-arang"}`}
          >
            {title}
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">{target}</p>
        </div>

        {/* Label Indikator Selesai */}
        {isCompleted && (
          <span className="text-[10px] font-extrabold text-kuning-emas bg-yellow-50 px-2 py-1 rounded-md">
            Skor: {score}/5
          </span>
        )}
      </div>

      {/* Baris Skor Evaluasi Presisi */}
      <div className="flex justify-between items-center bg-gray-50/50 p-2 rounded-xl border border-gray-100">
        <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest pl-1">
          Kualitas:
        </span>
        <div className="flex gap-1.5">
          {scores.map((s) => (
            <button
              key={s}
              onClick={() => onScoreChange(s)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold transition-all active:scale-90 ${
                score >= s
                  ? "bg-kuning-emas text-white shadow-[0_2px_8px_rgba(244,196,48,0.4)]"
                  : "bg-white border border-gray-200 text-gray-400 hover:border-kuning-emas hover:text-kuning-emas"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
