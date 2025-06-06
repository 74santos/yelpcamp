const mongoSanitize = require('express-mongo-sanitize');

// Helper to deeply clone objects/arrays
function deepCopy(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(deepCopy);
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, deepCopy(v)])
  );
}

// Middleware for Express 5
module.exports = function sanitizeV5(options = {}) {
  const hasOnSanitize = typeof options.onSanitize === 'function';

  return function (req, _res, next) {
    // Sanitize writable fields
    ['body', 'params', 'headers'].forEach(key => {
      if (req[key]) {
        const clean = mongoSanitize.sanitize(req[key], options);
        req[key] = clean;
        if (hasOnSanitize && mongoSanitize.has(clean, options.allowDots)) {
          options.onSanitize({ req, key });
        }
      }
    });

    // Handle read-only req.query (in Express 5 it's a getter)
    if (req.query) {
      const cleanQuery = mongoSanitize.sanitize(deepCopy(req.query), options);

      // Replace the getter with a sanitized concrete value
      Object.defineProperty(req, 'query', {
        value: cleanQuery,
        writable: false,
        configurable: true,
        enumerable: true
      });

      if (hasOnSanitize && mongoSanitize.has(cleanQuery, options.allowDots)) {
        options.onSanitize({ req, key: 'query' });
      }
    }

    next();
  };
};
