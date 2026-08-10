import { useState } from 'react';
import { useStore } from '@/contexts/StoreContext';
import UserLayout from '@/components/user/UserLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { changePassword, deleteAccount } from '@/api/apihelper';
import {
  Bell,
  Trash2,
  Eye,
  EyeOff,
  Mail,
  Gift,
  Package,
  AlertTriangle,
  CheckCircle2,
  Shield,
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

const fieldClasses =
  'h-11 bg-white border-input rounded-sm text-[14.5px] pr-12 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-maroon';

const labelClasses =
  'block text-[11px] font-sans font-semibold uppercase tracking-[0.16em] text-espresso';

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
        return 'bg-sale';
      case 2:
        return 'bg-terracotta';
      case 3:
        return 'bg-gold';
      case 4:
        return 'bg-[#3E6B4F]';
      default:
        return 'bg-sand';
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
      <div className="space-y-8">
        {/* Page header */}
        <div>
          <span className="overline-label mb-2">Preferences & security</span>
          <h1 className="font-serif text-3xl md:text-4xl font-medium text-espresso">Account Settings</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Section */}
          <div className="space-y-6 lg:col-span-2">
            {/* Security Settings */}
            <div className="rounded-sm border border-border bg-white">
              <div className="flex items-center justify-between border-b border-border bg-ivory px-6 py-4">
                <div>
                  <h2 className="font-serif text-lg font-medium text-espresso">Security Settings</h2>
                  <p className="mt-0.5 text-[13px] text-muted-foreground">
                    Keep your account secure with a strong password
                  </p>
                </div>
                <Shield className="h-5 w-5 flex-shrink-0 text-gold" />
              </div>
              <div className="p-6">
                <form onSubmit={handleSubmitPassword} className="space-y-5">
                  {/* Current Password */}
                  <div className="space-y-2">
                    <Label className={labelClasses}>Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.current ? 'text' : 'password'}
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Enter your current password"
                        className={fieldClasses}
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-espresso"
                        onClick={() => togglePasswordVisibility('current')}
                        aria-label={showPasswords.current ? 'Hide password' : 'Show password'}
                      >
                        {showPasswords.current ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-2">
                    <Label className={labelClasses}>New Password</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.new ? 'text' : 'password'}
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Create a strong new password"
                        className={fieldClasses}
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-espresso"
                        onClick={() => togglePasswordVisibility('new')}
                        aria-label={showPasswords.new ? 'Hide password' : 'Show password'}
                      >
                        {showPasswords.new ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Strength Meter */}
                    {passwordData.newPassword && (
                      <div className="rounded-sm border border-border bg-blush/60 p-4 space-y-2.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Password strength</span>
                          <span
                            className={`font-medium ${
                              passwordStrength >= 4
                                ? 'text-[#3E6B4F]'
                                : passwordStrength >= 3
                                ? 'text-[#8A6414]'
                                : 'text-sale'
                            }`}
                          >
                            {getPasswordStrengthText(passwordStrength)}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          {[0, 1, 2, 3].map((i) => (
                            <span
                              key={i}
                              className={`h-1 flex-1 rounded-full ${passwordStrength > i ? 'bg-gold' : 'bg-sand'}`}
                            />
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${passwordData.newPassword.length >= 8 ? 'bg-gold' : 'bg-sand'}`}></span>
                            <span>8+ characters</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${/[A-Z]/.test(passwordData.newPassword) ? 'bg-gold' : 'bg-sand'}`}></span>
                            <span>Uppercase letter</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${/[0-9]/.test(passwordData.newPassword) ? 'bg-gold' : 'bg-sand'}`}></span>
                            <span>Number</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`h-1.5 w-1.5 rounded-full ${/[^A-Za-z0-9]/.test(passwordData.newPassword) ? 'bg-gold' : 'bg-sand'}`}></span>
                            <span>Special character</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label className={labelClasses}>Confirm New Password</Label>
                    <div className="relative">
                      <Input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        required
                        placeholder="Re-enter your new password"
                        className={fieldClasses}
                      />
                      <button
                        type="button"
                        className="absolute right-0 top-0 flex h-full items-center px-3 text-muted-foreground hover:text-espresso"
                        onClick={() => togglePasswordVisibility('confirm')}
                        aria-label={showPasswords.confirm ? 'Hide password' : 'Show password'}
                      >
                        {showPasswords.confirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {passwordData.confirmPassword && (
                      <div
                        className={`flex items-center gap-3 rounded-sm border p-3 ${
                          passwordData.newPassword === passwordData.confirmPassword
                            ? 'border-[#3E6B4F]/30 bg-[#3E6B4F]/5'
                            : 'border-sale/30 bg-sale/5'
                        }`}
                      >
                        {passwordData.newPassword === passwordData.confirmPassword ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-[#3E6B4F]" />
                            <p className="text-[13px] text-[#3E6B4F]">Passwords match</p>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-sale" />
                            <p className="text-[13px] text-sale">Passwords don't match</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-auto w-full rounded-sm bg-maroon px-7 py-3 text-[12px] font-medium uppercase tracking-[0.14em] text-ivory hover:bg-terracotta md:w-auto"
                  >
                    {isLoading ? 'Updating Password...' : 'Update Password'}
                  </Button>
                </form>
              </div>
            </div>

            {/* Notification Preferences */}
            {/* <div className="rounded-sm border border-border bg-white">
              <div className="border-b border-border bg-ivory px-6 py-4">
                <h2 className="font-serif text-lg font-medium text-espresso">Notification Preferences</h2>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Choose how you want to receive notifications
                </p>
              </div>
              <div className="space-y-3 p-6">
                {notificationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = notifications[item.key as keyof typeof notifications];
                  return (
                    <div
                      key={item.key}
                      className={`flex items-center justify-between rounded-sm border p-4 transition-colors ${
                        isActive ? 'border-gold/40 bg-ivory' : 'border-border hover:bg-ivory'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <Icon className={`mt-0.5 h-4 w-4 ${isActive ? 'text-maroon' : 'text-muted-foreground'}`} />
                        <div>
                          <h4 className="text-sm font-medium text-espresso">{item.title}</h4>
                          <p className="mt-0.5 text-[13px] text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={isActive}
                        onCheckedChange={() => handleToggle(item.key)}
                        className="data-[state=checked]:bg-maroon"
                      />
                    </div>
                  );
                })}
              </div>
            </div> */}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Account Status Card */}
            <div className="rounded-sm border border-border bg-white">
              <div className="border-b border-border bg-ivory px-6 py-4">
                <h2 className="font-serif text-lg font-medium text-espresso">Account Status</h2>
              </div>
              <div className="space-y-4 p-6">
                <div className="flex items-center justify-between rounded-sm border border-border p-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-[#3E6B4F]" />
                    <span className="text-sm text-espresso">Email Verified</span>
                  </div>
                  <span className="inline-flex items-center rounded-full border border-[#3E6B4F]/25 bg-[#3E6B4F]/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#3E6B4F]">
                    Verified
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-sm border border-border p-3">
                  <span className="text-sm text-espresso">Member Since</span>
                  <span className="font-serif text-sm font-medium text-maroon">
                    {new Date().getFullYear()}
                  </span>
                </div>

                <div className="rounded-sm border border-border bg-blush/60 p-4">
                  <div className="flex justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                      Profile completeness
                    </span>
                    <span className="text-xs font-medium text-[#8A6414]">85%</span>
                  </div>
                  <div className="flex gap-1.5 mt-2.5">
                    <span className="h-1 flex-1 rounded-full bg-gold" />
                    <span className="h-1 flex-1 rounded-full bg-gold" />
                    <span className="h-1 flex-1 rounded-full bg-gold" />
                    <span className="h-1 flex-1 rounded-full bg-gold" />
                    <span className="h-1 flex-1 rounded-full bg-sand" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">Add a profile photo to reach 100%</p>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="rounded-sm border border-sale/30 bg-white">
              <div className="border-b border-sale/30 bg-sale/5 px-6 py-4">
                <h2 className="font-serif text-lg font-medium text-sale">Danger Zone</h2>
              </div>
              <div className="p-6">
                <div className="mb-4 flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-sale" />
                  <div>
                    <p className="text-sm font-medium text-espresso">Permanent Action</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Once you delete your account, there is no going back. This action is permanent and cannot be undone.
                    </p>
                  </div>
                </div>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="h-auto w-full gap-2 rounded-sm bg-sale px-5 py-3 text-[12px] font-medium uppercase tracking-[0.14em] text-ivory hover:bg-sale/90">
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-sm border border-border bg-white">
                    <AlertDialogHeader>
                      <div className="mb-2 flex items-center gap-3">
                        <AlertTriangle className="h-5 w-5 text-sale" />
                        <AlertDialogTitle className="font-serif text-xl font-medium text-espresso">
                          Delete Your Account?
                        </AlertDialogTitle>
                      </div>
                      <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground">
                        <div className="space-y-3">
                          <p>This action will permanently:</p>
                          <ul className="list-disc space-y-1 pl-5 text-sm">
                            <li>Remove your account and all personal information</li>
                            <li>Delete your order history and saved data</li>
                            <li>Cancel any pending orders or subscriptions</li>
                          </ul>
                          <p className="mt-4 font-medium text-sale">This action cannot be undone!</p>
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-sm text-[12px] font-medium uppercase tracking-[0.12em]">
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                        className="rounded-sm bg-sale text-[12px] font-medium uppercase tracking-[0.12em] text-ivory hover:bg-sale/90"
                      >
                        {isDeleting ? 'Deleting...' : 'Yes, Delete Account'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default AccountSettingsPage;
