const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/lo_thuocController');

router.get('/', ctrl.getAll);
router.get('/thuoc/:idThuoc', ctrl.getByThuocId);
router.get('/:id', ctrl.getById);

module.exports = router;
