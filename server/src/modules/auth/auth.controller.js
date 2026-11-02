// server/src/modules/auth/auth.controller.js
import { env } from '../../config/env.js';
import * as authService from './auth.service.js';

export async function login(req, res) {
  const { email, password } = req.body;
  const { user, rawToken, expiresAt } = await authService.loginUser(email, password);

  res.cookie('forgequote_session', rawToken, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    expires: expiresAt,
    path: '/',
  });

  return res.status(200).json({
    success: true,
    data: {
      user,
      token: rawToken, // Provided for API test convenience
    },
    requestId: req.id,
  });
}

export async function logout(req, res) {
  const rawToken = req.cookies?.forgequote_session || req.headers.authorization?.split(' ')[1];
  await authService.logoutUser(rawToken);

  res.clearCookie('forgequote_session', {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
  });

  return res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully' },
    requestId: req.id,
  });
}

export async function me(req, res) {
  const user = await authService.getCurrentUser(req.user.id);
  return res.status(200).json({
    success: true,
    data: { user },
    requestId: req.id,
  });
}
