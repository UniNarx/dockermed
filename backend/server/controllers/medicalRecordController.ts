
import { Response } from 'express';
import MedicalRecord, { IMedicalRecord } from '../models/MedicalRecord';
import Patient, { IPatient } from '../models/Patient';
import Doctor, { IDoctor } from '../models/Doctor';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Types, isValidObjectId } from 'mongoose';





export const createMedicalRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const doctorUserId = req.user?.id;
  console.log(`[MedicalRecordController] createMedicalRecord hit by user ID: ${doctorUserId}`);

  try {
    const { patientId, visitDate, notes, attachments } = req.body;

    if (!patientId || !visitDate) {
      res.status(400).json({ message: 'ID пациента и дата визита обязательны' });
      return;
    }
    if (!isValidObjectId(patientId)) {
      res.status(400).json({ message: 'Некорректный ID пациента' });
      return;
    }
    const visitDt = new Date(visitDate);
    if (isNaN(visitDt.getTime())) {
        res.status(400).json({ message: 'Некорректный формат даты визита' });
        return;
    }


    const doctorProfile = await Doctor.findOne({ user: doctorUserId });
    if (!doctorProfile) {
      res.status(403).json({ message: 'Только врачи могут создавать медицинские записи (профиль врача не найден)' });
      return;
    }


    const patientExists = await Patient.findById(patientId);
    if (!patientExists) {
      res.status(404).json({ message: 'Пациент не найден' });
      return;
    }

    const medicalRecord = await MedicalRecord.create({
      patient: patientId,
      doctor: doctorProfile._id,
      visitDate: visitDt,
      notes,
      attachments: Array.isArray(attachments) ? attachments : [],
    });

    console.log(`[MedicalRecordController] Medical record created with ID: ${medicalRecord._id} by Doctor ID: ${doctorProfile._id}`);
    res.status(201).json(medicalRecord);

  } catch (error: any) {
    console.error('[MedicalRecordController] Ошибка в createMedicalRecord:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании медицинской записи' });
  }
};




export const getMedicalRecordsByPatient = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const patientProfileId = req.params.patientId;
  const requestingUser = req.user;
  console.log(`[MedicalRecordController] getMedicalRecordsByPatient hit for patient profile ID: ${patientProfileId}. Request by user: ${requestingUser?.username} (Role: ${requestingUser?.roleName})`);

  if (!isValidObjectId(patientProfileId)) {
    res.status(400).json({ message: 'Некорректный ID пациента' });
    return;
  }

  try {

    let canView = false;
    if (['Admin', 'SuperAdmin'].includes(requestingUser?.roleName!)) {
      canView = true;
    } else if (requestingUser?.roleName === 'Patient') {
      const currentPatientProfile = await Patient.findOne({ user: requestingUser.id });
      if (currentPatientProfile && currentPatientProfile._id.equals(patientProfileId)) {
        canView = true;
      }
    } else if (requestingUser?.roleName === 'Doctor') {










       const patientExists = await Patient.findById(patientProfileId);
       if (!patientExists) {
           res.status(404).json({ message: 'Пациент не найден' });
           return;
       }
      canView = true;
    }

    if (!canView) {
      res.status(403).json({ message: 'Недостаточно прав для просмотра этих медицинских записей' });
      return;
    }

    const medicalRecords = await MedicalRecord.find({ patient: patientProfileId })
      .populate('doctor', 'firstName lastName specialty')
      .sort({ visitDate: -1 });

    res.status(200).json(medicalRecords);

  } catch (error: any) {
    console.error(`[MedicalRecordController] Ошибка в getMedicalRecordsByPatient (PatientID: ${patientProfileId}):`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении медицинских записей пациента' });
  }
};




