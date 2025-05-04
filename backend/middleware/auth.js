/**
 * Simple authentication middleware for testing purposes
 * This provides basic protection for the testing environment
 */

// Test users with access codes
const TEST_USERS = {
  'tester1': 'access123',
  'tester2': 'access456',
  'admin': 'adminaccess789'
};

/**
 * Middleware to check if the request has valid authentication
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = (req, res, next) => {
  // Skip auth in development mode
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // Get auth header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication required' 
    });
  }

  // Check if it's Basic auth
  if (!authHeader.startsWith('Basic ')) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid authentication method' 
    });
  }

  // Decode the Base64 credentials
  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, password] = credentials.split(':');

    // Check if credentials are valid
    if (TEST_USERS[username] && TEST_USERS[username] === password) {
      // Add user info to request for potential use in routes
      req.user = { username };
      return next();
    }

    return res.status(401).json({ 
      success: false,
      message: 'Invalid credentials' 
    });
  } catch (error) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication failed' 
    });
  }
};

module.exports = { authenticate };
