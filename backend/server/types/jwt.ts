
import { JwtPayload } from 'jsonwebtoken';

export interface JwtPayloadWithIds extends JwtPayload {
  userId: string;
  roleId: string;
  roleName: string; 
  username?: string;
}