export const getMedicalRecordById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const recordId = req.params.id;
  const requestingUser = req.user;
  console.log(`[MedicalRecordController] getMedicalRecordById hit for Record ID: ${recordId}. Request by user: ${requestingUser?.username}`);

  if (!isValidObjectId(recordId)) {
    res.status(400).json({ message: 'Некорректный ID медицинской записи' });
    return;
  }

  try {
    const medicalRecord = await MedicalRecord.findById(recordId)
      .populate('doctor', 'firstName lastName specialty')
      .populate('patient', 'firstName lastName');

    if (!medicalRecord) {
      res.status(404).json({ message: 'Медицинская запись не найдена' });
      return;
    }


    let canView = false;
    if (['Admin', 'SuperAdmin'].includes(requestingUser?.roleName!)) {
      canView = true;
    } else if (requestingUser?.roleName === 'Patient') {
      const currentPatientProfile = await Patient.findOne({ user: requestingUser.id });
      if (currentPatientProfile && currentPatientProfile._id.equals((medicalRecord.patient as IPatient)._id)) {
        canView = true;
      }
    } else if (requestingUser?.roleName === 'Doctor') {
      const currentDoctorProfile = await Doctor.findOne({ user: requestingUser.id });

      if (currentDoctorProfile && currentDoctorProfile._id.equals((medicalRecord.doctor as IDoctor)._id)) {
        canView = true;
      }

    }
    
    if (!canView) {
      res.status(403).json({ message: 'Недостаточно прав для просмотра этой медицинской записи' });
      return;
    }

    res.status(200).json(medicalRecord);

  } catch (error: any) {
    console.error(`[MedicalRecordController] Ошибка в getMedicalRecordById (ID: ${recordId}):`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении медицинской записи' });
  }
};

export const updateMedicalRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const recordId = req.params.id;
  const doctorUserId = req.user?.id;
  console.log(`[MedicalRecordController] updateMedicalRecord hit for Record ID: ${recordId} by User ID: ${doctorUserId}`);

  if (!isValidObjectId(recordId)) {
    res.status(400).json({ message: 'Некорректный ID медицинской записи' });
    return;
  }

  try {
    const { visitDate, notes, attachments } = req.body;


    const doctorProfile = await Doctor.findOne({ user: doctorUserId });
    if (!doctorProfile) {
      res.status(403).json({ message: 'Только врачи могут обновлять медицинские записи (профиль врача не найден)' });
      return;
    }

    const medicalRecord = await MedicalRecord.findById(recordId);

    if (!medicalRecord) {
      res.status(404).json({ message: 'Медицинская запись не найдена' });
      return;
    }


    if (medicalRecord.doctor.toString() !== doctorProfile._id.toString()) {
      res.status(403).json({ message: 'Вы можете обновлять только свои медицинские записи' });
      return;
    }


    if (visitDate) {
        const visitDt = new Date(visitDate);
        if (isNaN(visitDt.getTime())) {
            res.status(400).json({ message: 'Некорректный формат даты визита' });
            return;
        }
        medicalRecord.visitDate = visitDt;
    }
    if (notes !== undefined) {
      medicalRecord.notes = notes;
    }
    if (attachments !== undefined) {
      medicalRecord.attachments = Array.isArray(attachments) ? attachments : [];
    }

    const updatedMedicalRecord = await medicalRecord.save();
    console.log(`[MedicalRecordController] Medical record ID: ${recordId} updated by Doctor ID: ${doctorProfile._id}`);
    res.status(200).json(updatedMedicalRecord);

  } catch (error: any) {
    console.error(`[MedicalRecordController] Ошибка в updateMedicalRecord (ID: ${recordId}):`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении медицинской записи' });
  }
};





export const deleteMedicalRecord = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const recordId = req.params.id;
  const requestingUser = req.user;
  console.log(`[MedicalRecordController] deleteMedicalRecord hit for Record ID: ${recordId} by User: ${requestingUser?.username} (Role: ${requestingUser?.roleName})`);

  if (!isValidObjectId(recordId)) {
    res.status(400).json({ message: 'Некорректный ID медицинской записи' });
    return;
  }

  try {
    const medicalRecord = await MedicalRecord.findById(recordId);

    if (!medicalRecord) {
      res.status(404).json({ message: 'Медицинская запись не найдена' });
      return;
    }

    let canDelete = false;
    if (['Admin', 'SuperAdmin'].includes(requestingUser?.roleName!)) {
  canDelete = true;


} else if (requestingUser?.roleName === 'Doctor') {
  const doctorProfile = await Doctor.findOne({ user: requestingUser.id });
  if (
    doctorProfile &&
    medicalRecord.doctor && 

    doctorProfile._id.toString() ===
      (medicalRecord.doctor as Types.ObjectId).toString()
  ) {
    canDelete = true;
  }
}


if (!canDelete) {
  res.status(403).json({ message: 'Недостаточно прав для удаления этой медицинской записи' });
  return;
}



    await MedicalRecord.findByIdAndDelete(recordId);


    console.log(`[MedicalRecordController] Medical record ID: ${recordId} deleted by User ID: ${requestingUser?.id}`);
    res.status(200).json({ message: 'Медицинская запись успешно удалена' });

  } catch (error: any) {
    console.error(`[MedicalRecordController] Ошибка в deleteMedicalRecord (ID: ${recordId}):`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении медицинской записи' });
  }
};