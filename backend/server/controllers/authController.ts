import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import Role, { IRole } from '../models/Role';
import Patient from '../models/Patient'; 
import PatientProfile from '../models/PatientProfile'; 
import DoctorProfile from '../models/DoctorProfile';
import appConfig from '../config/index';
import jwt from 'jsonwebtoken';    
import { JwtPayloadWithIds } from '../types/jwt';
import { isValidObjectId } from 'mongoose';

import Doctor from '../models/Doctor';
import Appointment from '../models/Appointment';
import MedicalRecord from '../models/MedicalRecord'; 
import { Types } from 'mongoose';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {

      console.log('[Register API] Validation failed: username or password missing'); 

      res.status(400).json({ message: 'Имя пользователя и пароль обязательны' });

      return;

    }
    const existingUser = await User.findOne({ username });
     if (existingUser) {

      console.log(`[Register API] User ${username} already exists.`); 

      res.status(400).json({ message: 'Имя пользователя уже занято' });

      return;

    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const patientRole = await Role.findOne({ name: 'Patient' });
    if (!patientRole) {

      console.error('[Register API] CRITICAL: "Patient" role not found!'); 

      res.status(500).json({ message: 'Ошибка сервера: роль по умолчанию не найдена' });

      return;

    }

    const newUser = new User({
      username,
      passwordHash,
      role: patientRole._id,
    });
    const savedUser = await newUser.save();
    console.log(`[AuthController] User created with ID: ${savedUser._id}`);

    try {
      const newPatientRecord = new Patient({
        user: savedUser._id,
        firstName: '', 
        lastName: '',  
        
      });
      await newPatientRecord.save();
      console.log(`[AuthController] Empty Patient record created for User ID: ${savedUser._id}`);

    } catch (patientError) {
      console.error('[AuthController] Ошибка при создании пустой записи Patient:', patientError);

    }


    try {
      const newPatientProfile = new PatientProfile({
        user: savedUser._id,
      firstName: '',
      lastName: '',
      dateOfBirth: new Date(),
      });
      await newPatientProfile.save();
      console.log(`[AuthController] Empty PatientProfile created for User ID: ${savedUser._id}`);
    } catch (profileError) {
      console.error('[AuthController] Ошибка при создании PatientProfile:', profileError);
    }



    res.status(201).json({
      message: 'Пользователь успешно зарегистрирован',
      userId: savedUser._id,
      username: savedUser.username,
    });

  } catch (error: any) {
    console.error('[Register API] Error caught in register function:', error.message, error.stack);

    if (!res.headersSent) {
      res.status(500).json({ message: 'Ошибка сервера при регистрации пользователя (из catch)' });
    } else {
      console.error('[Register API] Headers already sent, cannot send error JSON.');
    }
    return;
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    console.log("[ChangePassword Controller] Received req.body:", JSON.stringify(req.body, null, 2));

  const userId = req.user?.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
        console.warn("[ChangePassword Controller] Validation failed: oldPassword or newPassword is missing or empty.");

    res.status(400).json({ message: 'Старый и новый пароли обязательны' });
    return;
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ message: 'Пользователь не найден' });
      return;
    }

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ message: 'Неверный старый пароль' });
      return;
    }

    if (newPassword.length < 6) {
        res.status(400).json({ message: 'Новый пароль должен быть не менее 6 символов.' });
        return;
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Пароль успешно изменен' });
  } catch (error: any) {
    console.error('[AuthController] Ошибка смены пароля:', error);
    res.status(500).json({ message: 'Ошибка сервера при смене пароля' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  console.log('[Login API] Entered login function');
  try {
    const { username, password } = req.body;
    console.log(`[Login API] Received username: ${username}, password: ${password ? '***' : 'undefined'}`);

    if (!username || !password) {
      console.log('[Login API] Validation failed: username or password missing');
      res.status(400).json({ message: 'Имя пользователя и пароль обязательны' });
      return;
    }

    console.log(`[Login API] Looking for user: ${username}`);
    const user = await User.findOne({ username }).populate('role');

    if (!user) {
      console.log(`[Login API] User ${username} not found.`);
      res.status(401).json({ message: 'Неверные учетные данные (пользователь не найден)' });
      return;
    }
    console.log(`[Login API] User ${username} found.`);

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      console.log(`[Login API] Password mismatch for user ${username}.`);
      res.status(401).json({ message: 'Неверные учетные данные (пароль не совпадает)' });
      return;
    }
    console.log(`[Login API] Password matches for user ${username}.`);

    if (!user.role || typeof (user.role as IRole).name === 'undefined') {
    console.error(`[Login API] CRITICAL: Role name for user ${user.username} not found after populate.`);
    res.status(500).json({ message: 'Ошибка сервера: не удалось определить имя роли пользователя' });
    return;
}

const payload: JwtPayloadWithIds = {
    userId: user._id.toString(),
    username: user.username,
    roleId: (user.role as IRole)._id.toString(),
    roleName: (user.role as IRole).name,
};

const token = jwt.sign(
    payload,
    appConfig.jwtSecret,
    { expiresIn: '24h' }
);

res.json({
    message: 'Вход выполнен успешно',
    token,
    user: {
        id: user._id,
        username: user.username,
        role: (user.role as IRole).name
    }
});
    console.log(`[Login API] Sent 200 response for ${username}.`);
    return;

  } catch (error: any) {
    console.error('[Login API] Error caught in login function:', error.message, error.stack);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Ошибка сервера при входе пользователя (из catch)' });
    } else {
      console.error('[Login API] Headers already sent, cannot send error JSON.');
    }
    return;
  }
};

