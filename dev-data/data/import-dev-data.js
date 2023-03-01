const fs = require('fs');
const dotenv = require('dotenv');

const mongoose = require('mongoose');
const Tour = require('../../models/tourModel');
const User = require('../../models/userModel');
const Review = require('../../models/reviewModel');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => console.log('DB successfully connected'));

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

const importData = async (Model, data) => {
  try {
    await Model.create(data, { validateBeforeSave: false });
    console.log('data successfully created');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

const deleteData = async Model => {
  try {
    await Model.deleteMany();
    console.log('data successfully deleted');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData(Tour, tours);
  importData(Review, reviews);
  importData(User, users);
} else if (process.argv[2] === '--delete') {
  deleteData(Tour);
  deleteData(User);
  deleteData(Review);
}
