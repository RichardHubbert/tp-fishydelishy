import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Search, Users, Shield, Building, User as UserIcon, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { User, fetchAllUsers, deleteUser, restoreUser, getUserCountByRole } from '@/services/userService';
import UserForm from '@/components/UserForm';
import UserMenu from '@/components/UserMenu';
import NavigationHeader from '@/components/NavigationHeader';

const UserManagement: React.FC = () => {
  const { isAdmin, user } = useAdmin();
  const { user: authUser, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | undefined>();
  const [showInactive, setShowInactive] = useState(false);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
      loadUserCounts();
    }
  }, [isAdmin]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, showInactive]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserCounts = async () => {
    try {
      const counts = await getUserCountByRole();
      setUserCounts(counts);
    } catch (error) {
      console.error('Error loading user counts:', error);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by active/inactive status
    if (!showInactive) {
      filtered = filtered.filter(u => u.role !== 'inactive');
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        (u.full_name?.toLowerCase().includes(query)) ||
        (u.company_name?.toLowerCase().includes(query)) ||
        u.role.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleDelete = async (user: User) => {
    try {
      await deleteUser(user.id);
      toast({
        title: "User Deleted",
        description: `${user.full_name || 'User'} has been deactivated.`,
      });
      loadUsers();
      loadUserCounts();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user.",
        variant: "destructive",
      });
    }
  };

  const handleRestore = async (user: User) => {
    try {
      await restoreUser(user.id);
      toast({
        title: "User Restored",
        description: `${user.full_name || 'User'} has been restored.`,
      });
      loadUsers();
      loadUserCounts();
    } catch (error) {
      console.error('Error restoring user:', error);
      toast({
        title: "Error",
        description: "Failed to restore user.",
        variant: "destructive",
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingUser(undefined);
    loadUsers();
    loadUserCounts();
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingUser(undefined);
    setShowForm(true);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-4 w-4" />;
      case 'business':
        return <Building className="h-4 w-4" />;
      case 'user':
        return <UserIcon className="h-4 w-4" />;
      default:
        return <UserIcon className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'business':
        return 'bg-blue-100 text-blue-800';
      case 'user':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        {/* Navigation header */}
        <header className="bg-white border-b shadow-sm py-3 px-4 md:px-6 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">User Management</h1>
            
            <div className="flex items-center gap-2 md:gap-4">
              {authUser ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = '/'}
                    className="hidden md:flex"
                  >
                    Back to Home
                  </Button>
                  <UserMenu />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="hidden md:inline">Logout</span>
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/auth'}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
                <p className="text-gray-600">
                  You don't have permission to access this page. Only admin users can manage users.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="min-h-screen bg-background">
        {/* Navigation header */}
        <header className="bg-white border-b shadow-sm py-3 px-4 md:px-6 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {editingUser ? 'Edit User' : 'Invite New User'}
            </h1>
            
            <div className="flex items-center gap-2 md:gap-4">
              {authUser ? (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowForm(false)}
                    className="hidden md:flex"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Users
                  </Button>
                  <UserMenu />
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span className="hidden md:inline">Logout</span>
                  </Button>
                </>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/auth'}
                >
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8">
          <UserForm
            user={editingUser}
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <NavigationHeader />
      <div className="container mx-auto px-4 py-8 mt-24">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">
              Manage all users in the system. Only visible to admin users.
            </p>
          </div>
          <Button onClick={handleAddNew} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Invite User
          </Button>
        </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold">{userCounts.admin || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Building className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Business</p>
                <p className="text-2xl font-bold">{userCounts.business || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <UserIcon className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Regular Users</p>
                <p className="text-2xl font-bold">{userCounts.user || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowInactive(!showInactive)}
              className="flex items-center gap-2"
            >
              {showInactive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showInactive ? 'Hide Inactive' : 'Show Inactive'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading users...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600">
                {searchQuery ? 'No users found matching your search.' : 'No users found.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className={user.role === 'inactive' ? 'opacity-60' : ''}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full">
                      {getRoleIcon(user.role)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {user.full_name || 'Unnamed User'}
                        </h3>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </div>
                      {user.company_name && (
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Company:</strong> {user.company_name}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>User ID:</strong> {user.user_id}
                      </p>
                      <p className="text-sm text-gray-500">
                        Created: {new Date(user.created_at || '').toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {user.role !== 'inactive' ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to deactivate "{user.full_name || 'this user'}"? This action can be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(user)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Deactivate
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(user)}
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </>
  );
};

export default UserManagement; 