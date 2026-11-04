const mongoose = require('mongoose');
// Application-defined categories for classifying freelance gigs.
const CATEGORIES = [
  'design',
  'development',
  'writing',
  'marketing',
  'video',
  'music',
  'business',
  'other',
];

const gigSchema = new mongoose.Schema(
  {
    // Defines the Gig document structure using the Mongoose Schema API.
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, enum: CATEGORIES, default: 'other' },
    price: { type: Number, required: true, min: 1 },
    deliveryDays: { type: Number, required: true, min: 1, max: 90 },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
// Customises JSON output by removing Mongoose's internal version key.
gigSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Gig = mongoose.model('Gig', gigSchema);

module.exports = { Gig, CATEGORIES };

//REFERENCES
//Mongoose (n.d.) 'Schemas'. Mongoose documentation.
//Available at: https://mongoosejs.com/docs/guide.html
//(Accessed: 10 October 2026).

//OpenJS Foundation (n.d.) 'Modules: CommonJS modules'.
//Node.js documentation.
//Available at: https://nodejs.org/api/modules.html
//(Accessed: 10 October 2026).

