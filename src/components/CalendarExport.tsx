import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import Button from './Button';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import html2canvas from 'html2canvas';

const CalendarExport = () => {
  const { rooms, reservations, currentDate } = useStore();

  const handleExport = async () => {
    try {
      // Trouver l'élément du calendrier
      const element = document.getElementById('calendar-container');
      if (!element) {
        console.error('Élément calendrier non trouvé');
        return;
      }

      // Créer le canvas avec une meilleure qualité
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: true,
        width: element.scrollWidth,
        height: element.scrollHeight,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });

      // Créer un PDF A3 en mode paysage
      const pdf = new jsPDF({
        orientation: 'l',
        unit: 'mm',
        format: 'a3',
        compress: true
      });

      // Définir les marges (5mm)
      const margin = 5;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const usableWidth = pageWidth - (2 * margin);
      const usableHeight = pageHeight - (2 * margin);

      // Convertir le canvas en image
      const imgData = canvas.toDataURL('image/png');

      // Calculer les dimensions pour l'image
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(usableWidth / imgWidth, usableHeight / imgHeight);

      // Centrer l'image
      const imgX = margin + (usableWidth - imgWidth * ratio) / 2;
      const imgY = margin + (usableHeight - imgHeight * ratio) / 2;

      // Ajouter l'image au PDF
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      // Ajouter un titre
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      const title = `Planning - ${format(new Date(currentDate), 'MMMM yyyy', { locale: fr })}`;
      pdf.text(title, pageWidth / 2, margin + 5, { align: 'center' });

      // Sauvegarder le PDF
      pdf.save('planning.pdf');
    } catch (error) {
      console.error('Erreur lors de l\'export PDF:', error);
      alert('Une erreur est survenue lors de l\'export PDF');
    }
  };

  return (
    <Button
      onClick={handleExport}
      variant="outline"
      leftIcon={<CalendarIcon className="h-5 w-5" />}
    >
      PDF
    </Button>
  );
};

export default CalendarExport;