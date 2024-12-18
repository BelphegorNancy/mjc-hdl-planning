import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFExportProps {
  calendarRef: React.RefObject<HTMLDivElement>;
}

export const exportToPDF = async (calendarRef: React.RefObject<HTMLDivElement>) => {
  if (!calendarRef.current) return;

  try {
    // Créer le canvas
    const canvas = await html2canvas(calendarRef.current, {
      scale: 2,
      useCORS: true,
      logging: false,
      allowTaint: true,
      scrollX: 0,
      scrollY: 0
    });

    // Calculer les dimensions pour A3 paysage
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a3'
    });

    // Dimensions de la page A3 en mm
    const pageWidth = 420;
    const pageHeight = 297;

    // Calculer le ratio pour ajuster l'image à la page
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);

    // Calculer les dimensions finales
    const finalWidth = imgWidth * ratio;
    const finalHeight = imgHeight * ratio;

    // Centrer l'image sur la page
    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;

    // Convertir le canvas en image
    const imgData = canvas.toDataURL('image/jpeg', 1.0);

    // Ajouter l'image au PDF
    pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);

    // Sauvegarder le PDF
    pdf.save('calendar.pdf');
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error);
  }
};
