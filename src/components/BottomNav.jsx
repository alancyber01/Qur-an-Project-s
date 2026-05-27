import { Home, Bookmark, MessageSquare, User } from "lucide-react";

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 w-full max-w-md mx-auto bg-dark-bg/90 backdrop-blur-xl border-t border-white/5 pb-safe z-50">
      <div className="flex justify-around items-center h-16 px-2">
        <button className="flex flex-col items-center justify-center w-full text-black hover:text-amber transition-colors">
          <Home className="w-5 h-5 mb-1" strokeWidth={2} />
          <span className="text-[10px] font-medium">Home</span>
          <div className="w-4 h-0.5 bg-black rounded-full mt-1"></div>
        </button>

        <button className="flex flex-col items-center justify-center w-full text-gray-500 hover:text-white transition-colors">
          <Bookmark className="w-5 h-5 mb-1" strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Tracker</span>
        </button>

        <button className="flex flex-col items-center justify-center w-full text-gray-500 hover:text-white transition-colors">
          <MessageSquare className="w-5 h-5 mb-1" strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Pesan</span>
        </button>

        <button className="flex flex-col items-center justify-center w-full text-gray-500 hover:text-white transition-colors">
          <User className="w-5 h-5 mb-1" strokeWidth={1.5} />
          <span className="text-[10px] font-medium">Profil</span>
        </button>
      </div>
    </div>
  );
}
