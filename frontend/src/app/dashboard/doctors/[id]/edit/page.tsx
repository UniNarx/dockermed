'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { apiFetch } from '@/lib/api';
import { motion } from 'framer-motion';
import { UploadButton } from '@uploadthing/react';
import { UploadCloud } from 'lucide-react';
import type { OurFileRouter } from '@/app/api/uploadthing/core'; 

type DoctorData = {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  specialty: string;
  avatarUrl?: string;
  description?: string;
};

export default function DoctorEditPage() {
  const router = useRouter();
  const params = useParams();
  const doctorIdFromUrl = Array.isArray(params.id) ? params.id[0] : (params.id as string);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [description, setDescription] = useState('');
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const glassCard  = 'bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg';
  const glassInput = 'w-full bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400';
  const btnBase    = 'w-full py-2 rounded-lg font-medium transition-colors';
  const btnSave    = 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50';
  const errorBox   = 'text-red-400 bg-red-900/30 border border-red-600 rounded-lg px-4 py-2';

  useEffect(() => {
    if (!doctorIdFromUrl) {
      setError('ID врача не найден в URL.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);

    apiFetch<DoctorData>(`/doctors/${doctorIdFromUrl}`)
      .then(doctor => {
        if (doctor) {
          setFirstName(doctor.firstName);
          setLastName(doctor.lastName);
          setSpecialty(doctor.specialty);
          setDescription(doctor.description || '');
          setCurrentAvatarUrl(doctor.avatarUrl || null);
        } else {
          throw new Error(`Врач с ID ${doctorIdFromUrl} не найден.`);
        }
      })
      .catch(err => {
        console.error(`Ошибка загрузки данных врача с ID ${doctorIdFromUrl}:`, err);
        setError(err.message || 'Не удалось загрузить данные врача.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [doctorIdFromUrl]);

  const handleProfileDataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !specialty.trim()) {
      setError('Имя, фамилия и специализация обязательны.');
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      await apiFetch<void>(`/doctors/${doctorIdFromUrl}`, {
        method: 'PUT',
        body: JSON.stringify({ firstName, lastName, specialty, description: description.trim() }),
      });
      alert('Данные профиля врача успешно обновлены!');
    } catch (err: any) {
      console.error('Ошибка сохранения данных врача:', err);
      setError(err.message || 'Не удалось сохранить изменения.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUploadComplete = async (res?: any[]) => {
    setIsUploading(false);
    if (!res || res.length === 0) {
      setError('Загрузка не вернула ни одного файла.');
      return;
    }
    const newAvatarUrl = res[0].fileUrl || res[0].url;
    if (!newAvatarUrl) {
      setError('Ответ от UploadThing не содержит URL файла.');
      return;
    }
    try {
      const updateResponse = await apiFetch<{ avatarUrl: string }>(
        `/doctors/${doctorIdFromUrl}/avatar`,
        {
          method: 'PUT',
          body: JSON.stringify({ avatarUrl: newAvatarUrl }),
        }
      );
      setCurrentAvatarUrl(updateResponse.avatarUrl);
      alert('Аватар врача успешно обновлен!');
    } catch (uploadError: any) {
      console.error('Ошибка при сохранении аватара:', uploadError);
      setError(uploadError.message || 'Не удалось сохранить аватар.');
    }
  };

  const handleUploadError = (err: Error) => {
    setIsUploading(false);
    setError(`Ошибка загрузки файла: ${err.message}`);
  };

  if (isLoading) {
    return <p className="p-6 text-center text-gray-300">Загрузка данных врача...</p>;
  }
  if (error && !firstName && !doctorIdFromUrl) { 
    return <p className="p-6 text-center text-red-400">Ошибка: {error}</p>;
  }
   if (!isLoading && !error && !doctorIdFromUrl) {
    return <p className="p-6 text-center text-gray-300">Не указан ID врача.</p>;
  }
  if (!isLoading && !error && doctorIdFromUrl && !firstName && !lastName) {
      return (
        <div className="p-6 text-center">
          <p className="text-red-400">Не удалось загрузить данные для врача с ID: {doctorIdFromUrl}.</p>
          {error && <p className="text-red-400">Детали ошибки: {error}</p>}
          <button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded">Назад</button>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-4 !-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-lg w-full ${glassCard} p-6 space-y-6 text-white`}
      >
        <h1 className="text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 text-center">
          Редактировать врача (ID: {doctorIdFromUrl ? doctorIdFromUrl.slice(-6) : 'N/A'})
        </h1>

        {error && <div className={errorBox}>{error}</div>}

        <div className="flex flex-col items-center space-y-3 border-b border-white/10 pb-6 mb-6">
          <span className="font-medium">Аватар</span>
          {currentAvatarUrl ? (
            <Image
              src={currentAvatarUrl}
              alt="Аватар врача"
              width={100}
              height={100}
              className="rounded-full object-cover w-24 h-24 border-2 border-indigo-300"
              priority 
            />
          ) : (
            <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center text-gray-400 text-xs">
              Нет аватара
            </div>
          )}
          <UploadButton<OurFileRouter, "avatarUploader">
            endpoint="avatarUploader" 
            onClientUploadComplete={handleAvatarUploadComplete}
            onUploadError={handleUploadError}
            onUploadBegin={() => { setIsUploading(true); setError(null); }}
            className="ut-button:bg-indigo-500 ut-button:ut-readying:bg-indigo-500/50 ut-label:text-white ut-allowed-content:text-gray-300" 
            content={{
                button({ ready, isUploading: uploading }) {
                  if (ready && !uploading) return <><UploadCloud className="w-5 h-5 mr-2" /> <span>Изменить аватар</span></>;
                  if (uploading) return "Загрузка...";
                  return "Подготовка...";
                },
                allowedContent({ ready, fileTypes, isUploading: uploading }) {
                  if (!ready || uploading) return null;
                  return <span className="text-xs text-gray-400 mt-1">Макс. 2MB ({fileTypes.join(", ")})</span>;
                },
            }}
          />
          {isUploading && <p className="text-sm text-gray-400 mt-1">Идет загрузка...</p>}
        </div>

        <form onSubmit={handleProfileDataSubmit} className="space-y-4">
          <h2 className="text-xl font-semibold text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 mb-4">
            Основные данные
          </h2>
          <label className="block space-y-1">
            <span className="font-medium">Имя</span>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className={glassInput}
              required
              disabled={isSaving || isLoading}
            />
          </label>
          <label className="block space-y-1">
            <span className="font-medium">Фамилия</span>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className={glassInput}
              required
              disabled={isSaving || isLoading}
            />
          </label>
          <label className="block space-y-1">
            <span className="font-medium">Специализация</span>
            <input
              type="text"
              value={specialty}
              onChange={e => setSpecialty(e.target.value)}
              className={glassInput}
              required
              disabled={isSaving || isLoading}
            />
          </label>
           <label className="block space-y-1">
            <span className="font-medium">Описание врача</span>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={`${glassInput} h-40 resize-y`}
              placeholder="Расскажите о враче, его опыте, подходе к лечению и т.д."
              disabled={isLoading || isSaving}
            />
          </label>

          <button
            type="submit"
            disabled={isSaving || isUploading || isLoading}
            className={`${btnBase} ${btnSave}`}
          >
            {isSaving ? 'Сохраняем…' : 'Сохранить изменения'}
          </button>
        </form>

        <button
          onClick={() => router.push('/dashboard/doctors')}
          className={`${btnBase} bg-gray-600 hover:bg-gray-700 text-white mt-2`}
          disabled={isSaving || isUploading || isLoading}
        >
          Назад к списку врачей
        </button>
      </motion.div>
    </div>
  );
}
