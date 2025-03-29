import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
// Rename imported Settings to SettingsComponent to avoid name conflict
import { Settings as SettingsIcon, UserCog, Bell, Shield, LogOut } from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Settings: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [isPrivacyModeEnabled, setIsPrivacyModeEnabled] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      toast.error('Please log in to view settings.');
    }
  }, [navigate, user]);

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Logged out successfully.');
      navigate('/login');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action is irreversible.')) {
      try {
        if (!user) {
          toast.error('No user session found.');
          return;
        }

        const { error } = await supabase.auth.admin.deleteUser(user.id);

        if (error) {
          toast.error(`Error deleting account: ${error.message}`);
        } else {
          toast.success('Account deleted successfully.');
          navigate('/register');
        }
      } catch (err) {
        console.error('Error deleting account:', err);
        toast.error('Failed to delete account.');
      }
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <SettingsIcon className="h-6 w-6" />
        Settings
      </h1>

      {/* Account Settings Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Account Settings
          </CardTitle>
          <CardDescription>
            Manage your account preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile settings would go here */}
        </CardContent>
      </Card>

      {/* Notification Settings Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Control your notification preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Enable notifications</h3>
              <p className="text-sm text-gray-500">Receive updates and important alerts</p>
            </div>
            <Switch checked={isNotificationsEnabled} onCheckedChange={setIsNotificationsEnabled} />
          </div>
          <Separator />
          {/* More notification settings would go here */}
        </CardContent>
      </Card>

      {/* Privacy Settings Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy Settings
          </CardTitle>
          <CardDescription>
            Manage your privacy settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Enable privacy mode</h3>
              <p className="text-sm text-gray-500">Hide your profile from public view</p>
            </div>
            <Switch checked={isPrivacyModeEnabled} onCheckedChange={setIsPrivacyModeEnabled} />
          </div>
          <Separator />
          {/* More privacy settings would go here */}
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-red-200 mb-6">
        <CardHeader className="text-red-700">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription className="text-red-600/90">
            These actions are irreversible
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-red-700">Log out from all devices</h3>
              <p className="text-sm text-gray-500">This will sign you out from all browsers and devices</p>
            </div>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
              Log Out Everywhere
            </Button>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium text-red-700">Delete account</h3>
              <p className="text-sm text-gray-500">Permanently delete your account and all your data</p>
            </div>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount}
            >
              Delete Account
            </Button>
          </div>
        </CardContent>
        <CardFooter className="bg-red-50/50 text-sm text-red-600 rounded-b-lg">
          Note: Deleting your account will remove all your stories and associated data.
        </CardFooter>
      </Card>

      <div className="flex justify-end mt-6">
        <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
          <LogOut className="h-4 w-4" />
          Log Out
        </Button>
      </div>
    </div>
  );
};

export default Settings;
