const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/yeu_cau_ke_donController');

router.get('/queue', ctrl.getQueue);
router.get('/', ctrl.getAll);
router.post('/', ctrl.create);
router.get('/:id', ctrl.getById);
router.post('/:id/accept', ctrl.accept);
router.post('/:id/reject', ctrl.reject);
router.post('/:id/prescription', ctrl.prescribe);
router.post('/:id/cancel', ctrl.cancel);

module.exports = router;
