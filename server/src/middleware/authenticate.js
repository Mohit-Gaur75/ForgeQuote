// server/src/middleware/authenticate.js
import { prisma } from '../config/database.js';
import { hashToken } from '../utils/crypto.js';
import { AuthenticationError } from '../utils/errors.js';

export async function authenticate(req, res, next) {
  try {
    let rawToken = req.cookies?.forgequote_session;

    if (!rawToken && req.headers.authorization?.startsWith('Bearer ')) {
      rawToken = req.headers.authorization.split(' ')[1];
    }

    if (!rawToken) {
      throw new AuthenticationError('Authentication required');
    }

    const tokenHash = hashToken(rawToken);

    const session = await prisma.session.findUnique({
      where: { tokenHash },
      include: {
        user: true,
      },
    });

    if (!session) {
      throw new AuthenticationError('Invalid or expired session');
    }

    if (new Date() > new Date(session.expiresAt)) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      throw new AuthenticationError('Session expired. Please log in again.');
    }

    if (!session.user.isActive) {
      throw new AuthenticationError('Your account has been deactivated');
    }

    // Touch lastActivityAt asynchronously
    prisma.session.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    }).catch(() => {});

    req.user = session.user;
    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
}
