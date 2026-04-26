import {
  login,
  loginWithGoogle,
  register,
  logout,
  resetPassword,
} from '@/lib/firebase/auth';
import type { LoginDTO, RegisterDTO } from '@/types/dto/auth.dto';

class AuthService {
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
}

export const authService = new AuthService();
