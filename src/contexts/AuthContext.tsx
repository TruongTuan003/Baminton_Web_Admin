import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra token và user từ localStorage khi app khởi động
    const savedToken = localStorage.getItem('admin_token');
    const savedUser = localStorage.getItem('admin_user');

    if (savedToken && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(userData);
      } catch (error) {
        // Nếu parse lỗi, xóa dữ liệu không hợp lệ
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { authAPI } = await import('../services/api');
      const response = await authAPI.login(email, password);
      const { token: newToken, user: userData } = response.data;

      // Kiểm tra role
      if (userData.role !== 'admin') {
        throw new Error('Bạn không có quyền truy cập. Vui lòng sử dụng ứng dụng di động.');
      }

      // Lưu token và user vào localStorage
      localStorage.setItem('admin_token', newToken);
      localStorage.setItem('admin_user', JSON.stringify(userData));

      setToken(newToken);
      setUser(userData);
    } catch (error: any) {
      // Xử lý lỗi từ axios response
      let errorMessage = 'Đăng nhập thất bại. Vui lòng thử lại.';
      
      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.status === 401) {
        errorMessage = 'Sai email hoặc mật khẩu';
      } else if (error?.response?.status === 403) {
        errorMessage = error.response.data?.message || 'Bạn không có quyền truy cập';
      } else if (error?.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Thông tin đăng nhập không hợp lệ';
      } else if (error?.response?.status >= 500) {
        errorMessage = 'Lỗi máy chủ. Vui lòng thử lại sau.';
      } else if (!error?.response) {
        errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
      }
      
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token && !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

