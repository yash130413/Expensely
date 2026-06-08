import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

/**
 * Verify JWT token from Authorization header
 * Returns userId from token or null if invalid
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error.message);
    return null;
  }
}

/**
 * Middleware to verify JWT token from Authorization header
 * Sets req.userId if token is valid
 */
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization header' });
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  const decoded = verifyToken(token);
  
  if (!decoded) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.userId = decoded.userId;
  req.firebaseUid = decoded.firebaseUid;
  next();
}

/**
 * Generate JWT token for user
 */
export function generateToken(userId, firebaseUid) {
  return jwt.sign(
    { userId, firebaseUid },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}
