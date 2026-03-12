import bcrypt from 'bcryptjs';
import { db } from './db';
import { cookies } from 'next/headers';
import { User } from '@prisma/client';

const SALT_ROUNDS = 10;
const SESSION_COOKIE_NAME = 'sonar_session';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function createSession(userId: string): Promise<string> {
  const sessionToken = generateToken();
  // Store session in database or as a secure cookie
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  // For simplicity, we'll use a JWT-like approach with cookies
  const sessionData = JSON.stringify({
    userId,
    token: sessionToken,
    expiresAt: expiresAt.toISOString()
  });
  
  return sessionData;
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  try {
    const sessionData = JSON.parse(sessionCookie.value);
    
    // Check expiration
    if (new Date(sessionData.expiresAt) < new Date()) {
      return null;
    }
    
    const user = await db.user.findUnique({
      where: { id: sessionData.userId }
    });
    
    if (!user || !user.isActive) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(sessionData: string) {
  const cookieStore = await cookies();
  const parsed = JSON.parse(sessionData);
  
  cookieStore.set(SESSION_COOKIE_NAME, sessionData, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(parsed.expiresAt)
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createUser(email: string, password: string, name: string, role: string = 'USER'): Promise<User> {
  const hashedPassword = await hashPassword(password);
  
  return db.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role
    }
  });
}

export async function authenticateUser(email: string, password: string): Promise<SessionUser | null> {
  const user = await db.user.findUnique({
    where: { email }
  });
  
  if (!user || !user.isActive) {
    return null;
  }
  
  const isValid = await verifyPassword(password, user.password);
  
  if (!isValid) {
    return null;
  }
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
}

export function isAdmin(user: SessionUser | null): boolean {
  return user?.role === 'ADMIN';
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Error('Não autorizado');
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== 'ADMIN') {
    throw new Error('Acesso restrito a administradores');
  }
  return session;
}
