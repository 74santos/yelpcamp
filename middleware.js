const { campgroundSchema, reviewSchema } = require("./schemas.js");
const Campground = require('./models/campground');
const Review = require('./models/review');

module.exports.isLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.returnTo = req.originalUrl;
    req.flash('error', 'You must be signed in first!');
    return res.redirect('/login');
  }
  next();
}

module.exports.storeReturnTo = (req, res, next) => {
  if (req.session.returnTo) {
    res.locals.returnTo = req.session.returnTo;
  }
  next();
}


module.exports.validateCampground = (req, res, next) => {
  const { error } = campgroundSchema.validate(req.body);
if (error) {
  const msg = error.details.map(el => el.message).join(', ');
  const err = new Error(msg);
  err.statusCode = 400;
  return next(err); // ✅ Express 5 will send this to your global handler
}
  next();
}


module.exports.validateReview = (req, res, next) => {
  const { error } = reviewSchema.validate(req.body);
  if (error) {
    const msg = error.details.map(el => el.message).join(', ');
    const err = new Error(msg);
    err.statusCode = 400;
    return next(err);
  } else {
    next();
  }
}

module.exports.isAuthor = async (req, res, next) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);

  if (!campground) {
    req.flash('error', 'Campground not found.');
    return res.redirect('/campgrounds');
  }
  if (!campground.author || !req.user || !campground.author.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to do that!');
    return res.redirect(`/campgrounds/${id}`);
  }
  next();
};


module.exports.isReviewAuthor = async (req, res, next) => {
  const { id, reviewId } = req.params;
  const review = await Review.findById(reviewId);

  if (!review) {   // If review doesn't exist, error:
    req.flash('error', 'Review not found.');
    return res.redirect('/campgrounds');
  }

  // Check if the current user is the author of the review:
  if (!review.author.equals(req.user._id)) {
    req.flash('error', 'You do not have permission to do that!');
    return res.redirect(`/campgrounds/${id}`);
  }

  next();
};
