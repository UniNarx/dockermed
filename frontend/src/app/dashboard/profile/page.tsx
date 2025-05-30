'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import { motion } from 'framer-motion'
import {
    getTokenFromStorage,
    getDecodedToken, 
    ROLE_NAMES,      
    RoleName,
    DecodedJwtPayload 
} from '@/lib/authUtils';

const ROLE_DISPLAY_NAMES: Record<RoleName & string, string> = { 
  [ROLE_NAMES.PATIENT]:    'Пациент',
  [ROLE_NAMES.DOCTOR]:     'Врач',
  [ROLE_NAMES.ADMIN]:      'Администратор',
  [ROLE_NAMES.SUPERADMIN]: 'СуперАдмин',
};

type UserProfileData = {
  id: string;      
  username: string;
  roleId: string;  
  roleName: RoleName & string; 
  createdAt?: string; 
};

type UserListItem = {
    _id: string;
    id?: string;
    username: string;
    roleId: string;
    roleName?: RoleName & string;
    createdAt: string; 
};


export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserProfileData | null>(null);
  const [currentUserRoleName, setCurrentUserRoleName] = useState<RoleName>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  const [adminsList, setAdminsList] = useState<UserListItem[]>([]);
  const [adminsError, setAdminsError] = useState<string | null>(null);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const token = getTokenFromStorage();
    const decoded = getDecodedToken(token);
    setCurrentUserRoleName(decoded?.roleName as RoleName || null);

    apiFetch<{ data: UserProfileData }>('/users/me') 
      .then(response => {
        if (response && response.data) {
          setCurrentUser(response.data);
        } else {
          throw new Error("Не удалось получить данные профиля.");
        }
      })
      .catch(err => {
        console.error("Ошибка загрузки профиля:", err);
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (currentUserRoleName === ROLE_NAMES.SUPERADMIN) {
      setIsLoadingAdmins(true);
      setAdminsError(null);
      apiFetch<UserListItem[]>(`/users?roleName=${ROLE_NAMES.ADMIN}`)
        .then(data => {
          setAdminsList(Array.isArray(data) ? data : []);
        })
        .catch(err => {
          console.error("Ошибка загрузки списка администраторов:", err);
          setAdminsError(err.message);
        })
        .finally(() => {
          setIsLoadingAdmins(false);
        });
    }
  }, [currentUserRoleName]); 

  const handleDeleteAdmin = async (adminUserId: string) => {
    if (!confirm('Удалить этого администратора? Это действие удалит пользователя.')) return;
    try {
      await apiFetch<void>(`/users/${adminUserId}`, { method: 'DELETE' });
      setAdminsList(prevAdmins => prevAdmins.filter(admin => (admin._id || admin.id) !== adminUserId));
      alert("Администратор удален.");
    } catch (err: any) {
      console.error("Ошибка при удалении администратора:", err);
      alert('Ошибка при удалении: ' + err.message);
    }
  };

  if (isLoading && !currentUser) return <p className="p-6 text-center text-gray-300">Загрузка профиля...</p>;
  if (error) return <p className="p-6 text-center text-red-400">Ошибка загрузки профиля: {error}</p>;
  if (!currentUser) return <p className="p-6 text-center text-gray-300">Не удалось загрузить данные профиля.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 !-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-6 space-y-6 text-white"
      >
        <h1 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Профиль
        </h1>

        <div className="space-y-2">
          <p><strong>Username:</strong> {currentUser.username}</p>
          <p>
            <strong>Role:</strong>{' '}
            {currentUser.roleName ? ROLE_DISPLAY_NAMES[currentUser.roleName] : currentUser.roleId}
          </p>
          {currentUser.createdAt && ( 
            <p>
              <strong>Создан:</strong>{' '}
              {new Date(currentUser.createdAt).toLocaleDateString('ru-RU')}
            </p>
          )}
        </div>

        <div className="flex flex-col  gap-3">
          
          <Link href="/dashboard/profile/password">
            <button className="w-full  px-4 py-2 rounded-lg font-medium transition-colors text-white bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500">
              Сменить пароль
            </button>
          </Link>
          {currentUserRoleName === ROLE_NAMES.SUPERADMIN && (
            <Link href="/dashboard/profile/create-admin">
              <button className="w-full  px-4 py-2 rounded-lg font-medium transition-colors text-white bg-gradient-to-r from-green-400 to-teal-400 hover:from-teal-400 hover:to-green-400">
                Добавить пользователя
              </button>
            </Link>
          )}
        </div>

        {currentUserRoleName === ROLE_NAMES.SUPERADMIN && (
          <section className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 space-y-3 mt-4"> 
            <h2 className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300"> 
              Администраторы (роль Admin)
            </h2>

            {isLoadingAdmins && <p className="text-gray-300">Загрузка списка администраторов…</p>}
            {adminsError && <p className="text-red-400">Ошибка загрузки администраторов: {adminsError}</p>}

            {!isLoadingAdmins && !adminsError && adminsList.length === 0 && (
              <p className="text-gray-400 italic">Администраторы с ролью "Admin" не найдены.</p>
            )}

            {adminsList.length > 0 && (
                <ul className="space-y-2">
                {adminsList.map(admin => {
                    const adminId = admin._id || admin.id;
                    return (
                    <li key={adminId} className="flex justify-between items-center p-2 bg-white/5 rounded-md">
                    <span>
                        <strong>{admin.username}</strong>{' '}
                        <small className="text-gray-400">
                        (ID: {adminId?.slice(-6)}, создан: {new Date(admin.createdAt).toLocaleDateString('ru-RU')})
                        </small>
                    </span>
                    {adminId && (
                        <button
                            onClick={() => handleDeleteAdmin(adminId)}
                            className="text-red-400 hover:text-red-300 underline text-sm"
                        >
                            Удалить
                        </button>
                    )}
                    </li>
                );})}
                </ul>
            )}
          </section>
        )}
      </motion.div>
    </div>
  );
}