import React from 'react';
import { Plus, Trash2, Edit } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Room } from '../types';
import EditRoomModal from '../components/EditRoomModal';

const RoomManagement = () => {
  const { rooms, addRoom, updateRoom, removeRoom } = useStore();
  const currentUser = useStore((state) => state.currentUser);
  const [isAdding, setIsAdding] = React.useState(false);
  const [editingRoom, setEditingRoom] = React.useState<Room | null>(null);
  const [newRoom, setNewRoom] = React.useState<{
    name: string;
    capacity: string;
    currentOccupancy: string;
    color: string;
    equipment: string[];
  }>({
    name: '',
    capacity: '',
    currentOccupancy: '',
    color: '#ff0000',
    equipment: [],
  });
  const [equipmentInput, setEquipmentInput] = React.useState('');

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
    const capacity = parseInt(newRoom.capacity);
    const currentOccupancy = newRoom.currentOccupancy ? parseInt(newRoom.currentOccupancy) : undefined;
    
    if (newRoom.name && !isNaN(capacity)) {
      addRoom({
        id: Date.now().toString(),
        name: newRoom.name,
        capacity: capacity,
        currentOccupancy: currentOccupancy,
        color: newRoom.color || '#ff0000',
        equipment: newRoom.equipment || [],
        createdBy: currentUser.id,
        createdAt: new Date(),
      });
      setIsAdding(false);
      setNewRoom({ 
        name: '', 
        capacity: '', 
        currentOccupancy: '',
        color: '#ff0000', 
        equipment: [] 
      });
      setEquipmentInput('');
    }
  };

  const handleEquipmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEquipmentInput(e.target.value);
    setNewRoom({
      ...newRoom,
      equipment: e.target.value.split(',').map(item => item.trim()).filter(Boolean)
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Salles</h1>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Ajouter une Salle</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold mb-4">Nouvelle Salle</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nom</label>
              <input
                id="name"
                type="text"
                required
                value={newRoom.name}
                onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">Capacité</label>
              <input
                id="capacity"
                type="number"
                required
                min="1"
                value={newRoom.capacity}
                onChange={(e) => setNewRoom({ ...newRoom, capacity: e.target.value })}
                placeholder="Nombre de personnes"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div>
              <label htmlFor="currentOccupancy" className="block text-sm font-medium text-gray-700">
                Nombre de personnes en présence <span className="text-gray-500">(optionnel)</span>
              </label>
              <input
                id="currentOccupancy"
                type="number"
                min="0"
                value={newRoom.currentOccupancy}
                onChange={(e) => setNewRoom({ ...newRoom, currentOccupancy: e.target.value })}
                placeholder="Nombre de personnes actuellement présentes"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div>
              <label htmlFor="color" className="block text-sm font-medium text-gray-700">Couleur</label>
              <input
                id="color"
                type="color"
                required
                value={newRoom.color}
                onChange={(e) => setNewRoom({ ...newRoom, color: e.target.value })}
                className="mt-1 block w-20 h-10"
              />
            </div>
            <div>
              <label htmlFor="equipment" className="block text-sm font-medium text-gray-700">Équipements</label>
              <input
                id="equipment"
                type="text"
                value={equipmentInput}
                onChange={handleEquipmentChange}
                placeholder="Ex: Projecteur, Tables, Chaises (séparés par des virgules)"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Sauvegarder
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="border border-gray-300 px-4 py-2 rounded-md hover:bg-gray-50"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6">
        {rooms.map((room) => (
          <div
            key={room.id}
            className="bg-white p-6 rounded-lg shadow-md flex justify-between items-center"
            style={{ borderLeft: `4px solid ${room.color}` }}
          >
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{room.name}</h3>
              <p className="text-gray-500">Capacité: {room.capacity} personnes</p>
              {room.currentOccupancy !== undefined && (
                <p className="text-gray-500">Présence actuelle: {room.currentOccupancy} personnes</p>
              )}
              {room.equipment.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Équipements: {room.equipment.join(', ')}
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setEditingRoom(room)}
                className="text-gray-400 hover:text-blue-600"
              >
                <Edit className="h-5 w-5" />
              </button>
              <button
                onClick={() => removeRoom(room.id)}
                className="text-gray-400 hover:text-red-600"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingRoom && (
        <EditRoomModal
          isOpen={!!editingRoom}
          onClose={() => setEditingRoom(null)}
          room={editingRoom}
          onSave={(updatedRoom) => {
            updateRoom(editingRoom.id, updatedRoom);
            setEditingRoom(null);
          }}
        />
      )}
    </div>
  );
}

export default RoomManagement;