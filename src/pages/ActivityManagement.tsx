import React from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Activity } from '../types';
import Button from '../components/Button';

const ActivityManagement = () => {
  const { activities, addActivity, deleteActivity, updateActivity } = useStore();
  const currentUser = useStore((state) => state.currentUser);
  const [isAdding, setIsAdding] = React.useState(false);
  const [editingActivity, setEditingActivity] = React.useState<Activity | null>(null);
  const [newActivity, setNewActivity] = React.useState<Partial<Activity>>({
    name: '',
    description: '',
    requirements: [],
  });
  const [requirementsInput, setRequirementsInput] = React.useState('');

  const userRole = currentUser?.role?.toUpperCase();
  const canAccess = userRole === 'SUPERADMIN' || userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'USER';

  if (!currentUser || !canAccess) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <p className="text-gray-500">Accès non autorisé</p>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newActivity.name) {
      addActivity({
        id: `activity-${Date.now()}`,
        name: newActivity.name,
        description: newActivity.description || '',
        requirements: newActivity.requirements || [],
        createdBy: 'current-user',
        createdAt: new Date(),
      });
      setIsAdding(false);
      setNewActivity({ name: '', description: '', requirements: [] });
      setRequirementsInput('');
    }
  };

  const handleRequirementsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRequirementsInput(e.target.value);
    setNewActivity(prev => ({
      ...prev,
      requirements: e.target.value.split(',').map(req => req.trim()).filter(Boolean)
    }));
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setNewActivity({
      name: activity.name,
      description: activity.description || '',
      requirements: activity.requirements || [],
    });
    setRequirementsInput(activity.requirements?.join(', ') || '');
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette activité ?')) {
      deleteActivity(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Activités</h1>
        <Button
          onClick={() => {
            setIsAdding(true);
            setEditingActivity(null);
            setNewActivity({ name: '', description: '', requirements: [] });
            setRequirementsInput('');
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Ajouter une Activité
        </Button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">
            {editingActivity ? 'Modifier l\'activité' : 'Nouvelle Activité'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Nom
              </label>
              <input
                id="name"
                type="text"
                required
                value={newActivity.name}
                onChange={(e) => setNewActivity(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Informations complémentaires <span className="text-gray-500">(optionnel)</span>
              </label>
              <textarea
                id="description"
                value={newActivity.description}
                onChange={(e) => setNewActivity(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Nom du professeur / Description du cours, etc..."
              />
            </div>
            <div>
              <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                Besoins Spécifiques
              </label>
              <input
                id="requirements"
                type="text"
                value={requirementsInput}
                onChange={handleRequirementsChange}
                placeholder="Ex: Projecteur, Sono, Tapis (séparés par des virgules)"
                className="mt-1 block w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">
                {editingActivity ? 'Mettre à jour' : 'Sauvegarder'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setEditingActivity(null);
                  setNewActivity({ name: '', description: '', requirements: [] });
                  setRequirementsInput('');
                }}
              >
                Annuler
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow">
        <div className="divide-y">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="p-4 flex items-center justify-between hover:bg-gray-50"
            >
              <div>
                <h3 className="text-lg font-medium text-gray-900">{activity.name}</h3>
                {activity.description && (
                  <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
                )}
                {activity.requirements && activity.requirements.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {activity.requirements.map((req, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {req}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(activity)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(activity.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ActivityManagement;