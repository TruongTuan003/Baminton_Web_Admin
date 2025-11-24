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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  FormControl,
  InputLabel,
  OutlinedInput,
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { mealPlanAPI, mealAPI } from '../services/api';

interface Meal {
  _id: string;
  name: string;
  mealType: string;
  goal: string;
  calories?: number;
  image_url?: string;
}

interface MealPlanMeal {
  dayOfWeek?: string;   // weekly
  dayNumber?: number;   // daily & monthly
  mealType: string;
  mealId: string;
  time?: string;
}

type MealPlanType = 'daily' | 'weekly' | 'monthly';

interface MealPlan {
  _id: string;
  name: string;
  description?: string;
  type: MealPlanType;
  goals: string[];
  goal?: string; // For backward compatibility with old data
  meals: MealPlanMeal[];
  isActive: boolean;
  createdAt: string;
}

const GOALS = [
  'Cải thiện thể chất',
  'Nâng cao kỹ năng cầu lông',
  'Quản lý hình thể và sức khỏe',
] as const;

export default function MealPlanList() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'weekly' as MealPlanType,
    goals: [] as string[],
  });
  const [planMeals, setPlanMeals] = useState<MealPlanMeal[]>([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMealPlans();
    fetchMeals();
  }, []);

  const fetchMealPlans = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await mealPlanAPI.getAllMealPlans();
      setMealPlans(response.data || []);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải danh sách thực đơn';
      setError(errorMessage);
      setMealPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeals = async () => {
    try {
      const response = await mealAPI.getAllMeals();
      setAllMeals(response.data || []);
    } catch (err) {
      console.error('Error fetching meals:', err);
    }
  };

  // Generate days cho từng loại
  const generateDays = (type: MealPlanType): { label: string; value: string | number }[] => {
    if (type === 'daily') {
      return [{ label: 'Hôm nay', value: 1 }];
    }
    if (type === 'weekly') {
      return [
        { label: 'Thứ 2', value: 'Thứ 2' },
        { label: 'Thứ 3', value: 'Thứ 3' },
        { label: 'Thứ 4', value: 'Thứ 4' },
        { label: 'Thứ 5', value: 'Thứ 5' },
        { label: 'Thứ 6', value: 'Thứ 6' },
        { label: 'Thứ 7', value: 'Thứ 7' },
        { label: 'Chủ nhật', value: 'Chủ nhật' },
      ];
    }
    // monthly
    return Array.from({ length: 30 }, (_, i) => ({
      label: `Ngày ${i + 1}`,
      value: i + 1,
    }));
  };

  // Tạo khung meals khi thay đổi type hoặc goals (chỉ khi tạo mới)
  useEffect(() => {
    if (formData.type && formData.goals.length > 0 && !selectedMealPlan) {
      const days = generateDays(formData.type);
      const mealTypes = ['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Bữa phụ'];

      const hasMeals = planMeals.length > 0;
      if (!hasMeals) {
        const newMeals: MealPlanMeal[] = [];
        days.forEach((d) => {
          const dayValue = d.value;
          mealTypes.forEach((mt) => {
            const meal: MealPlanMeal = {
              mealType: mt,
              mealId: '',
              time:
                mt === 'Bữa sáng' ? '07:00' :
                mt === 'Bữa trưa' ? '12:00' :
                mt === 'Bữa tối' ? '18:00' : '15:00',
            };
            if (formData.type === 'weekly') {
              meal.dayOfWeek = dayValue as string;
            } else {
              meal.dayNumber = dayValue as number;
            }
            newMeals.push(meal);
          });
        });
        setPlanMeals(newMeals);
      }
    } else if (formData.goals.length === 0 && !selectedMealPlan) {
      setPlanMeals([]);
    }
  }, [formData.type, formData.goals, selectedMealPlan]);

  const handleAdd = () => {
    setSelectedMealPlan(null);
    setFormData({
      name: '',
      description: '',
      type: 'weekly',
      goals: [],
    });
    setPlanMeals([]);
    setOpenDialog(true);
  };

  const handleEdit = async (mealPlan: MealPlan) => {
    setSelectedMealPlan(mealPlan);

    const normalizedMeals: MealPlanMeal[] = (mealPlan.meals || []).map((meal: any) => {
      let mealId = meal.mealId;
      if (meal.mealId && typeof meal.mealId === 'object') {
        mealId = meal.mealId._id || meal.mealId;
      }
      return {
        dayOfWeek: meal.dayOfWeek,
        dayNumber: meal.dayNumber,
        mealType: meal.mealType,
        mealId: mealId || '',
        time: meal.time || (
          meal.mealType === 'Bữa sáng' ? '07:00' :
          meal.mealType === 'Bữa trưa' ? '12:00' :
          meal.mealType === 'Bữa tối' ? '18:00' : '15:00'
        ),
      };
    });

    // Đảm bảo đủ khung cho tất cả các ngày
    const days = generateDays(mealPlan.type);
    const mealTypes = ['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Bữa phụ'];
    const completeMeals: MealPlanMeal[] = [];

    days.forEach((d) => {
      const dayValue = d.value;
      mealTypes.forEach((mt) => {
        const existing = normalizedMeals.find((m) => {
          if (mealPlan.type === 'weekly') {
            return m.dayOfWeek === dayValue && m.mealType === mt;
          }
          return m.dayNumber === dayValue && m.mealType === mt;
        });

        if (existing) {
          completeMeals.push(existing);
        } else {
          const newMeal: MealPlanMeal = {
            mealType: mt,
            mealId: '',
            time:
              mt === 'Bữa sáng' ? '07:00' :
              mt === 'Bữa trưa' ? '12:00' :
              mt === 'Bữa tối' ? '18:00' : '15:00',
          };
          if (mealPlan.type === 'weekly') {
            newMeal.dayOfWeek = dayValue as string;
          } else {
            newMeal.dayNumber = dayValue as number;
          }
          completeMeals.push(newMeal);
        }
      });
    });

    setPlanMeals(completeMeals);

    setFormData({
      name: mealPlan.name,
      description: mealPlan.description || '',
      type: mealPlan.type,
      goals: Array.isArray(mealPlan.goals) ? mealPlan.goals : mealPlan.goal ? [mealPlan.goal] : [],
    });

    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa thực đơn này?')) {
      try {
        await mealPlanAPI.deleteMealPlan(id);
        setSuccessMessage('Xóa thực đơn thành công!');
        await fetchMealPlans();
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể xóa thực đơn';
        setError(errorMessage);
      }
    }
  };

  // Khi đổi goals → xóa mealId không phù hợp
  useEffect(() => {
    if (formData.goals.length > 0 && planMeals.length > 0) {
      const updated = planMeals.map((meal) => {
        if (meal.mealId) {
          const selected = allMeals.find((m) => m._id === meal.mealId);
          if (selected && !formData.goals.includes(selected.goal)) {
            return { ...meal, mealId: '' };
          }
        }
        return meal;
      });
      setPlanMeals(updated);
    }
  }, [formData.goals]);

  const handleMealChange = (index: number, field: keyof MealPlanMeal, value: string) => {
    const updated = [...planMeals];
    updated[index] = { ...updated[index], [field]: value };
    setPlanMeals(updated);
  };

  const handleSave = async () => {
    try {
      setError('');

      if (!formData.name.trim()) {
        setError('Vui lòng nhập tên thực đơn');
        return;
      }
      if (formData.goals.length === 0) {
        setError('Vui lòng chọn ít nhất một mục tiêu');
        return;
      }

      const validMeals = planMeals.filter((m) => m.mealId && m.mealType);
      if (validMeals.length === 0) {
        setError('Vui lòng chọn ít nhất một món ăn cho thực đơn');
        return;
      }

      setSaving(true);
      const data = { ...formData, meals: validMeals };

      if (selectedMealPlan) {
        await mealPlanAPI.updateMealPlan(selectedMealPlan._id, data);
        setSuccessMessage('Cập nhật thực đơn thành công!');
      } else {
        await mealPlanAPI.createMealPlan(data);
        setSuccessMessage('Tạo thực đơn thành công!');
      }

      await fetchMealPlans();
      setOpenDialog(false);
      setSelectedMealPlan(null);
      setFormData({ name: '', description: '', type: 'weekly', goals: [] });
      setPlanMeals([]);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể lưu thực đơn';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Tên thực đơn', width: 200, flex: 1 },
    {
      field: 'type',
      headerName: 'Loại',
      width: 130,
      renderCell: (params) => (
        <Chip
          label={
            params.value === 'daily' ? 'Theo ngày' :
            params.value === 'weekly' ? 'Theo tuần' : 'Theo tháng'
          }
          size="small"
          color={
            params.value === 'daily' ? 'success' :
            params.value === 'weekly' ? 'primary' : 'secondary'
          }
          variant="outlined"
        />
      ),
    },
    {
      field: 'goals',
      headerName: 'Mục tiêu',
      width: 300,
      renderCell: (params) => {
        const goals = Array.isArray(params.value) ? params.value : params.row.goal ? [params.row.goal] : [];
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {goals.length > 0 ? (
              goals.map((goal: string, index: number) => (
                <Chip key={index} label={goal} size="small" variant="outlined" />
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                Chưa có
              </Typography>
            )}
          </Box>
        );
      },
    },
    {
      field: 'meals',
      headerName: 'Số bữa ăn',
      width: 120,
      valueGetter: (value: MealPlanMeal[]) => (value ? value.length : 0),
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
      field: 'createdAt',
      headerName: 'Ngày tạo',
      width: 180,
      renderCell: (params) => {
        if (!params.value) return '-';
        const date = new Date(params.value);
        const formattedDate = date.toLocaleDateString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
        return (
          <Typography variant="body2">
            {formattedDate}
          </Typography>
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Thao tác',
      width: 120,
      getActions: (params) => [
        <GridActionsCellItem icon={<EditIcon />} label="Sửa" onClick={() => handleEdit(params.row)} />,
        <GridActionsCellItem icon={<DeleteIcon />} label="Xóa" onClick={() => handleDelete(params.row._id)} showInMenu />,
      ],
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Quản lý thực đơn
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd}>
          Tạo thực đơn mới
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
            rows={mealPlans}
            columns={columns}
            getRowId={(row) => row._id}
            pageSizeOptions={[10, 25, 50]}
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            sx={{ '& .MuiDataGrid-cell:focus': { outline: 'none' } }}
          />
        )}
      </Paper>

      {/* Dialog tạo/sửa */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>{selectedMealPlan ? 'Sửa thực đơn' : 'Tạo thực đơn mới'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
              <TextField
                label="Tên thực đơn *"
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
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <FormControl fullWidth required>
                  <InputLabel>Loại thực đơn *</InputLabel>
                  <Select
                    value={formData.type}
                    label="Loại thực đơn *"
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as MealPlanType })}
                  >
                    <MenuItem value="daily">Theo ngày</MenuItem>
                    <MenuItem value="weekly">Theo tuần</MenuItem>
                    <MenuItem value="monthly">Theo tháng</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth required>
                  <InputLabel>Mục tiêu *</InputLabel>
                  <Select
                    multiple
                    value={formData.goals}
                    label="Mục tiêu *"
                    onChange={(e) => {
                      const value = typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value;
                      setFormData({ ...formData, goals: value });
                    }}
                    input={<OutlinedInput label="Mục tiêu *" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {GOALS.map((g) => (
                      <MenuItem key={g} value={g}>
                        {g}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {formData.type && formData.goals.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Chọn món ăn cho{' '}
                  {formData.type === 'daily'
                    ? 'ngày hôm nay'
                    : formData.type === 'weekly'
                    ? 'từng ngày trong tuần'
                    : 'từng ngày trong tháng'}
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 500, overflow: 'auto' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {formData.type === 'daily' ? 'Ngày' : formData.type === 'weekly' ? 'Thứ' : 'Ngày'}
                        </TableCell>
                        <TableCell>Bữa sáng</TableCell>
                        <TableCell>Bữa trưa</TableCell>
                        <TableCell>Bữa tối</TableCell>
                        <TableCell>Bữa phụ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {generateDays(formData.type).map((dayObj) => {
                        const dayValue = dayObj.value;
                        const dayLabel = dayObj.label;

                        const mealTypes = ['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Bữa phụ'];

                        return (
                          <TableRow key={dayValue}>
                            <TableCell sx={{ fontWeight: 600 }}>{dayLabel}</TableCell>
                            {mealTypes.map((mealType) => {
                              const meal = planMeals.find((m) => {
                                if (formData.type === 'daily' || formData.type === 'monthly') {
                                  return m.dayNumber === dayValue && m.mealType === mealType;
                                }
                                return m.dayOfWeek === dayValue && m.mealType === mealType;
                              });

                              const index = planMeals.findIndex((m) => {
                                if (formData.type === 'daily' || formData.type === 'monthly') {
                                  return m.dayNumber === dayValue && m.mealType === mealType;
                                }
                                return m.dayOfWeek === dayValue && m.mealType === mealType;
                              });

                              let filteredMeals = allMeals.filter((m) => m.mealType === mealType);
                              if (formData.goals.length > 0) {
                                filteredMeals = filteredMeals.filter((m) => formData.goals.includes(m.goal));
                              }

                              return (
                                <TableCell key={mealType} sx={{ py: 0.5 }}>
                                  <Select
                                    size="small"
                                    fullWidth
                                    value={meal?.mealId || ''}
                                    onChange={(e) => {
                                      const newId = e.target.value;
                                      if (index >= 0) {
                                        handleMealChange(index, 'mealId', newId);
                                      } else {
                                        const newMeal: MealPlanMeal = {
                                          mealType,
                                          mealId: newId,
                                          time:
                                            mealType === 'Bữa sáng' ? '07:00' :
                                            mealType === 'Bữa trưa' ? '12:00' :
                                            mealType === 'Bữa tối' ? '18:00' : '15:00',
                                        };
                                        if (formData.type === 'weekly') {
                                          newMeal.dayOfWeek = dayValue as string;
                                        } else {
                                          newMeal.dayNumber = dayValue as number;
                                        }
                                        setPlanMeals([...planMeals, newMeal]);
                                      }
                                    }}
                                    displayEmpty
                                    disabled={formData.goals.length === 0}
                                  >
                                    <MenuItem value="">
                                      <em>{formData.goals.length > 0 ? 'Chọn món' : 'Chọn mục tiêu trước'}</em>
                                    </MenuItem>
                                    {filteredMeals.length > 0 ? (
                                      filteredMeals.map((m) => (
                                        <MenuItem key={m._id} value={m._id}>
                                          {m.name}
                                        </MenuItem>
                                      ))
                                    ) : (
                                      <MenuItem value="" disabled>
                                        <em>Không có món phù hợp</em>
                                      </MenuItem>
                                    )}
                                  </Select>
                                </TableCell>
                              );
                            })}
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