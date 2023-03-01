const { promisify } = require('util');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const User = require('./../models/userModel');
const catchASync = require('./../utils/catchASync');
const Email = require('./../utils/email');

const signToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, res, statusCode) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  user.password = undefined;

  res.status(statusCode).json({
    token,
    status: 'success',
    data: {
      user
    }
  });
};

exports.signup = catchASync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  console.log(url);

  await new Email(newUser, url).sendWelcome();

  createSendToken(newUser, res, 201);
});

exports.login = catchASync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('invalid Username or password', 401));
  }
  createSendToken(user, res, 200);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'looooggggeed out', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({ status: 'success' });
};

exports.protect = catchASync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError('You are not logged in, Please login to get access', 401)
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('this user with the ID no longer exist', 401));
  }

  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed Password', 401));
  }
  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      const token = req.cookies.jwt;

      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET
      );

      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }

      if (currentUser.changePasswordAfter(decoded.iat)) {
        return next();
      }
      res.locals.user = currentUser;

      return next();
    } catch (error) {
      return next();
    }
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('User is not allowed to perform this option', 403)
      );
    }
    next();
  };
};

exports.forgetPassword = async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('This user does not exist', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  // const message = `Forget your password? Submit a Patch request with a new password and passwordConfirm to: ${resetURL}.
  // \nIf you didnt request for new passwprd please ignore`;

  try {
    //   await Email({
    //     email: user.email,
    //     subject: 'Your Password reset token, Valid fot 10 mins',
    //     message
    //   });

    await new Email(user, resetURL).sendForgetPassword();

    res.status(200).json({
      status: 'success',
      message: 'token sent to mail'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiresIn = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'Unable to send reset link to mail, Please try again later',
        500
      )
    );
  }
};

exports.resetPassword = catchASync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresIn: { $gt: Date.now() }
  });

  console.log(new Date(Date.now()));

  if (!user) {
    return next(new AppError('Token is invalid or has expired'), 400);
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresIn = undefined;

  await user.save();

  createSendToken(user, res, 201);
});

exports.updatePassword = catchASync(async (req, res, next) => {
  const { id, currentPassword, newPassword, newPasswordConfirm } = req.body;

  const user = await User.findOne(id).select('+password');

  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('Invalid current Password', 400));
  }

  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  createSendToken(user, res, 200);
});
