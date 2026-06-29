import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'superaccesssecretkey';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'superrefreshsecretkey';

export interface TokenPayload {
  userId: string;
  role: string;
}

export const signAccessToken = (userId: string, role: string): string => {
  return jwt.sign({ userId, role }, ACCESS_SECRET, { expiresIn: '15m' });
};

export const signRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '7d' });
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, REFRESH_SECRET) as { userId: string };
};
