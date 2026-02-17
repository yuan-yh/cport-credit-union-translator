// =============================================================================
// AUTHENTICATION ROUTES - SIMPLIFIED
// =============================================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { queries, query } = require('../database');
const { ApiError } = require('../middleware/errorHandler');
const { authenticate, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

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
    isActive: Boolean(dbUser.is_active),
    createdAt: dbUser.created_at,
  };
}

// =============================================================================
// LOGIN
// =============================================================================

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required', 'VALIDATION_ERROR');
    }

    // Try to find user by email or username
    let user = await queries.users.findByEmail.get(email.toLowerCase());
    if (!user) {
      user = await queries.users.findByUsername.get(email);
    }
    
    if (!user) {
      throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      throw new ApiError(403, 'Account is disabled', 'ACCOUNT_DISABLED');
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    
    await queries.tokens.create.run(
      uuidv4(),
      user.id,
      refreshTokenHash,
      expiresAt.toISOString()
    );

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
        refreshToken,
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
    const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    
    if (!refreshToken) {
      throw new ApiError(401, 'Refresh token required', 'NO_REFRESH_TOKEN');
    }

    // Get all non-revoked, non-expired tokens
    const tokens = await query(
      `SELECT * FROM refresh_tokens WHERE revoked = false AND expires_at > NOW()`
    ).catch(() => 
      // Fallback for SQLite syntax
      query(`SELECT * FROM refresh_tokens WHERE revoked = 0 AND expires_at > datetime('now')`)
    );

    let validToken = null;
    for (const stored of tokens) {
      const isValid = await bcrypt.compare(refreshToken, stored.token_hash);
      if (isValid) {
        validToken = stored;
        break;
      }
    }

    if (!validToken) {
      throw new ApiError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    if (new Date(validToken.expires_at) < new Date()) {
      await queries.tokens.revoke.run(validToken.id);
      throw new ApiError(401, 'Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
    }

    const user = await queries.users.findById.get(validToken.user_id);
    if (!user || !user.is_active) {
      throw new ApiError(403, 'User account unavailable', 'ACCOUNT_UNAVAILABLE');
    }

    await queries.tokens.revoke.run(validToken.id);

    const accessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken();
    
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
    
    await queries.tokens.create.run(
      uuidv4(),
      user.id,
      refreshTokenHash,
      expiresAt.toISOString()
    );

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
    await queries.tokens.revokeAllForUser.run(req.user.id);
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

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await queries.users.findById.get(req.user.id);
    
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
