
import { Router } from 'express';
import { protect, AuthenticatedRequest } from '../middleware/authMiddleware';
import { changePassword } from '../controllers/authController';
import { authorize } from '../middleware/roleMiddleware';
import { Response } from 'express';
import { getAllUsers, deleteUserById } from '../controllers/authController'; 


const router = Router();

console.log('[UserRoutes] Файл userRoutes.ts ЗАГРУЖЕН, роутер создан.');


router.get('/', protect, authorize(['SuperAdmin']), getAllUsers);


router.get(
  '/me',
  protect,
  authorize(['Patient', 'Doctor', 'Admin', 'SuperAdmin']),
  (req: AuthenticatedRequest, res: Response) => {
    console.log('[UserRoutes] ВНУТРИ обработчика GET /me. User:', req.user);
    if (req.user) {
      res.status(200).json({
        message: 'Информация о текущем пользователе (требуется роль Patient или выше)',
        data: {
          id: req.user.id,
          username: req.user.username,
          roleId: req.user.roleId,
          roleName: req.user.roleName,
        }
      });
    } else {
      console.warn('[UserRoutes] ВНУТРИ GET /me, но req.user отсутствует после protect/authorize.');
      res.status(500).json({ message: 'Ошибка сервера: пользователь не был установлен middleware' });
    }
  }
);


router.get(
  '/admin-only',
  protect,
  authorize(['Admin', 'SuperAdmin']),
  (req: AuthenticatedRequest, res: Response) => {
    console.log('[UserRoutes] ВНУТРИ обработчика GET /admin-only. User:', req.user);
    res.status(200).json({
      message: 'Добро пожаловать в административную зону!',
      user: req.user,
    });
  }
);

router.get('/test', (req, res) => {
  console.log('[UserRoutes] ВНУТРИ обработчика GET /users/test');
  res.status(200).send('User routes test endpoint reached!');
});
router.put('/me/password', protect, changePassword);

router.delete('/:userId', protect, authorize(['SuperAdmin']), deleteUserById);

export default router;