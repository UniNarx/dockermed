
import { Router } from 'express';
import { createDoctor, getMyDoctorProfile, getAllDoctors, getDoctorById, updateDoctorById, deleteDoctorById, updateMyDoctorProfileData, updateMyDoctorAvatar, updateDoctorAvatarById } from '../controllers/doctorController'; 
import { getAssignedPatientsForDoctor } from '../controllers/patientDoctorController';
import { getDoctorAppointments, getDoctorAvailability } from '../controllers/appointmentController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

console.log('[DoctorRoutes] Файл doctorRoutes.ts ЗАГРУЖЕН, роутер создан.');

router.post('/', protect, authorize(['Admin', 'SuperAdmin']), createDoctor);
router.get('/', getAllDoctors);
router.route('/me')
    .get(protect, authorize(['Doctor']), getMyDoctorProfile)
    .put(protect, authorize(['Doctor']), updateMyDoctorProfileData);router.put('/me/avatar', protect, authorize(['Doctor']), updateMyDoctorAvatar);



router.get('/:doctorId/availability', getDoctorAvailability);

router.get('/:doctorId/appointments', protect, authorize(['Doctor', 'Admin', 'SuperAdmin']), getDoctorAppointments);
router.get('/:id', getDoctorById);
router.get(
    '/:doctorId/patients',
    protect,
    authorize(['Doctor', 'Admin', 'SuperAdmin']),
    getAssignedPatientsForDoctor
);
router.put('/:id/avatar', protect, authorize(['Admin', 'SuperAdmin']), updateDoctorAvatarById);

router.route('/:id')
    .get(getDoctorById)
    .put(protect, authorize(['Admin', 'SuperAdmin']), updateDoctorById)
    .delete(protect, authorize(['Admin', 'SuperAdmin']), deleteDoctorById);

export default router;