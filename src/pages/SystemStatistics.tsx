import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { userAPI } from '../services/api';

interface SystemStatisticsData {
  systemUsage: Array<{ month: string; users: number; exercises: number; meals: number }>;
  dailyActivity: Array<{ day: string; logins: number; workouts: number; meals: number }>;
  featureUsage: Array<{ feature: string; usage: number; color: string }>;
  overview: {
    totalVisits: number;
    completedWorkouts: number;
    scheduledMeals: number;
    completionRate: number;
    visitsGrowth: number;
    workoutsGrowth: number;
    mealsGrowth: number;
    completionRateGrowth: number;
  };
}

export default function SystemStatistics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<SystemStatisticsData | null>(null);

  useEffect(() => {
    fetchSystemStatistics();
  }, []);

  const fetchSystemStatistics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userAPI.getSystemStatistics();
      setData(response.data);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thống kê hệ thống';
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
          Thống kê hệ thống
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
          Thống kê hệ thống
        </Typography>
        <Alert severity="info">Không có dữ liệu thống kê</Alert>
      </Box>
    );
  }

  const { systemUsage, dailyActivity, featureUsage, overview } = data;
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
        Thống kê hệ thống
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(12, 1fr)',
          },
          gap: 3,
        }}
      >
        <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Tăng trưởng hệ thống
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={systemUsage}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="users" stackId="1" stroke="#92A3FD" fill="#92A3FD" fillOpacity={0.6} name="Người dùng" />
                <Area type="monotone" dataKey="exercises" stackId="2" stroke="#C58BF2" fill="#C58BF2" fillOpacity={0.6} name="Bài tập" />
                <Area type="monotone" dataKey="meals" stackId="3" stroke="#7ED7B5" fill="#7ED7B5" fillOpacity={0.6} name="Món ăn" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        <Box sx={{ gridColumn: { xs: '1', md: '1 / 9' } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Hoạt động hàng ngày
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="logins" fill="#92A3FD" name="Đăng nhập" />
                <Bar dataKey="workouts" fill="#C58BF2" name="Bài tập" />
                <Bar dataKey="meals" fill="#7ED7B5" name="Bữa ăn" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        <Box sx={{ gridColumn: { xs: '1', md: '9 / -1' } }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Sử dụng tính năng
            </Typography>
            <Box sx={{ mt: 3 }}>
              {featureUsage.map((item, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">{item.feature}</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.usage}%
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      height: 8,
                      backgroundColor: 'grey.200',
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        height: '100%',
                        width: `${item.usage}%`,
                        backgroundColor: item.color,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>

        <Box sx={{ gridColumn: { xs: '1', md: '1 / 4' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tổng lượt truy cập
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {overview.totalVisits.toLocaleString('vi-VN')}
              </Typography>
              <Typography variant="body2" color={overview.visitsGrowth >= 0 ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                {overview.visitsGrowth >= 0 ? '+' : ''}{overview.visitsGrowth}% so với tháng trước
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: '1', md: '4 / 7' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Bài tập hoàn thành
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                {overview.completedWorkouts.toLocaleString('vi-VN')}
              </Typography>
              <Typography variant="body2" color={overview.workoutsGrowth >= 0 ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                {overview.workoutsGrowth >= 0 ? '+' : ''}{overview.workoutsGrowth}% so với tháng trước
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: '1', md: '7 / 10' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Bữa ăn đã lên lịch
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                {overview.scheduledMeals.toLocaleString('vi-VN')}
              </Typography>
              <Typography variant="body2" color={overview.mealsGrowth >= 0 ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                {overview.mealsGrowth >= 0 ? '+' : ''}{overview.mealsGrowth}% so với tháng trước
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ gridColumn: { xs: '1', md: '10 / -1' } }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Tỷ lệ hoàn thành
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                {overview.completionRate}%
              </Typography>
              <Typography variant="body2" color={overview.completionRateGrowth >= 0 ? 'success.main' : 'error.main'} sx={{ mt: 1 }}>
                {overview.completionRateGrowth >= 0 ? '+' : ''}{overview.completionRateGrowth}% so với tháng trước
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

