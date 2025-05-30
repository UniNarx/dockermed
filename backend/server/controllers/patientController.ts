
import { Response } from 'express';
import mongoose, { isValidObjectId } from 'mongoose';
import Patient, { IPatient } from '../models/Patient';
import User from '../models/User';
import Appointment from '../models/Appointment';
import MedicalRecord from '../models/MedicalRecord';
import PatientProfile from '../models/PatientProfile';
import { AuthenticatedRequest } from '../middleware/authMiddleware';




export const upsertMyPatientProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('[PatientController] upsertMyPatientProfile hit. User:', req.user?.id);
  try {
    const { firstName, lastName, dateOfBirth } = req.body;
    const userId = req.user?.id;

    if (!userId) {

      res.status(400).json({ message: 'Пользователь не определен в запросе' });
      return;
    }

    if (!firstName || !lastName || !dateOfBirth) {
      res.status(400).json({ message: 'Имя, фамилия и дата рождения обязательны' });
      return;
    }


    let patientProfile = await Patient.findOne({ user: userId });

    if (patientProfile) {

      patientProfile.firstName = firstName;
      patientProfile.lastName = lastName;
      patientProfile.dateOfBirth = new Date(dateOfBirth);
      patientProfile = await patientProfile.save();
      console.log(`[PatientController] Профиль пациента для пользователя ${userId} обновлен.`);
      res.status(200).json(patientProfile);
    } else {

      patientProfile = await Patient.create({
        user: userId,
        firstName,
        lastName,
        dateOfBirth: new Date(dateOfBirth),
      });
      console.log(`[PatientController] Профиль пациента для пользователя ${userId} создан.`);
      res.status(201).json(patientProfile);
    }
  } catch (error: any) {
    console.error('[PatientController] Ошибка в upsertMyPatientProfile:', error);
    if (error.code === 11000) {
        res.status(400).json({ message: 'Профиль пациента для этого пользователя уже существует или другая ошибка уникальности.' });
    } else {
        res.status(500).json({ message: 'Ошибка сервера при создании/обновлении профиля пациента' });
    }
  }
};
export const getPatientById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const patientId = req.params.id;
  if (!isValidObjectId(patientId)) {
    res.status(400).json({ message: 'Некорректный ID пациента' });
    return;
  }
  try {
    const patient = await Patient.findById(patientId).populate('user', 'username');
    if (!patient) {
      res.status(404).json({ message: 'Пациент не найден' });
      return;
    }
    res.status(200).json(patient);
  } catch (error: any) {
    console.error(`[PatientController] Ошибка в getPatientById (ID: ${patientId}):`, error);
    res.status(500).json({ message: 'Ошибка сервера при получении данных пациента' });
  }
};




export const getMyPatientProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('[PatientController] getMyPatientProfile hit. User ID:', req.user?.id);
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(400).json({ message: 'Пользователь не определен' });
      return;
    }

    const patientProfile = await Patient.findOne({ user: userId }).populate('user', 'username email');
    
    if (!patientProfile) {
      console.log(`[PatientController] Профиль пациента для пользователя ${userId} не найден.`);



      res.status(404).json({ message: 'Профиль пациента не найден. Пожалуйста, создайте или обновите его.' });
      return;
    }

    res.status(200).json(patientProfile);
  } catch (error: any) {
    console.error('[PatientController] Ошибка в getMyPatientProfile:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении профиля пациента' });
  }
};




export const getAllPatients = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('[PatientController] getAllPatients hit. Requesting user role:', req.user?.roleName);
  try {
    const patients = await Patient.find({}).populate('user', 'username');
    res.status(200).json(patients);
  } catch (error: any) {
    console.error('[PatientController] Ошибка в getAllPatients:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении списка пациентов' });
  }
};
export const deletePatientById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const patientId = req.params.id;
  console.log(`[PatientController] deletePatientById hit. Patient ID: ${patientId}`);

  if (!isValidObjectId(patientId)) {
    res.status(400).json({ message: 'Некорректный ID пациента' });
    return;
  }

  try {
    const patientToDelete = await Patient.findById(patientId);

    if (!patientToDelete) {
      res.status(404).json({ message: 'Пациент не найден' });
      return;
    }

    const userId = patientToDelete.user;





    try {

      await Appointment.deleteMany({ patient: patientId });
      console.log(`[PatientController] Appointments for patient ${patientId} deleted.`);


      await MedicalRecord.deleteMany({ patient: patientId });
      console.log(`[PatientController] Medical records for patient ${patientId} deleted.`);
      

      if (userId) {
        await PatientProfile.deleteOne({ user: userId });
        console.log(`[PatientController] PatientProfile for user ${userId} deleted.`);
      }


      await Patient.findByIdAndDelete(patientId );
      console.log(`[PatientController] Patient record ${patientId} deleted.`);


      if (userId) {
        await User.findByIdAndDelete(userId );
        console.log(`[PatientController] User record ${userId} for patient ${patientId} deleted.`);
      }


      res.status(200).json({ message: 'Пациент и все связанные с ним данные успешно удалены' });

    } catch (transactionError: any) {

      console.error(`[PatientController] Ошибка транзакции при удалении пациента ${patientId}:`, transactionError);
      res.status(500).json({ message: 'Ошибка сервера при удалении связанных данных пациента' });
    } 

  } catch (error: any) {
    console.error(`[PatientController] Ошибка при поиске пациента ${patientId} для удаления:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении пациента' });
  }
};