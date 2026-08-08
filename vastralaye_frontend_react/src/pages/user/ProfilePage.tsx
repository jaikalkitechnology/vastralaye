import { useEffect, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import UserLayout from "@/components/user/UserLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getProfile, updateProfile } from "@/api/apihelper";
import { User } from "@/types";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Camera,
  Edit3,
  Save,
  X,
  Leaf,
  Shield,
  CheckCircle
} from "lucide-react";

const ProfilePage = () => {
  const { dispatch } = useStore();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ Fetch profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const profile = await getProfile() as User;
      setFormData(profile);
      setAvatarPreview(profile.avatar || null);
      dispatch({ type: "SET_CURRENT_USER", payload: profile });
    } catch (error: any) {
      console.error("Failed to load profile:", error);
      toast.error("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // ✅ FIXED: Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // ✅ Handle Avatar File Selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }

      setAvatarFile(file);
      const previewURL = URL.createObjectURL(file);
      setAvatarPreview(previewURL);
    }
  };

  // ✅ Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditing) return;
    setIsSubmitting(true);

    try {
      const form = new FormData();
      Object.entries({
        first_name: formData.first_name || "",
        last_name: formData.last_name || "",
        email: formData.email || "",
        phone: formData.phone || "",
        address_line1: formData.address_line1 || "",
        address_line2: formData.address_line2 || "",
        city: formData.city || "",
        region: formData.region || "",
        postal_code: formData.postal_code || "",
        country: formData.country || "",
      }).forEach(([key, value]) => form.append(key, value as string));

      if (avatarFile) {
        form.append("avatar", avatarFile);
      }

      await updateProfile(form);
      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setAvatarFile(null);

      const updated = await getProfile();
      setFormData(updated);
      dispatch({ type: "SET_CURRENT_USER", payload: updated as User });

    } catch (error: any) {
      console.error("Profile update failed:", error);
      toast.error(error.response?.data?.detail || "Failed to update profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setAvatarFile(null);
    fetchProfile();
  };

  if (loading) {
    return (
      <UserLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#7A1F2B]"></div>
          <p className="ml-3 text-gray-600">Loading your profile...</p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-6xl mx-auto space-y-8 p-4">
        {/* Header Section with Gradient */}
        <div className="bg-gradient-to-r from-[#7A1F2B]/10 via-[#B85C38]/5 to-[#7A1F2B]/10 rounded-2xl p-6 border border-[#7A1F2B]/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] bg-clip-text text-transparent">
                My Profile
              </h1>
              <p className="text-gray-600 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-[#7A1F2B]" />
                Manage your personal information and preferences
              </p>
            </div>
            
            {!isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] hover:from-[#7A1F2B]/90 hover:to-[#B85C38]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Edit3 className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  className="flex items-center gap-2 border-[#B85C38] text-[#B85C38] hover:bg-[#B85C38]/5 transition-all duration-200"
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="profile-form"
                  className="flex items-center gap-2 bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] hover:from-[#7A1F2B]/90 hover:to-[#B85C38]/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Picture Card */}
          <Card className="lg:col-span-1 border-[#7A1F2B]/20 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-[#7A1F2B]/5 to-[#B85C38]/5 border-b border-[#7A1F2B]/10 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-[#7A1F2B]">
                <UserIcon className="w-5 h-5" />
                Profile Picture
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-6 p-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                <img
                  src={avatarPreview || "/default-avatar.png"}
                  alt="Profile"
                  className="relative w-36 h-36 rounded-full object-cover border-4 border-white shadow-xl transition-all duration-300 group-hover:scale-105"
                />
           {isEditing && (
  <>
    <label className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 cursor-pointer touch-manipulation">
      <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-white mb-1 sm:mb-0" />
      <span className="text-[10px] sm:text-xs font-semibold text-white px-2 sm:hidden">
        Tap to upload
      </span>
      <input
        type="file"
        accept="image/*"
        onChange={handleAvatarChange}
        className="hidden"
        disabled={isSubmitting}
      />
    </label>
    
    {/* Desktop badge */}
    <div className="hidden sm:block absolute -bottom-3 left-1/2 -translate-x-1/2">
      <span className="text-xs font-medium text-white bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap">
        Click to change
      </span>
    </div>
  </>
)}

              </div>

              {!isEditing && (
                <div className="text-center space-y-2">
                  <h3 className="font-bold text-xl bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] bg-clip-text text-transparent">
                    {formData.first_name} {formData.last_name}
                  </h3>
                  <p className="text-gray-600 flex items-center justify-center gap-2">
                    <Mail className="w-4 h-4" />
                    {formData.email}
                  </p>
                
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personal Information Card */}
          <Card className="lg:col-span-2 border-[#7A1F2B]/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#7A1F2B]/5 to-[#B85C38]/5 border-b border-[#7A1F2B]/10 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-[#7A1F2B]">
                <UserIcon className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form id="profile-form" onSubmit={handleSubmit} className="space-y-8">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="first_name" className="text-sm font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#7A1F2B]"></div>
                      First Name
                    </Label>
                    <div className="relative">
                      <Input
                        id="first_name"
                        name="first_name"
                        value={formData.first_name || ""}
                        onChange={handleChange}
                        disabled={!isEditing || isSubmitting}
                        className={`pl-10 ${isEditing ? "border-[#7A1F2B] focus:border-[#7A1F2B] focus:ring-[#7A1F2B]" : "bg-gray-50"}`}
                      />
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="last_name" className="text-sm font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#7A1F2B]"></div>
                      Last Name
                    </Label>
                    <div className="relative">
                      <Input
                        id="last_name"
                        name="last_name"
                        value={formData.last_name || ""}
                        onChange={handleChange}
                        disabled={!isEditing || isSubmitting}
                        className={`pl-10 ${isEditing ? "border-[#7A1F2B] focus:border-[#7A1F2B] focus:ring-[#7A1F2B]" : "bg-gray-50"}`}
                      />
                      <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-6 p-4 bg-gradient-to-r from-[#7A1F2B]/5 to-transparent rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-lg text-gray-900">
                      Contact Information
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#B85C38]"></div>
                        Email Address
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email || ""}
                          disabled={true}
                          className="pl-10 bg-gray-100 cursor-not-allowed"
                        />
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500 flex items-center gap-2">
                        <Shield className="w-3 h-3 text-[#7A1F2B]" />
                        Email cannot be changed for security reasons
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#B85C38]"></div>
                        Phone Number
                      </Label>
                      <div className="relative">
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          value={formData.phone || ""}
                          onChange={handleChange}
                          disabled={!isEditing || isSubmitting}
                          className={`pl-10 ${isEditing ? "border-[#B85C38] focus:border-[#B85C38] focus:ring-[#B85C38]" : "bg-gray-50"}`}
                          minLength={10}
                          maxLength={10}
                          inputMode="numeric"
                        />
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-6 p-4 bg-gradient-to-r from-transparent to-[#B85C38]/5 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-[#7A1F2B] to-[#B85C38] rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-white" />
                    </div>
                    <h4 className="font-semibold text-lg text-gray-900">
                      Address Information
                    </h4>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="address_line1" className="text-sm font-medium">
                          Address Line 1
                        </Label>
                        <Input
                          id="address_line1"
                          name="address_line1"
                          value={formData.address_line1 || ""}
                          onChange={handleChange}
                          disabled={!isEditing || isSubmitting}
                          className={isEditing ? "border-[#7A1F2B] focus:border-[#7A1F2B] focus:ring-[#7A1F2B]" : ""}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="address_line2" className="text-sm font-medium">
                          Address Line 2 (Optional)
                        </Label>
                        <Input
                          id="address_line2"
                          name="address_line2"
                          value={formData.address_line2 || ""}
                          onChange={handleChange}
                          disabled={!isEditing || isSubmitting}
                          className={isEditing ? "border-[#7A1F2B] focus:border-[#7A1F2B] focus:ring-[#7A1F2B]" : ""}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-3">
                        <Label htmlFor="city" className="text-sm font-medium">
                          City
                        </Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city || ""}
                          onChange={handleChange}
                          disabled={!isEditing || isSubmitting}
                          className={isEditing ? "border-[#7A1F2B] focus:border-[#7A1F2B] focus:ring-[#7A1F2B]" : ""}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="region" className="text-sm font-medium">
                          Region
                        </Label>
                        <Input
                          id="region"
                          name="region"
                          value={formData.region || ""}
                          onChange={handleChange}
                          disabled={!isEditing || isSubmitting}
                          className={isEditing ? "border-[#B85C38] focus:border-[#B85C38] focus:ring-[#B85C38]" : ""}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="postal_code" className="text-sm font-medium">
                          Postal Code
                        </Label>
                        <Input
                          id="postal_code"
                          name="postal_code"
                          value={formData.postal_code || ""}
                          onChange={handleChange}
                          minLength={6}
                          maxLength={6}
                          disabled={!isEditing || isSubmitting}
                          className={isEditing ? "border-[#B85C38] focus:border-[#B85C38] focus:ring-[#B85C38]" : ""}
                        />
                      </div>
                      <div className="space-y-3">
                        <Label htmlFor="country" className="text-sm font-medium">
                          Country
                        </Label>
                        <Input
                          id="country"
                          name="country"
                          value={formData.country || ""}
                          onChange={handleChange}
                          disabled={!isEditing || isSubmitting}
                          className={isEditing ? "border-[#7A1F2B] focus:border-[#7A1F2B] focus:ring-[#7A1F2B]" : ""}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Note */}
                <div className="p-4 bg-gradient-to-r from-[#7A1F2B]/10 to-[#B85C38]/10 rounded-xl border border-[#7A1F2B]/20">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[#7A1F2B] mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <div className="text-sm font-medium text-[#7A1F2B]">Security Information</div>
                      <p className="text-xs text-gray-600">
                        Your personal information is encrypted and securely stored. We never share your data with third parties.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserLayout>
  );
};

export default ProfilePage;