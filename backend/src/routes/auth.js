const express = require('express');
const {register, login, getMe } = require('../controllers/authController');
const { userAuth } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', userAuth, getMe);

module.exports = router;