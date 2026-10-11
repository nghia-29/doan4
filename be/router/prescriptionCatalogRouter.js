const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/prescriptionCatalogController');

router.get('/benh', ctrl.getDiseases);
router.get('/phac_do', ctrl.getRegimens);
router.get('/chi_tiet_phac_do', ctrl.getRegimenItems);

module.exports = router;
