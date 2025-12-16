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
  dayOfWeek?: string;
  dayNumber?: number;
  mealType: string;
  mealId: string | Meal;
  time?: string;
}

type MealPlanType = 'daily' | 'weekly' | 'monthly';

interface MealPlan {
  _id: string;
  name: string;
  description?: string;
  type: MealPlanType;
  goals: string[];
  goal?: string;
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
      
      // Backend trả về trực tiếp array (không có wrapper)
      const mealPlansData = Array.isArray(response.data) 
        ? response.data 
        : Array.isArray(response) 
        ? response 
        : [];
      
      console.log('📦 Fetched meal plans:', mealPlansData);
      console.log('📦 Total:', mealPlansData.length);
      
      // Log sample để check structure
      if (mealPlansData.length > 0) {
        console.log('📦 Sample meal plan:', mealPlansData[0]);
        if (mealPlansData[0].meals && mealPlansData[0].meals.length > 0) {
          console.log('📦 Sample meal:', mealPlansData[0].meals[0]);
        }
      }
      
      setMealPlans(mealPlansData);
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
      console.log('=== FETCHING ALL MEALS ===');
      const response = await mealAPI.getAllMeals();
      console.log('📥 Meals response:', response);
      
      // Backend trả về trực tiếp array hoặc { data: array }
      const mealsData = Array.isArray(response.data) 
        ? response.data 
        : Array.isArray(response) 
        ? response 
        : [];
      
      console.log('📥 Meals data:', mealsData);
      console.log('📥 Total meals loaded:', mealsData.length);
      
