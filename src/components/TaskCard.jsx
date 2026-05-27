import { Check } from "lucide-react";

// Tambahkan properti onClick di sini
export default function TaskCard({
  title,
  time,
  target,
  isCompleted,
  Icon,
  onClick,
}) {
  return (
    <div className="bg-white p-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.04)] border border-gray-100 flex items-center mb-3">
      <div
        className={`p-3 rounded-xl mr-4 ${isCompleted ? "bg-gray-50" : "bg-blue-50"}`}
      >
        <Icon
          className={`w-5 h-5 ${isCompleted ? "text-gray-300" : "text-biru-azure"}`}
          strokeWidth={1.5}
        />
      </div>

      <div className="flex-1">
        <h3
          className={`text-[14px] font-bold tracking-wide ${isCompleted ? "text-gray-400 line-through" : "text-teks-arang"}`}
        >
          {title}
        </h3>
        <p className="text-[11px] text-gray-500 mt-0.5">{target}</p>
      </div>

      {/* Tambahkan onClick={onClick} di dalam tag button ini */}
      <button
        onClick={onClick}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 border-[1.5px] active:scale-90 ${
          isCompleted
            ? "bg-kuning-emas border-kuning-emas text-white shadow-[0_2px_8px_rgba(244,196,48,0.4)]"
            : "bg-transparent border-gray-200 text-transparent hover:border-kuning-emas"
        }`}
      >
        <Check className="w-3.5 h-3.5" strokeWidth={3} />
      </button>
    </div>
  );
}
