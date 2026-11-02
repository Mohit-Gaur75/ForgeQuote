// server/src/modules/auth/auth.service.js
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { verifyPassword, generateToken, hashToken } from '../../utils/crypto.js';
import { AuthenticationError } from '../../utils/errors.js';

export async function loginUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AuthenticationError('Invalid email or password');
  }

  if (!user.isActive) {
    throw new AuthenticationError('Your account has been deactivated. Please contact an administrator.');
  }

  const isValidPassword = await verifyPassword(user.passwordHash, password);
  if (!isValidPassword) {
    throw new AuthenticationError('Invalid email or password');
  }

  const rawToken = generateToken();
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + env.SESSION_EXPIRY_HOURS);

  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const { passwordHash: _, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    rawToken,
    expiresAt,
  };
}

export async function logoutUser(rawToken) {
  if (!rawToken) return;
  const tokenHash = hashToken(rawToken);
  await prisma.session.deleteMany({
    where: { tokenHash },
  });
}

export async function getCurrentUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new AuthenticationError('User not found');
  }

  return user;
}
