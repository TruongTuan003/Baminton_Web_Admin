import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  MenuItem,
  Chip,
  Snackbar,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  FormControl,
  InputLabel,
  Stack,
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { trainingPlanAPI, trainingAPI } from '../services/api';

interface Training {
  _id: string;
  title: string;
  level: string;
  goal?: string;
  duration_minutes?: number;
}

interface PlanWorkout {
  day: number; // daily:1-7, weekly:0-6, monthly:1-30
  trainingId: string;
  time?: string;
  note?: string;
}

interface TrainingPlan {
  _id: string;
  name: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly';
  level: string;
  goal?: string;
  planDays: {
    day: number;
    workouts: {
      trainingId: string | { _id: string; title: string };
      time?: string;
      note?: string;
      order: number;
    }[];
  }[];
  isActive: boolean;
  createdAt: string;
}

const DAY_NAMES = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
const WEEKDAY_INDICES = [1, 2, 3, 4, 5, 6, 0]; // T2=1, T3=2, ..., CN=0

export default function TrainingPlanList() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const [allTrainings, setAllTrainings] = useState<Training[]>([]);
  const [availableGoals, setAvailableGoals] = useState<string[]>([]);
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'weekly' as 'daily' | 'weekly' | 'monthly',
    level: '',
    goal: '',
  });
  const [planWorkouts, setPlanWorkouts] = useState<PlanWorkout[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchTrainings();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await trainingPlanAPI.getAllTrainingPlans();
      setPlans(response.data || []);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải danh sách kế hoạch';
      setError(errorMessage);
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrainings = async () => {
    try {
      const response = await trainingAPI.getAllTrainings();
      const trainings = response.data || [];
      setAllTrainings(trainings);
      
      // Lấy danh sách goals từ trainings
      const goalsSet = new Set<string>();
      trainings.forEach((training: Training) => {
        if (training.goal) {
          goalsSet.add(training.goal);
        }
      });
      setAvailableGoals(Array.from(goalsSet).sort());
      
      // Lấy danh sách levels từ trainings
      const levelsSet = new Set<string>();
      trainings.forEach((training: Training) => {
        if (training.level) {
          levelsSet.add(training.level);
        }
      });
      setAvailableLevels(Array.from(levelsSet).sort());
    } catch (err) {
      console.error('Error fetching trainings:', err);
    }
  };

  // Lấy số ngày theo type
  const getDaysForType = (type: 'daily' | 'weekly' | 'monthly'): number[] => {
    if (type === 'daily') {
      return [1]; // Chỉ 1 ngày
    } else if (type === 'weekly') {
      return WEEKDAY_INDICES; // [1,2,3,4,5,6,0]
    } else {
      return Array.from({ length: 30 }, (_, i) => i + 1); // 1-30
    }
  };

  // Lấy tên ngày
  const getDayName = (day: number, type: 'daily' | 'weekly' | 'monthly'): string => {
    if (type === 'daily') {
      return `Ngày ${day}`;
    } else if (type === 'weekly') {
      return DAY_NAMES[day];
    } else {
      return `Ngày ${day}`;
    }
  };

  const handleAdd = () => {
    setSelectedPlan(null);
    setFormData({
      name: '',
      description: '',
      type: 'weekly',
      level: '',
      goal: '',
    });
    setPlanWorkouts([]);
    setOpenDialog(true);
  };

  const handleEdit = async (plan: TrainingPlan) => {
    setSelectedPlan(plan);
    
    // Chuyển đổi planDays thành planWorkouts
    const workouts: PlanWorkout[] = [];
    (plan.planDays || []).forEach((planDay) => {
      planDay.workouts.forEach((workout) => {
        let trainingId = workout.trainingId;
        if (typeof trainingId === 'object') {
          trainingId = trainingId._id;
        }
        workouts.push({
          day: planDay.day,
          trainingId: trainingId as string,
          time: workout.time || '07:00',
          note: workout.note || '',
        });
      });
    });
    
    setPlanWorkouts(workouts);
    
    setFormData({
      name: plan.name,
      description: plan.description || '',
      type: plan.type,
      level: plan.level,
      goal: plan.goal || '',
    });
    
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa kế hoạch này?')) {
      try {
        await trainingPlanAPI.deleteTrainingPlan(id);
        setSuccessMessage('Xóa kế hoạch thành công!');
        await fetchPlans();
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể xóa kế hoạch';
        setError(errorMessage);
      }
    }
  };

  // Thêm workout cho một ngày
  const handleAddWorkout = (day: number) => {
    setPlanWorkouts([
      ...planWorkouts,
      {
        day,
        trainingId: '',
        time: '07:00',
        note: '',
      },
    ]);
  };

  // Xóa workout
  const handleRemoveWorkout = (index: number) => {
    setPlanWorkouts(planWorkouts.filter((_, i) => i !== index));
  };

  // Cập nhật workout
  const handleWorkoutChange = (index: number, field: keyof PlanWorkout, value: any) => {
    const updated = [...planWorkouts];
    updated[index] = { ...updated[index], [field]: value };
    setPlanWorkouts(updated);
  };

  const handleSave = async () => {
    try {
      setError('');
      
      // Validation
      if (!formData.name.trim()) {
        setError('Vui lòng nhập tên kế hoạch');
        return;
      }
      if (!formData.level) {
        setError('Vui lòng chọn cấp độ');
        return;
      }
      
      const validWorkouts = planWorkouts.filter(w => w.trainingId);
      
      if (validWorkouts.length === 0) {
        setError('Vui lòng thêm ít nhất một bài tập cho kế hoạch');
        return;
      }

      setSaving(true);
      
      // Chuyển đổi planWorkouts thành planDays
      const planDaysMap: Map<number, { trainingId: string; time?: string; note?: string; order: number }[]> = new Map();
      
      validWorkouts.forEach((workout, index) => {
        if (!planDaysMap.has(workout.day)) {
          planDaysMap.set(workout.day, []);
        }
        planDaysMap.get(workout.day)!.push({
          trainingId: workout.trainingId,
          time: workout.time,
          note: workout.note || undefined,
          order: index,
        });
      });
      
      const planDays = Array.from(planDaysMap.entries()).map(([day, workouts]) => ({
        day,
        workouts,
      }));
      
      const data = {
        ...formData,
        planDays,
      };

      if (selectedPlan) {
        await trainingPlanAPI.updateTrainingPlan(selectedPlan._id, data);
        setSuccessMessage('Cập nhật kế hoạch thành công!');
      } else {
        await trainingPlanAPI.createTrainingPlan(data);
        setSuccessMessage('Tạo kế hoạch thành công!');
      }

      await fetchPlans();
      setOpenDialog(false);
      setSelectedPlan(null);
      setFormData({
        name: '',
        description: '',
        type: 'weekly',
        level: '',
        goal: '',
      });
      setPlanWorkouts([]);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể lưu kế hoạch';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Tên kế hoạch', width: 200, flex: 1 },
    {
      field: 'type',
      headerName: 'Loại',
      width: 120,
      renderCell: (params) => {
        const typeMap: Record<string, string> = {
          daily: 'Hàng ngày',
          weekly: 'Hàng tuần',
          monthly: 'Hàng tháng'
        };
        return (
          <Chip
            label={typeMap[params.value] || params.value}
            size="small"
            color={params.value === 'weekly' ? 'primary' : 'secondary'}
          />
        );
      },
    },
    {
      field: 'level',
      headerName: 'Cấp độ',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    { field: 'goal', headerName: 'Mục tiêu', width: 150 },
    {
      field: 'planDays',
      headerName: 'Số bài tập',
      width: 120,
      valueGetter: (value: any[]) => {
        if (!Array.isArray(value)) return 0;
        return value.reduce((total, day) => total + (day.workouts?.length || 0), 0);
      },
    },
    {
      field: 'isActive',
      headerName: 'Trạng thái',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Hoạt động' : 'Tạm dừng'}
          size="small"
          color={params.value ? 'success' : 'default'}
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Thao tác',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Sửa"
          onClick={() => handleEdit(params.row)}
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Xóa"
          onClick={() => handleDelete(params.row._id)}
          showInMenu
        />,
      ],
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Quản lý kế hoạch tập luyện
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Tạo kế hoạch mới
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      <Paper sx={{ height: 600, width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={plans}
            columns={columns}
            getRowId={(row) => row._id}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            sx={{
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
            }}
          />
        )}
      </Paper>

      {/* Dialog tạo/sửa kế hoạch */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{selectedPlan ? 'Sửa kế hoạch tập' : 'Tạo kế hoạch tập mới'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
              <TextField
                label="Tên kế hoạch *"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <TextField
                label="Mô tả"
                fullWidth
                multiline
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <FormControl fullWidth required>
                  <InputLabel>Loại kế hoạch *</InputLabel>
                  <Select
                    value={formData.type}
                    label="Loại kế hoạch *"
                    onChange={(e) => {
                      setFormData({ ...formData, type: e.target.value as any });
                      setPlanWorkouts([]); // Clear workouts khi đổi type
                    }}
                  >
                    <MenuItem value="daily">Hàng ngày (1 ngày)</MenuItem>
                    <MenuItem value="weekly">Hàng tuần (7 ngày)</MenuItem>
                    <MenuItem value="monthly">Hàng tháng (30 ngày)</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth required>
                  <InputLabel>Cấp độ *</InputLabel>
                  <Select
                    value={formData.level}
                    label="Cấp độ *"
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  >
                    {availableLevels.length > 0 ? (
                      availableLevels.map((level) => (
                        <MenuItem key={level} value={level}>
                          {level}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem value="" disabled>
                        Không có cấp độ
                      </MenuItem>
                    )}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Mục tiêu</InputLabel>
                  <Select
                    value={formData.goal}
                    label="Mục tiêu"
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  >
                    <MenuItem value="">Tất cả</MenuItem>
                    {availableGoals.map((goal) => (
                      <MenuItem key={goal} value={goal}>
                        {goal}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {formData.type && formData.level && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Chọn bài tập cho {
                    formData.type === 'daily' ? '1 ngày' : 
                    formData.type === 'weekly' ? 'từng ngày trong tuần' : 
                    '30 ngày trong tháng'
                  }
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="15%">Ngày</TableCell>
                        <TableCell width="35%">Bài tập</TableCell>
                        <TableCell width="15%">Giờ</TableCell>
                        <TableCell width="25%">Ghi chú</TableCell>
                        <TableCell width="10%">Xóa</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getDaysForType(formData.type).map((dayValue) => {
                        const dayWorkouts = planWorkouts
                          .map((w, i) => ({ ...w, originalIndex: i }))
                          .filter(w => w.day === dayValue);
                        
                        // Lọc bài tập theo level và goal
                        let filteredTrainings = allTrainings.filter(
                          t => t.level === formData.level
                        );
                        
                        if (formData.goal) {
                          filteredTrainings = filteredTrainings.filter(
                            t => t.goal === formData.goal
                          );
                        }

                        return (
                          <TableRow key={dayValue}>
                            <TableCell>
                              <Stack spacing={1}>
                                <Typography variant="body2" fontWeight="bold">
                                  {getDayName(dayValue, formData.type)}
                                </Typography>
                                <Button
                                  size="small"
                                  startIcon={<AddIcon />}
                                  onClick={() => handleAddWorkout(dayValue)}
                                >
                                  Thêm
                                </Button>
                              </Stack>
                            </TableCell>
                            <TableCell colSpan={4}>
                              {dayWorkouts.length === 0 ? (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                  Chưa có bài tập
                                </Typography>
                              ) : (
                                <Table size="small">
                                  <TableBody>
                                    {dayWorkouts.map((workout) => (
                                      <TableRow key={workout.originalIndex}>
                                        <TableCell width="35%">
                                          <Select
                                            size="small"
                                            fullWidth
                                            value={workout.trainingId}
                                            onChange={(e) => handleWorkoutChange(workout.originalIndex, 'trainingId', e.target.value)}
                                            displayEmpty
                                          >
                                            <MenuItem value="">
                                              <em>Chọn bài tập</em>
                                            </MenuItem>
                                            {filteredTrainings.length > 0 ? (
                                              filteredTrainings.map((t) => (
                                                <MenuItem key={t._id} value={t._id}>
                                                  {t.title} ({t.duration_minutes || 0} phút)
                                                </MenuItem>
                                              ))
                                            ) : (
                                              <MenuItem value="" disabled>
                                                <em>Không có bài tập phù hợp</em>
                                              </MenuItem>
                                            )}
                                          </Select>
                                        </TableCell>
                                        <TableCell width="15%">
                                          <TextField
                                            size="small"
                                            type="time"
                                            value={workout.time || ''}
                                            onChange={(e) => handleWorkoutChange(workout.originalIndex, 'time', e.target.value)}
                                            fullWidth
                                          />
                                        </TableCell>
                                        <TableCell width="25%">
                                          <TextField
                                            size="small"
                                            placeholder="Ghi chú (tùy chọn)"
                                            value={workout.note || ''}
                                            onChange={(e) => handleWorkoutChange(workout.originalIndex, 'note', e.target.value)}
                                            fullWidth
                                          />
                                        </TableCell>
                                        <TableCell width="15%">
                                          <IconButton
                                            size="small"
                                            color="error"
                                            onClick={() => handleRemoveWorkout(workout.originalIndex)}
                                          >
                                            <RemoveCircleOutlineIcon />
                                          </IconButton>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={saving}>
            Hủy
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
