// Populates the database with demo accounts and gigs so the Postman
// collection / demo video have predictable data to work with.
// Usage: npm run seed
require('dotenv').config();
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { User } = require('../models/User');
const { Gig } = require('../models/Gig');
const { Booking } = require('../models/Booking');
const { Transaction } = require('../models/Transaction');
const logger = require('./logger');
const { taxYearOf, taxYearRange } = require('./tax');

// Demo-account password: taken from SEED_PASSWORD (set it in .env / the CI secrets) so no
// credential is stored in the repository. If it is not set, a strong random one is
// generated and printed once to the console.
function demoPassword() {
  if (process.env.SEED_PASSWORD) return { value: process.env.SEED_PASSWORD, generated: false };
  return { value: `Aa1!${crypto.randomBytes(12).toString('hex')}`, generated: true };
}

// Fake but realistic income for the demo freelancer: a few paid bookings in every month of the
// current SARS tax year so the dashboard shows brackets, a rebate and real tax.
async function seedIncomeHistory({ client, freelancer, gigs }) {
  const now = new Date();
  const { start } = taxYearRange(taxYearOf(now));
  const pattern = [
    { gig: 0, day: 3 },
    { gig: 0, day: 9 },
    { gig: 1, day: 14 },
    { gig: 1, day: 21 },
    { gig: 2, day: 26 },
  ];

  const stamps = [];
  for (let m = 0; m < 12; m += 1) {
    const monthStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 2 + m, 1));
    for (const { gig, day } of pattern) {
      const when = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth(), day, 10, 0, 0));
      if (when < now) stamps.push({ gig: gigs[gig], when });
    }
  }

  for (const { gig, when } of stamps) {
    const booking = await Booking.create({
      gig: gig._id,
      client: client._id,
      freelancer: freelancer._id,
      gigTitleSnapshot: gig.title,
      amount: gig.price,
      status: 'completed',
    });
    const transaction = await Transaction.create({
      booking: booking._id,
      client: client._id,
      freelancer: freelancer._id,
      amount: gig.price,
      status: 'completed',
      reference: `SIM-${when.getTime()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    });
    // Back-date the records (timestamps are managed by Mongoose, so set them on the raw collection).
    await Booking.collection.updateOne({ _id: booking._id }, { $set: { createdAt: when, updatedAt: when } });
    await Transaction.collection.updateOne({ _id: transaction._id }, { $set: { createdAt: when, updatedAt: when } });
  }
  return stamps.length;
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  logger.info('Connected for seeding');

  await Promise.all([
    User.deleteMany({}),
    Gig.deleteMany({}),
    Booking.deleteMany({}),
    Transaction.deleteMany({}),
  ]);

  const password = demoPassword();
  const passwordHash = await bcrypt.hash(password.value, 12);

  const client = await User.create({ email: 'client@example.com', passwordHash, role: 'client' });
  const freelancer = await User.create({ email: 'freelancer@example.com', passwordHash, role: 'freelancer' });
  const otherFreelancer = await User.create({ email: 'freelancer2@example.com', passwordHash, role: 'freelancer' });
  await User.create({ email: 'admin@example.com', passwordHash, role: 'admin' });

  // Prices are in South African rand (ZAR).
  const gigs = await Gig.create([
    {
      title: 'I will create a complete brand identity package',
      description: 'Logo, colour palette, typography and a brand guide delivered as editable files.',
      category: 'design',
      price: 12000,
      deliveryDays: 10,
      freelancer: freelancer._id,
    },
    {
      title: 'I will build a responsive React landing page',
      description: 'A fast, mobile-friendly landing page built with React and deployed for you.',
      category: 'development',
      price: 6500,
      deliveryDays: 7,
      freelancer: freelancer._id,
    },
    {
      title: 'I will design a modern logo for your startup',
      description: 'Professional, minimal logo design with 3 concepts and unlimited revisions.',
      category: 'design',
      price: 1500,
      deliveryDays: 3,
      freelancer: freelancer._id,
    },
    {
      title: 'I will write SEO-optimised blog content',
      description: 'Well-researched, engaging blog articles optimised for search engines.',
      category: 'writing',
      price: 800,
      deliveryDays: 2,
      freelancer: otherFreelancer._id,
    },
  ]);

  const history = await seedIncomeHistory({ client, freelancer, gigs });

  logger.info('Seed complete', {
    users: { client: client.email, freelancer: freelancer.email },
    demoIncomeTransactions: history,
  });
  // eslint-disable-next-line no-console
  console.log(
    password.generated
      ? `Demo accounts (client@, freelancer@, freelancer2@, admin@example.com) use this generated password: ${password.value}`
      : 'Demo accounts (client@, freelancer@, freelancer2@, admin@example.com) use the password from SEED_PASSWORD.'
  );

  await mongoose.disconnect();
}

seed().catch((err) => {
  logger.error('Seeding failed', { message: err.message });
  process.exit(1);
});

// REFERENCES
// npm, Inc. (n.d.) ‘dotenv’. npm. Available at: https://www.npmjs.com/package/dotenv (Accessed: 12 October 2026).
// bcrypt (n.d.) ‘bcrypt’. npm. Available at: https://www.npmjs.com/package/bcrypt (Accessed: 12 October 2026).
// Mongoose (n.d.) ‘Connecting to MongoDB’. Mongoose documentation. Available at: https://mongoosejs.com/docs/connections.html (Accessed: 12 October 2026).
// Mongoose (n.d.) ‘Model API’. Mongoose documentation. Available at: https://mongoosejs.com/docs/api/model.html (Accessed: 12 October 2026).
// Mongoose (n.d.) ‘Mongoose Queries: deleteMany()’. Mongoose documentation. Available at: https://mongoosejs.com/docs/api/model.html#Model.deleteMany() (Accessed: 12 October 2026).
// Node.js (n.d.) ‘Process’. Node.js documentation. Available at: https://nodejs.org/api/process.html (Accessed: 12 October 2026).
