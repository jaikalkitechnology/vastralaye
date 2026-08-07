// ReviewSection.tsx - FIXED VERSION
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { toast } from "@/components/ui/use-toast";
import {
  RefreshCw,
  Send,
  User,
  LogIn,
  X,
  AlertCircle,
  UserCog,
  Edit,
  Trash2,
  Clock,
  ChevronDown,
} from "lucide-react";
import { BASE_URL } from "@/config";

interface Reply {
  id: number;
  comment: string;
  created_at: string;
  admin_name?: string;
  admin_id?: number;
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  name?: string;
  user_name?: string;
  created_at: string;
  user_id?: number;
  product_id?: number;
  reply?: Reply; // Single reply object (not array)
  isTemp?: boolean;
}

interface ReviewErrors {
  rating?: string;
  name?: string;
  comment?: string;
  reply?: string;
}

interface ReviewFormData {
  rating: number;
  comment: string;
  name: string;
}

type Props = {
  productId: string | undefined;
  isAdmin: boolean;
  user: any;
  onReviewAdded?: () => void;
};

export default function ReviewSection({ productId, isAdmin, user, onReviewAdded }: Props) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [refreshingReviews, setRefreshingReviews] = useState(false);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  // Review form states
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewFormData>({
    rating: 5,
    comment: "",
    name: ""
  });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [errors, setErrors] = useState<ReviewErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  // rating hover preview
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  // Admin reply states
  const [replyingToReview, setReplyingToReview] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyLoading, setReplyLoading] = useState(false);
  const [editingReply, setEditingReply] = useState<{ reviewId: number; replyId: number } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ reviewId: number; replyId: number } | null>(null);

  // helpers
  const getToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        return null;
      }
      return token;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  };

  // Format date and time function
  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      };
      
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString || 'Recently';
    }
  };

  // Validation functions
  const validateField = (name: string, value: any): string => {
    switch (name) {
      case 'rating':
        if (value === null || value === undefined || value < 0.5 || value > 5) {
          return 'Please select a rating between 0.5 and 5 stars';
        }
        return '';

      case 'name':
        if (!value || !value.trim()) {
          return 'Name is required';
        }
        if (value.trim().length < 2) {
          return 'Name must be at least 2 characters long';
        }
        if (value.trim().length > 50) {
          return 'Name must be less than 50 characters';
        }
        return '';

      case 'comment':
        if (value && value.trim().length > 1000) {
          return 'Review must be less than 1000 characters';
        }
        return '';

      case 'reply':
        if (!value.trim()) {
          return 'Reply comment is required';
        }
        if (value.trim().length < 5) {
          return 'Reply must be at least 5 characters long';
        }
        if (value.trim().length > 500) {
          return 'Reply must be less than 500 characters';
        }
        return '';

      default:
        return '';
    }
  };

  const validateForm = (formData: ReviewFormData): ReviewErrors => {
    const newErrors: ReviewErrors = {};

    newErrors.rating = validateField('rating', formData.rating);
    newErrors.name = validateField('name', formData.name);
    newErrors.comment = validateField('comment', formData.comment);

    Object.keys(newErrors).forEach(key => {
      if (!newErrors[key as keyof ReviewErrors]) {
        delete newErrors[key as keyof ReviewErrors];
      }
    });

    return newErrors;
  };

  const isFormValid = () => {
    const formErrors = validateForm(reviewForm);
    return Object.keys(formErrors).length === 0;
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, (reviewForm as any)[fieldName]);
    setErrors(prev => ({ ...prev, [fieldName]: error }));
  };

  const handleFieldChange = (field: string, value: any) => {
    setReviewForm(prev => ({ ...prev, [field]: value }));
    if ((errors as any)[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if ((touched as any)[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }
  };

  // FIXED: Fetch reviews WITHOUT making separate API calls for replies
  const fetchReviews = async (page: number = 1, forceRefresh = false) => {
    if (!productId) return;
    
    if (forceRefresh || page === 1) {
      setRefreshingReviews(true);
    } else {
      setLoadingMore(true);
    }
    
    try {
      // Fetch paginated reviews - replies should already be included in the response
      const response = await axios.get(
        `${BASE_URL}/users/product/${productId}/reviews?page=${page}&page_size=3`
      );
      
      let reviewsData: Review[] = [];
      let paginationData = {
        total: 0,
        page: 1,
        total_pages: 1
      };

      // Handle different response structures
      if (response.data) {
        if (Array.isArray(response.data.reviews)) {
          reviewsData = response.data.reviews;
          paginationData = {
            total: response.data.total || 0,
            page: response.data.page || 1,
            total_pages: response.data.total_pages || 1
          };
        } else if (Array.isArray(response.data.data)) {
          reviewsData = response.data.data;
          paginationData = {
            total: response.data.total || 0,
            page: response.data.page || 1,
            total_pages: response.data.total_pages || 1
          };
        } else if (Array.isArray(response.data)) {
          reviewsData = response.data;
          paginationData = {
            total: response.data.length,
            page: 1,
            total_pages: 1
          };
        }
      }

      // Update pagination metadata
      setTotalPages(paginationData.total_pages);
      setTotalReviews(paginationData.total);
      setCurrentPage(paginationData.page);

      if (reviewsData.length === 0 && page === 1) {
        setReviews([]);
        setRefreshingReviews(false);
        setLoadingMore(false);
        return;
      }

      // REMOVED: No more Promise.all fetching replies!
      // The API should return replies with each review
      // If your API returns reply_text, map it to the expected format:
      const processedReviews = reviewsData.map(review => {
        // If your API returns reply data in a different format, adjust here
        if ((review as any).reply_text) {
          return {
            ...review,
            reply: {
              id: (review as any).reply_id,
              comment: (review as any).reply_text,
              created_at: (review as any).reply_created_at,
              admin_name: (review as any).admin_name || "Admin"
            }
          };
        }
        return review;
      });
      
      // Update reviews list
      if (forceRefresh || page === 1) {
        const permanentReviews = processedReviews.filter(r => !r.isTemp);
        setReviews(permanentReviews);
      } else {
        setReviews(prev => [...prev, ...processedReviews]);
      }
      
      setShouldRefresh(false);
    } catch (error) {
      console.log("Error fetching reviews:", error);
      toast({
        title: "Error",
        description: "Failed to load reviews. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRefreshingReviews(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchReviews(1, shouldRefresh);
  }, [productId, shouldRefresh]);

  // ... (rest of your code remains the same - handleLoadMore, handleRefreshReviews, etc.)

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      fetchReviews(currentPage + 1, false);
    }
  };

  const handleRefreshReviews = () => {
    setCurrentPage(1);
    setShouldRefresh(true);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;

    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token && !user) {
      setShowLoginPrompt(true);
      return;
    }

    setTouched({ rating: true, name: true, comment: true });
    const formErrors = validateForm(reviewForm);
    setErrors(formErrors);
    if (Object.keys(formErrors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    setReviewLoading(true);
    try {
      const formData = new URLSearchParams();
      formData.append('name', reviewForm.name.trim());
      formData.append('rating', reviewForm.rating.toString());
      if (reviewForm.comment.trim()) formData.append('comment', reviewForm.comment.trim());

      const response = await axios.post(
        `${BASE_URL}/users/product/${productId}/review`,
        formData,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      if (response.status === 201 || response.status === 200) {
        const tempReview: Review = {
          id: Date.now(),
          rating: reviewForm.rating,
          comment: reviewForm.comment.trim(),
          name: reviewForm.name.trim(),
          created_at: new Date().toISOString(),
          isTemp: true
        };
        
        setReviews(prev => [tempReview, ...prev]);
        
        setReviewForm({
          rating: 5,
          comment: "",
          name: reviewForm.name.trim()
        });
        setShowReviewForm(false);
        setErrors({});
        setTouched({});
        
        toast({ 
          title: "Review Submitted Successfully!", 
          description: "Thank you for your review!" 
        });
        
        if (onReviewAdded) {
          onReviewAdded();
        }
        
        setTimeout(() => {
          setCurrentPage(1);
          setShouldRefresh(true);
        }, 1500);
      }
    } catch (error: any) {
      console.error('Review submission error:', error);
      setReviews(prev => prev.filter(r => !r.isTemp));
      
      if (error.response?.status === 422) {
        const validationErrors = error.response.data.detail;
        let errorMessages: string[] = [];
        if (Array.isArray(validationErrors)) {
          errorMessages = validationErrors.map((err: any) => {
            const field = err.loc[err.loc.length - 1];
            return `${field}: ${err.msg}`;
          });
        }
        toast({ 
          title: "Validation Error", 
          description: errorMessages.join(', ') || "Please check your input and try again.", 
          variant: "destructive" 
        });
      } else if (error.response?.data?.detail) {
        toast({ 
          title: "Error!", 
          description: error.response.data.detail, 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Error!", 
          description: "Failed to submit review. Please try again.", 
          variant: "destructive" 
        });
      }
    } finally {
      setReviewLoading(false);
    }
  };

  // Reply functions (these are fine - only called when admin takes action)
  const handleReplySubmit = async (reviewId: number) => {
    if (!replyText.trim()) {
      toast({ title: "Error", description: "Please enter a reply message", variant: "destructive" });
      return;
    }
    setReplyLoading(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Authentication required");
      const formData = new FormData();
      formData.append("reply_text", replyText.trim());
      const response = await axios.post(`${BASE_URL}/users/${reviewId}/reply`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        transformRequest: (d) => d
      });
      const r = response.data.reply;
      const newReply: Reply = { 
        id: r.id, 
        comment: r.reply_text, 
        created_at: r.created_at, 
        admin_name: r.admin_name || "Admin" 
      };
      setReviews(prev => prev.map(rv => rv.id === reviewId ? { ...rv, reply: newReply } : rv));
      setReplyText("");
      setReplyingToReview(null);
      toast({ title: "Reply Posted!", description: "Your reply has been posted successfully." });
    } catch (error) {
      console.error('Reply submission error:', error);
      toast({ title: "Error!", description: "Failed to post reply. Please try again.", variant: "destructive" });
    } finally {
      setReplyLoading(false);
    }
  };

  const handleEditReply = async (reviewId: number, replyId: number) => {
    if (!replyText.trim()) {
      toast({ title: "Error", description: "Please enter a reply message", variant: "destructive" });
      return;
    }
    setReplyLoading(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Authentication required");
      const formData = new FormData();
      formData.append("reply_text", replyText.trim());
      const response = await axios.put(`${BASE_URL}/users/${reviewId}/reply/${replyId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        transformRequest: (d) => d
      });
      const r = response.data.reply;
      const updatedReply: Reply = { 
        id: r.id, 
        comment: r.reply_text, 
        created_at: r.created_at, 
        admin_name: r.admin_name || "Admin" 
      };
      setReviews(prev => prev.map(rv => rv.id === reviewId ? { ...rv, reply: updatedReply } : rv));
      setReplyText("");
      setEditingReply(null);
      toast({ title: "Reply Updated!", description: "Your reply has been updated successfully." });
    } catch (error) {
      console.error('Reply edit error:', error);
      toast({ title: "Error!", description: "Failed to update reply. Please try again.", variant: "destructive" });
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDeleteReply = async (reviewId: number, replyId: number) => {
    setReplyLoading(true);
    try {
      if (!replyId) throw new Error("Invalid reply ID");
      const token = getToken();
      if (!token) throw new Error("Authentication required");
      await axios.delete(`${BASE_URL}/users/${reviewId}/reply/${replyId}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      setReviews(prev => prev.map(rv => rv.id === reviewId ? { ...rv, reply: undefined } : rv));
      setDeleteConfirm(null);
      toast({ title: "Reply Deleted!", description: "The reply has been deleted successfully." });
    } catch (error: any) {
      console.error('Reply delete error:', error);
      const errorMsg = error?.response?.status === 401
        ? "Authentication failed. Please login again."
        : error?.response?.status === 404
          ? "Reply not found. It may have been deleted."
          : error?.response?.data?.message || "Failed to delete reply";
      toast({ title: "Error!", description: errorMsg, variant: "destructive" });
    } finally {
      setReplyLoading(false);
    }
  };

  const startReply = (reviewId: number) => {
    setReplyingToReview(reviewId);
    setEditingReply(null);
    setReplyText("");
  };

  const startEditReply = (reviewId: number, replyId: number, currentText: string) => {
    setEditingReply({ reviewId, replyId });
    setReplyingToReview(null);
    setReplyText(currentText);
  };

  const cancelReply = () => {
    setReplyingToReview(null);
    setEditingReply(null);
    setReplyText("");
  };

  const handleWriteReviewClick = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token && !user) {
      setShowLoginPrompt(true);
      return;
    }
    setShowReviewForm(!showReviewForm);
    if (!showReviewForm) { setErrors({}); setTouched({}); }
  };

  const handleLogin = () => {
    window.location.href = `/login?redirect=/product/${productId}`;
  };

  // ... (rest of your JSX rendering code remains the same)
  
  // Include all your render functions and JSX here
  const ErrorMessage = ({ message }: { message?: string }) => {
    if (!message) return null;
    return (
      <div className="flex items-center gap-1 mt-1 text-red-600 text-sm">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{message}</span>
      </div>
    );
  };

  const renderStarSVG = (fill: number, size = 24, key?: React.Key) => {
    const clipId = `clip-${Math.random().toString(36).slice(2, 9)}`;
    const viewBox = "0 0 24 24";
    return (
      <svg key={key} width={size} height={size} viewBox={viewBox} className="inline-block">
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={`${Math.max(0, Math.min(1, fill)) * 100}%`} height="100%" />
          </clipPath>
        </defs>
        <path
          d="M12 .587l3.668 7.431L23.4 9.75l-5.7 5.556L19.34 24 12 20.201 4.66 24l1.64-8.694L.6 9.75l7.733-1.732L12 .587z"
          fill="#E5E7EB"
        />
        <g clipPath={`url(#${clipId})`}>
          <path
            d="M12 .587l3.668 7.431L23.4 9.75l-5.7 5.556L19.34 24 12 20.201 4.66 24l1.64-8.694L.6 9.75l7.733-1.732L12 .587z"
            fill="#FBBF24"
          />
        </g>
      </svg>
    );
  };

  const onStarMouseMove = (e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = x < rect.width / 2 ? 0.5 : 1;
    setHoverRating(starIndex - 1 + half);
  };

  const onStarMouseLeave = () => {
    setHoverRating(null);
  };

  const onStarClick = (e: React.MouseEvent<HTMLButtonElement>, starIndex: number) => {
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const half = x < rect.width / 2 ? 0.5 : 1;
    const value = starIndex - 1 + half;
    const finalValue = Math.max(0.5, Math.min(5, Math.round(value * 2) / 2));
    handleFieldChange("rating", finalValue);
  };

  const displayFormRating = hoverRating ?? reviewForm.rating;

  // ... (include all your JSX return statement here - it's the same as before)
  
    return (
    <div className="mt-16 border-t pt-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">Reviews</span>
              </div>
              <span className="text-gray-600">
                {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleWriteReviewClick} className="bg-navy hover:bg-navy/90">
              <Send className="w-4 h-4 mr-2" /> Write a Review
            </Button>

            {isAdmin && (
              <Button 
                onClick={handleRefreshReviews} 
                variant="outline" 
                disabled={refreshingReviews} 
                size="sm"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${refreshingReviews ? 'animate-spin' : ''}`} />
                Refresh Reviews
              </Button>
            )}
          </div>
        </div>

        {/* Login Prompt Modal */}
        {showLoginPrompt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Login Required</h3>
                <button onClick={() => setShowLoginPrompt(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <LogIn className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Join the Conversation!</h4>
                <p className="text-gray-600 text-sm">Please login to share your experience and help other shoppers make better decisions.</p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleLogin} className="flex-1 bg-navy hover:bg-navy/90" size="lg">
                  <LogIn className="w-4 h-4 mr-2" /> Login Now
                </Button>
                <Button onClick={() => setShowLoginPrompt(false)} variant="outline" className="flex-1" size="lg">Maybe Later</Button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                Don't have an account? <a className="text-navy hover:underline" href="/register">Sign up here</a>
              </p>
            </div>
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <div className="bg-white border rounded-xl p-6 mb-8 shadow-sm">
            <h3 className="text-xl font-semibold mb-6">Write Your Review</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">Your Rating <span className="text-red-500">*</span></label>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => {
                    const filled = Math.max(0, Math.min(1, displayFormRating - (s - 1)));
                    const displayFill = Math.round(filled * 2) / 2;
                    return (
                      <button
                        key={s}
                        type="button"
                        onMouseMove={(e) => onStarMouseMove(e, s)}
                        onMouseLeave={onStarMouseLeave}
                        onClick={(e) => onStarClick(e, s)}
                        aria-label={`${s} star`}
                        className="p-1"
                        style={{ lineHeight: 0 }}
                      >
                        {renderStarSVG(displayFill, 24, `form-star-${s}`)}
                      </button>
                    );
                  })}
                  <div className="ml-3 text-sm text-gray-600">{displayFormRating.toFixed(1)} / 5</div>
                </div>

                <ErrorMessage message={touched.rating ? errors.rating : undefined} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Name <span className="text-red-500">*</span></label>
                <Input 
                  value={reviewForm.name} 
                  onChange={(e) => handleFieldChange("name", e.target.value)} 
                  onBlur={() => handleFieldBlur("name")} 
                  placeholder="Enter your name" 
                />
                <ErrorMessage message={errors.name} />
                {user && <p className="text-xs text-gray-500">Using: {user.name || user.username || 'Not set in profile'}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Your Review <span className="text-gray-500">(Optional)</span></label>
                <Textarea 
                  rows={5} 
                  value={reviewForm.comment} 
                  onChange={(e) => handleFieldChange("comment", e.target.value)} 
                  onBlur={() => handleFieldBlur("comment")} 
                  placeholder="Share your experience with this product..." 
                />
                <div className="flex justify-between items-center">
                  <ErrorMessage message={errors.comment} />
                  <span className={`text-xs ${reviewForm.comment.length > 1000 ? 'text-red-500' : 'text-gray-500'}`}>
                    {reviewForm.comment.length}/1000
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={reviewLoading || !isFormValid()} className="bg-navy hover:bg-navy/90">
                  {reviewLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" /> Submit Review
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => { 
                    setShowReviewForm(false); 
                    setErrors({}); 
                    setTouched({}); 
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Reviews List */}
        <div className="space-y-6">
          {reviews.length > 0 ? (
            <>
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-6 last:border-b-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {(review as any).user_name || review.name || 'Anonymous User'}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => {
                                const starIndex = i + 1;
                                const rawFill = Math.max(0, Math.min(1, (review.rating || 0) - (starIndex - 1)));
                                const displayFill = Math.round(rawFill * 2) / 2;
                                return (
                                  <span key={`r-${review.id}-s-${i}`} className="mr-0.5">
                                    {renderStarSVG(displayFill, 12, `r-${review.id}-star-${i}`)}
                                  </span>
                                );
                              })}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>
                                {review.isTemp ? 'Just now (Pending...)' : formatDateTime(review.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-700 leading-relaxed">{review.comment}</p>

                      {review.reply && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mt-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                                <UserCog className="w-4 h-4 text-white" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-blue-900">Official Store Reply</span>
                                <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">Official Response</span>
                                <div className="flex items-center gap-1 text-xs text-blue-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDateTime(review.reply.created_at)}</span>
                                </div>
                              </div>
                              <p className="text-blue-800 text-sm leading-relaxed">{review.reply.comment}</p>
                              <p className="text-xs text-blue-600 mt-1">Posted by {review.reply.admin_name || 'Store Admin'}</p>
                            </div>

                            {isAdmin && (
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => startEditReply(review.id, review.reply!.id, review.reply!.comment)} 
                                  className="h-8 px-2 text-blue-600 hover:text-blue-800"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setDeleteConfirm({ reviewId: review.id, replyId: review.reply!.id })} 
                                  className="h-8 px-2 text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {isAdmin && (
                        <div className="mt-4">
                          {replyingToReview === review.id ? (
                            <div className="bg-gray-50 border rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 mb-3">Post a Reply</h5>
                              <Textarea 
                                value={replyText} 
                                onChange={(e) => setReplyText(e.target.value)} 
                                placeholder="Type your reply to this review..." 
                                rows={3} 
                                className="mb-3" 
                              />
                              <div className="flex gap-2">
                                <Button onClick={() => handleReplySubmit(review.id)} disabled={replyLoading} size="sm">
                                  {replyLoading ? (
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Send className="w-4 h-4 mr-2" />
                                  )}
                                  Post Reply
                                </Button>
                                <Button onClick={cancelReply} variant="outline" size="sm">Cancel</Button>
                              </div>
                            </div>
                          ) : editingReply?.reviewId === review.id ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 mb-3">Edit Reply</h5>
                              <Textarea 
                                value={replyText} 
                                onChange={(e) => setReplyText(e.target.value)} 
                                placeholder="Edit your reply..." 
                                rows={3} 
                                className="mb-3" 
                              />
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => handleEditReply(review.id, editingReply.replyId)} 
                                  disabled={replyLoading} 
                                  size="sm"
                                >
                                  {replyLoading ? (
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Edit className="w-4 h-4 mr-2" />
                                  )}
                                  Update Reply
                                </Button>
                                <Button onClick={cancelReply} variant="outline" size="sm">Cancel</Button>
                              </div>
                            </div>
                          ) : !review.reply ? (
                            <Button onClick={() => startReply(review.id)} variant="outline" size="sm" className="mt-2">
                              <UserCog className="w-4 h-4 mr-2 text-blue-700" /> Reply as Admin
                            </Button>
                          ) : null}
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              ))}

              {/* Load More Button */}
              {currentPage < totalPages && (
                <div className="flex justify-center pt-6 border-t">
                  <Button
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto min-w-[200px] hover:bg-navy hover:text-white transition-colors"
                  >
                    {loadingMore ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Loading more reviews...
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Load More Reviews ({reviews.length} of {totalReviews})
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Pagination Info */}
              {totalPages > 1 && (
                <div className="text-center text-sm text-gray-500 pt-2">
                  Showing {reviews.length} of {totalReviews} reviews
                  {currentPage >= totalPages && ' (All loaded)'}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-500 mb-6">Be the first to share your thoughts about this product!</p>
              <Button onClick={handleWriteReviewClick} className="bg-navy hover:bg-navy/90">
                Write First Review
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Delete Reply?</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete this reply? This action cannot be undone.</p>
              <div className="flex gap-3">
                <Button onClick={() => setDeleteConfirm(null)} variant="outline" className="flex-1">Cancel</Button>
                <Button 
                  onClick={() => handleDeleteReply(deleteConfirm.reviewId, deleteConfirm.replyId)} 
                  disabled={replyLoading} 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {replyLoading ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-2" />
                  )}
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
