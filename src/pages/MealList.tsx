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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
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
    setImageFile(null);
    setImagePreview(meal.image_url || null);
    setOpenDialog(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Tạo preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
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
      
      // Validation: Kiểm tra tất cả các field bắt buộc
      if (!formData.name?.trim()) {
        setError('Vui lòng nhập tên món ăn');
        return;
      }
      if (!formData.mealType?.trim()) {
        setError('Vui lòng chọn loại bữa');
        return;
      }
      if (!formData.goal?.trim()) {
        setError('Vui lòng chọn mục tiêu');
        return;
      }
      if (!formData.calories || Number(formData.calories) <= 0) {
        setError('Vui lòng nhập calories hợp lệ');
        return;
      }
      if (!formData.protein || Number(formData.protein) < 0) {
        setError('Vui lòng nhập đạm (g) hợp lệ');
        return;
      }
      if (!formData.fat || Number(formData.fat) < 0) {
        setError('Vui lòng nhập chất béo (g) hợp lệ');
        return;
      }
      if (!formData.carbs || Number(formData.carbs) < 0) {
        setError('Vui lòng nhập tinh bột (g) hợp lệ');
        return;
      }
      if (!formData.description?.trim()) {
        setError('Vui lòng nhập mô tả');
        return;
      }
      // Kiểm tra hình ảnh: bắt buộc khi tạo mới, khi edit có thể giữ nguyên
      if (!selectedMeal) {
        if (!imageFile && !formData.image_url) {
          setError('Vui lòng chọn hình ảnh hoặc nhập URL hình ảnh');
          return;
        }
      }
      
      setUploading(true);

      // Tạo FormData
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name.trim());
      formDataToSend.append('mealType', formData.mealType.trim());
      formDataToSend.append('calories', formData.calories);
      formDataToSend.append('protein', formData.protein);
      formDataToSend.append('fat', formData.fat);
      formDataToSend.append('carbs', formData.carbs);
      formDataToSend.append('goal', formData.goal.trim());
      formDataToSend.append('description', formData.description.trim());

      // Thêm file nếu có
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      } else if (formData.image_url && !selectedMeal) {
        // Nếu không có file mới nhưng có URL (cho trường hợp tạo mới với URL)
        formDataToSend.append('image_url', formData.image_url);
      }

      // Nếu đang edit và không có file mới, giữ nguyên URL cũ
      if (selectedMeal) {
        if (!imageFile && formData.image_url) {
          formDataToSend.append('image_url', formData.image_url);
        }
      }

      if (selectedMeal) {
        await mealAPI.updateMeal(selectedMeal._id, formDataToSend);
        setSuccessMessage('Cập nhật món ăn thành công!');
        await fetchMeals(); // Refresh danh sách
      } else {
        await mealAPI.createMeal(formDataToSend);
        setSuccessMessage('Thêm món ăn thành công!');
        await fetchMeals(); // Refresh danh sách
      }
      setOpenDialog(false);
      setSelectedMeal(null);
      setFormData({ name: '', calories: '', protein: '', fat: '', carbs: '', mealType: '', goal: '', description: '', image_url: '' });
      setImageFile(null);
      setImagePreview(null);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể lưu thông tin';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: '_id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Tên món ăn', width: 200, flex: 1 },
    {
      field: 'image_url',
      headerName: 'Hình ảnh',
      width: 120,
      renderCell: (params) => {
        const imageUrl = params.value;
        if (!imageUrl) {
          return (
            <Box
              sx={{
                width: 80,
                height: 80,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: 1,
                color: '#999',
                fontSize: '12px',
              }}
            >
              Không có ảnh
            </Box>
          );
        }
        return (
          <Box
            component="img"
            src={imageUrl}
            alt={params.row.name}
            sx={{
              width: 80,
              height: 80,
              objectFit: 'cover',
              borderRadius: 1,
              cursor: 'pointer',
              '&:hover': {
                opacity: 0.8,
              },
            }}
            onClick={() => {
              // Mở hình ảnh trong tab mới khi click
              window.open(imageUrl, '_blank');
            }}
          />
        );
      },
    },
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
            setImageFile(null);
            setImagePreview(null);
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
            label="Tên món ăn *"
            fullWidth
            required
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              margin="dense"
              label="Calories *"
              type="number"
              required
              variant="outlined"
              value={formData.calories}
              onChange={(e) => setFormData({ ...formData, calories: e.target.value })}
              inputProps={{ min: 1 }}
              sx={{ flex: 1 }}
            />
            <TextField
              margin="dense"
              label="Đạm (g) *"
              type="number"
              required
              variant="outlined"
              value={formData.protein}
              onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
              inputProps={{ min: 0 }}
              sx={{ flex: 1 }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              margin="dense"
              label="Chất béo (g) *"
              type="number"
              required
              variant="outlined"
              value={formData.fat}
              onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
              inputProps={{ min: 0 }}
              sx={{ flex: 1 }}
            />
            <TextField
              margin="dense"
              label="Tinh bột (g) *"
              type="number"
              required
              variant="outlined"
              value={formData.carbs}
              onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
              inputProps={{ min: 0 }}
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
            <MenuItem value="Cải thiện thể chất">Cải thiện thể chất</MenuItem>
            <MenuItem value="Nâng cao kỹ năng cầu lông">Nâng cao kỹ năng cầu lông</MenuItem>
            <MenuItem value="Quản lý hình thể và sức khỏe">Quản lý hình thể và sức khỏe</MenuItem>
          </TextField>
          {/* Upload Hình ảnh */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Hình ảnh *
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 1 }}
            >
              {imageFile ? 'Đổi hình ảnh' : 'Chọn hình ảnh'}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
            {imagePreview && (
              <Box sx={{ mt: 1 }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                />
              </Box>
            )}
            {!imageFile && !imagePreview && (
              <TextField
                margin="dense"
                label="Hoặc nhập URL hình ảnh"
                fullWidth
                variant="outlined"
                size="small"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
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
          <Button onClick={() => setOpenDialog(false)} disabled={uploading}>
            Hủy
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={uploading}>
            {uploading ? <CircularProgress size={20} /> : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

