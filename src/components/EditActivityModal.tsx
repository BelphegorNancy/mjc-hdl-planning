import React from 'react';
import { X } from 'lucide-react';
import { Activity } from '../types';

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity;
  onSave: (updatedActivity: Activity) => void;
}

const EditActivityModal: React.FC<EditActivityModalProps> = ({ isOpen, onClose, activity, onSave }) => {
  const [editedActivity, setEditedActivity] = React.useState(activity);
  const [requirementsInput, setRequirementsInput] = React.useState(activity.requirements.join(', '));

  React.useEffect(() => {
    setEditedActivity(activity);
    setRequirementsInput(activity.requirements.join(', '));
  }, [activity]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedActivity);
    onClose();
  };

  const handleRequirementsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRequirementsInput(e.target.value);
    setEditedActivity({
      ...editedActivity,
      requirements: e.target.value.split(',').map(req => req.trim()).filter(Boolean)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Modifier l'Activité</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">Nom</label>
            <input
              id="edit-name"
              type="text"
              required
              value={editedActivity.name}
              onChange={(e) => setEditedActivity({ ...editedActivity, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            />
          </div>

          <div>
            <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
              Informations complémentaires <span className="text-gray-500">(optionnel)</span>
            </label>
            <textarea
              id="edit-description"
              value={editedActivity.description}
              onChange={(e) => setEditedActivity({ ...editedActivity, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              rows={3}
              placeholder="Nom du professeur / Description du cours, etc..."
            />
          </div>

          <div>
            <label htmlFor="edit-requirements" className="block text-sm font-medium text-gray-700">Besoins Spécifiques</label>
            <input
              id="edit-requirements"
              type="text"
              value={requirementsInput}
              onChange={handleRequirementsChange}
              placeholder="Ex: Projecteur, Sono, Tapis (séparés par des virgules)"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Sauvegarder
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditActivityModal;