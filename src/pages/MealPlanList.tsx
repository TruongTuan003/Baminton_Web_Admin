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
  dayOfWeek?: string; // Cho weekly: "Thứ 2", "Thứ 3", ..., "Chủ nhật"
  dayNumber?: number; // Cho monthly: 1, 2, 3, ..., 30
  mealType: string;
  mealId: string;
  time?: string;
}

interface MealPlan {
  _id: string;
  name: string;
  description?: string;
  type: 'weekly' | 'monthly';
  goal: string;
  meals: MealPlanMeal[];
  isActive: boolean;
  createdAt: string;
}

export default function MealPlanList() {
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMealPlan, setSelectedMealPlan] = useState<MealPlan | null>(null);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'weekly' as 'weekly' | 'monthly',
    goal: '',
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

  // Generate days cho weekly hoặc monthly
  const generateDays = (type: 'weekly' | 'monthly'): string[] | number[] => {
    if (type === 'weekly') {
      return ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    } else {
      return Array.from({ length: 30 }, (_, i) => i + 1);
    }
  };

  // Khi type hoặc goal thay đổi, chỉ tạo meals mới nếu đang tạo mới (không có selectedMealPlan)
  useEffect(() => {
    // Chỉ tạo meals mới khi đang tạo mới (không có selectedMealPlan)
    if (formData.type && formData.goal && !selectedMealPlan) {
      const days = generateDays(formData.type);
      const mealTypes = ['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Bữa phụ'];
      
      // Kiểm tra xem đã có meals chưa (tránh tạo lại khi đã có)
      const hasMeals = planMeals.length > 0 && planMeals.some(m => 
        (formData.type === 'weekly' ? m.dayOfWeek : m.dayNumber !== undefined)
      );
      
      if (!hasMeals) {
        const newMeals: MealPlanMeal[] = [];
        days.forEach((day) => {
          mealTypes.forEach((mealType) => {
            const meal: MealPlanMeal = {
              mealType,
              mealId: '',
              time: mealType === 'Bữa sáng' ? '07:00' : mealType === 'Bữa trưa' ? '12:00' : mealType === 'Bữa tối' ? '18:00' : '15:00',
            };
            
            if (formData.type === 'weekly') {
              meal.dayOfWeek = day as string;
            } else {
              meal.dayNumber = day as number;
            }
            
            newMeals.push(meal);
          });
        });
        
        setPlanMeals(newMeals);
      }
    } else if (formData.type && !formData.goal && !selectedMealPlan) {
      // Nếu chưa có goal và không đang edit, clear planMeals
      setPlanMeals([]);
    }
  }, [formData.type, formData.goal, selectedMealPlan]);

  const handleAdd = () => {
    setSelectedMealPlan(null);
    setFormData({
      name: '',
      description: '',
      type: 'weekly',
      goal: '',
    });
    setPlanMeals([]);
    setOpenDialog(true);
  };

  const handleEdit = async (mealPlan: MealPlan) => {
    // Set selectedMealPlan trước để useEffect không override
    setSelectedMealPlan(mealPlan);
    
    // Chuẩn hóa meals từ backend: đảm bảo mealId là string
    const normalizedMeals: MealPlanMeal[] = (mealPlan.meals || []).map((meal: any) => {
      // Nếu mealId là object (đã populate), lấy _id
      let mealId = meal.mealId;
      if (meal.mealId && typeof meal.mealId === 'object') {
        mealId = meal.mealId._id || meal.mealId;
      }
      
      return {
        dayOfWeek: meal.dayOfWeek,
        dayNumber: meal.dayNumber,
        mealType: meal.mealType,
        mealId: mealId || '',
        time: meal.time || (meal.mealType === 'Bữa sáng' ? '07:00' : meal.mealType === 'Bữa trưa' ? '12:00' : meal.mealType === 'Bữa tối' ? '18:00' : '15:00'),
      };
    });
    
    // Đảm bảo có đủ meals cho tất cả các ngày
    const days = generateDays(mealPlan.type);
    const mealTypes = ['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Bữa phụ'];
    const completeMeals: MealPlanMeal[] = [];
    
    days.forEach((day) => {
      mealTypes.forEach((mealType) => {
        const existing = normalizedMeals.find((m) => {
          if (mealPlan.type === 'weekly') {
            return m.dayOfWeek === day && m.mealType === mealType;
          } else {
            return m.dayNumber === day && m.mealType === mealType;
          }
        });
        
        if (existing) {
          completeMeals.push(existing);
        } else {
          // Tạo meal mới nếu chưa có
          const newMeal: MealPlanMeal = {
            mealType,
            mealId: '',
            time: mealType === 'Bữa sáng' ? '07:00' : mealType === 'Bữa trưa' ? '12:00' : mealType === 'Bữa tối' ? '18:00' : '15:00',
          };
          
          if (mealPlan.type === 'weekly') {
            newMeal.dayOfWeek = day as string;
          } else {
            newMeal.dayNumber = day as number;
          }
          
          completeMeals.push(newMeal);
        }
      });
    });
    
    // Set planMeals với đầy đủ meals
    setPlanMeals(completeMeals);
    
    // Set formData sau
    setFormData({
      name: mealPlan.name,
      description: mealPlan.description || '',
      type: mealPlan.type,
      goal: mealPlan.goal,
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


  // Khi goal thay đổi, cập nhật lại planMeals để clear các mealId không phù hợp
  useEffect(() => {
    if (formData.goal && planMeals.length > 0) {
      const updatedMeals = planMeals.map(meal => {
        // Nếu mealId đã chọn nhưng không phù hợp với goal mới, clear nó
        if (meal.mealId) {
          const selectedMeal = allMeals.find(m => m._id === meal.mealId);
          if (selectedMeal && selectedMeal.goal !== formData.goal) {
            return { ...meal, mealId: '' };
          }
        }
        return meal;
      });
      setPlanMeals(updatedMeals);
    }
  }, [formData.goal]);

  const handleMealChange = (index: number, field: keyof MealPlanMeal, value: string) => {
    const updated = [...planMeals];
    updated[index] = { ...updated[index], [field]: value };
    setPlanMeals(updated);
  };

  const handleSave = async () => {
    try {
      setError('');
      
      // Validation
      if (!formData.name.trim()) {
        setError('Vui lòng nhập tên thực đơn');
        return;
      }
      if (!formData.goal) {
        setError('Vui lòng chọn mục tiêu');
        return;
      }
      
      const validMeals = planMeals.filter(m => {
        if (!m.mealId || !m.mealType) return false;
        if (formData.type === 'weekly') {
          return m.dayOfWeek !== undefined;
        } else {
          return m.dayNumber !== undefined;
        }
      });
      
      if (validMeals.length === 0) {
        setError('Vui lòng chọn ít nhất một món ăn cho thực đơn');
        return;
      }

      setSaving(true);
      const data = {
        ...formData,
        meals: validMeals,
      };

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
      setFormData({
        name: '',
        description: '',
        type: 'weekly',
        goal: '',
      });
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
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value === 'weekly' ? 'Theo tuần' : 'Theo tháng'}
          size="small"
          color={params.value === 'weekly' ? 'primary' : 'secondary'}
        />
      ),
    },
    {
      field: 'goal',
      headerName: 'Mục tiêu',
      width: 150,
      renderCell: (params) => (
        <Chip label={params.value} size="small" variant="outlined" />
      ),
    },
    {
      field: 'meals',
      headerName: 'Số bữa ăn',
      width: 120,
      valueGetter: (value: MealPlanMeal[]) => (value && Array.isArray(value) ? value.length : 0),
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

  const goals = ['Giảm cân', 'Tăng cơ', 'Duy trì sức khỏe'];

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

      {/* Dialog tạo/sửa thực đơn */}
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
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as 'weekly' | 'monthly' })}
                  >
                    <MenuItem value="weekly">Theo tuần</MenuItem>
                    <MenuItem value="monthly">Theo tháng</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth required>
                  <InputLabel>Mục tiêu *</InputLabel>
                  <Select
                    value={formData.goal}
                    label="Mục tiêu *"
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  >
                    {goals.map((goal) => (
                      <MenuItem key={goal} value={goal}>
                        {goal}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {formData.type && formData.goal && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Chọn món ăn cho {formData.type === 'weekly' ? 'từng ngày trong tuần' : 'từng ngày trong tháng'}
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{formData.type === 'weekly' ? 'Thứ' : 'Ngày'}</TableCell>
                        <TableCell>Bữa sáng</TableCell>
                        <TableCell>Bữa trưa</TableCell>
                        <TableCell>Bữa tối</TableCell>
                        <TableCell>Bữa phụ</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {generateDays(formData.type).map((day) => {
                        const mealTypes = ['Bữa sáng', 'Bữa trưa', 'Bữa tối', 'Bữa phụ'];
                        return (
                          <TableRow key={day}>
                            <TableCell>
                              {formData.type === 'weekly' ? day : `Ngày ${day}`}
                            </TableCell>
                            {mealTypes.map((mealType) => {
                              const meal = planMeals.find((m) => {
                                if (formData.type === 'weekly') {
                                  return m.dayOfWeek === day && m.mealType === mealType;
                                } else {
                                  return m.dayNumber === day && m.mealType === mealType;
                                }
                              });
                              
                              const index = planMeals.findIndex((m) => {
                                if (formData.type === 'weekly') {
                                  return m.dayOfWeek === day && m.mealType === mealType;
                                } else {
                                  return m.dayNumber === day && m.mealType === mealType;
                                }
                              });
                              
                              // Filter meals: theo mealType và goal
                              let filteredMeals = allMeals.filter(
                                (m) => m.mealType === mealType
                              );
                              
                              if (formData.goal) {
                                filteredMeals = filteredMeals.filter(
                                  (m) => m.goal === formData.goal
                                );
                              }

                              return (
                                <TableCell key={mealType}>
                                  <Select
                                    size="small"
                                    fullWidth
                                    value={meal?.mealId || ''}
                                    onChange={(e) => {
                                      if (index >= 0) {
                                        handleMealChange(index, 'mealId', e.target.value);
                                      } else {
                                        const newMeal: MealPlanMeal = {
                                          mealType,
                                          mealId: e.target.value,
                                          time:
                                            mealType === 'Bữa sáng'
                                              ? '07:00'
                                              : mealType === 'Bữa trưa'
                                              ? '12:00'
                                              : mealType === 'Bữa tối'
                                              ? '18:00'
                                              : '15:00',
                                        };
                                        
                                        if (formData.type === 'weekly') {
                                          newMeal.dayOfWeek = day as string;
                                        } else {
                                          newMeal.dayNumber = day as number;
                                        }
                                        
                                        setPlanMeals([...planMeals, newMeal]);
                                      }
                                    }}
                                    displayEmpty
                                    disabled={!formData.goal}
                                  >
                                    <MenuItem value="">
                                      <em>{formData.goal ? 'Chọn món' : 'Chọn mục tiêu trước'}</em>
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

