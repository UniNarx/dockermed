
import { Router } from "express";
import {
  upsertMyPatientProfile,
  getMyPatientProfile,
  getAllPatients,
  deletePatientById,
  getPatientById,
} from "../controllers/patientController";
import {
  assignDoctorToPatient,
  unassignDoctorFromPatient,
  getAssignedDoctorsForPatient,
} from "../controllers/patientDoctorController";
import { getPatientAppointments } from "../controllers/appointmentController";
import { getMedicalRecordsByPatient } from "../controllers/medicalRecordController";
import { protect } from "../middleware/authMiddleware";
import { authorize } from "../middleware/roleMiddleware";

const router = Router();

console.log("[PatientRoutes] Файл patientRoutes.ts ЗАГРУЖЕН, роутер создан.");


router
  .route("/me")
  .get(
    protect,
    authorize(["Patient", "Admin", "SuperAdmin"]),
    getMyPatientProfile
  )
  .put(
    protect,
    authorize(["Patient", "Admin", "SuperAdmin"]),
    upsertMyPatientProfile
  );


router
  .route("/")
  .get(protect, authorize(["Admin", "SuperAdmin"]), getAllPatients);


router.post(
  "/:patientId/assign-doctor/:doctorId",
  protect,
  authorize(["Admin", "SuperAdmin"]),
  assignDoctorToPatient
);

router.delete(
  "/:patientId/assign-doctor/:doctorId",
  protect,
  authorize(["Admin", "SuperAdmin"]),
  unassignDoctorFromPatient
);


router.get(
  "/:patientId/appointments",
  protect,
  authorize(["Patient", "Doctor", "Admin", "SuperAdmin"]),
  getPatientAppointments
);

router.get(
  "/:patientId/medical-records",
  protect,
  authorize(["Patient", "Doctor", "Admin", "SuperAdmin"]),
  getMedicalRecordsByPatient
);

router.get(
  "/:patientId/doctors",
  protect,
  authorize(["Patient", "Admin", "SuperAdmin", "Doctor"]),
  getAssignedDoctorsForPatient
);



router
  .route("/:id")
  .get(protect, authorize(["Doctor", "Admin", "SuperAdmin"]), getPatientById)
  .delete(
    protect,
    authorize(["Admin", "SuperAdmin"]),
    deletePatientById
  );

export default router;