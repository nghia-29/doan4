const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/v_thuoc_sap_het_hanController');
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
module.exports = router;
