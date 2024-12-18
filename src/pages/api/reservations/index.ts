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

  try {
    switch (req.method) {
      case 'GET':
        const reservations = await prisma.reservation.findMany({
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
        return res.status(200).json(reservations);

      case 'POST':
        const newReservation = await prisma.reservation.create({
          data: {
            ...req.body,
            createdBy: session.user.id
          },
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
        return res.status(201).json(newReservation);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Reservation API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
