import { Home, Bookmark, MessageSquare, User } from "lucide-react";

export default function BottomNav({ activeTab, setActiveTab }) {
  const navItems = [
    { id: "home", label: "Home", Icon: Home },
    { id: "tracker", label: "Tracker", Icon: Bookmark },
    { id: "pesan", label: "Pesan", Icon: MessageSquare },
    { id: "profile", label: "Profil", Icon: User },
  ];

  return (
    <div className="fixed bottom-0 w-full max-w-md mx-auto bg-white/95 backdrop-blur-xl border-t border-gray-100 pb-safe z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map(({ id, label, Icon }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center justify-center w-full transition-all duration-300 ${
                isActive
                  ? "text-emerald-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <Icon
                className={`mb-1 transition-all duration-300 ${isActive ? "w-5 h-5 scale-110" : "w-[18px] h-[18px]"}`}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}
              >
                {label}
              </span>
              {/* Indikator Aktif */}
              <div
                className={`w-1.5 h-1.5 rounded-full mt-1 transition-all duration-300 ${isActive ? "bg-kuning-emas" : "bg-transparent"}`}
              ></div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
