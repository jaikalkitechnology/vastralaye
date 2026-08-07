import { useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import UserLayout from '@/components/user/UserLayout';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { changePassword, deleteAccount } from '@/api/apihelper';
import {
  Lock,
  Bell,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  Mail,
  Gift,
  Package,
  AlertTriangle,
  CheckCircle2,
  Key,
  Save,
  UserCheck,
  Calendar,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

const AccountSettingsPage = () => {
  const { state } = useStore();
  const { currentUser } = state;

  const [notifications, setNotifications] = useState({
    email: true,
    offers: false,
    updates: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'newPassword') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const getPasswordStrengthColor = (strength: number) => {
    switch (strength) {
      case 1:
        return 'from-red-500 to-red-400';
      case 2:
        return 'from-orange-500 to-amber-400';
      case 3:
        return 'from-yellow-500 to-yellow-400';
      case 4:
        return 'from-[#559F4B] to-[#E1783E]';
      default:
        return 'from-gray-300 to-gray-300';
    }
  };

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 1:
        return 'Weak';
      case 2:
        return 'Fair';
      case 3:
        return 'Good';
      case 4:
        return 'Strong';
      default:
        return 'Very Weak';
    }
  };

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await changePassword({
        old_password: passwordData.currentPassword,
        new_password: passwordData.newPassword,
      });

      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordStrength(0);
    } catch (err: any) {
      toast.error(
        err?.response?.data?.detail ||
          'Failed to change password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (name: string) => {
    setNotifications((prev) => ({
      ...prev,
      [name]: !prev[name as keyof typeof notifications],
    }));
    toast.success('Notification settings updated');
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      toast.loading('Deleting your account...');
      await deleteAccount();
      toast.dismiss();
      toast.success('Account deleted successfully!');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    } catch (error: any) {
      toast.dismiss();
      toast.error(
        error?.response?.data?.detail ||
          'Failed to delete account. Please try again.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const notificationItems = [
    {
      key: 'email',
      title: 'Email Notifications',
      desc: 'Receive order updates and important account information',
      icon: Mail,
    },
    {
      key: 'offers',
      title: 'Special Offers',
      desc: 'Get notified about exclusive deals and promotions',
      icon: Gift,
    },
    {
      key: 'updates',
      title: 'Product Updates',
      desc: 'Stay informed about new features and products',
      icon: Package,
    },
  ];

  return (
    <UserLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-[#559F4B]/10 to-[#E1783E]/10">
              <Shield className="w-8 h-8 bg-gradient-to-r from-[#559F4B] to-[#E1783E] bg-clip-text text-transparent" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
              <p className="text-gray-600">
                Manage your account preferences and security settings
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Security Settings */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#559F4B]/5 to-[#E1783E]/5 p-1">
                <CardHeader className="bg-white">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-[#559F4B] to-[#E1783E] text-white">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
                      <CardDescription className="text-gray-600 mt-1">
                        Keep your account secure with a strong password
                      </CardDescription>
                    </div>
                  </CardTitle>
                </CardHeader>
              </div>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmitPassword} className="space-y-6">
                  {/* Current Password */}
                  <div className="space-y-3">
                    <Label className="text-gray-700 font-medium">Current Password</Label>
                    <div className="relative group">
                      <Input
                        type={showPasswords.current ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Enter your current password"
                        className="pr-12 py-6 rounded-xl border-gray-300 focus:border-[#559F4B] focus:ring-[#559F4B] transition-all group-hover:border-gray-400"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-gray-100"
                        onClick={() => togglePasswordVisibility('current')}
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-3">
                    <Label className="text-gray-700 font-medium">New Password</Label>
                    <div className="relative group">
                      <Input
                        type={showPasswords.new ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Create a strong new password"
                        className="pr-12 py-6 rounded-xl border-gray-300 focus:border-[#559F4B] focus:ring-[#559F4B] transition-all group-hover:border-gray-400"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-gray-100"
                        onClick={() => togglePasswordVisibility('new')}
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>

                    {/* Strength Bar */}
                    {passwordData.newPassword && (
                      <div className="space-y-3 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-50/50 border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Password strength</span>
                          <span className={`text-sm font-bold ${
                            passwordStrength >= 4
                              ? 'text-[#559F4B]'
                              : passwordStrength >= 3
                              ? 'text-amber-600'
                              : 'text-red-500'
                          }`}>
                            {getPasswordStrengthText(passwordStrength)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${getPasswordStrengthColor(
                              passwordStrength
                            )} transition-all duration-300`}
                            style={{ width: `${(passwordStrength / 4) * 100}%` }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${passwordData.newPassword.length >= 8 ? 'bg-[#559F4B]' : 'bg-gray-300'}`}></div>
                            <span>8+ characters</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${/[A-Z]/.test(passwordData.newPassword) ? 'bg-[#559F4B]' : 'bg-gray-300'}`}></div>
                            <span>Uppercase letter</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${/[0-9]/.test(passwordData.newPassword) ? 'bg-[#559F4B]' : 'bg-gray-300'}`}></div>
                            <span>Number</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${/[^A-Za-z0-9]/.test(passwordData.newPassword) ? 'bg-[#559F4B]' : 'bg-gray-300'}`}></div>
                            <span>Special character</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-3">
                    <Label className="text-gray-700 font-medium">Confirm New Password</Label>
                    <div className="relative group">
                      <Input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Re-enter your new password"
                        className="pr-12 py-6 rounded-xl border-gray-300 focus:border-[#559F4B] focus:ring-[#559F4B] transition-all group-hover:border-gray-400"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-lg hover:bg-gray-100"
                        onClick={() => togglePasswordVisibility('confirm')}
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4 text-gray-500" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-500" />
                        )}
                      </Button>
                    </div>
                    {passwordData.confirmPassword && (
                      <div className={`flex items-center gap-3 p-3 rounded-lg ${
                        passwordData.newPassword === passwordData.confirmPassword
                          ? 'bg-green-50 border border-green-100'
                          : 'bg-red-50 border border-red-100'
                      }`}>
                        {passwordData.newPassword === passwordData.confirmPassword ? (
                          <>
                            <div className="p-1.5 rounded-full bg-green-100">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-green-800">Passwords match</p>
                              <p className="text-xs text-green-600">Your passwords are identical</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="p-1.5 rounded-full bg-red-100">
                              <AlertTriangle className="w-4 h-4 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-red-800">Passwords don't match</p>
                              <p className="text-xs text-red-600">Please make sure both passwords are identical</p>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full md:w-auto bg-gradient-to-r from-[#559F4B] to-[#E1783E] hover:from-[#559F4B]/90 hover:to-[#E1783E]/90 text-white font-semibold py-6 px-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isLoading ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            {/* <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500/5 to-cyan-500/5 p-1">
                <CardHeader className="bg-white">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
                      <Bell className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
                      <CardDescription className="text-gray-600 mt-1">
                        Choose how you want to receive notifications
                      </CardDescription>
                    </div>
                  </CardTitle>
                </CardHeader>
              </div>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {notificationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = notifications[item.key as keyof typeof notifications];
                    return (
                      <div
                        key={item.key}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                          isActive
                            ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-blue-50/50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-lg ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {item.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => handleToggle(item.key)}
                          className={`data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-500 data-[state=checked]:to-cyan-500`}
                        />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card> */}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status Card */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-[#559F4B]/10 to-[#E1783E]/10 p-1">
                <CardHeader className="bg-white">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-[#559F4B] to-[#E1783E] text-white">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">Account Status</h2>
                  </CardTitle>
                </CardHeader>
              </div>
              <CardContent className="pt-6 space-y-5">
                <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Email Verified</span>
                  </div>
                  <Badge className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold px-3 py-1 rounded-full">
                    Verified
                  </Badge>
                </div>

                {/* <div className="flex justify-between items-center p-3 rounded-xl bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-200">
                      <Shield className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">2FA Enabled</span>
                  </div>
                  <Badge variant="outline" className="bg-gray-100 text-gray-700 font-semibold px-3 py-1 rounded-full">
                    Disabled
                  </Badge>
                </div> */}

                <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-amber-50 to-amber-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-[#559F4B]/20 to-[#E1783E]/20">
                      <Calendar className="w-4 h-4 text-[#559F4B]" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Member Since</span>
                  </div>
                  <span className="text-sm font-bold bg-gradient-to-r from-[#559F4B] to-[#E1783E] bg-clip-text text-transparent">
                    {new Date().getFullYear()}
                  </span>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-[#559F4B]/5 to-[#E1783E]/5 border border-[#559F4B]/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Sparkles className="w-5 h-5 text-[#E1783E]" />
                    <span className="text-sm font-bold text-gray-900">Account Level</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className="bg-gradient-to-r from-[#559F4B] to-[#E1783E] h-2 rounded-full" 
                      style={{ width: '85%' }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Gold Member</span>
                    <span className="font-bold text-[#559F4B]">85%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">85% to Platinum Level</p>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden border-red-200">
              <div className="bg-gradient-to-r from-red-500/10 to-red-600/10 p-1">
                <CardHeader className="bg-white">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <h2 className="text-lg font-bold text-red-700">Danger Zone</h2>
                  </CardTitle>
                </CardHeader>
              </div>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-red-50 border border-red-100">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-red-800 mb-1">Permanent Action</p>
                        <p className="text-xs text-red-600">
                          Once you delete your account, there is no going back. This action is permanent and cannot be undone.
                        </p>
                      </div>
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="destructive" 
                          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl border-0 shadow-2xl">
                        <AlertDialogHeader>
                          <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 rounded-full bg-gradient-to-r from-red-100 to-red-50">
                              <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <AlertDialogTitle className="text-xl text-red-700">Delete Your Account?</AlertDialogTitle>
                          </div>
                          <AlertDialogDescription className="text-gray-600 text-sm leading-relaxed">
                            <div className="space-y-3">
                              <p>This action will permanently:</p>
                              <ul className="list-disc pl-5 space-y-1 text-sm">
                                <li>Remove your account and all personal information</li>
                                <li>Delete your order history and saved data</li>
                                <li>Cancel any pending orders or subscriptions</li>
                              </ul>
                              <p className="font-medium text-red-600 mt-4">This action cannot be undone!</p>
                            </div>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl border-gray-300 hover:bg-gray-50">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={isDeleting}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                          >
                            {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default AccountSettingsPage;