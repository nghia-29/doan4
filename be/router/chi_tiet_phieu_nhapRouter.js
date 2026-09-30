const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/chi_tiet_phieu_nhapController');
router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.delete);
module.exports = router;
