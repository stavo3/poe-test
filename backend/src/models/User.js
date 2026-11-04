const mongoose = require('mongoose');

const ALLOWED_ROLES = ['client', 'freelancer', 'admin'];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never returned by default queries
    },
    role: {
      type: String,
      enum: ALLOWED_ROLES,
      required: true,
    },
    // Account-lockout state (security feature: brute-force protection).
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
  },
  { timestamps: true }
);

// Strip sensitive fields whenever a document is serialised (e.g. res.json(user))
userSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.passwordHash;
    delete ret.failedLoginAttempts;
    delete ret.lockUntil;
    delete ret.__v;
    return ret;
  },
});

userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

module.exports = { User, ALLOWED_ROLES };

// REFERENCES
// Mongoose (n.d.) ‘Schemas’. Mongoose documentation. Available at: https://mongoosejs.com/docs/guide.html (Accessed: 5 October 2026).
// Mongoose (n.d.) ‘SchemaTypes’. Mongoose documentation. Available at: https://mongoosejs.com/docs/schematypes.html (Accessed: 5 October 2026).
// Mongoose (n.d.) ‘Models’. Mongoose documentation. Available at: https://mongoosejs.com/docs/models.html (Accessed: 5 October 2026).
// Mongoose (n.d.) ‘Schema Indexes’. Mongoose documentation. Available at: https://mongoosejs.com/docs/guide.html#indexes (Accessed: 5 October 2026).
// OpenJS Foundation (n.d.) ‘Modules: CommonJS modules’. Node.js documentation. Available at: https://nodejs.org/api/modules.html (Accessed: 5 October 2026).
