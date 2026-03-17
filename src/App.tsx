import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './lib/firebase';

// Pages
import Login from './pages/Login';
import AppLayout from './app/AppLayout';
import Home from './app/Home';
import LiveTV from './app/LiveTV';
import Movies from './app/Movies';
import Series from './app/Series';
import Favorites from './app/Favorites';
import Search from './app/Search';
import Settings from './app/Settings';

// Admin
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import Users from './admin/Users';
import Content from './admin/Content';
import Categories from './admin/Categories';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user is admin
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser({ ...firebaseUser, ...userData });
          setIsAdmin(userData.role === 'admin' || firebaseUser.email === 'elieltonsilvak2@gmail.com');
        } else {
          setUser(firebaseUser);
          setIsAdmin(firebaseUser.email === 'elieltonsilvak2@gmail.com');
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        
        {/* App Routes */}
        <Route path="/" element={user ? <AppLayout /> : <Navigate to="/login" />}>
          <Route index element={<Home />} />
          <Route path="live" element={<LiveTV />} />
          <Route path="movies" element={<Movies />} />
          <Route path="series" element={<Series />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="search" element={<Search />} />
          <Route path="settings" element={<Settings />} />
          <Route path="games" element={<div className="p-10 text-center text-2xl font-bold text-white/20 uppercase tracking-widest mt-20">Seção de Jogos em Breve</div>} />
          <Route path="kids" element={<div className="p-10 text-center text-2xl font-bold text-white/20 uppercase tracking-widest mt-20 italic">Seção Kids em Breve</div>} />
          <Route path="anime" element={<div className="p-10 text-center text-2xl font-bold text-white/20 uppercase tracking-widest mt-20">Seção Anime em Breve</div>} />
          <Route path="explore" element={<div className="p-10 text-center text-2xl font-bold text-white/20 uppercase tracking-widest mt-20">Explorar em Breve</div>} />
        </Route>

        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            (isAdmin || auth.currentUser?.email === 'elieltonsilvak2@gmail.com') 
              ? <AdminLayout /> 
              : <Navigate to="/" />
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="content" element={<Content />} />
          <Route path="categories" element={<Categories />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