export const registerAdmin = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  console.log('[AuthController] registerAdmin hit by User ID:', req.user?.id, 'Role:', req.user?.roleName);
  try {
    const { username, password, role: roleName } = req.body;

    if (!username || !password || !roleName) {
      res.status(400).json({ message: 'Имя пользователя, пароль и роль обязательны.' });
      return;
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      res.status(400).json({ message: 'Имя пользователя уже занято.' });
      return;
    }

    const targetRole = await Role.findOne({ name: roleName });
    if (!targetRole) {
      res.status(400).json({ message: `Роль "${roleName}" не найдена.` });
      return;
    }


    if (password.length < 6) {
         res.status(400).json({ message: 'Пароль должен быть не менее 6 символов.' });
         return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      passwordHash,
      role: targetRole._id,
    });
    const savedUser = await newUser.save();
    console.log(`[AuthController] User ${username} created with role ${roleName} by admin.`);


    if (roleName === 'Patient') {
      const newPatientRecord = new Patient({
        user: savedUser._id,
        firstName: '',
        lastName: '',
        dateOfBirth: new Date(0),
      });
      await newPatientRecord.save();

      const newPatientProfile = new PatientProfile({ user: savedUser._id });
      await newPatientProfile.save();
      console.log(`[AuthController] Patient record and profile created for new user ${username}`);
    } else if (roleName === 'Doctor') {





      console.warn(`[AuthController] Doctor user ${username} created. Doctor profile (firstName, lastName, specialty) needs to be created separately.`);

      const newDoctorProfile = new DoctorProfile({ user: savedUser._id });
      await newDoctorProfile.save();
    }

    res.status(201).json({
      message: `Пользователь "<span class="math-inline">\{username\}" с ролью "</span>{roleName}" успешно создан.`,
      userId: savedUser._id,
      username: savedUser.username,
      role: targetRole.name,
    });

  } catch (error: any) {
    console.error('[AuthController] Ошибка в registerAdmin:', error);
    if (error.code === 11000) {
      res.status(400).json({ message: 'Имя пользователя уже существует (ошибка БД).' });
    } else {
      res.status(500).json({ message: 'Ошибка сервера при создании пользователя.' });
    }
  }
};

export const getAllUsers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query: any = {};
    const { roleName, roleId } = req.query;

    if (roleName && typeof roleName === 'string') {
      const roleDoc = await Role.findOne({ name: roleName });
      if (roleDoc) {
        query.role = roleDoc._id;
      } else {
        res.status(200).json([]);
        return;
      }
    } else if (roleId && typeof roleId === 'string' && isValidObjectId(roleId)) {
        query.role = roleId;
    }



    const users = await User.find(query).select('-passwordHash').populate('role', 'name');


    const userList = users.map(u => ({
        _id: u._id.toString(),
        id: u._id.toString(),
        username: u.username,
        roleId: (u.role as IRole)._id.toString(),
        roleName: (u.role as IRole).name,
        createdAt: u.createdAt.toISOString(),
    }));

    res.status(200).json(userList);
  } catch (error: any) {
    console.error("Ошибка получения списка пользователей:", error);
    res.status(500).json({ message: "Ошибка сервера при получении списка пользователей." });
  }
};
export const deleteUserById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userIdToDelete = req.params.userId;
  const requestingUserId = req.user?.id;

  console.log(`[AuthController] Attempting to delete user ID: ${userIdToDelete} by user ID: ${requestingUserId}`);

  if (!isValidObjectId(userIdToDelete)) {
    res.status(400).json({ message: 'Некорректный ID пользователя для удаления.' });
    return;
  }


  if (userIdToDelete === requestingUserId) {
    res.status(400).json({ message: 'Вы не можете удалить свой собственный аккаунт через этот интерфейс.' });
    return;
  }

  try {
    const userToDelete = await User.findById(userIdToDelete).populate('role');
    if (!userToDelete) {
      res.status(404).json({ message: 'Пользователь для удаления не найден.' });
      return;
    }

    const userRoleName = (userToDelete.role as IRole)?.name;










    if (userRoleName === 'Patient') {
      const patientProfileDoc = await Patient.findOne({ user: userToDelete._id });
      if (patientProfileDoc) {
        await Appointment.deleteMany({ patient: patientProfileDoc._id });
        await MedicalRecord.deleteMany({ patient: patientProfileDoc._id });
        await Patient.deleteOne({ _id: patientProfileDoc._id });
        console.log(`[AuthController] Associated Patient data for user ${userIdToDelete} deleted.`);
      }
      await PatientProfile.deleteOne({ user: userToDelete._id });
      console.log(`[AuthController] Associated PatientProfile for user ${userIdToDelete} deleted.`);
    } else if (userRoleName === 'Doctor') {
      const doctorProfileDoc = await Doctor.findOne({ user: userToDelete._id });
      if (doctorProfileDoc) {




        await Appointment.deleteMany({ doctor: doctorProfileDoc._id });



        await Doctor.deleteOne({ _id: doctorProfileDoc._id });
        console.log(`[AuthController] Associated Doctor data for user ${userIdToDelete} deleted.`);
      }
      await DoctorProfile.deleteOne({ user: userToDelete._id });
       console.log(`[AuthController] Associated DoctorProfile for user ${userIdToDelete} deleted.`);
    }


    await User.findByIdAndDelete(userIdToDelete);
    console.log(`[AuthController] User ID: ${userIdToDelete} deleted successfully.`);
    res.status(200).json({ message: `Пользователь ${userToDelete.username} и связанные данные успешно удалены.` });

  } catch (error: any) {
    console.error(`[AuthController] Ошибка при удалении пользователя ${userIdToDelete}:`, error);
    res.status(500).json({ message: 'Ошибка сервера при удалении пользователя.' });
  }
};