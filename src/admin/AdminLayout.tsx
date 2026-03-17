import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Film, List, LogOut, ArrowLeft } from 'lucide-react';
import { auth } from '../lib/firebase';
import { cn } from '../lib/utils';

export default function AdminLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: Users, label: 'Usuários' },
    { to: '/admin/content', icon: Film, label: 'Conteúdo' },
    { to: '/admin/categories', icon: List, label: 'Categorias' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-50">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <LayoutDashboard className="text-white w-6 h-6" />
          </div>
          <span className="text-xl font-bold text-slate-900">Admin Panel</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all",
                isActive 
                  ? "bg-indigo-50 text-indigo-600 font-semibold" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 space-y-1">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar ao App</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen bg-slate-50/50">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
