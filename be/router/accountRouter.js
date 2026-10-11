const express = require('express');
const controller = require('../controllers/accountController');

const router = express.Router();
router.get('/me', controller.getMe);
router.patch('/me', controller.updateMe);

module.exports = router;
