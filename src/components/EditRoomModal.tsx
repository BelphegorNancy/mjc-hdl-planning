import React from 'react';
import { X } from 'lucide-react';
import { Room } from '../types';

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  onSave: (updatedRoom: Room) => void;
}

const EditRoomModal: React.FC<EditRoomModalProps> = ({ isOpen, onClose, room, onSave }) => {
  const [editedRoom, setEditedRoom] = React.useState(room);
  const [equipmentInput, setEquipmentInput] = React.useState(room.equipment.join(', '));

  React.useEffect(() => {
    setEditedRoom(room);
    setEquipmentInput(room.equipment.join(', '));
  }, [room]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(editedRoom);
    onClose();
  };

  const handleEquipmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEquipmentInput(e.target.value);
    setEditedRoom({
      ...editedRoom,
      equipment: e.target.value.split(',').map(item => item.trim()).filter(Boolean)
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Modifier la Salle</h2>
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
              value={editedRoom.name}
              onChange={(e) => setEditedRoom({ ...editedRoom, name: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            />
          </div>

          <div>
            <label htmlFor="edit-capacity" className="block text-sm font-medium text-gray-700">Capacité</label>
            <input
              id="edit-capacity"
              type="number"
              required
              min="1"
              value={editedRoom.capacity}
              onChange={(e) => setEditedRoom({ ...editedRoom, capacity: parseInt(e.target.value) || 0 })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            />
          </div>

          <div>
            <label htmlFor="edit-currentOccupancy" className="block text-sm font-medium text-gray-700">
              Nombre de personnes en présence <span className="text-gray-500">(optionnel)</span>
            </label>
            <input
              id="edit-currentOccupancy"
              type="number"
              min="0"
              value={editedRoom.currentOccupancy || ''}
              onChange={(e) => setEditedRoom({ 
                ...editedRoom, 
                currentOccupancy: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              placeholder="Nombre de personnes actuellement présentes"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
            />
          </div>

          <div>
            <label htmlFor="edit-color" className="block text-sm font-medium text-gray-700">Couleur</label>
            <input
              id="edit-color"
              type="color"
              required
              value={editedRoom.color}
              onChange={(e) => setEditedRoom({ ...editedRoom, color: e.target.value })}
              className="mt-1 block w-20 h-10"
            />
          </div>

          <div>
            <label htmlFor="edit-equipment" className="block text-sm font-medium text-gray-700">Équipements</label>
            <input
              id="edit-equipment"
              type="text"
              value={equipmentInput}
              onChange={handleEquipmentChange}
              placeholder="Ex: Projecteur, Tables, Chaises (séparés par des virgules)"
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

export default EditRoomModal;