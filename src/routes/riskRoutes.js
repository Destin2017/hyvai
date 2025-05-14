const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/authMiddleware');
const checkRole = require('../middlewares/roleMiddleware');
const riskController = require('../controllers/riskController');


router.get("/overview", authenticate, checkRole("admin"), riskController.getRiskOverview);
router.get("/installments", authenticate, checkRole("admin"), riskController.getRiskInstallments);
router.post("/escalate", authenticate, checkRole("admin"), riskController.createEscalation);
router.get("/escalate/:installment_id", authenticate, checkRole("admin"), riskController.getEscalationLogs);
router.get("/admins", authenticate, checkRole("admin"), riskController.getEscalatableAdmins);
router.get("/me", authenticate, checkRole("admin"), riskController.getCurrentUserProfile);
router.get("/me", authenticate, checkRole("admin"), riskController.getMe);





module.exports = router;
