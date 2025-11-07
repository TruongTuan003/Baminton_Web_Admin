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
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import { mealAPI } from '../services/api';

interface Meal {
  _id: string;
  name: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  mealType: string; // Backend dùng camelCase
  goal?: string;
  image_url?: string;
  description?: string;
  createdAt: string;
}

export default function MealList() {
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    calories: '',
    protein: '',
    fat: '',
    carbs: '',
    mealType: '',
    goal: '',
    description: '',
    image_url: '',
  });
  const [error, setError] = useState('');
  const [searchName, setSearchName] = useState('');
  const [filterMealType, setFilterMealType] = useState('');
  const [availableMealTypes, setAvailableMealTypes] = useState<string[]>([]);

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await mealAPI.getAllMeals();
      const mealsData = response.data || [];
      setAllMeals(mealsData);
      
      // Lấy danh sách mealType duy nhất từ database
      const mealTypesSet = new Set<string>();
      mealsData.forEach((meal: Meal) => {
        if (meal.mealType) {
          mealTypesSet.add(meal.mealType);
        }
      });
      const uniqueMealTypes = Array.from(mealTypesSet).sort();
      setAvailableMealTypes(uniqueMealTypes);
      
      applyFilters(mealsData, searchName, filterMealType);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải danh sách món ăn';
      setError(errorMessage);
      setAllMeals([]);
      setFilteredMeals([]);
      setAvailableMealTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (meals: Meal[], name: string, mealType: string) => {
    let filtered = [...meals];

    // Filter theo tên
    if (name.trim()) {
      filtered = filtered.filter((meal) =>
        meal.name.toLowerCase().includes(name.toLowerCase().trim())
      );
    }

    // Filter theo loại bữa
    if (mealType) {
      filtered = filtered.filter((meal) => meal.mealType === mealType);
    }

    setFilteredMeals(filtered);
  };

  useEffect(() => {
    applyFilters(allMeals, searchName, filterMealType);
  }, [searchName, filterMealType, allMeals]);

  const handleEdit = (meal: Meal) => {
    setSelectedMeal(meal);
    setFormData({
      name: meal.name,
      calories: meal.calories ? String(meal.calories) : '',
      protein: meal.protein ? String(meal.protein) : '',
      fat: meal.fat ? String(meal.fat) : '',
      carbs: meal.carbs ? String(meal.carbs) : '',
      mealType: meal.mealType,
      goal: meal.goal || '',
      description: meal.description || '',
      image_url: meal.image_url || '',
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa món ăn này?')) {
      try {
        setError('');
        await mealAPI.deleteMeal(id);
        const updatedMeals = allMeals.filter((m) => m._id !== id);
        setAllMeals(updatedMeals);
        applyFilters(updatedMeals, searchName, filterMealType);
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể xóa món ăn';
        setError(errorMessage);
      }
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      const mealData = {
        name: formData.name,
        mealType: formData.mealType,
        calories: formData.calories ? Number(formData.calories) : undefined,
        protein: formData.protein ? Number(formData.protein) : undefined,
        fat: formData.fat ? Number(formData.fat) : undefined,
        carbs: formData.carbs ? Number(formData.carbs) : undefined,
        goal: formData.goal || undefined,
        description: formData.description || undefined,
        image_url: formData.image_url || undefined,
      };

      if (selectedMeal) {
        await mealAPI.updateMeal(selectedMeal._id, mealData);
        await fetchMeals(); // Refresh danh sách
      } else {
        await mealAPI.createMeal(mealData);
        await fetchMeals(); // Refresh danh sách
      }
      setOpenDialog(false);
      setSelectedMeal(null);
      setFormData({ name: '', calories: '', protein: '', fat: '', carbs: '', mealType: '', goal: '', description: '', image_url: '' });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể lưu thông tin';
      setError(errorMessage);
    }
  };

  const columns: GridColDef[] = [
    { field: '_id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Tên món ăn', width: 200, flex: 1 },
    { field: 'calories', headerName: 'Calories', width: 100 },
    { field: 'protein', headerName: 'Đạm (g)', width: 100 },
    { field: 'fat', headerName: 'Béo (g)', width: 100 },
    { field: 'carbs', headerName: 'Tinh bột (g)', width: 120 },
    {
      field: 'mealType',
      headerName: 'Loại bữa',
      width: 120,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color="primary" variant="outlined" />
      ),
    },
    { field: 'goal', headerName: 'Mục tiêu', width: 120 },
    {
      field: 'createdAt',
      headerName: 'Ngày tạo',
      width: 150,
      valueFormatter: (value) => {
        if (!value) return '';
        try {
          return new Date(value).toLocaleDateString('vi-VN');
        } catch {
          return value;
        }
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
          Danh sách món ăn
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedMeal(null);
            setFormData({ name: '', calories: '', protein: '', fat: '', carbs: '', mealType: '', goal: '', description: '', image_url: '' });
            setOpenDialog(true);
          }}
        >
          Thêm món ăn
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Hàng tìm kiếm và lọc */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            gap: 2,
            alignItems: 'center',
          }}
        >
          <TextField
            label="Tìm kiếm theo tên"
            variant="outlined"
            fullWidth
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
          <TextField
            label="Lọc theo bữa"
            select
            variant="outlined"
            fullWidth
            value={filterMealType}
            onChange={(e) => setFilterMealType(e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {availableMealTypes.map((mealType) => (
              <MenuItem key={mealType} value={mealType}>
                {mealType}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      <Paper sx={{ height: 600, width: '100%' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={filteredMeals}
            columns={columns}
            getRowId={(row) => row._id}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
          />
        )}
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedMeal ? 'Sửa món ăn' : 'Thêm món ăn mới'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tên món ăn"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              margin="dense"
              label="Calories"
              type="number"
              variant="outlined"
              value={formData.calories}
              onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
              sx={{ flex: 1 }}
            />
            <TextField
              margin="dense"
              label="Đạm (g)"
              type="number"
              variant="outlined"
              value={formData.protein}
              onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
              sx={{ flex: 1 }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              margin="dense"
              label="Chất béo (g)"
              type="number"
              variant="outlined"
              value={formData.fat}
              onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
              sx={{ flex: 1 }}
            />
            <TextField
              margin="dense"
              label="Tinh bột (g)"
              type="number"
              variant="outlined"
              value={formData.carbs}
              onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
              sx={{ flex: 1 }}
            />
          </Box>
          <TextField
            margin="dense"
            label="Loại bữa *"
            fullWidth
            required
            select
            variant="outlined"
            value={formData.mealType}
            onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Bữa sáng">Bữa sáng</MenuItem>
            <MenuItem value="Bữa trưa">Bữa trưa</MenuItem>
            <MenuItem value="Bữa tối">Bữa tối</MenuItem>
            <MenuItem value="Bữa phụ">Bữa phụ</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            label="Mục tiêu *"
            fullWidth
            required
            select
            variant="outlined"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Giảm cân">Giảm cân</MenuItem>
            <MenuItem value="Tăng cơ">Tăng cơ</MenuItem>
            <MenuItem value="Duy trì sức khỏe">Duy trì sức khỏe</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            label="URL Hình ảnh"
            fullWidth
            variant="outlined"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Mô tả"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Hủy</Button>
          <Button onClick={handleSave} variant="contained">
            Lưu
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

