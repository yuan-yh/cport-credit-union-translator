// =============================================================================
// AUTHENTICATION ROUTES
// =============================================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { queries } = require('../database');
const { ApiError } = require('../middleware/errorHandler');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Token configuration
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

// =============================================================================
// HELPERS
// =============================================================================

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      branchId: user.branch_id,
      firstName: user.first_name,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

function generateRefreshToken() {
  return uuidv4() + '-' + uuidv4();
}

function formatUser(dbUser) {
  return {
    id: dbUser.id,
    username: dbUser.username,
    email: dbUser.email,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    role: dbUser.role,
    branchId: dbUser.branch_id,
    isActive: Boolean(dbUser.is_active),
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
}

// =============================================================================
// LOGIN
// =============================================================================

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required', 'VALIDATION_ERROR');
    }

    // Find user
    const user = queries.users.findByEmail.get(email.toLowerCase());
    
    if (!user) {
      throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      throw new ApiError(403, 'Account is disabled', 'ACCOUNT_DISABLED');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    
    // Store refresh token hash
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    
    queries.tokens.create.run(
      uuidv4(),
      user.id,
      refreshTokenHash,
      expiresAt.toISOString()
    );

    // Log audit
    queries.audit.create.run(
      uuidv4(),
      user.id,
      null,
      'LOGIN',
      'auth',
      JSON.stringify({ method: 'password' }),
      req.ip
    );

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: formatUser(user),
        accessToken,
        refreshToken, // Also return in body for mobile clients
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// REFRESH TOKEN
// =============================================================================

router.post('/refresh', async (req, res, next) => {
  try {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    
    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token required', 'NO_REFRESH_TOKEN');
    }

    // Find all non-revoked tokens for comparison
    const allTokens = queries.tokens.findByHash.all ? 
      // If using all(), iterate through all
      queries.tokens.findByHash.all(refreshToken) :
      // Otherwise, we need to check manually
      [];

    // We need to check the hash against all stored tokens
    // This is a simplified approach - in production, you'd use a different strategy
    const storedTokens = queries.db?.prepare(`
      SELECT * FROM refresh_tokens WHERE revoked = 0 AND expires_at > datetime('now')
    `).all() || [];

    let validToken = null;
    for (const stored of storedTokens) {
      const isValid = await bcrypt.compare(refreshToken, stored.token_hash);
      if (isValid) {
        validToken = stored;
        break;
      }
    }

    // Fallback: try direct lookup (for development simplicity)
    if (!validToken) {
      // For development, allow direct token comparison
      const { db } = require('../database');
      const tokens = db.prepare(`
        SELECT * FROM refresh_tokens WHERE revoked = 0 AND expires_at > datetime('now')
      `).all();

      for (const stored of tokens) {
        try {
          const isValid = await bcrypt.compare(refreshToken, stored.token_hash);
          if (isValid) {
            validToken = stored;
            break;
          }
        } catch {
          // Continue checking
        }
      }
    }

    if (!validToken) {
      throw new ApiError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    // Check if expired
    if (new Date(validToken.expires_at) < new Date()) {
      queries.tokens.revoke.run(validToken.id);
      throw new ApiError(401, 'Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
    }

    // Get user
    const user = queries.users.findById.get(validToken.user_id);
    
    if (!user || !user.is_active) {
      throw new ApiError(403, 'User account unavailable', 'ACCOUNT_UNAVAILABLE');
    }

    // Revoke old token (rotation)
    queries.tokens.revoke.run(validToken.id);

    // Generate new tokens
    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken();
    
    // Store new refresh token
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    
    queries.tokens.create.run(
      uuidv4(),
      user.id,
      refreshTokenHash,
      expiresAt.toISOString()
    );

    // Set new refresh token cookie
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: formatUser(user),
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// LOGOUT
// =============================================================================

router.post('/logout', authenticate, async (req, res, next) => {
  try {
    // Revoke all refresh tokens for user
    queries.tokens.revokeAllForUser.run(req.user.id);

    // Log audit
    queries.audit.create.run(
      uuidv4(),
      req.user.id,
      null,
      'LOGOUT',
      'auth',
      null,
      req.ip
    );

    // Clear cookie
    res.clearCookie('refreshToken');

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (error) {
    next(error);
  }
});

// =============================================================================
// GET CURRENT USER
// =============================================================================

router.get('/me', authenticate, (req, res, next) => {
  try {
    const user = queries.users.findById.get(req.user.id);
    
    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: formatUser(user),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
