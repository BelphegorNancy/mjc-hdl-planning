import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Home, Users, Activity, LogOut, Shield, MonitorPlay, UserCog, Settings, LogIn } from 'lucide-react';
import { useStore } from '../store/useStore';
import LoginModal from './LoginModal';
import { createPortal } from 'react-dom';

interface NavbarProps {
  onExportPDF?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onExportPDF }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const store = useStore();
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  const userRole = store.currentUser?.role?.toUpperCase();
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN';
  const canManageRoomsAndActivities = isAdmin || userRole === 'MANAGER' || userRole === 'USER';

  const handleLogout = () => {
    store.logout();
    navigate('/');
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-red-600/95 backdrop-blur-sm text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1 flex items-center justify-between">
              {/* Logo et boutons de navigation principaux */}
              <div className="flex items-center space-x-4">
                <Link to="/" className="flex items-center space-x-2">
                  <Users className="h-8 w-8" />
                  <span className="font-bold text-xl">MJC HDL</span>
                </Link>

                {/* Liens pour utilisateurs connectés */}
                {store.currentUser && (
                  <>
                    <Link
                      to="/calendar"
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium
                        ${isActive('/calendar') ? 'bg-red-700' : 'hover:bg-red-500'}`}
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Planning</span>
                    </Link>

                    <Link
                      to="/rooms"
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium
                        ${isActive('/rooms') ? 'bg-red-700' : 'hover:bg-red-500'}`}
                    >
                      <Home className="h-4 w-4" />
                      <span>Salles</span>
                    </Link>

                    <Link
                      to="/activities"
                      className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium
                        ${isActive('/activities') ? 'bg-red-700' : 'hover:bg-red-500'}`}
                    >
                      <Activity className="h-4 w-4" />
                      <span>Activités</span>
                    </Link>
                  </>
                )}
              </div>

              {/* Boutons d'administration et profil */}
              <div className="flex items-center space-x-4">
                {store.currentUser && (
                  <>
                    {/* Boutons pour administrateurs uniquement */}
                    {isAdmin && (
                      <>
                        <Link
                          to="/admin"
                          className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium
                            ${isActive('/admin') ? 'bg-red-700' : 'hover:bg-red-500'}`}
                        >
                          <Shield className="h-4 w-4" />
                          <span>Administration</span>
                        </Link>

                        <a
                          href="/display"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-500"
                        >
                          <MonitorPlay className="h-4 w-4" />
                          <span>Affichage Public</span>
                        </a>
                      </>
                    )}

                    {/* Profil utilisateur et déconnexion */}
                    <div className="flex items-center">
                      <span className="text-white text-sm mr-4">
                        {store.currentUser.username} ({store.currentUser.role})
                      </span>
                      <button
                        onClick={handleLogout}
                        className="p-2 rounded-full hover:bg-red-700 transition-colors"
                        title="Déconnexion"
                      >
                        <LogOut className="h-5 w-5" />
                      </button>
                    </div>
                  </>
                )}

                {/* Bouton de connexion pour les utilisateurs non connectés */}
                {!store.currentUser && (
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium hover:bg-red-500"
                  >
                    <LogIn className="h-4 w-4" />
                    <span>Connexion</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      {isLoginModalOpen && createPortal(
        <LoginModal onClose={() => setIsLoginModalOpen(false)} />,
        document.body
      )}
    </>
  );
};

export default Navbar;