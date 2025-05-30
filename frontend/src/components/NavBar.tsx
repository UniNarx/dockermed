"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
    getRoleNameFromToken,
    getTokenFromStorage,
    removeTokenFromStorage,
    ROLE_NAMES,
    RoleName,
} from "@/lib/authUtils";

export default function NavBar() {
  const [currentRoleName, setCurrentRoleName] = useState<RoleName>(ROLE_NAMES.ANONYMOUS);
  const pathname = usePathname();
  const router = useRouter();

  const readTokenAndSetRole = () => {
    const token = getTokenFromStorage();
    const roleNameFromToken = getRoleNameFromToken(token);
    setCurrentRoleName(roleNameFromToken);
  };

  useEffect(() => {
    readTokenAndSetRole();
    const handleTokenChange = () => {
      readTokenAndSetRole();
    };
    window.addEventListener("token-changed", handleTokenChange);
    return () => {
      window.removeEventListener("token-changed", handleTokenChange);
    };
  }, []);

  const handleLogout = () => {
    removeTokenFromStorage();
    window.location.href = "/public/login";
  };

  const linkClass = "flex items-center px-2 py-1 font-medium text-gray-800 transition-transform duration-200 hover:scale-105";
  const fancyUnderline = (active: boolean) =>
    `after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-0.5 ${
      active
        ? "after:w-full after:bg-gradient-to-r after:from-indigo-500 after:to-purple-500"
        : "after:w-0"
    } after:transition-all after:duration-300`;

  const NavLink = ({ href, children, icon }: { href: string; children: React.ReactNode, icon?: React.ReactNode }) => {
    const isActive = pathname === href || (href === "/dashboard/chat" && pathname.startsWith("/dashboard/chat")); 
    return (
      <Link href={href} className={`group relative ${linkClass} ${fancyUnderline(isActive)}`}>
        {icon && <span className="mr-1.5">{icon}</span>}
        <span className="group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-indigo-500 group-hover:to-purple-500">
          {children}
        </span>
      </Link>
    );
  };

  const LogoutBtn = (
    <button onClick={handleLogout} className={`${linkClass} text-red-500 hover:text-red-600`}>
      Выйти
    </button>
  );

  const renderLinks = () => {
    if (currentRoleName === ROLE_NAMES.ANONYMOUS || !currentRoleName) {
      return (
        <>
          <NavLink href="/public/doctors">Врачи</NavLink>
          <NavLink href="/public/login">Войти</NavLink>
        </>
      );
    }
    if (currentRoleName === ROLE_NAMES.PATIENT) {
      return (
        <>
          <NavLink href="/public/doctors">Врачи</NavLink>
          <NavLink href="/dashboard/patients/appointments">Мои приёмы</NavLink>
          <NavLink href="/dashboard/patients/medical_records">Мои медкарты</NavLink>
          <NavLink href="/dashboard/chat" >Чат</NavLink> 
          <NavLink href="/dashboard/patients/profile">Профиль</NavLink>
          {LogoutBtn}
        </>
      );
    }
    if (currentRoleName === ROLE_NAMES.DOCTOR) {
      return (
        <>
          <NavLink href="/dashboard/doctors/patients">Пациенты</NavLink>
          <NavLink href="/dashboard/doctors/appointments">Приёмы</NavLink>
          <NavLink href="/dashboard/chat" >Чат</NavLink> 
          <NavLink href="/dashboard/doctors/profile">Профиль</NavLink>
          {LogoutBtn}
        </>
      );
    }
    if (currentRoleName === ROLE_NAMES.ADMIN || currentRoleName === ROLE_NAMES.SUPERADMIN) {
      return (
        <>
          <NavLink href="/dashboard/doctors">Упр. врачи</NavLink>
          <NavLink href="/dashboard/patients">Упр. пациенты</NavLink>
          <NavLink href="/dashboard/appointments">Упр. приёмы</NavLink>
          <NavLink href="/dashboard/profile">Профиль</NavLink>
          {LogoutBtn}
        </>
      );
    }
    return <NavLink href="/public/login">Войти</NavLink>;
  };

  let logoHref = "/public/doctors";

  return (
    <nav className="fixed top-0 w-full bg-white/60 backdrop-blur-md shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <Link href={logoHref} className="text-2xl font-bold text-indigo-600">
          Docker<span className="text-purple-500">Med</span>
        </Link>
        <div className="flex space-x-3 md:space-x-5">{renderLinks()}</div> 
      </div>
    </nav>
  );
}
