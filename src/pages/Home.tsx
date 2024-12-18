import React from 'react';
import { Calendar, Users, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import LoginForm from '../components/LoginForm';

const Home = () => {
  const currentUser = useStore((state) => state.currentUser);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Bannière MJC */}
      {/* <div className="w-full mb-8">
        <img 
          src="/images/mjc-banner.jpg"
          alt="MJC Haut-du-Lièvre"
          className="w-full h-48 object-cover rounded-lg shadow-md"
        />
      </div> */}

      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Réservation des Salles MJC HDL
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Bienvenue sur le système de réservation de salles de la MJC HDL. 
          Gérez facilement vos réservations, consultez le planning et organisez vos activités.
        </p>
      </div>

      {currentUser ? (
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Link to="/calendar" className="group">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-red-600 mb-4">
                <Calendar className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Planning</h3>
              <p className="text-gray-600">
                Consultez le planning des salles et gérez vos réservations en quelques clics.
              </p>
            </div>
          </Link>

          <Link to="/rooms" className="group">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-red-600 mb-4">
                <Users className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Salles</h3>
              <p className="text-gray-600">
                Découvrez nos salles disponibles et leurs équipements.
              </p>
            </div>
          </Link>

          <Link to="/activities" className="group">
            <div className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="text-red-600 mb-4">
                <Activity className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900">Activités</h3>
              <p className="text-gray-600">
                Explorez les différentes activités proposées dans nos locaux.
              </p>
            </div>
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <LoginForm />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-8">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">À propos de la MJC HDL</h2>
        <p className="text-gray-600 mb-4">
          La Maison des Jeunes et de la Culture HDL est un espace culturel et social 
          dédié à l'épanouissement de tous. Nos salles accueillent une variété 
          d'activités pour tous les âges et tous les centres d'intérêt.
        </p>
        <img 
          src="https://lh3.googleusercontent.com/p/AF1QipMfzEdBfca1C4x-puFvAIVaDh44tA7vO-9frtH9=s1360-w1360-h1020"
          alt="MJC Building"
          className="w-full h-64 object-cover rounded-lg"
        />
      </div>
    </div>
  );
};

export default Home;