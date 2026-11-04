const { Gig } = require('../models/Gig');
const logger = require('../utils/logger');
// Imports the project's Mongoose Gig model and custom logging utility.


// POST /api/gigs (freelancer only)
async function createGig(req, res, next) {
  try {
    const { title, description, category, price, deliveryDays } = req.body;
    // Extracts gig information from the incoming HTTP request.

    const gig = await Gig.create({
      title,
      description,
      category,
      price,
      deliveryDays,
      freelancer: req.user.id,
    });
    // Creates a new gig document using the Mongoose model
    // (Mongoose, n.d.-a).

    logger.info('Gig created', {
      gigId: gig._id.toString(),
      freelancerId: req.user.id
    });
    // Logs the successful creation of a gig using the project's
    // custom logging utility.

    return res.status(201).json({
      message: 'Gig created.',
      gig
    });
    // Returns HTTP 201 to indicate successful resource creation.
  } catch (err) {
    next(err);
    // Passes errors to Express error-handling middleware
    // (Express, n.d.).
  }
}


// GET /api/gigs (public browse, supports ?category=&search=)
async function getGigs(req, res, next) {
  try {
    const { category, search } = req.query;
    // Extracts optional category and search filters from the URL query.

    const filter = { isActive: true };
    // Initially limits results to active gigs.

    if (category) filter.category = category;
    // Adds a category condition when a category is supplied.

    if (search) {
      // Escapes regular-expression metacharacters to reduce the risk
      // of regex injection and unintended regular-expression behaviour
      // from user-supplied search input (MDN Web Docs, n.d.-a).

      const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      filter.title = {
        $regex: escaped,
        $options: 'i'
      };
      // Performs a case-insensitive title search using a MongoDB
      // regular-expression query (MongoDB, n.d.).
    }

    const gigs = await Gig.find(filter)
      .populate('freelancer', 'email role')
      .sort({ createdAt: -1 });
    // Retrieves matching gig documents, populates selected fields
    // from the referenced freelancer document and sorts newest first
    // (Mongoose, n.d.-a; Mongoose, n.d.-b).

    return res.status(200).json({ gigs });
    // Returns the matching gigs as a JSON response.
  } catch (err) {
    next(err);
    // Forwards errors to Express error-handling middleware
    // (Express, n.d.).
  }
}


// GET /api/gigs/mine (freelancer only — their own gigs, active or not)
async function getMyGigs(req, res, next) {
  try {
    const gigs = await Gig.find({
      freelancer: req.user.id
    }).sort({ createdAt: -1 });
    // Retrieves gigs associated with the authenticated freelancer
    // and sorts them by creation date (Mongoose, n.d.-a).

    return res.status(200).json({ gigs });
  } catch (err) {
    next(err);
    // Forwards errors to Express error-handling middleware
    // (Express, n.d.).
  }
}


// GET /api/gigs/:id (public)
async function getGigById(req, res, next) {
  try {
    const gig = await Gig.findById(req.params.id)
      .populate('freelancer', 'email role');
    // Finds a gig by its MongoDB document identifier and populates
    // selected freelancer fields (Mongoose, n.d.-a; Mongoose, n.d.-b).

    if (!gig) {
      return res.status(404).json({
        message: 'Gig not found.'
      });
      // Returns HTTP 404 if the requested gig does not exist.
    }

    return res.status(200).json({ gig });
  } catch (err) {
    next(err);
    // Passes errors to Express error-handling middleware
    // (Express, n.d.).
  }
}


// PUT /api/gigs/:id (owning freelancer only)
async function updateGig(req, res, next) {
  try {
    const gig = await Gig.findById(req.params.id);
    // Retrieves the gig to be updated (Mongoose, n.d.-a).

    if (!gig) {
      return res.status(404).json({
        message: 'Gig not found.'
      });
    }

    if (gig.freelancer.toString() !== req.user.id) {
      // Checks whether the authenticated user owns the gig.
      // Server-side access control should be enforced for every
      // operation involving a protected resource (OWASP Foundation, n.d.).

      logger.warn('Blocked attempt to update a gig owned by another user', {
        gigId: gig._id.toString(),
        requesterId: req.user.id,
      });

      return res.status(403).json({
        message: 'You can only modify your own gigs.'
      });
      // Returns HTTP 403 when the user lacks permission.
    }

    const allowedFields = [
      'title',
      'description',
      'category',
      'price',
      'deliveryDays',
      'isActive'
    ];
    // Defines which properties the client is permitted to update.
    // Allowlisting fields helps prevent unintended property changes
    // (OWASP Foundation, n.d.).

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) gig[field] = req.body[field];
    }
    // Updates only allowlisted fields supplied in the request.

    await gig.save();
    // Persists the changes to MongoDB through Mongoose
    // (Mongoose, n.d.-a).

    return res.status(200).json({
      message: 'Gig updated.',
      gig
    });
  } catch (err) {
    next(err);
    // Passes errors to Express error-handling middleware
    // (Express, n.d.).
  }
}


// DELETE /api/gigs/:id (owning freelancer only)
async function deleteGig(req, res, next) {
  try {
    const gig = await Gig.findById(req.params.id);
    // Retrieves the gig selected for deletion (Mongoose, n.d.-a).

    if (!gig) {
      return res.status(404).json({
        message: 'Gig not found.'
      });
    }

    if (gig.freelancer.toString() !== req.user.id) {
      // Verifies resource ownership before allowing deletion
      // (OWASP Foundation, n.d.).

      logger.warn('Blocked attempt to delete a gig owned by another user', {
        gigId: gig._id.toString(),
        requesterId: req.user.id,
      });

      return res.status(403).json({
        message: 'You can only delete your own gigs.'
      });
      // Denies deletion when the authenticated user is not the owner.
    }

    await gig.deleteOne();
    // Deletes the gig document using Mongoose
    // (Mongoose, n.d.-a).

    return res.status(200).json({
      message: 'Gig deleted.'
    });
  } catch (err) {
    next(err);
    // Forwards errors to Express error-handling middleware
    // (Express, n.d.).
  }
}

module.exports = {
  createGig,
  getGigs,
  getMyGigs,
  getGigById,
  updateGig,
  deleteGig
};
// Exports the controller functions for use by the application's
// route modules (Node.js, n.d.).


//References
//Express (n.d.) Error handling. Available at: https://expressjs.com/en/guide/error-handling.html (Accessed: 7 October 2026).
//MDN Web Docs (n.d.-a) Regular expressions. Available at: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions (Accessed: 7 October 2026).
//Mongoose (n.d.-a) Queries. Available at: https://mongoosejs.com/docs/queries.html (Accessed: 7 October 2026).
//Mongoose (n.d.-b) Populate. Available at: https://mongoosejs.com/docs/populate.html (Accessed: 7 October 2026).
//MongoDB (n.d.) $regex. Available at: https://www.mongodb.com/docs/manual/reference/operator/query/regex/ (Accessed: 7 October 2026).
//Node.js (n.d.) Modules: CommonJS modules. Available at: https://nodejs.org/api/modules.html (Accessed: 7 October 2026).
//OWASP Foundation (n.d.) Authorization Cheat Sheet. Available at: https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html (Accessed: 7 October 2026).
