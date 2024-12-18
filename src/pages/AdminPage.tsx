import React from 'react';
import { Shield, Users, History, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import { useStore } from '../store/useStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const AdminPage = () => {
  const { users, addUser, updateUser, removeUser, currentUser } = useStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      const user = users.find(u => u.id === editingUser);
      if (user) {
        updateUser({
          ...user,
          ...formData,
        });
      }
      setEditingUser(null);
    } else {
      addUser({
        ...formData,
        createdAt: new Date(),
      });
    }
    setFormData({ username: '', email: '', password: '', role: 'user' });
    setIsEditing(false);
    setShowPassword(false);
  };

  const handleEdit = (user: any) => {
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
    });
    setEditingUser(user.id);
    setIsEditing(true);
    setShowPassword(false);
  };

  if (!currentUser || currentUser.role !== 'superadmin') {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Accès non autorisé</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => {
              setIsEditing(true);
              setEditingUser(null);
              setFormData({ username: '', email: '', password: '', role: 'user' });
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2"
          >
            <Users className="h-5 w-5" />
            <span>Nouvel Utilisateur</span>
          </button>
          <button
            onClick={() => navigate('/history')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 flex items-center space-x-2"
          >
            <History className="h-5 w-5" />
            <span>Historique</span>
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingUser ? 'Modifier un utilisateur' : 'Nouvel utilisateur'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  required={!editingUser}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Rôle
              </label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              >
                <option value="user">Utilisateur</option>
                <option value="admin">Admin</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setEditingUser(null);
                  setFormData({ username: '', email: '', password: '', role: 'user' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                {editingUser ? 'Modifier' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
                          removeUser(user.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPage;