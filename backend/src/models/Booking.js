const mongoose = require('mongoose');
// Application-defined list of permitted booking statuses.
const BOOKING_STATUSES = ['confirmed', 'completed', 'cancelled'];

const bookingSchema = new mongoose.Schema(
  {
      // References the Gig document associated with this booking.
    gig: { type: mongoose.Schema.Types.ObjectId, ref: 'Gig', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    gigTitleSnapshot: { type: String, required: true },
    amount: { type: Number, required: true, min: 1 },
    status: { type: String, enum: BOOKING_STATUSES, default: 'confirmed' },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);
// The toJSON transform is configured using the Mongoose Schema API.
bookingSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = { Booking, BOOKING_STATUSES };


//REFERENCES
//Mongoose (n.d.) 'Schemas'. Mongoose documentation.
//Available at: https://mongoosejs.com/docs/guide.html
//(Accessed: 12 October 2026).
 
//OpenJS Foundation (n.d.) 'Modules: CommonJS modules'.
//Node.js documentation.
//Available at: https://nodejs.org/api/modules.html
//(Accessed: 12 October 2026).
 
