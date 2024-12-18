import React from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { ViewMode } from '../types';

interface CalendarPDFProps {
  viewMode: ViewMode;
  selectedDate: Date;
  calendarRef: React.RefObject<HTMLDivElement>;
}

const CalendarPDF: React.FC<CalendarPDFProps> = ({ viewMode, selectedDate, calendarRef }) => {
  const generatePDF = async () => {
    if (!calendarRef.current) return;

    try {
      // Sauvegarder l'état original
      const calendar = calendarRef.current;
      const originalHtml = calendar.innerHTML;

      // Appliquer des styles temporaires pour la capture
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        [data-calendar-container] .room-name {
          font-size: 1.5rem !important;
          font-weight: 700 !important;
        }
        [data-calendar-container] .reservation-title {
          font-size: 1.3rem !important;
          font-weight: 600 !important;
        }
        [data-calendar-container] .reservation-time {
          font-size: 1.2rem !important;
        }
        [data-calendar-container] .activity-name {
          font-size: 1.3rem !important;
          font-weight: 600 !important;
        }
      `;
      document.head.appendChild(styleSheet);

      // Ajouter des classes pour le PDF
      calendar.querySelectorAll('[data-room-name]').forEach(el => {
        el.classList.add('room-name');
      });
      calendar.querySelectorAll('[data-reservation-title]').forEach(el => {
        el.classList.add('reservation-title');
      });
      calendar.querySelectorAll('[data-reservation-time]').forEach(el => {
        el.classList.add('reservation-time');
      });
      calendar.querySelectorAll('[data-activity-name]').forEach(el => {
        el.classList.add('activity-name');
      });

      // Capturer avec une résolution plus élevée
      const canvas = await html2canvas(calendar, {
        scale: 3,
        useCORS: true,
        logging: false,
        windowWidth: 3508,
        windowHeight: 2480,
        onclone: (clonedDoc) => {
          const clonedCalendar = clonedDoc.querySelector('[data-calendar-container]');
          if (clonedCalendar) {
            // Appliquer les mêmes styles au clone
            clonedDoc.head.appendChild(styleSheet.cloneNode(true));
          }
        }
      });

      // Restaurer l'état original
      calendar.innerHTML = originalHtml;
      styleSheet.remove();

      // Configuration du PDF
      const pageSize = viewMode === 'week' ? [420, 297] : [297, 210];
      const orientation = viewMode === 'week' ? 'landscape' : 'portrait';

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: pageSize,
        compress: true
      });

      // Dimensions et positionnement
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      const imgRatio = canvas.width / canvas.height;
      let imgWidth = pageWidth;
      let imgHeight = pageWidth / imgRatio;
      
      if (imgHeight > pageHeight) {
        imgHeight = pageHeight;
        imgWidth = pageHeight * imgRatio;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;

      // Ajouter l'image avec qualité maximale
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 1.0),
        'JPEG',
        x,
        y,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );

      // Sauvegarder
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const fileName = viewMode === 'week' 
        ? `planning-semaine-${dateStr}.pdf`
        : `planning-${dateStr}.pdf`;

      pdf.save(fileName);
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
    }
  };

  return (
    <button
      onClick={generatePDF}
      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
    >
      Télécharger le PDF
    </button>
  );
};

export default CalendarPDF;
