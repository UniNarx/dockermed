
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.roleName) {
      console.warn('[RoleMiddleware] req.user или req.user.roleName не определены. Middleware protect должно быть вызвано первым.');
      res.status(401).json({ message: 'Не авторизован (данные пользователя отсутствуют)' });
      return;
    }

    if (allowedRoles.includes(req.user.roleName)) {
      next();

    } else {
      console.log(`[RoleMiddleware] Доступ запрещен для роли "${req.user.roleName}". Разрешенные роли: ${allowedRoles.join(', ')}`);
      res.status(403).json({ message: 'Доступ запрещен (недостаточно прав)' });
      return;
    }
  };
};