      setAllMeals(mealsData);
    } catch (err) {
      console.error('❌ Error fetching meals:', err);
    }
  };

  // Helper: Normalize mealId từ object hoặc string
  const normalizeMealId = (mealId: string | Meal | any): string => {
    console.log('🔍 normalizeMealId input:', mealId);
    console.log('🔍 mealId type:', typeof mealId);
    
    if (!mealId) {
      console.log('❌ mealId is falsy');
      return '';
    }
    
    if (typeof mealId === 'string') {
      console.log('✅ mealId is string:', mealId);
      return mealId;
    }
    
    if (typeof mealId === 'object') {
      console.log('🔍 mealId is object, checking _id...');
      console.log('🔍 mealId._id:', mealId._id);
      console.log('🔍 mealId.id:', mealId.id);
      
      if (mealId._id) {
        console.log('✅ Found _id:', mealId._id);
        return mealId._id;
      }
      if (mealId.id) {
        console.log('✅ Found id:', mealId.id);
        return mealId.id;
      }
      
      console.log('❌ Object has no _id or id');
    }
    
    console.log('❌ Cannot normalize, returning empty string');
    return '';
  };

  // Helper: Normalize goals (xử lý cả goal số ít và goals số nhiều)
  const normalizeGoals = (mealPlan: MealPlan): string[] => {
    if (Array.isArray(mealPlan.goals) && mealPlan.goals.length > 0) {
      return mealPlan.goals;
    }
    if (mealPlan.goal) {
      return [mealPlan.goal];
    }
    return [];
  };

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
    return Array.from({ length: 30 }, (_, i) => ({
      label: `Ngày ${i + 1}`,
      value: i + 1,
    }));
  };

  // Tạo khung meals khi thay đổi type hoặc goals
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

  const handleEdit = (mealPlanId: string) => {
    // Tìm meal plan từ state thay vì dùng params.row từ DataGrid
    const mealPlan = mealPlans.find(mp => mp._id === mealPlanId);
    
    if (!mealPlan) {
      console.error('❌ Không tìm thấy meal plan với ID:', mealPlanId);
      setError('Không tìm thấy thực đơn');
      return;
    }
    
    console.log('=== EDIT MEAL PLAN ===');
    console.log('MealPlan ID:', mealPlanId);
    console.log('Found mealPlan from state:', mealPlan);
    console.log('Original meals:', mealPlan.meals);
    
    setSelectedMealPlan(mealPlan);

    // Normalize goals
    const normalizedGoals = normalizeGoals(mealPlan);
    console.log('Normalized goals:', normalizedGoals);

    // Normalize meals với mealId
    const normalizedMeals: MealPlanMeal[] = (mealPlan.meals || []).map((meal: any, index: number) => {
      console.log(`\n--- Processing meal ${index} ---`);
      console.log('Raw meal:', meal);
      console.log('meal.mealId:', meal.mealId);
      
      const mealId = normalizeMealId(meal.mealId);
      console.log('Final normalized mealId:', mealId);
      
      // Cảnh báo nếu mealId rỗng
      if (!mealId) {
        console.warn('⚠️ WARNING: Meal has empty mealId!', {
          index,
          mealType: meal.mealType,
          dayOfWeek: meal.dayOfWeek,
          dayNumber: meal.dayNumber,
        });
      }
      
      return {
        dayOfWeek: meal.dayOfWeek,
        dayNumber: meal.dayNumber,
        mealType: meal.mealType,
        mealId: mealId,
        time: meal.time || (
          meal.mealType === 'Bữa sáng' ? '07:00' :
          meal.mealType === 'Bữa trưa' ? '12:00' :
          meal.mealType === 'Bữa tối' ? '18:00' : '15:00'
        ),
      };
    });

    console.log('Normalized meals:', normalizedMeals);
    
    // Đếm số meal có ID và không có ID
    const mealsWithId = normalizedMeals.filter(m => m.mealId).length;
    const mealsWithoutId = normalizedMeals.filter(m => !m.mealId).length;
    console.log(`📊 Meals with ID: ${mealsWithId}, without ID: ${mealsWithoutId}`);

    // Tạo khung đầy đủ cho tất cả các ngày
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
    console.log('Complete meals with all days:', completeMeals);
    
    // Hiển thị thông báo nếu có meal không có ID
    const emptyMeals = completeMeals.filter(m => !m.mealId).length;
    if (emptyMeals > 0) {
      console.warn(`⚠️ ${emptyMeals} meals không có mealId. Backend có thể chưa populate hoặc dữ liệu bị thiếu.`);
      setError(`⚠️ Cảnh báo: ${emptyMeals} bữa ăn chưa có món. Vui lòng chọn lại món ăn cho các bữa này.`);
    }

    setFormData({
      name: mealPlan.name,
      description: mealPlan.description || '',
      type: mealPlan.type,
      goals: normalizedGoals,
    });

    console.log('=== END EDIT MEAL PLAN ===');
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

      // Normalize mealId trước khi lưu
      const validMeals = planMeals
        .filter((m) => m.mealType)
        .map((m) => ({
          ...m,
          mealId: normalizeMealId(m.mealId),
        }))
        .filter((m) => m.mealId);

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
        const goals = normalizeGoals(params.row);
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
        <GridActionsCellItem 
          icon={<EditIcon />} 
          label="Sửa" 
          onClick={() => handleEdit(params.row._id)}  // Truyền ID thay vì object
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

                              // Bỏ lọc theo goals - hiển thị tất cả món ăn theo mealType
                              const filteredMeals = allMeals.filter((m) => m.mealType === mealType);

                              const currentMealId = normalizeMealId(meal?.mealId);
                              
                              console.log(`Day: ${dayLabel}, MealType: ${mealType}`);
                              console.log('Found meal:', meal);
                              console.log('Current mealId:', currentMealId);
                              console.log('Filtered meals count:', filteredMeals.length);
                              console.log('All meals count:', allMeals.length);

                              return (
                                <TableCell key={mealType} sx={{ py: 0.5 }}>
                                  <Select
                                    size="small"
                                    fullWidth
                                    value={currentMealId || ''}
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
                                  >
                                    <MenuItem value="">
                                      <em>Chọn món</em>
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