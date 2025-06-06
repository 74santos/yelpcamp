const Campground = require("../models/campground");
const Review = require('../models/review');

module.exports.createReview = async (req, res) => {
  const campground = await Campground.findById(req.params.id);
  const review = new Review({...req.body.review, author: req.user._id});

  campground.reviews.push(review);
  await review.save();
  await campground.save();
  req.flash('success', 'Created new review!');
  res.redirect(`/campgrounds/${campground._id}`);
}



module.exports.deleteReview = async (req, res) => {
  const { id, reviewId } = req.params;

  console.log('Review Deletion Request:', { id, reviewId }); // 👈 Add this

  const campground = await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });

  if (!campground) {
    console.log('Campground not found with id:', id); // 👈 Check this
    req.flash('error', 'Campground not found');
    return res.redirect('/campgrounds');
  }

  await Review.findByIdAndDelete(reviewId);
  req.flash('success', 'Successfully deleted review');
  res.redirect(`/campgrounds/${id}`);
};


// module.exports.deleteReview = async (req, res) => {
//   const { id, reviewId } = req.params;
//   await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
//   await Review.findByIdAndDelete(reviewId);
//   req.flash('success', 'Successfully deleted review');
//   res.redirect(`/campgrounds/${id}`);
// }


