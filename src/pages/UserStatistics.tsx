import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { userAPI } from '../services/api';

const COLORS = ['#92A3FD', '#C58BF2', '#7ED7B5', '#FF6B6B', '#FFA726'];

interface StatisticsData {
  overview: {
    totalUsers: number;
    newUsersThisMonth: number;
    activeUsers: number;
    retentionRate: number;
  };
  userGrowth: Array<{ month: string; users: number }>;
  userActivity: Array<{ day: string; active: number; new: number }>;
  ageDistribution: Array<{ name: string; value: number }>;
}

export default function UserStatistics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState<StatisticsData | null>(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userAPI.getStatistics();
      setData(response.data);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải thống kê';
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
          Thống kê người dùng
        </Typography>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
          Thống kê người dùng
        </Typography>
        <Alert severity="info">Không có dữ liệu thống kê</Alert>
      </Box>
    );
  }

  const { overview, userGrowth, userActivity, ageDistribution } = data;
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700 }}>
        Thống kê người dùng
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(2, 1fr)',
          },
          gap: 3,
        }}
      >
        <Box>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Tăng trưởng người dùng (6 tháng gần nhất)
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="#92A3FD" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        <Box>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Hoạt động theo tuần
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="active" fill="#92A3FD" name="Người dùng hoạt động" />
                <Bar dataKey="new" fill="#C58BF2" name="Người dùng mới" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        <Box>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Phân bố độ tuổi
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ageDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name}: ${((props.percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ageDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Box>

        <Box>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Tổng quan
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 2,
                mt: 1,
              }}
            >
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Tổng người dùng
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    {overview.totalUsers.toLocaleString('vi-VN')}
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Người dùng mới (tháng này)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'secondary.main' }}>
                    {overview.newUsersThisMonth.toLocaleString('vi-VN')}
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Người dùng hoạt động
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                    {overview.activeUsers.toLocaleString('vi-VN')}
                  </Typography>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Tỷ lệ giữ chân
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: 'warning.main' }}>
                    {overview.retentionRate}%
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

