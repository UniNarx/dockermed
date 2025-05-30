
export const ROLE_NAMES = {
  PATIENT: "Patient",
  DOCTOR: "Doctor",
  ADMIN: "Admin",
  SUPERADMIN: "SuperAdmin",
  ANONYMOUS: null, 
} as const; 

export type RoleName = typeof ROLE_NAMES[keyof typeof ROLE_NAMES] | null;


export interface DecodedJwtPayload {
  userId: string;
  username: string;
  roleId: string;   
  roleName: string;
  iat?: number;
  exp?: number;
}

export function getDecodedToken(tokenString?: string | null): DecodedJwtPayload | null {
  if (!tokenString) {
    return null;
  }
  try {
    const payloadBase64 = tokenString.split(".")[1];
    if (!payloadBase64) {
      return null;
    }
    return JSON.parse(atob(payloadBase64)) as DecodedJwtPayload;
  } catch (e) {
    console.error("Error decoding token:", e);
    return null;
  }
}

export function getRoleNameFromToken(tokenString?: string | null): RoleName {
  const decodedToken = getDecodedToken(tokenString);
  return decodedToken?.roleName as RoleName || ROLE_NAMES.ANONYMOUS;
}

export function getUserIdFromToken(tokenString?: string | null): string | null {
  const decodedToken = getDecodedToken(tokenString);
  return decodedToken?.userId || null;
}

export function isAuthenticated(tokenString?: string | null): boolean {
  const decodedToken = getDecodedToken(tokenString);
  if (!decodedToken || !decodedToken.exp) {
    return false;
  }
  const срокДействияВМиллисекундах = decodedToken.exp * 1000;
  return срокДействияВМиллисекундах > Date.now();
}

export function getTokenFromStorage(): string | null {
    if (typeof window !== 'undefined') {
        return localStorage.getItem("token");
    }
    return null;
}

export function saveTokenToStorage(token: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem("token", token);
        window.dispatchEvent(new CustomEvent("token-changed", { detail: { token } }));
    }
}

export function removeTokenFromStorage(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem("token");
        window.dispatchEvent(new CustomEvent("token-changed", { detail: { token: null } }));
    }
}