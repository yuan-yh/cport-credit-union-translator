// =============================================================================
// REQUEST LOGGER MIDDLEWARE
// =============================================================================

/**
 * Simple request logger
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  
  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    // Color code based on status
    let statusColor = '\x1b[32m'; // green
    if (status >= 400) statusColor = '\x1b[33m'; // yellow
    if (status >= 500) statusColor = '\x1b[31m'; // red
    
    const reset = '\x1b[0m';
    const dim = '\x1b[2m';
    
    console.log(
      `${dim}${new Date().toISOString()}${reset} ` +
      `${statusColor}${status}${reset} ` +
      `${req.method} ${req.originalUrl} ` +
      `${dim}${duration}ms${reset}`
    );
  });
  
  next();
}

module.exports = { requestLogger };
