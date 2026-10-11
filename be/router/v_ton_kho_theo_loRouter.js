const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/v_ton_kho_theo_loController');

router.get('/', ctrl.getAll);
router.get('/thuoc/:idThuoc', ctrl.getByThuocId);

module.exports = router;
