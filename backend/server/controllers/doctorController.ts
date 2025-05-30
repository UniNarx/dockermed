
import { Request, Response } from 'express';
import Doctor, { IDoctor } from '../models/Doctor';
import User from '../models/User';
import Role from '../models/Role';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { isValidObjectId } from 'mongoose';





export const createDoctor = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('[DoctorController] createDoctor hit. Requesting user role:', req.user?.roleName);
  try {
    const { username, password, firstName, lastName, specialty, description } = req.body;

    if (!username || !password || !firstName || !lastName || !specialty) {
      res.status(400).json({ message: 'Имя пользователя, пароль, имя, фамилия и специализация обязательны' });
      return;
    }


    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ message: 'Имя пользователя уже занято' });
      return;
    }


    const doctorRole = await Role.findOne({ name: 'Doctor' });
    if (!doctorRole) {
      console.error('[DoctorController] CRITICAL: "Doctor" role not found!');
      res.status(500).json({ message: 'Ошибка сервера: роль "Doctor" не найдена' });
      return;
    }


    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);


    const newUser = new User({
      username,
      passwordHash,
      role: doctorRole._id,
    });
    const savedUser = await newUser.save();
    console.log(`[DoctorController] User for doctor ${username} created with ID: ${savedUser._id}`);


    const newDoctorProfile = new Doctor({
      user: savedUser._id,
      firstName,
      lastName,
      specialty,
      description: description || '',
    });
    const savedDoctorProfile = await newDoctorProfile.save();
    console.log(`[DoctorController] Doctor profile for ${firstName} ${lastName} created with ID: ${savedDoctorProfile._id}`);


    res.status(201).json({
        message: 'Врач успешно создан',
        doctor: savedDoctorProfile,
        user: {
            _id: savedUser._id,
            username: savedUser.username,
            role: doctorRole.name
        }
    });

  } catch (error: any) {
    console.error('[DoctorController] Ошибка в createDoctor:', error);


    if (error.code === 11000) {
        res.status(400).json({ message: 'Ошибка уникальности: пользователь или профиль врача с такими данными уже существует.' });
    } else {
        res.status(500).json({ message: 'Ошибка сервера при создании врача' });
    }
  }
};





export const getAllDoctors = async (req: Request, res: Response): Promise<void> => {
  console.log('[DoctorController] getAllDoctors hit.');
  try {

    const doctors = await Doctor.find({})
      .populate({
          path: 'user',
          select: 'username',
          populate: {
              path: 'role',
              select: 'name'
          }
      });
    res.status(200).json(doctors);
  } catch (error: any) {
    console.error('[DoctorController] Ошибка в getAllDoctors:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении списка врачей' });
  }
};




export const getDoctorById = async (req: Request, res: Response): Promise<void> => {
  const doctorId = req.params.id;
  console.log(`[DoctorController] getDoctorById hit. Doctor ID: ${doctorId}`);
  try {
    const doctor = await Doctor.findById(doctorId)
    .populate({
        path: 'user',
        select: 'username',
        populate: {
            path: 'role',
            select: 'name'
        }
    });

    if (!doctor) {
      res.status(404).json({ message: 'Врач не найден' });
      return;
    }
    res.status(200).json(doctor);
  } catch (error: any) {
    console.error(`[DoctorController] Ошибка в getDoctorById (ID: ${doctorId}):`, error);
    if (error.kind === 'ObjectId') {
        res.status(400).json({ message: 'Некорректный ID врача' });
        return;
    }
    res.status(500).json({ message: 'Ошибка сервера при получении информации о враче' });
  }
};
export const updateDoctorById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const doctorId = req.params.id;
  const { firstName, lastName, specialty, description } = req.body;

  console.log(`[DoctorController] updateDoctorById hit. Doctor ID: ${doctorId}`);

  if (!isValidObjectId(doctorId)) {
    res.status(400).json({ message: 'Некорректный ID врача' });
    return;
  }

  if (!firstName || !lastName || !specialty) {
    res.status(400).json({ message: 'Имя, фамилия и специализация обязательны для обновления' });
    return;
  }

  try {
    const doctor = await Doctor.findById(doctorId);

    if (!doctor) {
      res.status(404).json({ message: 'Врач не найден' });
      return;
    }

    doctor.firstName = firstName;
    doctor.lastName = lastName;
    doctor.specialty = specialty;

     if (description !== undefined) {
        doctor.description = description;
    }

    const updatedDoctor = await doctor.save();
    console.log(`[DoctorController] Doctor profile ID: ${updatedDoctor._id} updated.`);
    res.status(200).json(updatedDoctor);
  } catch (error: any) {
    console.error(`[DoctorController] Ошибка в updateDoctorById (ID: ${doctorId}):`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении данных врача' });
  }
};
export const deleteDoctorById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const doctorId = req.params.id;
  console.log(`[DoctorController] deleteDoctorById hit. Doctor Profile ID: ${doctorId}`);

  if (!isValidObjectId(doctorId)) {
    res.status(400).json({ message: 'Некорректный ID профиля врача' });
    return;
  }

  try {
    const doctorProfile = await Doctor.findById(doctorId);

    if (!doctorProfile) {
      res.status(404).json({ message: 'Профиль врача не найден' });
      return;
    }

    const userIdToDelete = doctorProfile.user;


    const deletedDoctorProfile = await Doctor.findByIdAndDelete(doctorId);
    if (!deletedDoctorProfile) {

      res.status(404).json({ message: 'Профиль врача не найден для удаления (повторно)' });
      return;
    }
    console.log(`[DoctorController] Doctor profile ID: ${doctorId} deleted.`);


    if (userIdToDelete) {
      const deletedUser = await User.findByIdAndDelete(userIdToDelete);
      if (deletedUser) {
        console.log(`[DoctorController] Associated User ID: ${userIdToDelete} deleted.`);
      } else {
        console.warn(`[DoctorController] User ID: ${userIdToDelete} associated with doctor profile ${doctorId} not found or already deleted.`);
      }
    } else {
      console.warn(`[DoctorController] No user ID found in doctor profile ${doctorId} to delete.`);
    }






    res.status(200).json({ message: 'Врач и связанный пользователь успешно удалены' });

  } catch (error: any) {
    console.error(`[DoctorController] Ошибка в deleteDoctorById (Doctor Profile ID: ${doctorId}):`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении врача' });
  }
};
export const getMyDoctorProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const doctorProfile = await Doctor.findOne({ user: req.user?.id })
      .populate('user', 'username');

    if (!doctorProfile) {
      res.status(404).json({ message: 'Профиль врача для текущего пользователя не найден.' });
      return;
    }
    res.status(200).json(doctorProfile);
  } catch (error: any) {
    console.error('[DoctorController] Ошибка в getMyDoctorProfile:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении профиля врача' });
  }
};

