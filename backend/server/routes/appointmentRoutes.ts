
import { Router } from 'express';
import {
    createAppointment,
    getPatientAppointments,
    cancelAppointment,
    getDoctorAppointments,
    getAppointmentById,
    updateAppointmentStatus,
    getAllAppointmentsForAdmin,
    deleteAppointmentById,
    updateAppointmentById
} from '../controllers/appointmentController';
import { protect } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';

const router = Router();

console.log('[AppointmentRoutes] Файл appointmentRoutes.ts ЗАГРУЖЕН, роутер создан.');


router.post('/', protect, createAppointment);



router.get('/my', protect, authorize(['Patient', 'Admin', 'SuperAdmin']), getPatientAppointments); 



router.get('/doctor/me', protect, authorize(['Doctor', 'Admin', 'SuperAdmin']), getDoctorAppointments);




router.patch('/:id/status', protect, authorize(['Doctor', 'Admin', 'SuperAdmin']), updateAppointmentStatus);



router.patch('/:id/cancel', protect, cancelAppointment); 
router.get('/all-for-admin', protect, authorize(['Admin', 'SuperAdmin']), getAllAppointmentsForAdmin);
router.route('/:id')
    .get(protect, getAppointmentById)
    .put(protect, authorize(['Admin', 'SuperAdmin']), updateAppointmentById)
    .delete(protect, authorize(['Admin', 'SuperAdmin']), deleteAppointmentById);




router.get('/:id', protect, getAppointmentById); 

export default router;