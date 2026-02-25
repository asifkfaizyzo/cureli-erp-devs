// src/pages/Dashboard/comps/WelcomeBanner.jsx

import { useState, useEffect } from "react";
import { 
  Sun, 
  Moon, 
  Sunrise, 
  Sparkles,
  TrendingUp,
  Bell,
  ShieldCheck,
} from "lucide-react";

const WelcomeBanner = ({ admin, pendingCounts }) => {
  const [greeting, setGreeting] = useState({ text: "Hello", icon: Sun });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting({ text: "Good Morning", icon: Sunrise });
    } else if (hour >= 12 && hour < 17) {
      setGreeting({ text: "Good Afternoon", icon: Sun });
    } else if (hour >= 17 && hour < 21) {
      setGreeting({ text: "Good Evening", icon: Sun });
    } else {
      setGreeting({ text: "Good Night", icon: Moon });
    }
  }, []);

  const Icon = greeting.icon;
  const firstName = admin?.name?.split(" ")[0] || "Admin";
  const roleDisplay = admin?.role?.replace("_", " ") || "Admin";

  // Calculate total pending
  const totalPending = 
    (pendingCounts?.pendingVerifications || 0) +
    (pendingCounts?.pendingTickets || 0) +
    (pendingCounts?.pendingEnquiries || 0);

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#000060] via-[#000080] to-violet-700 rounded-2xl p-5 text-white shadow-xl">
      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-violet-500/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
      
      {/* Sparkle decorations */}
      <Sparkles className="absolute top-4 right-4 w-6 h-6 text-white/20 animate-pulse" />
      <Sparkles className="absolute bottom-4 right-12 w-4 h-4 text-violet-300/30 animate-pulse delay-300" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Greeting */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Icon size={28} className="text-amber-300" />
          </div>
          
          <div>
            <p className="text-sm text-white/70 flex items-center gap-2">
              {greeting.text}
              <span className="inline-block w-1 h-1 rounded-full bg-white/50" />
              <span className="text-xs opacity-60">
                {new Date().toLocaleDateString("en-IN", { 
                  weekday: "long", 
                  day: "numeric", 
                  month: "short" 
                })}
              </span>
            </p>
            <h2 className="text-2xl font-bold mt-0.5">{firstName}!</h2>
            <div className="flex items-center gap-2 mt-1">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-xs text-white/80 capitalize">{roleDisplay}</span>
            </div>
          </div>
        </div>

        {/* Right: Quick Stats */}
        <div className="flex items-center gap-3">
          {totalPending > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
              <Bell size={18} className="text-amber-300" />
              <div>
                <p className="text-lg font-bold">{totalPending}</p>
                <p className="text-[10px] text-white/60 uppercase tracking-wider">Pending</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10">
            <TrendingUp size={18} className="text-emerald-400" />
            <div>
              <p className="text-lg font-bold">Active</p>
              <p className="text-[10px] text-white/60 uppercase tracking-wider">Status</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;