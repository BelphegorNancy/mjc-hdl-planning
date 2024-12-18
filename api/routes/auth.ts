import express from 'express';
import { User } from '../../src/types';
import jwt from 'jsonwebtoken';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'votre_secret_jwt_securise';

// Utilisateur par défaut (comme défini dans types.ts)
const SUPER_ADMIN: User = {
  id: 'super-admin',
  username: 'BKNL',
  password: '@@Ght2cd@@',
  email: 'admin@example.com',
  role: 'admin',
  createdAt: new Date('2024-01-01')
};

// Route de login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt:', { username });

  // Vérifier les identifiants
  if (username.toLowerCase() === SUPER_ADMIN.username.toLowerCase() && password === SUPER_ADMIN.password) {
    // Générer un token JWT
    const token = jwt.sign(
      { 
        id: SUPER_ADMIN.id,
        username: SUPER_ADMIN.username,
        role: SUPER_ADMIN.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Ne pas renvoyer le mot de passe dans la réponse
    const { password: _, ...userWithoutPassword } = SUPER_ADMIN;
    const userWithToken = {
      ...userWithoutPassword,
      token
    };

    console.log('Login successful:', { username, token: token.substring(0, 20) + '...' });
    
    res.json({
      success: true,
      user: userWithToken
    });
  } else {
    console.log('Login failed:', { username });
    res.status(401).json({
      success: false,
      message: 'Identifiants invalides'
    });
  }
});

// Route de vérification de session
router.get('/check-session', (req, res) => {
  // Pour l'instant, on renvoie juste un succès
  // Plus tard, on pourra ajouter une vérification de token JWT
  res.json({ success: true });
});

export const authRoutes = router;
