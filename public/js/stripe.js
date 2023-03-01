/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51MfFK5HzJit7gKqaYybR7r4625GkhZNDYU2REo9yo434F1HJTCyHw5opn9VCdjMDTxy4zs2OfrAv82RlXCol4ycv00piUkPimp'
);

export const bookTour = async tourId => {
  try {
    // 1) Get checkout session from API
    const session = await axios(
      `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
    );
    console.log(session);

    // 2) Create checkout form + chanre credit card
    // await stripe.redirectToCheckout({
    //   sessionId: session.data.session.id
    // });
    window.location.replace(session.data.session.url);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
