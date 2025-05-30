
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import appConfig from '../config/index';
import User, { IUser } from '../models/User';
import Role, { IRole } from '../models/Role';
import { JwtPayloadWithIds } from '../types/jwt';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    roleId: string;
    roleName?: string;
  };
}

export const protect = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Не авторизован: отсутствует заголовок Authorization или неверный формат' });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      appConfig.jwtSecret
    ) as JwtPayloadWithIds;



    if (!decoded.userId || !decoded.roleId) {
        console.warn('[AuthMiddleware] Токен не содержит userId или roleId после декодирования');
        res.status(401).json({ message: 'Не авторизован, неполные данные в токене' });
        return;
    }




    const userFromDb = await User.findById(decoded.userId)
      .select('-passwordHash')
      .lean<IUser>();

    const roleFromDb = await Role.findById(decoded.roleId)
      .lean<IRole>();

    if (!userFromDb || !roleFromDb) {
      console.warn(`[AuthMiddleware] Пользователь ${decoded.userId} или его роль ${decoded.roleId} не найдены в БД (после lean).`);
      res.status(401).json({ message: 'Не авторизован, пользователь или роль не найдены' });
      return;
    }



    req.user = {
      id: userFromDb._id.toString(),
      username: userFromDb.username,
      roleId: roleFromDb._id.toString(),
      roleName: roleFromDb.name,
    };

    next();
  } catch (err) {
    console.error('[AuthMiddleware] Ошибка обработки токена:', err);

    if (err instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ message: 'Не авторизован: недействительный токен' });
    } else if (err instanceof jwt.TokenExpiredError) {
        res.status(401).json({ message: 'Не авторизован: срок действия токена истек' });
    } else {
        res.status(401).json({ message: 'Не авторизован: ошибка токена' });
    }
    return;
  }
};