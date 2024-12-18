import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id } = req.query;
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid reservation ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        const reservation = await prisma.reservation.findUnique({
          where: { id },
          include: {
            room: true,
            activity: true,
            creator: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true
              }
            }
          }
        });
        if (!reservation) {
          return res.status(404).json({ error: 'Reservation not found' });
        }
        return res.status(200).json(reservation);

      case 'PATCH':
        const updatedReservation = await prisma.reservation.update({
          where: { id },
          data: req.body,
          include: {
            room: true,
            activity: true,
            creator: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true
              }
            }
          }
        });
        return res.status(200).json(updatedReservation);

      case 'DELETE':
        await prisma.reservation.delete({
          where: { id }
        });
        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Reservation API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
