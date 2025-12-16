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
  Chip,
  Snackbar,
} from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { userAPI } from '../services/api';

interface User {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  status?: string;
  age?: number;
  gender?: string;
  height?: number;
  weight?: number;
  createdAt: string;
}

export default function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await userAPI.getAllUsers();
      setUsers(response.data || []);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Không thể tải danh sách người dùng';
      setError(errorMessage);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleLockUser = async (id: string, currentStatus: string) => {
    const action = currentStatus === 'lock' ? 'unlock' : 'lock';
    const actionText = action === 'lock' ? 'khóa' : 'mở khóa';
    
    if (window.confirm(`Bạn có chắc muốn ${actionText} người dùng này?`)) {
      try {
        await userAPI.lockUser(id, action);
        setSuccessMessage(`${actionText === 'khóa' ? 'Khóa' : 'Mở khóa'} người dùng thành công!`);
        await fetchUsers(); // Refresh danh sách
        setError('');
      } catch (err: any) {
        const errorMessage = err?.response?.data?.message || err?.message || `Không thể ${actionText} người dùng`;
        setError(errorMessage);
      }
    }
  };


  const columns: GridColDef[] = [
    { field: '_id', headerName: 'ID', width: 90 },
    { field: 'name', headerName: 'Tên', width: 200, flex: 1 },
    { field: 'email', headerName: 'Email', width: 250, flex: 1 },
    { field: 'role', headerName: 'Vai trò', width: 120 },
    {
      field: 'status',
      headerName: 'Trạng thái',
      width: 120,
      renderCell: (params) => {
        const status = params.value || 'pending';
        const color = status === 'lock' ? 'error' : status === 'active' ? 'success' : 'warning';
        const label = status === 'lock' ? 'Khóa' : status === 'active' ? 'Hoạt động' : 'Chờ xác thực';
        return <Chip label={label} size="small" color={color} variant="outlined" />;
      },
    },
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
      getActions: (params) => {
        const status = params.row.status || 'pending';
        const isLocked = status === 'lock';
        
        return [
          <GridActionsCellItem
            icon={<VisibilityIcon />}
            label="Xem chi tiết"
            onClick={() => handleViewUser(params.row)}
          />,
          <GridActionsCellItem
            icon={isLocked ? <LockOpenIcon /> : <LockIcon />}
            label={isLocked ? 'Mở khóa' : 'Khóa'}
            onClick={() => handleLockUser(params.row._id, status)}
            showInMenu
          />,
        ];
      },
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Danh sách người dùng
        </Typography>
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
            rows={users}
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

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Thông tin người dùng</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ pt: 2 }}>
              <TextField
                margin="dense"
                label="Tên"
                fullWidth
                variant="outlined"
                value={selectedUser.name || ''}
                InputProps={{ readOnly: true }}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                value={selectedUser.email || ''}
                InputProps={{ readOnly: true }}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Vai trò"
                fullWidth
                variant="outlined"
                value={selectedUser.role || ''}
                InputProps={{ readOnly: true }}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Trạng thái"
                fullWidth
                variant="outlined"
                value={
                  selectedUser.status === 'lock' 
                    ? 'Khóa' 
                    : selectedUser.status === 'active' 
                    ? 'Hoạt động' 
                    : 'Chờ xác thực'
                }
                InputProps={{ readOnly: true }}
                sx={{ mb: 2 }}
              />
              {selectedUser.age && (
                <TextField
                  margin="dense"
                  label="Tuổi"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={selectedUser.age}
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 2 }}
                />
              )}
              {selectedUser.gender && (
                <TextField
                  margin="dense"
                  label="Giới tính"
                  fullWidth
                  variant="outlined"
                  value={selectedUser.gender}
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 2 }}
                />
              )}
              {selectedUser.height && (
                <TextField
                  margin="dense"
                  label="Chiều cao (cm)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={selectedUser.height}
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 2 }}
                />
              )}
              {selectedUser.weight && (
                <TextField
                  margin="dense"
                  label="Cân nặng (kg)"
                  type="number"
                  fullWidth
                  variant="outlined"
                  value={selectedUser.weight}
                  InputProps={{ readOnly: true }}
                  sx={{ mb: 2 }}
                />
              )}
              <TextField
                margin="dense"
                label="Ngày tạo"
                fullWidth
                variant="outlined"
                value={
                  selectedUser.createdAt
                    ? new Date(selectedUser.createdAt).toLocaleDateString('vi-VN')
                    : ''
                }
                InputProps={{ readOnly: true }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} variant="contained">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

