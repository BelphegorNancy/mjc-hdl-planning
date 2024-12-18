import { PrismaClient } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Créer le super admin
  const hashedPassword = await hash('@@Ght2cd@@', 10);
  const admin = await prisma.user.create({
    data: {
      id: 'super-admin',
      username: 'BKNL',
      email: 'admin@mjc-hdl.fr',
      password: hashedPassword,
      role: 'superadmin',
      createdAt: new Date('2024-01-01')
    }
  });

  console.log('Created admin user:', admin);

  // Créer les salles
  const rooms = await Promise.all([
    prisma.room.create({
      data: {
        id: 'salle-1',
        name: 'CLASS 1',
        capacity: 20,
        color: '#EF4444',
        equipment: ['Tapis', 'Miroirs', 'Système audio'],
        createdBy: admin.id,
        createdAt: new Date()
      }
    }),
    prisma.room.create({
      data: {
        id: 'salle-2',
        name: 'CLASS 2',
        capacity: 30,
        color: '#3B82F6',
        equipment: ['Tapis', 'Miroirs', 'Système audio', 'Barres'],
        createdBy: admin.id,
        createdAt: new Date()
      }
    }),
    prisma.room.create({
      data: {
        id: 'dojo',
        name: 'DOJO',
        capacity: 30,
        color: '#10B981',
        equipment: ['Tatamis', 'Miroirs', 'Système audio', 'Équipement d\'arts martiaux'],
        createdBy: admin.id,
        createdAt: new Date()
      }
    })
  ]);

  console.log('Created rooms:', rooms);

  // Créer les activités
  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        id: 'activite-1',
        name: 'HIPHOP',
        description: 'Cours de danse Hip-Hop',
        requirements: ['Système audio', 'Miroirs'],
        createdBy: admin.id
      }
    }),
    prisma.activity.create({
      data: {
        id: 'activite-2',
        name: 'JUDO',
        description: 'Cours de Judo',
        requirements: ['Tatamis'],
        createdBy: admin.id
      }
    }),
    prisma.activity.create({
      data: {
        id: 'activite-3',
        name: 'KARATE',
        description: 'Cours de Karaté',
        requirements: ['Tatamis'],
        createdBy: admin.id
      }
    }),
    prisma.activity.create({
      data: {
        id: 'activite-4',
        name: 'YOGA',
        description: 'Cours de Yoga',
        requirements: ['Tapis'],
        createdBy: admin.id
      }
    })
  ]);

  console.log('Created activities:', activities);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
