import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserList from './pages/UserList';
import UserStatistics from './pages/UserStatistics';
import ExerciseList from './pages/ExerciseList';
import MealList from './pages/MealList';
import MealPlanList from './pages/MealPlanList';
import SystemStatistics from './pages/SystemStatistics';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#92A3FD',
    },
    secondary: {
      main: '#C58BF2',
    },
    background: {
      default: '#F7F8F8',
      paper: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h5: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

// Component để redirect nếu đã đăng nhập
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Navigate to="/dashboard" replace />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Layout>
              <UserList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/user-statistics"
        element={
          <ProtectedRoute>
            <Layout>
              <UserStatistics />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/exercises"
        element={
          <ProtectedRoute>
            <Layout>
              <ExerciseList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/meals"
        element={
          <ProtectedRoute>
            <Layout>
              <MealList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/meal-plans"
        element={
          <ProtectedRoute>
            <Layout>
              <MealPlanList />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/system-statistics"
        element={
          <ProtectedRoute>
            <Layout>
              <SystemStatistics />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
