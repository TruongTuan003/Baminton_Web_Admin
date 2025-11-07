import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { userAPI } from '../services/api';

interface DashboardStats {
  totalUsers: number;
  totalTrainings: number;
  totalMeals: number;
  growthRate: number;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userAPI.getDashboardStatistics();
      setStats(response.data);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thống kê dashboard';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!stats) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
          Dashboard
        </Typography>
        <Alert severity="info">Không có dữ liệu thống kê</Alert>
      </Box>
    );
  }

  const statsCards = [
    {
      title: 'Tổng người dùng',
      value: stats.totalUsers.toLocaleString('vi-VN'),
      icon: <PeopleIcon />,
      color: '#92A3FD',
    },
    {
      title: 'Tổng bài tập',
      value: stats.totalTrainings.toLocaleString('vi-VN'),
      icon: <FitnessCenterIcon />,
      color: '#C58BF2',
    },
    {
      title: 'Tổng món ăn',
      value: stats.totalMeals.toLocaleString('vi-VN'),
      icon: <RestaurantIcon />,
      color: '#7ED7B5',
    },
    {
      title: 'Tăng trưởng',
      value: `${stats.growthRate >= 0 ? '+' : ''}${stats.growthRate}%`,
      icon: <TrendingUpIcon />,
      color: '#FF6B6B',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
        Dashboard
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 3,
        }}
      >
        {statsCards.map((stat, index) => (
          <Card
            key={index}
            sx={{
              height: '100%',
              background: `linear-gradient(135deg, ${stat.color}15 0%, ${stat.color}05 100%)`,
              border: `1px solid ${stat.color}30`,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                    {stat.value}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    backgroundColor: `${stat.color}20`,
                    borderRadius: 2,
                    p: 1.5,
                    color: stat.color,
                  }}
                >
                  {stat.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

