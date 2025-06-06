const express = require('express');
const router = express.Router();
const { storeReturnTo } = require('../middleware');
const passport = require('passport');
const User = require('../models/user'); // Adjust the path as needed
const users = require('../controllers/user');



router.route('/register')
  .get(users.renderRegister)
  .post(users.register);

router.route('/login')
  .get(users.renderLogin)
  .post(storeReturnTo, passport.authenticate('local', {
    failureFlash: true,
    failureRedirect: '/login',
    failureMessage: true
  }), users.login);



// Handle logout
router.get('/logout', users.logout);

module.exports = router;




 





// Render registration form
// router.get('/register', users.renderRegister);

// Handle user registration
// router.post('/register', users.register);

// Render login form
// router.get('/login', users.renderLogin);

// Handle login
// router.post('/login', storeReturnTo,
//   passport.authenticate('local', {
//     failureFlash: true,
//     failureRedirect: '/login',
//     failureMessage: true
//   }),
//   users.login
// );

