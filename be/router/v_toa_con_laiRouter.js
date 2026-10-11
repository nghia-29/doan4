const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/v_toa_con_laiController');

router.get('/', ctrl.getAll);
router.get('/:idDonThuoc', ctrl.getByDonThuocId);

module.exports = router;
