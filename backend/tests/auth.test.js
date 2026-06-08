import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const JWT_SECRET = 'test-secret';

function generateToken(userId, firebaseUid) {
  return jwt.sign({ userId, firebaseUid }, JWT_SECRET, { expiresIn: '7d' });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

describe('JWT Auth Utilities', () => {
  it('generateToken returns a non-empty string', () => {
    const token = generateToken('user123', 'firebase456');
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  it('verifyToken decodes a valid token correctly', () => {
    const token = generateToken('user123', 'firebase456');
    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded.userId).toBe('user123');
    expect(decoded.firebaseUid).toBe('firebase456');
  });

  it('verifyToken returns null for invalid token', () => {
    const result = verifyToken('invalid.token.here');
    expect(result).toBeNull();
  });

  it('verifyToken returns null for tampered token', () => {
    const token = generateToken('user123', 'firebase456');
    const tampered = token.slice(0, -5) + 'XXXXX';
    expect(verifyToken(tampered)).toBeNull();
  });

  it('token contains userId and firebaseUid in payload', () => {
    const token = generateToken('abc', 'xyz');
    const decoded = verifyToken(token);
    expect(decoded).toMatchObject({ userId: 'abc', firebaseUid: 'xyz' });
  });
});
