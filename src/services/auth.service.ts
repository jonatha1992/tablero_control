import {
  login,
  loginWithGoogle,
  register,
  logout,
  resetPassword,
} from '@/lib/firebase/auth';
import { userRepository } from '@/repositories';
import type { User } from '@/types/domain/user';
import type { LoginDTO, RegisterDTO } from '@/types/dto/auth.dto';

export class AuthService {
  async login(dto: LoginDTO) {
    return login(dto.email, dto.password);
  }

  async loginWithGoogle() {
    return loginWithGoogle();
  }

  async register(dto: RegisterDTO) {
    return register(dto.email, dto.password, dto.name, dto.role);
  }

  async logout() {
    return logout();
  }

  async resetPassword(email: string) {
    return resetPassword(email);
  }

  async getUserProfile(uid: string): Promise<User | null> {
    return userRepository.findById(uid);
  }
}

export const authService = new AuthService();
