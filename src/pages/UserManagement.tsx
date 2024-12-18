import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { User } from '../types';
import Button from '../components/Button';
import Panel from '../components/Panel';

const UserManagement = () => {
  const navigate = useNavigate();
  const { currentUser, users, createUser, updateUser, deleteUser } = useStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as User['role']
  });

  // Vérifier si l'utilisateur est un superadmin
  useEffect(() => {
    console.log('Current user in UserManagement:', currentUser);
    if (!currentUser || currentUser.role !== 'superadmin') {
      console.log('Access denied, redirecting to home');
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      updateUser({
        ...selectedUser,
        ...formData,
        updatedBy: currentUser?.id
      });
    } else {
      createUser({
        ...formData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        createdBy: currentUser?.id || ''
      });
    }
    resetForm();
  };

  const handleDelete = (user: User) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer ${user.username} ?`)) {
      deleteUser(user.id);
    }
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'user'
    });
    setSelectedUser(null);
    setIsCreateModalOpen(false);
  };

  const canCreateSuperAdmin = currentUser?.role === 'superadmin';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          Nouvel Utilisateur
        </Button>
      </div>

      {/* Liste des utilisateurs */}
      <div className="grid gap-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white p-4 rounded-lg shadow flex justify-between items-center"
          >
            <div>
              <h3 className="font-medium">{user.username}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100">
                {user.role}
              </span>
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedUser(user);
                  setFormData({
                    username: user.username,
                    email: user.email,
                    password: '',
                    role: user.role
                  });
                  setIsCreateModalOpen(true);
                }}
              >
                Modifier
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(user)}
              >
                Supprimer
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de création/modification */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedUser ? 'Modifier' : 'Créer'} un utilisateur
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full p-2 border rounded"
                  required={!selectedUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rôle</label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as User['role']
                    })
                  }
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="user">Utilisateur</option>
                  {canCreateSuperAdmin && (
                    <option value="superadmin">Super Administrateur</option>
                  )}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                >
                  Annuler
                </Button>
                <Button type="submit">
                  {selectedUser ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
