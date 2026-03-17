import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Tv, Search, Settings, LogOut, LayoutDashboard, Bell, User, History, Filter, Wifi, Clock } from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      if (auth.currentUser) {
        // Fallback: Check email directly if firestore is slow or doc is missing
        if (auth.currentUser.email === 'elieltonsilvak2@gmail.com') {
          setIsAdmin(true);
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        setIsAdmin(userDoc.data()?.role === 'admin');
      }
    };
    checkAdmin();
  }, [auth.currentUser]);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/live', label: 'TV' },
    { to: '/games', label: 'JOGOS' },
    { to: '/', label: 'DESTAQUES' },
    { to: '/movies', label: 'FILMES' },
    { to: '/series', label: 'SÉRIES' },
    { to: '/kids', label: 'KIDS', isColorful: true },
    { to: '/anime', label: 'ANIME' },
    { to: '/explore', label: 'EXPLORAR' },
    ...(isAdmin ? [{ to: '/admin', label: 'ADMIN', isSpecial: true }] : []),
  ];

  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col">
      {/* Top Header */}
      <header className="h-20 px-8 flex items-center justify-between z-50 bg-gradient-to-b from-black/80 to-transparent fixed top-0 w-full">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
            <Tv className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight glow-text">Pro IPTV</span>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                "text-lg font-bold tracking-wider transition-all hover:scale-110",
                isActive ? "nav-tab-active" : "text-white/50 hover:text-white",
                item.isColorful && "text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500",
                item.isSpecial && "text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-lg bg-emerald-500/10"
              )}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Icons */}
        <div className="flex items-center gap-5 text-white/70">
          <button onClick={() => navigate('/search')} className="hover:text-white transition-colors"><Search className="w-6 h-6" /></button>
          <button onClick={() => navigate('/explore')} className="hover:text-white transition-colors"><Filter className="w-6 h-6" /></button>
          <button onClick={() => navigate('/favorites')} className="hover:text-white transition-colors"><History className="w-6 h-6" /></button>
          <div className="relative">
            <button onClick={() => navigate('/settings')} className="hover:text-white transition-colors flex items-center gap-1">
              <User className="w-6 h-6" />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] font-bold text-black">V</div>
            </button>
          </div>
          <button onClick={() => navigate('/settings')} className="hover:text-white transition-colors"><Bell className="w-6 h-6" /></button>
          <button onClick={() => navigate('/settings')} className="hover:text-white transition-colors"><Wifi className="w-6 h-6" /></button>
          <div className="flex items-center gap-2 ml-2">
            <Clock className="w-5 h-5" />
            <span className="text-lg font-medium">
              {currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          
          {isAdmin && (
            <button 
              onClick={() => navigate('/admin')}
              className="ml-4 p-2 bg-emerald-500/20 text-emerald-500 rounded-lg hover:bg-emerald-500/30 transition-all"
              title="Painel Admin"
            >
              <LayoutDashboard className="w-5 h-5" />
            </button>
          )}
          
          <button 
            onClick={handleLogout}
            className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-all"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-20 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
