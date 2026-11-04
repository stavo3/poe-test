
const xss = require('xss');
// Imports the xss library, which sanitizes HTML to help prevent
// cross-site scripting (XSS) attacks (XSS, n.d.).

const mongoSanitize = require('express-mongo-sanitize');
// Imports middleware that helps protect against MongoDB query
// selector injection by sanitizing untrusted request data
// (Express Mongo Sanitize, n.d.).

// Recursively strip HTML/script content from every string in an object
// (req.body, req.query, req.params) to prevent stored/reflected XSS.
// Output encoding and appropriate sanitization are important XSS
// prevention techniques (OWASP Foundation, n.d.-a).
function stripXss(value) {
  if (typeof value === 'string') {
    // Uses an empty allowlist to remove HTML tags, while also stripping
    // ignored tags and script element bodies (XSS, n.d.).
    return xss(value, { whiteList: {}, stripIgnoreTag: true, stripIgnoreTagBody: ['script'] });
  }
  if (Array.isArray(value)) {
    // Recursively sanitizes each array element.
    return value.map(stripXss);
  }
  if (value && typeof value === 'object') {
    // Recursively sanitizes each property in an object.
    const result = {};
    for (const key of Object.keys(value)) {
      result[key] = stripXss(value[key]);
    }
    return result;
  }
  // Leaves non-string primitive values unchanged.
  return value;
}

function xssSanitizer(req, res, next) {
  // Sanitizes the request body when it is present.
  if (req.body) req.body = stripXss(req.body);

  // Sanitizes route parameters when they are present.
  if (req.params) req.params = stripXss(req.params);

  if (req.query) {
    // req.query is a getter-only property in newer Express versions; mutate keys in place instead of reassigning.
    // Query parameters are untrusted input and should be validated and
    // handled carefully (Express, n.d.).
    const cleaned = stripXss(req.query);
    for (const key of Object.keys(req.query)) delete req.query[key];
    Object.assign(req.query, cleaned);
  }
  // Passes control to the next middleware or route handler
  // (Express, n.d.).
  next();
}

// Removes or replaces any request keys containing '$' or '.' to help
// prevent MongoDB operator injection (e.g. { "email": { "$gt": "" } }).
// MongoDB query selector injection is a recognised NoSQL security risk
// (OWASP Foundation, n.d.-b).
const noSqlSanitizer = mongoSanitize({
  replaceWith: '_',
  // Replaces prohibited characters with underscores instead of removing
  // them entirely (Express Mongo Sanitize, n.d.).
});

module.exports = { xssSanitizer, noSqlSanitizer };
// Exports the middleware so it can be registered in the Express
// application (Node.js, n.d.).

//References
//Express (n.d.) Using middleware.Available at: https://expressjs.com/en/guide/using-middleware.html (Accessed: 12 October 2026).
//Express Mongo Sanitize (n.d.) express-mongo-sanitize. Available at: https://github.com/fiznool/express-mongo-sanitize (Accessed: 7 October 2026).
//Node.js (n.d.) Modules: CommonJS modules. Available at: https://nodejs.org/api/modules.html (Accessed: 7 October 2026).
//OWASP Foundation (n.d.-a) Cross Site Scripting Prevention Cheat Sheet. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html (Accessed: 7 October 2026).
//OWASP Foundation (n.d.-b) NoSQL Security Cheat Sheet. Available at: https://cheatsheetseries.owasp.org/cheatsheets/NoSQL_Security_Cheat_Sheet.html (Accessed: 12 October 2026).
//XSS (n.d.) xss: Sanitize untrusted HTML. Available at: https://github.com/leizongmin/js-xss (Accessed: 7 October 2026).
