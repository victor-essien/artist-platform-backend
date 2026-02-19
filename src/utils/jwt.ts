import jwt from 'jsonwebtoken'
import { IAdminPayload } from '../types'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (payload: object) => {
  return jwt.sign(payload, JWT_SECRET,  {
    expiresIn: '7d',
  });
};

export const verifyToken = (token: string): IAdminPayload => {
  return jwt.verify(token, JWT_SECRET) as IAdminPayload;
};

export const decodeToken = (token: string): IAdminPayload | null => {
  try {
    return jwt.decode(token) as IAdminPayload;
  } catch (error) {
    return null;
  }
};