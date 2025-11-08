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
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { trainingAPI } from '../services/api';

interface Exercise {
  _id: string;
  title: string;
  goal?: string;
  level: string;
  description?: string;
  video_url?: string;
  image_url?: string;
  duration_minutes?: number;
  step?: string[];
  createdAt: string;
}

export default function ExerciseList() {
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    goal: '',
    level: '',
    description: '',
    video_url: '',
    image_url: '',
    duration_minutes: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [steps, setSteps] = useState<string[]>([]); // Mảng các bước (chỉ chứa mô tả, không có số thứ tự)
  const [searchName, setSearchName] = useState('');
  const [filterGoal, setFilterGoal] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [availableGoals, setAvailableGoals] = useState<string[]>([]);
  const [availableLevels, setAvailableLevels] = useState<string[]>([]);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await trainingAPI.getAllTrainings();
      const exercisesData = response.data || [];
      setAllExercises(exercisesData);
      
      // Lấy danh sách mục tiêu duy nhất từ database
      const goalsSet = new Set<string>();
      exercisesData.forEach((ex: Exercise) => {
        if (ex.goal) {
          goalsSet.add(ex.goal);
        }
      });
      const uniqueGoals = Array.from(goalsSet).sort();
      setAvailableGoals(uniqueGoals);
      
      // Lấy danh sách cấp độ duy nhất từ database
      const levelsSet = new Set<string>();
      exercisesData.forEach((ex: Exercise) => {
        if (ex.level) {
          levelsSet.add(ex.level);
        }
      });
      const uniqueLevels = Array.from(levelsSet).sort();
      setAvailableLevels(uniqueLevels);
      
      applyFilters(exercisesData, searchName, filterGoal, filterLevel);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải danh sách bài tập';
      setError(errorMessage);
      setAllExercises([]);
      setFilteredExercises([]);
      setAvailableGoals([]);
      setAvailableLevels([]);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (exercises: Exercise[], name: string, goal: string, level: string) => {
    let filtered = [...exercises];

    // Filter theo tên (title)
    if (name.trim()) {
      filtered = filtered.filter((exercise) =>
        exercise.title.toLowerCase().includes(name.toLowerCase().trim())
      );
    }

    // Filter theo mục tiêu
    if (goal) {
      filtered = filtered.filter((exercise) => exercise.goal === goal);
    }

    // Filter theo cấp độ
    if (level) {
      filtered = filtered.filter((exercise) => exercise.level === level);
    }

    setFilteredExercises(filtered);
  };

  useEffect(() => {
    applyFilters(allExercises, searchName, filterGoal, filterLevel);
  }, [searchName, filterGoal, filterLevel, allExercises]);

  const handleEdit = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setFormData({
      title: exercise.title,
      goal: exercise.goal || '',
      level: exercise.level,
      description: exercise.description || '',
      video_url: exercise.video_url || '',
      image_url: exercise.image_url || '',
      duration_minutes: exercise.duration_minutes ? String(exercise.duration_minutes) : '',
    });
    setImageFile(null);
    setVideoFile(null);
    setImagePreview(exercise.image_url || null);
    setVideoPreview(exercise.video_url || null);
    // Step đã là mảng string thuần (không có số thứ tự), sử dụng trực tiếp
    if (exercise.step && Array.isArray(exercise.step)) {
      // Nếu có format "số: mô tả" (dữ liệu cũ), parse để lấy phần mô tả
      const parsedSteps = exercise.step.map((s) => {
        if (typeof s === 'string' && s.includes(':')) {
          // Lấy phần sau dấu ":" (có thể có nhiều dấu ":" trong mô tả)
          const match = s.match(/^\d+:\s*(.+)$/);
          if (match) {
            return match[1].trim();
          }
          return s.split(':').slice(1).join(':').trim();
        }
        return s;
      });
      setSteps(parsedSteps);
    } else {
      setSteps([]);
    }
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bạn có chắc muốn xóa bài tập này?')) {
      try {
        setError('');
        await trainingAPI.deleteTraining(id);
        const updatedExercises = allExercises.filter((e) => e._id !== id);
        setAllExercises(updatedExercises);
        applyFilters(updatedExercises, searchName, filterGoal, filterLevel);
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || 'Không thể xóa bài tập';
        setError(errorMessage);
      }
    }
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

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      // Tạo preview cho video
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quản lý các bước
  const [newStep, setNewStep] = useState('');

  const handleAddStep = () => {
    if (newStep.trim()) {
      setSteps([...steps, newStep.trim()]);
      setNewStep('');
    }
  };

  const handleRemoveStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const handleUpdateStep = (index: number, value: string) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = value;
    setSteps(updatedSteps);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const updatedSteps = [...steps];
      [updatedSteps[index - 1], updatedSteps[index]] = [updatedSteps[index], updatedSteps[index - 1]];
      setSteps(updatedSteps);
    } else if (direction === 'down' && index < steps.length - 1) {
      const updatedSteps = [...steps];
      [updatedSteps[index], updatedSteps[index + 1]] = [updatedSteps[index + 1], updatedSteps[index]];
      setSteps(updatedSteps);
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      
      // Validation: Kiểm tra tất cả các field bắt buộc
      if (!formData.title?.trim()) {
        setError('Vui lòng nhập tiêu đề');
        return;
      }
      if (!formData.goal?.trim()) {
        setError('Vui lòng chọn mục tiêu');
        return;
      }
      if (!formData.level?.trim()) {
        setError('Vui lòng chọn cấp độ');
        return;
      }
      if (!formData.description?.trim()) {
        setError('Vui lòng nhập mô tả');
        return;
      }
      if (!formData.duration_minutes || Number(formData.duration_minutes) <= 0) {
        setError('Vui lòng nhập thời gian (phút) hợp lệ');
        return;
      }
      if (steps.length === 0) {
        setError('Vui lòng thêm ít nhất một bước thực hiện');
        return;
      }
      // Kiểm tra hình ảnh: bắt buộc khi tạo mới, khi edit có thể giữ nguyên
      if (!selectedExercise) {
        if (!imageFile && !formData.image_url) {
          setError('Vui lòng chọn hình ảnh hoặc nhập URL hình ảnh');
          return;
        }
        if (!videoFile && !formData.video_url) {
          setError('Vui lòng chọn video hoặc nhập URL video');
          return;
        }
      }
      
      setUploading(true);

      // Tạo FormData
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('goal', formData.goal.trim());
      formDataToSend.append('level', formData.level.trim());
      formDataToSend.append('description', formData.description.trim());
      formDataToSend.append('duration_minutes', formData.duration_minutes);
      
      // Thêm steps (gửi dưới dạng mảng string)
      if (steps.length > 0) {
        steps.forEach((step, index) => {
          formDataToSend.append(`step[${index}]`, step);
        });
      }

      // Thêm file nếu có
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      } else if (formData.image_url && !selectedExercise) {
        // Nếu không có file mới nhưng có URL (cho trường hợp tạo mới với URL)
        formDataToSend.append('image_url', formData.image_url);
      }

      if (videoFile) {
        formDataToSend.append('video', videoFile);
      } else if (formData.video_url && !selectedExercise) {
        // Nếu không có file mới nhưng có URL (cho trường hợp tạo mới với URL)
        formDataToSend.append('video_url', formData.video_url);
      }

      // Nếu đang edit và không có file mới, giữ nguyên URL cũ
      if (selectedExercise) {
        if (!imageFile && formData.image_url) {
          formDataToSend.append('image_url', formData.image_url);
        }
        if (!videoFile && formData.video_url) {
          formDataToSend.append('video_url', formData.video_url);
        }
      }

      if (selectedExercise) {
        await trainingAPI.updateTraining(selectedExercise._id, formDataToSend);
        setSuccessMessage('Cập nhật bài tập thành công!');
        await fetchExercises(); // Refresh danh sách
      } else {
        await trainingAPI.createTraining(formDataToSend);
        setSuccessMessage('Thêm bài tập thành công!');
        await fetchExercises(); // Refresh danh sách
      }
      setOpenDialog(false);
      setSelectedExercise(null);
      setFormData({ title: '', goal: '', level: '', description: '', video_url: '', image_url: '', duration_minutes: '' });
      setImageFile(null);
      setVideoFile(null);
      setImagePreview(null);
      setVideoPreview(null);
      setSteps([]);
      setNewStep('');
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể lưu thông tin';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: '_id', headerName: 'ID', width: 90 },
    { field: 'title', headerName: 'Tiêu đề', width: 250, flex: 1 },
    {
      field: 'goal',
      headerName: 'Mục tiêu',
      width: 150,
      renderCell: (params) => (
        <Chip label={params.value} size="small" color="primary" variant="outlined" />
      ),
    },
    {
      field: 'level',
      headerName: 'Cấp độ',
      width: 120,
      renderCell: (params) => {
        const color = params.value === 'Nâng cao' ? 'error' : params.value === 'Trung bình' ? 'warning' : 'success';
        return (
          <Chip
            label={params.value}
            size="small"
            color={color}
            variant="outlined"
          />
        );
      },
    },
    { field: 'duration_minutes', headerName: 'Thời gian (phút)', width: 130 },
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
          Danh sách bài tập
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedExercise(null);
            setFormData({ title: '', goal: '', level: '', description: '', video_url: '', image_url: '', duration_minutes: '' });
            setImageFile(null);
            setVideoFile(null);
            setImagePreview(null);
            setVideoPreview(null);
            setSteps([]);
            setNewStep('');
            setOpenDialog(true);
          }}
        >
          Thêm bài tập
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
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
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
            label="Lọc theo mục tiêu"
            select
            variant="outlined"
            fullWidth
            value={filterGoal}
            onChange={(e) => setFilterGoal(e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {availableGoals.map((goal) => (
              <MenuItem key={goal} value={goal}>
                {goal}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Lọc theo cấp độ"
            select
            variant="outlined"
            fullWidth
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
          >
            <MenuItem value="">Tất cả</MenuItem>
            {availableLevels.map((level) => (
              <MenuItem key={level} value={level}>
                {level}
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
            rows={filteredExercises}
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
        <DialogTitle>{selectedExercise ? 'Sửa bài tập' : 'Thêm bài tập mới'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tiêu đề *"
            fullWidth
            required
            variant="outlined"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            sx={{ mb: 2 }}
          />
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
            <MenuItem value="Nâng cao kỹ năng cầu lông">Nâng cao kỹ năng cầu lông</MenuItem>
            <MenuItem value="Cải thiện thể chất">Cải thiện thể chất</MenuItem>
            <MenuItem value="Quản lý thể hình và sức khỏe">Quản lý thể hình và sức khỏe</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            label="Cấp độ *"
            fullWidth
            required
            select
            variant="outlined"
            value={formData.level}
            onChange={(e) => setFormData({ ...formData, level: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Cơ bản">Cơ bản</MenuItem>
            <MenuItem value="Trung bình">Trung bình</MenuItem>
            <MenuItem value="Nâng cao">Nâng cao</MenuItem>
          </TextField>
          <TextField
            margin="dense"
            label="Thời gian (phút) *"
            type="number"
            fullWidth
            required
            variant="outlined"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
            inputProps={{ min: 1 }}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Mô tả *"
            fullWidth
            required
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          {/* Quản lý các bước */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Các bước thực hiện *
            </Typography>
            
            {/* Danh sách các bước */}
            {steps.length > 0 && (
              <List sx={{ mb: 2, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                {steps.map((step, index) => (
                  <ListItem
                    key={index}
                    sx={{
                      borderBottom: index < steps.length - 1 ? '1px solid' : 'none',
                      borderColor: 'divider',
                      py: 1,
                    }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleMoveStep(index, 'up')}
                          disabled={index === 0}
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleMoveStep(index, 'down')}
                          disabled={index === steps.length - 1}
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={() => handleRemoveStep(index)}
                          color="error"
                        >
                          <RemoveCircleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={
                        <TextField
                          fullWidth
                          size="small"
                          value={step}
                          onChange={(e) => handleUpdateStep(index, e.target.value)}
                          placeholder={`Bước ${index + 1}`}
                          variant="outlined"
                        />
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
            
            {/* Thêm bước mới */}
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Nhập mô tả bước mới..."
                value={newStep}
                onChange={(e) => setNewStep(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddStep();
                  }
                }}
                variant="outlined"
              />
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddStep}
                disabled={!newStep.trim()}
              >
                Thêm
              </Button>
            </Box>
          </Box>
          
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

          {/* Upload Video */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Video *
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ mb: 1 }}
            >
              {videoFile ? 'Đổi video' : 'Chọn video'}
              <input
                type="file"
                hidden
                accept="video/*"
                onChange={handleVideoChange}
              />
            </Button>
            {videoPreview && (
              <Box sx={{ mt: 1 }}>
                <video
                  src={videoPreview}
                  controls
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
                />
              </Box>
            )}
            {!videoFile && !videoPreview && (
              <TextField
                margin="dense"
                label="Hoặc nhập URL video"
                fullWidth
                variant="outlined"
                size="small"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                sx={{ mt: 1 }}
              />
            )}
          </Box>
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

