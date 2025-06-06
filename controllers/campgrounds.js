const Campground = require("../models/campground");
const Review = require('../models/review');
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder =mbxGeocoding({accessToken: mapBoxToken});

const { cloudinary } = require('../cloudinary');

module.exports.index = async (req, res) => {
  const campgrounds = await Campground.find({}); // Find all campgrounds / array
  res.render("campgrounds/index", { campgrounds });
}

module.exports.renderNewForm = (req, res) => {
  res.render("campgrounds/new");
}


module.exports.renderEditForm = async (req, res) => {
  
  const campground = await Campground.findById(req.params.id); // Find campground by id

  if (!campground) {
    return req.flash('error', 'Cannot find that campground!'), res.redirect('/campgrounds');
  }
  res.render('campgrounds/edit', { campground });
}


module.exports.createCampground = async (req, res, next) => {
  try {
    if (req.files.length > 5) {
      req.flash('error', 'You can only upload up to 5 images.');
      return res.redirect('/campgrounds/new');
    }
    
   const geoData = await geocoder.forwardGeocode({
      query: req.body.campground.location,
      limit: 1
    }).send()

    const campground = new Campground(req.body.campground); // Create a new campground
    campground.geometry = geoData.body.features[0].geometry; // Add the geometry property
    campground.images = req.files.map(f => ({ url: f.path, filename: f.filename })); // Add the images property
    campground.author = req.user._id;
    await campground.save();

    console.log(campground);

    req.flash('success', 'Successfully created a new campground!');
    res.redirect(`/campgrounds/${campground._id}`);
  } catch (e) {
    next(e);
  }
};



module.exports.showCampground = async (req, res) => {
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = 5;

  const campground = await Campground.findById(id).populate('author');

  if (!campground) {
    req.flash('error', 'Cannot find that campground!');
    return res.redirect('/campgrounds');
  }

  const totalReviews = campground.reviews.length;
  const totalPages = Math.ceil(totalReviews / limit);
  const slicedReviewIds = campground.reviews.slice((page - 1) * limit, page * limit);

  const paginatedReviews = await Review.find({ _id: { $in: slicedReviewIds } }).populate('author');

  res.render('campgrounds/show', {
    campground,
    reviews: paginatedReviews,
    currentPage: page,
    totalPages
  });
};



module.exports.updateCampground = async (req, res, next) => {
  const { id } = req.params;
  console.log(req.body);
  const campground = await Campground.findById(id);

  if (!campground) {
    req.flash('error', 'Campground not found');
    return res.redirect('/campgrounds');
  }

  // Update text fields
  const campgroundData = req.body.campground;
  campground.set(campgroundData);

  // Add new uploaded images
  const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
  campground.images.push(...imgs);

  // Handle image deletion
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages) {
      console.log(filename);
      // Delete from Cloudinary
      await cloudinary.uploader.destroy(filename);
      // Remove from MongoDB
      campground.images = campground.images.filter(img => img.filename !== filename);
    }
  }

  // Enforce max image limit
  if (campground.images.length > 5) {
    req.flash('error', 'You can only have up to 5 images total.');
    return res.redirect(`/campgrounds/${id}/edit`);
  }

  await campground.save();
  req.flash('success', 'Successfully updated campground!');
  res.redirect(`/campgrounds/${campground._id}`);
};



module.exports.deleteCampground = async (req, res) => {
  const { id } = req.params;
  await Campground.findByIdAndDelete(id);
  req.flash('success', 'Successfully deleted campground');
  res.redirect('/campgrounds');
}



// module.exports.updateCampground = async (req, res) => {
//   const { id } = req.params;
//   const campground = await Campground.findByIdAndUpdate(id, { ...req.body.campground });// Fine updating the basic campground fields (like title, location, description, etc.)
//   const imgs = req.files.map(f => ({url: f.path, filename: f.filename}))
//   campground.images.push(...imgs);

//   if (req.body.deleteImages) {
//     for (let filename of req.body.deleteImages) {
//       await cloudinary.uploader.destroy(filename);
//     }
//     await campground.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
//   }
  
//   req.flash('success', 'Successfully updated campground!');
//   res.redirect(`/campgrounds/${campground._id}`);
// }