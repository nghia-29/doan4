const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chi_tiet_xuat_loController');

router.get('/', ctrl.getAll);
router.get('/don-dat/:idDonDat', ctrl.getByDonDatId);

module.exports = router;
