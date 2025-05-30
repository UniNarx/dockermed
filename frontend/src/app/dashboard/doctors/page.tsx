"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { motion } from "framer-motion";

type DoctorData = {
  id?: number;
  _id: string; 
  firstName: string; 
  lastName: string; 
  specialty: string;
  createdAt: string; 
  user?: {
    username: string;
    _id: string;
  };
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const glassCard =
    "bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg";
  const headerText =
    "text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400";
  const btnAdd =
    "px-4 py-2 rounded-lg font-medium transition bg-gradient-to-r from-green-400 to-teal-400 hover:from-teal-400 hover:to-green-400 text-white";
  const btnEdit =
    "px-2 py-1 rounded-lg font-medium transition bg-gradient-to-r from-yellow-400 to-orange-400 hover:from-orange-400 hover:to-yellow-400 text-white";
  const btnDelete =
    "px-2 py-1 rounded-lg font-medium transition bg-gradient-to-r from-red-500 to-pink-500 hover:from-pink-500 hover:to-red-500 text-white";
  const rowHover = "hover:bg-white/5 transition-colors";

  useEffect(() => {
    setIsLoading(true);
    apiFetch<DoctorData[]>("/doctors")
      .then((data) => {
        setDoctors(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        console.error("Ошибка загрузки врачей:", err);
        setError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleDeleteDoctor = async (doctorId: string) => {
    if (!confirm("Удалить врача? Это действие нельзя будет отменить.")) return;
    try {
      await apiFetch<void>(`/doctors/${doctorId}`, { method: "DELETE" });
      setDoctors((prevDoctors) =>
        prevDoctors.filter(
          (doc) => (doc._id || doc.id?.toString()) !== doctorId
        )
      );
    } catch (err: any) {
      console.error(`Ошибка удаления врача ${doctorId}:`, err);
      alert("Ошибка при удалении врача: " + err.message);
    }
  };

  if (isLoading)
    return (
      <p className="p-4 text-center text-gray-300">Загрузка списка врачей...</p>
    );
  if (error)
    return (
      <p className="p-4 text-center text-red-400">
        Ошибка загрузки врачей: {error}
      </p>
    );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`max-w-4xl mx-auto ${glassCard} p-6 text-white`}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-2xl font-bold ${headerText}`}>Врачи</h1>
          <Link href="/dashboard/doctors/create">
            <button className={btnAdd}>Добавить врача</button>
          </Link>
        </div>

        {doctors.length === 0 && !isLoading && (
          <p className="text-center text-gray-400 py-4">Список врачей пуст.</p>
        )}

        {doctors.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full table-auto border-separate bg-white/10 rounded-lg">
              <thead>
                <tr className="text-left text-gray-300">
                  {[
                    "ID",
                    "Имя",
                    "Фамилия",
                    "Специализация",
                    "Создано",
                    "Действия",
                  ].map((col) => (
                    <th key={col} className="px-4 py-2">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => {
                  const doctorId = doctor._id || doctor.id?.toString();
                  return (
                    <tr
                      key={doctorId}
                      className={`border-t border-white/20 ${rowHover}`}
                      suppressHydrationWarning={true}
                    >
                      <td className="px-4 py-3 text-gray-200 truncate max-w-[100px]">
                        {doctorId}
                      </td>
                      <td className="px-4 py-3 text-gray-200">
                        {doctor.firstName}
                      </td>
                      <td className="px-4 py-3 text-gray-200">
                        {doctor.lastName}
                      </td>
                      <td className="px-4 py-3 text-gray-200">
                        {doctor.specialty}
                      </td>
                      <td className="px-4 py-3 text-gray-200">
                        {new Date(doctor.createdAt).toLocaleString("ru-RU")}
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        {doctorId && (
                          <Link href={`/dashboard/doctors/${doctorId}/edit`}>
                            <button className={btnEdit}>Ред.</button>
                          </Link>
                        )}
                        <button
                          className={btnDelete}
                          onClick={() =>
                            doctorId && handleDeleteDoctor(doctorId)
                          }
                          disabled={!doctorId}
                        >
                          Удл.
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
