const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chi_tiet_phieu_nhapController');
router.get('/', ctrl.getAll);
router.get('/:parentId/:itemId', ctrl.getByKeys);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
module.exports = router;
