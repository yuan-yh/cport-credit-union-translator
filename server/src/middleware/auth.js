// =============================================================================
// AUTHENTICATION MIDDLEWARE
// =============================================================================

const jwt = require('jsonwebtoken');
const { ApiError } = require('./errorHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'cport-dev-secret-change-in-production';

/**
 * Verify JWT token and attach user to request
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'Authentication required', 'NO_TOKEN');
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      branchId: decoded.branchId,
      firstName: decoded.firstName,
    };
    
    next();
  } catch (error) {
    if (error instanceof ApiError) {
      next(error);
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'Token expired', 'TOKEN_EXPIRED'));
    } else if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'Invalid token', 'INVALID_TOKEN'));
    } else {
      next(error);
    }
  }
}

/**
 * Check if user has required role(s)
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required', 'NO_USER'));
    }
    
    // Role hierarchy - higher roles can access lower role endpoints
    const roleHierarchy = {
      ADMIN: 100,
      MANAGER: 80,
      CONSULTOR: 60,
      TELLER: 40,
      GREETER: 20,
    };
    
    const userLevel = roleHierarchy[req.user.role] || 0;
    const hasAccess = allowedRoles.some(role => {
      // Exact match
      if (req.user.role === role) return true;
      // Higher level access
      return userLevel >= roleHierarchy[role];
    });
    
    if (!hasAccess) {
      return next(new ApiError(403, 'Insufficient permissions', 'FORBIDDEN'));
    }
    
    next();
  };
}

module.exports = { authenticate, requireRole, JWT_SECRET };
