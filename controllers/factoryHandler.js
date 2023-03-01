const AppError = require('../utils/appError');
const APIFeature = require('../utils/apiFeatures');
const catchAsyncError = require('../utils/catchASync');
// const Tour = require('./../models/tourModel');

exports.deleteOne = Model =>
  catchAsyncError(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('could not find this ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: `${doc.name} deleted`
    });
  });

exports.updateOne = Model =>
  catchAsyncError(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!doc) {
      return next(new AppError('could not find this ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });

exports.createOne = Model =>
  catchAsyncError(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).send({
      status: 'success',
      data: {
        doc
      }
    });
  });

exports.getOne = (Model, popOption) =>
  catchAsyncError(async (req, res, next) => {
    let query = Model.findById(req.params.id);
    if (popOption) query = query.populate(popOption);
    const doc = await query;

    if (!doc) {
      return next(new AppError('could not find this ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc
      }
    });
  });

exports.getAll = Model =>
  catchAsyncError(async (req, res, next) => {
    let filter = {};
    if (req.params.tourId) filter = { tour: req.params.tourId };
    const feature = new APIFeature(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .pagination();

    // const docs = await feature.query.explain();
    const docs = await feature.query;
    res.status(200).json({
      status: 'success',
      requestedAt: req.requestTime,
      results: docs.length,
      tours: [...docs]
    });
  });
