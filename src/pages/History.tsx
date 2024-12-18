import React from 'react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { HistoryActionType } from '../types';

const History: React.FC = () => {
  const currentUser = useStore((state) => state.currentUser);
  const history = useStore((state) => state.getHistory());

  console.log('History component - Current history:', history);

  // Vérification du rôle en ignorant la casse
  const isAdmin = currentUser?.role?.toUpperCase() === 'ADMIN' || currentUser?.role?.toUpperCase() === 'SUPERADMIN';
  
  if (!currentUser || !isAdmin) {
    return <div className="p-4">Accès non autorisé</div>;
  }

  const getActionColor = (actionType: HistoryActionType | undefined) => {
    if (!actionType) return 'text-gray-600';
    
    if (actionType.includes('CREATED') || actionType === 'USER_LOGIN') return 'text-green-600';
    if (actionType.includes('UPDATED')) return 'text-yellow-600';
    if (actionType.includes('DELETED') || actionType === 'USER_LOGOUT') return 'text-red-600';
    return 'text-gray-600';
  };

  const formatDate = (timestamp: string | Date) => {
    if (!timestamp) return '';
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return format(date, "d MMMM yyyy 'à' HH:mm:ss", { locale: fr });
  };

  const formatDetails = (details: any): string => {
    if (!details) return '-';
    if (typeof details === 'string') return details;
    
    // Pour une nouvelle réservation
    if (details.reservation) {
      return `Salle ${details.reservation.room}, ${details.reservation.activity} le ${details.reservation.startTime}`;
    }
    
    // Pour une modification de réservation
    if (details.reservationId && details.changes) {
      let changes = [];
      if (details.changes.room) changes.push(`Salle: ${details.changes.room}`);
      if (details.changes.activity) changes.push(`Activité: ${details.changes.activity}`);
      if (details.changes.startTime) changes.push(`Horaire: ${details.changes.startTime}`);
      return `Modifications: ${changes.join(', ')}`;
    }
    
    // Pour une suppression de réservation récurrente
    if (details.parentReservationId && details.count) {
      return `${details.count} réservations supprimées`;
    }
    
    // Pour tout autre objet, on essaie de le formater proprement
    try {
      return JSON.stringify(details, null, 2);
    } catch {
      return 'Détails non disponibles';
    }
  };

  const getActionTypeDisplay = (actionType: HistoryActionType | undefined) => {
    if (!actionType) return 'ACTION INCONNUE';
    
    // Traduire les types d'action en français
    const translations: Record<HistoryActionType, string> = {
      'USER_LOGIN': 'CONNEXION',
      'USER_LOGOUT': 'DÉCONNEXION',
      'USER_CREATED': 'UTILISATEUR CRÉÉ',
      'USER_UPDATED': 'UTILISATEUR MODIFIÉ',
      'USER_DELETED': 'UTILISATEUR SUPPRIMÉ',
      'RESERVATION_CREATED': 'RÉSERVATION CRÉÉE',
      'RESERVATION_UPDATED': 'RÉSERVATION MODIFIÉE',
      'RESERVATION_DELETED': 'RÉSERVATION SUPPRIMÉE'
    };

    return translations[actionType] || actionType.split('_').join(' ');
  };

  const sortedLogs = [...(history || [])].sort((a, b) => {
    if (!a.timestamp || !b.timestamp) return 0;
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateB.getTime() - dateA.getTime();
  });

  if (!history || history.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Historique des Actions</h1>
        <div className="bg-white shadow-md rounded-lg p-4 text-center text-gray-500">
          Aucun historique disponible
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Historique des Actions</h1>
      
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Détails
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedLogs.map((log, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getActionColor(log.actionType)}`}>
                      {getActionTypeDisplay(log.actionType)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDetails(log.details)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {log.username || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default History;
