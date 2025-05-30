
import { Router } from 'express';
import {
    getMyPatientProfileDetails,
    upsertMyPatientProfileDetails
} from '../controllers/patientProfileController';
import {
    getMyDoctorProfileDetails,
    upsertMyDoctorProfileDetails
} from '../controllers/doctorProfileController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

console.log('[ProfileRoutes] Файл profileRoutes.ts ЗАГРУЖЕН, роутер создан.');


router.route('/patient')
  .get(protect, authorize(['Patient', 'Admin', 'SuperAdmin']), getMyPatientProfileDetails)
  .post(protect, authorize(['Patient']), upsertMyPatientProfileDetails)
  .put(protect, authorize(['Patient']), upsertMyPatientProfileDetails);


router.route('/doctor')
  .get(protect, authorize(['Doctor', 'Admin', 'SuperAdmin']), getMyDoctorProfileDetails)
  .post(protect, authorize(['Doctor']), upsertMyDoctorProfileDetails)
  .put(protect, authorize(['Doctor']), upsertMyDoctorProfileDetails);

export default router;