export const updateMyDoctorAvatar = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { avatarUrl } = req.body;

  if (typeof avatarUrl !== 'string') {
    res.status(400).json({ message: 'Поле avatarUrl обязательно и должно быть строкой.' });
    return;
  }

  try {

    const doctorProfile = await Doctor.findOne({ user: userId });
    if (!doctorProfile) {
      res.status(404).json({ message: 'Профиль врача не найден.' });
      return;
    }

    doctorProfile.avatarUrl = avatarUrl;
    await doctorProfile.save();

    res.status(200).json({
      message: 'Аватар врача успешно обновлен.',
      avatarUrl: doctorProfile.avatarUrl,
      doctor: doctorProfile,
    });

  } catch (error: any) {
    console.error('[DoctorController] Ошибка при обновлении аватара врача:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении аватара врача.' });
  }
};
export const updateMyDoctorProfileData = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { firstName, lastName, specialty } = req.body;

  if (!firstName || !lastName || !specialty) {
    res.status(400).json({ message: 'Имя, фамилия и специализация обязательны.' });
    return;
  }

  try {
    const doctorProfile = await Doctor.findOne({ user: userId });
    if (!doctorProfile) {
      res.status(404).json({ message: 'Профиль врача не найден.' });
      return;
    }

    doctorProfile.firstName = firstName;
    doctorProfile.lastName = lastName;
    doctorProfile.specialty = specialty;
    await doctorProfile.save();

    res.status(200).json({
      message: 'Данные профиля врача успешно обновлены.',
      doctor: doctorProfile,
    });

  } catch (error: any) {
    console.error('[DoctorController] Ошибка при обновлении данных профиля врача:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении данных профиля врача.' });
  }
};

export const updateDoctorAvatarById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const doctorId = req.params.id;
  const { avatarUrl } = req.body;

  if (!isValidObjectId(doctorId)) {
    res.status(400).json({ message: 'Некорректный ID врача.' });
    return;
  }

  if (typeof avatarUrl !== 'string') {
    res.status(400).json({ message: 'Поле avatarUrl обязательно и должно быть строкой.' });
    return;
  }

  try {
    const doctorProfile = await Doctor.findById(doctorId);
    if (!doctorProfile) {
      res.status(404).json({ message: 'Профиль врача не найден.' });
      return;
    }

    doctorProfile.avatarUrl = avatarUrl;
    await doctorProfile.save();

    res.status(200).json({
      message: 'Аватар врача успешно обновлен администратором.',
      avatarUrl: doctorProfile.avatarUrl,
      doctor: doctorProfile,
    });

  } catch (error: any) {
    console.error(`[DoctorController] Ошибка при обновлении аватара для врача ${doctorId}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении аватара врача.' });
  }
};