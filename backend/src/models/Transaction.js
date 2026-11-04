const mongoose = require('mongoose');

// A transaction is a simulated payment confirmation record created whenever
// a booking is made. No real payment processor is involved (Part 2 spec:
// "does not require real payment integration; instead, a simulated
// confirmation is sufficient").
const transactionSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    type: { type: String, enum: ['booking_payment'], default: 'booking_payment' },
    status: { type: String, enum: ['completed'], default: 'completed' },
    reference: { type: String, required: true, unique: true }, // simulated payment reference
  },
  { timestamps: true }
);

transactionSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = { Transaction };

// REFERENCES
// Mongoose (n.d.) ‘Schemas’. Mongoose documentation. Available at: https://mongoosejs.com/docs/guide.html (Accessed: 9 October 2026).
// Mongoose (n.d.) ‘SchemaTypes’. Mongoose documentation. Available at: https://mongoosejs.com/docs/schematypes.html (Accessed: 9 October 2026).
// Mongoose (n.d.) ‘Models’. Mongoose documentation. Available at: https://mongoosejs.com/docs/models.html (Accessed: 9 October 2026).
// OpenJS Foundation (n.d.) ‘Modules: CommonJS modules’. Node.js documentation. Available at: https://nodejs.org/api/modules.html (Accessed: 9 October 2026).
