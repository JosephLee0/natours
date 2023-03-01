// const AppError = require('../utils/appError');
const Review = require('./../models/reviewModel');
// const catchAsync = require('./../utils/catchASync');
const factory = require('./factoryHandler');

exports.getAllReviews = factory.getAll(Review);
// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   let filter = {};
//   if (req.params.tourId) filter = { tour: req.params.tourId };
//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'success',
//     result: reviews.length,
//     data: {
//       reviews
//     }
//   });
// });

exports.setTourUserIds = (req, res, next) => {
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = factory.createOne(Review);

// exports.createReview = catchAsync(async (req, res) => {
//   const review = await Review.create(req.body);

//   res.status(200).json({
//     status: 'success',
//     data: {
//       review
//     }
//   });
// });

exports.getReview = factory.getOne(Review);

// exports.getReview = catchAsync(async (req, res, next) => {
//   console.log(req.params.id);
//   const review = await Review.findById(req.params.id);

//   if (!review) {
//     return next(new AppError('this review does not exist', 400));
//   }

//   res.status(200).json({
//     status: 'success',
//     result: review
//   });
// });

exports.deleteReview = factory.deleteOne(Review);

exports.updateReview = factory.updateOne(Review);
