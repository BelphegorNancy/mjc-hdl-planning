import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import RoomManagement from './pages/RoomManagement';
import ActivityManagement from './pages/ActivityManagement';
import Display from './pages/Display';
import Admin from './pages/Admin';
import { useStore } from './store/useStore';
import './styles/print.css';

const Layout = ({ children }: { children: React.ReactNode }) => {
  // Ne pas afficher la navbar sur la page d'affichage public
  const isDisplayPage = window.location.pathname === '/display';
  return (
    <div className="min-h-screen bg-gray-50">
      {!isDisplayPage && <Navbar />}
      <main className={`container mx-auto px-4 py-8 ${!isDisplayPage ? 'mt-16' : ''}`}>
        {children}
      </main>
    </div>
  );
};

function App() {
  const currentUser = useStore((state) => state.currentUser);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/display" element={<Display />} />
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/calendar"
          element={
            <Layout>
              <Calendar />
            </Layout>
          }
        />
        <Route
          path="/rooms"
          element={
            currentUser ? (
              <Layout>
                <RoomManagement />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/activities"
          element={
            currentUser ? (
              <Layout>
                <ActivityManagement />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/admin"
          element={
            currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN' ? (
              <Layout>
                <Admin />
              </Layout>
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;