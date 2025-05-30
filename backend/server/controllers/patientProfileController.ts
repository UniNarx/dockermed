
import { Response } from 'express';
import mongoose, { Types } from 'mongoose';
import PatientProfile, { IPatientProfile, Gender } from '../models/PatientProfile';
import { AuthenticatedRequest } from '../middleware/authMiddleware';




export const getMyPatientProfileDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  console.log(`[PatientProfileController] getMyPatientProfileDetails for User ID: ${userId}`);

  if (!userId) {
    res.status(401).json({ message: 'Пользователь не аутентифицирован' });
    return;
  }

  try {

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        res.status(400).json({ message: 'Некорректный формат User ID' });
        return;
    }
    const profile = await PatientProfile.findOne({ user: userId as unknown as Types.ObjectId });
    if (!profile) {
      res.status(404).json({ message: 'Профиль пациента не найден. Создайте его.' });
      return;
    }
    res.status(200).json(profile);
  } catch (error: any) {
    console.error('[PatientProfileController] Error in getMyPatientProfileDetails:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении профиля пациента' });
  }
};




export const upsertMyPatientProfileDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  console.log(`[PatientProfileController] upsertMyPatientProfileDetails for User ID: ${userId}`);

  if (!userId) {
    res.status(401).json({ message: 'Пользователь не аутентифицирован' });
    return;
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: 'Некорректный формат User ID для профиля' });
    return;
  }

  try {
    const { dob, gender } = req.body;

    if (gender && !Object.values(Gender).includes(gender as Gender)) {
        res.status(400).json({ message: `Некорректное значение для gender. Допустимые: ${Object.values(Gender).join(', ')}` });
        return;
    }
    
    let dobDate;
    if (dob) {
        dobDate = new Date(dob);
        if (isNaN(dobDate.getTime())) {
            res.status(400).json({ message: 'Некорректный формат даты рождения (dob)' });
            return;
        }
    }


    const profileData: Partial<IPatientProfile> = { user: userId as any };
    if (dobDate) profileData.dob = dobDate;
    if (gender) profileData.gender = gender as Gender;

    const existingProfile = await PatientProfile.findOne({ user: userId as unknown as Types.ObjectId });

    const updatedProfile = await PatientProfile.findOneAndUpdate(
      { user: userId as unknown as Types.ObjectId },
      { $set: profileData },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    if (!updatedProfile) {

        res.status(500).json({ message: 'Не удалось создать или обновить профиль' });
        return;
    }
    




    const statusCode = existingProfile ? 200 : 201;
    const actionMessage = existingProfile ? 'updated' : 'created';

    console.log(`[PatientProfileController] Profile for user ${userId} ${actionMessage}.`);
    res.status(statusCode).json(updatedProfile);

  } catch (error: any) {
    console.error('[PatientProfileController] Error in upsertMyPatientProfileDetails:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Ошибка уникальности (профиль для этого пользователя уже существует)' });
    } else {
      res.status(500).json({ message: 'Ошибка сервера при создании/обновлении профиля пациента' });
    }
  }
};