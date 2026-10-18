import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { User, UserRole, createUserProfile, updateUser, inviteUser } from '@/services/userService';

interface UserFormProps {
  user?: User;
  onSuccess: () => void;
  onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({
  user,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    company_name: '',
    role: 'user' as UserRole
  });

  const isEditing = !!user;

  useEffect(() => {
    if (user) {
      setFormData({
        email: '', // Email is not stored in profiles table
        full_name: user.full_name || '',
        company_name: user.company_name || '',
        role: (user.role as UserRole) || 'user'
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing && user) {
        // Update existing user
        await updateUser(user.id, {
          full_name: formData.full_name,
          company_name: formData.company_name,
          role: formData.role
        });
        toast({
          title: "User Updated",
          description: "User has been updated successfully.",
        });
      } else {
        // Create new user (invite)
        if (!formData.email) {
          throw new Error('Email is required for new users');
        }
        await inviteUser(
          formData.email,
          formData.role,
          formData.full_name,
          formData.company_name
        );
        toast({
          title: "User Invited",
          description: "User has been invited successfully. They will receive an email to set their password.",
        });
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEditing ? 'Edit User' : 'Invite New User'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="user@example.com"
                required={!isEditing}
              />
              <p className="text-sm text-gray-500">
                The user will receive an email invitation to set their password.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                placeholder="Acme Corp"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleInputChange('role', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-sm text-gray-500 space-y-1">
              <p><strong>User:</strong> Can make bookings and view their own bookings</p>
              <p><strong>Business:</strong> Can manage their own restaurant(s) and view bookings</p>
              <p><strong>Admin:</strong> Full access to all features including user management</p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : (isEditing ? 'Update User' : 'Invite User')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default UserForm; 