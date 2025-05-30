
import { Router } from 'express';
import {
  createMedicalRecord,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord
} from '../controllers/medicalRecordController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

console.log('[MedicalRecordRoutes] Файл medicalRecordRoutes.ts ЗАГРУЖЕН, роутер создан.');


router.post('/', protect, authorize(['Doctor']), createMedicalRecord);


router.get('/:id', protect, getMedicalRecordById);



router.put('/:id', protect, authorize(['Doctor']), updateMedicalRecord);



router.delete('/:id', protect, authorize(['Doctor', 'Admin', 'SuperAdmin']), deleteMedicalRecord);


export default router;