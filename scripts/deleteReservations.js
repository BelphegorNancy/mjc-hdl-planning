const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllReservations() {
  try {
    // Supprimer toutes les réservations
    const deleteReservations = await prisma.reservation.deleteMany({});
    
    console.log(`${deleteReservations.count} réservations ont été supprimées avec succès.`);
  } catch (error) {
    console.error('Erreur lors de la suppression des réservations:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllReservations();
