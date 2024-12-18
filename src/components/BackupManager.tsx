import React from 'react';
import { useStore } from '../store/StoreProvider';

const BackupManager: React.FC = () => {
  const { exportData, importData } = useStore();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mjc-hdl-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = e.target?.result as string;
        importData(jsonData);
        alert('Données importées avec succès');
      } catch (error) {
        alert('Erreur lors de l\'import : ' + error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-2">Sauvegarde des données</h2>
        <button
          onClick={handleExport}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Exporter les données
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-2">Restauration des données</h2>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImport}
          accept=".json"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Importer des données
        </button>
      </div>
    </div>
  );
};

export default BackupManager;
