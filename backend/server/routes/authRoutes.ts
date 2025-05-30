
import { Router } from 'express';
import { register, login, registerAdmin } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);


router.post('/register-admin', protect, authorize(['SuperAdmin']), registerAdmin);

export default router;