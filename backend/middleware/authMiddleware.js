// Simple authentication middleware for demo purposes
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // For development/demo purposes, we'll use a simple token check
    // In production, you would verify a proper JWT token
    if (token === 'admin-token-123' || token === 'demo-admin-token') {
      // Set user info for authenticated requests
      req.user = { 
        id: 'admin', 
        role: 'admin',
        isAuthenticated: true 
      };
      next();
    } else {
      return res.status(403).json({ error: 'Invalid token.' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = authMiddleware;
