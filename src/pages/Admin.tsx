import React, { useState } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useStore } from '../store/useStore';
import UserManagement from './UserManagement';
import History from './History';
import { cn } from '../utils/cn';
import BackupManager from '../components/BackupManager';

type Tab = 'users' | 'history' | 'backup';

const Admin = () => {
  const [activeTab, setActiveTab] = useState<Tab>('users');
  const currentUser = useStore(state => state.currentUser);
  
  console.log('Admin page - Current user:', currentUser);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-gray-500">Vous devez être connecté pour accéder à cette page</p>
      </div>
    );
  }

  if (!['SUPERADMIN', 'ADMIN'].includes(currentUser.role.toUpperCase())) {
    console.log('Admin page - User does not have the required role:', currentUser.role);
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-gray-500">Vous n'avez pas les droits nécessaires pour accéder à cette page</p>
      </div>
    );
  }

  console.log('Admin page - User has the required role:', currentUser.role);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center space-x-2 mb-6">
        <Cog6ToothIcon className="h-6 w-6 text-gray-600" />
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'users'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Utilisateurs
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'history'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Historique
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={cn(
              'py-4 px-1 border-b-2 font-medium text-sm',
              activeTab === 'backup'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            Sauvegardes
          </button>
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'history' && <History />}
        {activeTab === 'backup' && <BackupManager />}
      </div>
    </div>
  );
};

export default Admin;
