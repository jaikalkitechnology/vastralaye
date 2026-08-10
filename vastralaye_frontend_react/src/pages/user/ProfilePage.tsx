import { useEffect, useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import UserLayout from "@/components/user/UserLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getProfile, updateProfile } from "@/api/apihelper";
import { User } from "@/types";
import {
  Mail,
  Camera,
  Save,
  X,
  Shield,
} from "lucide-react";

const fieldClasses =
  "h-11 bg-white border-input rounded-sm text-[14.5px] focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-maroon disabled:bg-ivory disabled:opacity-100 disabled:text-muted-foreground";

const labelClasses =
  "block text-[11px] font-sans font-semibold uppercase tracking-[0.16em] text-espresso";

const overlineClasses =
  "block text-[10.5px] font-sans font-semibold uppercase tracking-[0.22em] text-[#8A6414]";

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
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-maroon border-t-transparent"></div>
          <p className="ml-3 text-muted-foreground">Loading your profile...</p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="space-y-8">
        {/* Page head */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className={overlineClasses}>Your details</span>
            <h1 className="mt-1 font-serif text-3xl font-medium text-espresso md:text-4xl">
              My Profile
            </h1>
          </div>

          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="h-auto rounded-sm bg-maroon px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ivory hover:bg-terracotta"
            >
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="h-auto gap-2 rounded-sm px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em]"
                disabled={isSubmitting}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
              <Button
                type="submit"
                form="profile-form"
                className="h-auto gap-2 rounded-sm bg-maroon px-5 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-ivory hover:bg-terracotta"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ivory border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-3.5 w-3.5" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
          {/* Identity card */}
          <div className="overflow-hidden rounded-sm border border-border bg-white text-center lg:col-span-1">
            {/* Blush hero with avatar */}
            <div className="bg-gradient-to-b from-blush to-transparent px-5 pt-8">
              <div className="group relative mx-auto h-28 w-28">
                <img
                  src={avatarPreview || "/default-avatar.png"}
                  alt="Profile"
                  className="h-28 w-28 rounded-full border-[3px] border-white bg-sand object-cover ring-2 ring-gold"
                />
                {isEditing && (
                  <>
                    <label className="absolute inset-0 flex cursor-pointer touch-manipulation flex-col items-center justify-center rounded-full bg-espresso/60 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <Camera className="mb-1 h-7 w-7 text-ivory sm:mb-0 sm:h-8 sm:w-8" />
                      <span className="px-2 text-[10px] font-medium uppercase tracking-[0.1em] text-ivory sm:hidden">
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
                    <div className="absolute -bottom-3 left-1/2 hidden -translate-x-1/2 sm:block">
                      <span className="whitespace-nowrap rounded-sm bg-espresso px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-ivory">
                        Click to change
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Name, email pill, ornament */}
            <div className="px-5">
              <h3 className="mt-3.5 font-serif text-xl font-medium text-espresso">
                {formData.first_name} {formData.last_name}
              </h3>
              <span className="mt-2 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-ivory px-3.5 py-1.5 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">{formData.email}</span>
              </span>
              <div className="my-4 flex items-center justify-center gap-2.5">
                <span className="h-px w-11 bg-gold opacity-60" />
                <span className="h-[7px] w-[7px] rotate-45 border border-gold" />
                <span className="h-px w-11 bg-gold opacity-60" />
              </div>
            </div>

            {/* Fact rows */}
            <div className="border-t border-border text-[12.5px]">
              <div className="flex items-center justify-between px-5 py-2.5">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium text-espresso">{formData.phone || "—"}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border px-5 py-2.5">
                <span className="text-muted-foreground">City</span>
                <span className="font-medium text-espresso">
                  {formData.city
                    ? `${formData.city}${formData.region ? ", " + formData.region : ""}`
                    : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Personal Information card */}
          <div className="rounded-sm border border-border bg-white lg:col-span-2">
            <div className="border-b border-border bg-ivory px-6 py-4">
              <h3 className="font-serif text-lg font-medium text-espresso">Personal Information</h3>
              <p className="mt-0.5 text-[12px] text-muted-foreground">
                Kept private — used only for your orders & delivery
              </p>
            </div>
            <div className="p-6">
              <form id="profile-form" onSubmit={handleSubmit} className="space-y-6">
                {/* Name Fields */}
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first_name" className={labelClasses}>
                      First Name
                    </Label>
                    <Input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name || ""}
                      onChange={handleChange}
                      disabled={!isEditing || isSubmitting}
                      className={fieldClasses}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name" className={labelClasses}>
                      Last Name
                    </Label>
                    <Input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name || ""}
                      onChange={handleChange}
                      disabled={!isEditing || isSubmitting}
                      className={fieldClasses}
                    />
                  </div>
                </div>

                {/* Contact */}
                <div className="mt-2 space-y-5 border-t border-border pt-6">
                  <span className={overlineClasses}>Contact</span>

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email" className={labelClasses}>
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email || ""}
                        disabled={true}
                        className={`${fieldClasses} cursor-not-allowed`}
                      />
                      <p className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Shield className="h-3 w-3 text-gold" />
                        Email cannot be changed for security reasons
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className={labelClasses}>
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone || ""}
                        onChange={handleChange}
                        disabled={!isEditing || isSubmitting}
                        className={fieldClasses}
                        minLength={10}
                        maxLength={10}
                        inputMode="numeric"
                      />
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="mt-2 space-y-5 border-t border-border pt-6">
                  <span className={overlineClasses}>Address</span>

                  <div className="space-y-5">
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="address_line1" className={labelClasses}>
                          Address Line 1
                        </Label>
                        <Input
                          id="address_line1"
                          name="address_line1"
                          value={formData.address_line1 || ""}
                          onChange={handleChange}
                          disabled={!isEditing || isSubmitting}
                          className={fieldClasses}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="address_line2" className={labelClasses}>
                          Address Line 2 (Optional)
                        </Label>
                        <Input
                          id="address_line2"
                          name="address_line2"
                          value={formData.address_line2 || ""}
                          onChange={handleChange}
                          disabled={!isEditing || isSubmitting}
                          className={fieldClasses}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-4 md:gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className={labelClasses}>
                          City
                        </Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city || ""}
                          onChange={handleChange}
                          disabled={!isEditing || isSubmitting}
                          className={fieldClasses}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="region" className={labelClasses}>
                          Region
                        </Label>
                        <Input
                          id="region"
                          name="region"
                          value={formData.region || ""}
                          onChange={handleChange}
                          disabled={!isEditing || isSubmitting}
                          className={fieldClasses}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal_code" className={labelClasses}>
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
                          className={fieldClasses}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country" className={labelClasses}>
                          Country
                        </Label>
                        <Input
                          id="country"
                          name="country"
                          value={formData.country || ""}
                          onChange={handleChange}
                          disabled={!isEditing || isSubmitting}
                          className={fieldClasses}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Note */}
                <div className="rounded-sm border border-border bg-blush/60 p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold" />
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso">
                        Security Information
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Your personal information is encrypted and securely stored. We never share your data with third parties.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
};

export default ProfilePage;
