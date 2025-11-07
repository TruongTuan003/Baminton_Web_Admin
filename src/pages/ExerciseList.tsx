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
  const [error, setError] = useState('');
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

  const handleSave = async () => {
    try {
      setError('');
      const trainingData = {
        title: formData.title,
        goal: formData.goal || undefined,
        level: formData.level,
        description: formData.description || undefined,
        video_url: formData.video_url || undefined,
        image_url: formData.image_url || undefined,
        duration_minutes: formData.duration_minutes ? Number(formData.duration_minutes) : undefined,
      };

      if (selectedExercise) {
        await trainingAPI.updateTraining(selectedExercise._id, trainingData);
        await fetchExercises(); // Refresh danh sách
      } else {
        await trainingAPI.createTraining(trainingData);
        await fetchExercises(); // Refresh danh sách
      }
      setOpenDialog(false);
      setSelectedExercise(null);
      setFormData({ title: '', goal: '', level: '', description: '', video_url: '', image_url: '', duration_minutes: '' });
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể lưu thông tin';
      setError(errorMessage);
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
            label="Mục tiêu"
            fullWidth
            select
            variant="outlined"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="Tăng sức mạnh">Tăng sức mạnh</MenuItem>
            <MenuItem value="Tăng tốc độ">Tăng tốc độ</MenuItem>
            <MenuItem value="Giảm cân">Giảm cân</MenuItem>
            <MenuItem value="Tăng cơ">Tăng cơ</MenuItem>
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
            label="Thời gian (phút)"
            type="number"
            fullWidth
            variant="outlined"
            value={formData.duration_minutes}
            onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
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
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="URL Video"
            fullWidth
            variant="outlined"
            value={formData.video_url}
            onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="URL Hình ảnh"
            fullWidth
            variant="outlined"
            value={formData.image_url}
            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
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

