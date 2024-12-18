#!/bin/bash

# Arrêter et supprimer les anciens conteneurs
echo "Arrêt des conteneurs existants..."
docker-compose down

# Construire les nouvelles images
echo "Construction des nouvelles images..."
docker-compose build

# Démarrer les nouveaux conteneurs
echo "Démarrage des nouveaux conteneurs..."
docker-compose up -d

# Exécuter les migrations Prisma
echo "Exécution des migrations Prisma..."
docker-compose exec api npx prisma migrate deploy

echo "Déploiement terminé !"
