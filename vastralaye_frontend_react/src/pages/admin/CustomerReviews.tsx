import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { BASE_URL } from "@/config";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  MessageSquare,
  Star,
  TrendingUp,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  Reply,
  CheckCircle2,
  User,
  Package,
  Calendar,
  Shield,
  Copy,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

/* ================= TYPES ================= */

interface Review {
  id: number;
  rating: number;
  comment: string;
  user_name: string;
  email?: string;
  created_at: string;
  product_id?: number;
  product_name?: string;
  product_image?: string;
  reply?: {
    id: number;
    comment: string;
    created_at: string;
    updated_at?: string;
    admin_name?: string;
  };
}

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  onSave: (reviewId: number, rating: number, comment: string) => void;
}

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  onDelete: (reviewId: number) => void;
}

interface ReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  review: Review | null;
  onReply: (reviewId: number, replyComment: string) => void;
  onEditReply?: (reviewId: number, replyId: number, replyComment: string) => void;
  onDeleteReply?: (reviewId: number, replyId: number) => void;
}

/* ================= REPLY MODAL ================= */

const ReplyModal = ({
  isOpen,
  onClose,
  review,
  onReply,
  onEditReply,
  onDeleteReply,
}: ReplyModalProps) => {
  const [replyComment, setReplyComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (review?.reply) {
      setReplyComment(review.reply.comment);
      setEditing(true);
    } else {
      setReplyComment("");
      setEditing(false);
    }
  }, [review]);

  const handleSubmit = async () => {
    if (!review) return;
    if (!replyComment.trim()) {
      toast.error("Please enter a reply comment");
      return;
    }
    setSubmitting(true);
    try {
      if (editing && review.reply && onEditReply) {
        if (!review.reply.id) throw new Error("Reply ID is undefined");
        await onEditReply(review.id, review.reply.id, replyComment);
      } else {
        await onReply(review.id, replyComment);
      }
      onClose();
      toast.success(editing ? "Reply updated successfully!" : "Reply posted successfully!");
    } catch (error: any) {
      toast.error(
        error.message || (editing ? "Failed to update reply" : "Failed to post reply")
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReply = async () => {
    if (!review?.reply || !onDeleteReply) return;
    if (!confirm("Are you sure you want to delete this reply?")) return;
    if (!review.reply.id) {
      toast.error("Cannot delete reply: Reply ID is missing");
      return;
    }
    setSubmitting(true);
    try {
      await onDeleteReply(review.id, review.reply.id);
      onClose();
      toast.success("Reply deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete reply");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setReplyComment("");
    setEditing(false);
    onClose();
  };

  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <Reply className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">
                {editing ? "Edit Reply" : "Reply to Review"}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-5 rounded-xl border-2 border-gray-200">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex text-yellow-500 text-lg">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-current" />
                ))}
                {Array.from({ length: 5 - review.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-gray-300" />
                ))}
              </div>
              <span className="text-xs font-mono bg-white px-3 py-1.5 rounded-full font-semibold text-gray-700 border border-gray-300">
                ID: {review.id}
              </span>
            </div>
            <p className="text-gray-800 font-medium mb-3 leading-relaxed">
              "{review.comment}"
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>{review.user_name || "Anonymous"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                <span>{review.product_name}</span>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Your Reply
            </label>
            <textarea
              value={replyComment}
              onChange={(e) => setReplyComment(e.target.value)}
              rows={5}
              maxLength={500}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all"
              placeholder="Type your professional response to the customer..."
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-sm text-gray-500">{replyComment.length}/500 characters</p>
              <div
                className={`text-sm font-semibold ${
                  replyComment.length > 450 ? "text-orange-600" : "text-gray-400"
                }`}
              >
                {500 - replyComment.length} remaining
              </div>
            </div>
          </div>
          {editing && review.reply && (
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border-2 border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-yellow-700" />
                <p className="text-sm font-bold text-yellow-800">Current Reply</p>
              </div>
              <p className="text-sm text-yellow-900 mb-2 leading-relaxed">
                {review.reply.comment}
              </p>
              <p className="text-xs text-yellow-700">
                Posted on {new Date(review.reply.created_at).toLocaleString()}
              </p>
              {!review.reply.id && (
                <p className="text-xs text-red-600 mt-2 font-semibold">
                  ⚠️ Reply ID missing - cannot edit/delete
                </p>
              )}
            </div>
          )}
        </div>
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex gap-3">
          {editing && review.reply?.id && (
            <button
              onClick={handleDeleteReply}
              disabled={submitting}
              className="px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
            >
              <Trash2 className="w-4 h-4" />
              Delete Reply
            </button>
          )}
          <button
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || (editing && !review.reply?.id)}
            className="flex-1 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {editing ? "Updating..." : "Posting..."}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                {editing ? "Update Reply" : "Post Reply"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= EDIT MODAL ================= */

const EditModal = ({ isOpen, onClose, review, onSave }: EditModalProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (review) {
      setRating(review.rating);
      setComment(review.comment);
    }
  }, [review]);

  const handleSave = async () => {
    if (!review) return;
    if (!comment.trim()) {
      toast.error("Please enter a comment");
      return;
    }
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating between 1 and 5");
      return;
    }
    setSaving(true);
    try {
      await onSave(review.id, rating, comment);
      onClose();
      toast.success("Review updated successfully!");
    } catch (error) {
      toast.error("Failed to update review");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (review) {
      setRating(review.rating);
      setComment(review.comment);
    }
    onClose();
  };

  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 rounded-lg">
                <Edit2 className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Edit Review</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-4 rounded-xl border-2 border-gray-200">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <strong className="font-bold text-gray-900">Review ID:</strong>
              <span
                className="font-mono bg-white px-3 py-1.5 rounded-lg cursor-pointer hover:bg-purple-100 transition-all font-semibold text-purple-700 border-2 border-purple-200"
                onClick={() => {
                  navigator.clipboard.writeText(review.id.toString());
                  toast.success("Review ID copied!");
                }}
              >
                {review.id}
              </span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3">Rating</label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-4xl transition-all hover:scale-125 ${
                    star <= rating ? "text-yellow-500" : "text-gray-300"
                  }`}
                >
                  <Star className={`w-10 h-10 ${star <= rating ? "fill-current" : ""}`} />
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-3 font-semibold">
              Selected: {rating} star{rating !== 1 ? "s" : ""}
            </p>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              maxLength={500}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none transition-all"
              placeholder="Enter your review comment..."
            />
            <p className="text-sm text-gray-500 mt-2">{comment.length}/500 characters</p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-purple-50 p-4 rounded-xl border-2 border-gray-200 space-y-2">
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-purple-600" />
              <strong>Product:</strong> {review.product_name || "Unknown"}
            </p>
            <p className="text-sm text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4 text-purple-600" />
              <strong>User:</strong> {review.user_name || "Anonymous"}
            </p>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 rounded-b-2xl flex gap-3">
          <button
            onClick={handleClose}
            disabled={saving}
            className="flex-1 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= DELETE MODAL ================= */

const DeleteModal = ({ isOpen, onClose, review, onDelete }: DeleteModalProps) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!review) return;
    setDeleting(true);
    try {
      await onDelete(review.id);
      onClose();
      toast.success("Review deleted successfully!");
    } catch (error) {
      toast.error("Failed to delete review");
    } finally {
      setDeleting(false);
    }
  };

  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl transform transition-all animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Delete Review?</h3>
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this review?
          </p>
          <div className="bg-gradient-to-br from-gray-50 to-red-50 p-4 rounded-xl border-2 border-red-200 mb-4 text-left">
            <div className="flex justify-between items-start mb-3">
              <div className="flex text-yellow-500 text-sm">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
                {Array.from({ length: 5 - review.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-gray-300" />
                ))}
              </div>
              <span className="text-xs font-mono bg-white px-2 py-1 rounded-full font-semibold text-gray-700 border border-gray-300">
                ID: {review.id}
              </span>
            </div>
            <p className="text-sm text-gray-800 font-medium line-clamp-2 mb-2">
              "{review.comment}"
            </p>
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {review.user_name || "Anonymous"}
              </div>
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                {review.product_name}
              </div>
            </div>
          </div>
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 mb-4">
            <p className="text-sm text-red-700 font-bold">
              ⚠️ This action cannot be undone
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all disabled:opacity-50 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  Delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= MAIN COMPONENT ================= */

export default function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterReplied, setFilterReplied] = useState<
    "replied" | "unreplied" | null
  >(null);
  const [sortBy, setSortBy] = useState<
    "newest" | "oldest" | "highest" | "lowest"
  >("newest");
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [deletingReview, setDeletingReview] = useState<Review | null>(null);
  const [replyingReview, setReplyingReview] = useState<Review | null>(null);

  // ===== PAGINATION STATE =====
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  /* ================= AUTH ================= */

  const getToken = () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required. Please login again.");
        return null;
      }
      return token;
    } catch (error) {
      return null;
    }
  };

  /* ================= FETCH ALL REVIEWS ================= */

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError("");
      const token = getToken();
      if (!token) {
        setError("Authentication required");
        setLoading(false);
        return;
      }

      // ✅ FIX: Fetch ALL reviews by passing large page_size
      const response = await axios.get(`${BASE_URL}/users/reviews`, {
        params: {
          page: 1,
          page_size: 100, // Fetch all reviews at once for client-side pagination
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let reviewsData: Review[] = [];

      if (Array.isArray(response.data)) {
        reviewsData = response.data;
      } else if (
        response.data &&
        Array.isArray((response.data as any).data)
      ) {
        // ✅ Check for "data" key
        reviewsData = (response.data as any).data;
      } else if (
        response.data &&
        Array.isArray((response.data as any).reviews)
      ) {
        reviewsData = (response.data as any).reviews;
      } else if (response.data && typeof response.data === "object") {
        const possibleArrays = Object.values(response.data).filter((item) =>
          Array.isArray(item)
        );
        if (possibleArrays.length > 0)
          reviewsData = possibleArrays[0] as Review[];
      }

      console.log("📦 Total reviews fetched from API:", reviewsData.length);

      if (reviewsData.length === 0) {
        toast.success("No reviews found");
        setReviews([]);
        setLoading(false);
        return;
      }

      // Fetch replies for each review
      const reviewsWithReplies = await Promise.all(
        reviewsData.map(async (review: Review) => {
          try {
            const repliesRes = await axios.get(
              `${BASE_URL}/users/${review.id}/replies`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              }
            );
            let replies: any[] = [];
            const rd = repliesRes.data as any;
            if (Array.isArray(rd)) replies = rd;
            else if (rd && Array.isArray(rd.data)) replies = rd.data;
            else if (rd && Array.isArray(rd.replies)) replies = rd.replies;

            if (replies.length > 0) {
              const r = replies[0];
              return {
                ...review,
                reply: {
                  id: r.id,
                  comment: r.reply_text,
                  created_at: r.created_at,
                  admin_name: r.admin_name || "Admin",
                },
              };
            }
            return review;
          } catch {
            return review;
          }
        })
      );

      setReviews(reviewsWithReplies);
      setCurrentPage(1); // ✅ Reset to page 1 on fresh fetch
      toast.success(`Loaded ${reviewsWithReplies.length} reviews`);
    } catch (error: any) {
      let errorMessage = "Failed to fetch reviews.";
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Authentication failed. Please login again.";
          localStorage.removeItem("token");
        } else {
          errorMessage =
            error.response.data?.message ||
            `Server error: ${error.response.status}`;
        }
      } else if (error.request) {
        errorMessage = "No response from server.";
      } else {
        errorMessage = error.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= DELETE REVIEW ================= */

  const handleDeleteReview = async (reviewId: number) => {
    try {
      const token = getToken();
      if (!token) throw new Error("Authentication required");
      await axios.delete(
        `${BASE_URL}/users/product/review/delete/${reviewId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setReviews(reviews.filter((r) => r.id !== reviewId));
    } catch (error: any) {
      const msg =
        error?.response?.status === 401
          ? "Auth failed."
          : error?.response?.data?.message || "Failed to delete";
      toast.error(msg);
      throw error;
    }
  };

  /* ================= UPDATE REVIEW ================= */

  const handleUpdateReview = async (
    reviewId: number,
    newRating: number,
    newComment: string
  ) => {
    try {
      const token = getToken();
      if (!token) throw new Error("Authentication required");
      const formData = new URLSearchParams();
      formData.append("rating", newRating.toString());
      formData.append("comment", newComment);
      await axios.put(
        `${BASE_URL}/users/product/review/edit/${reviewId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      setReviews(
        reviews.map((r) =>
          r.id === reviewId
            ? { ...r, rating: newRating, comment: newComment }
            : r
        )
      );
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || "Failed to update";
      toast.error(msg);
      throw error;
    }
  };

  /* ================= CREATE REPLY ================= */

  const handleReply = async (reviewId: number, replyComment: string) => {
    try {
      const token = getToken();
      if (!token) throw new Error("Authentication required");
      const formData = new FormData();
      formData.append("reply_text", replyComment);
      const response = await axios.post(
        `${BASE_URL}/users/${reviewId}/reply`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
          transformRequest: (data) => data,
        }
      );
      const r = response.data.reply;
      const newReply = {
        id: r.id,
        comment: r.reply_text,
        created_at: r.created_at,
        admin_name: "Admin",
      };
      setReviews(
        reviews.map((review) =>
          review.id === reviewId ? { ...review, reply: newReply } : review
        )
      );
    } catch {
      toast.error("Failed to post reply");
    }
  };

  /* ================= EDIT REPLY ================= */

  const handleEditReply = async (
    reviewId: number,
    replyId: number,
    replyComment: string
  ) => {
    try {
      const token = getToken();
      if (!token) throw new Error("Authentication required");
      const formData = new FormData();
      formData.append("reply_text", replyComment);
      const response = await axios.put(
        `${BASE_URL}/users/${reviewId}/reply/${replyId}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const r = response.data.reply;
      const updatedReply = {
        id: r.id,
        comment: r.reply_text,
        created_at: r.created_at,
        admin_name: "Admin",
      };
      setReviews(
        reviews.map((review) =>
          review.id === reviewId
            ? { ...review, reply: updatedReply }
            : review
        )
      );
    } catch {
      toast.error("Failed to update reply");
    }
  };

  /* ================= DELETE REPLY ================= */

  const handleDeleteReply = async (reviewId: number, replyId: number) => {
    try {
      if (!replyId) throw new Error("Invalid reply ID");
      const token = getToken();
      if (!token) throw new Error("Authentication required");
      await axios.delete(
        `${BASE_URL}/users/${reviewId}/reply/${replyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      setReviews(
        reviews.map((review) =>
          review.id === reviewId
            ? { ...review, reply: undefined }
            : review
        )
      );
    } catch (error: any) {
      const msg =
        error?.response?.data?.message || "Failed to delete reply";
      toast.error(msg);
      throw error;
    }
  };

  /* ================= FILTER & SORT ================= */

  const filteredAndSortedReviews = reviews
    .filter((review) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        review.comment.toLowerCase().includes(searchLower) ||
        review.user_name?.toLowerCase().includes(searchLower) ||
        review.product_name?.toLowerCase().includes(searchLower) ||
        (review.product_id &&
          review.product_id.toString().includes(searchTerm)) ||
        review.id.toString().includes(searchTerm) ||
        (review.reply &&
          review.reply.comment.toLowerCase().includes(searchLower));
      const matchesRating = filterRating
        ? review.rating === filterRating
        : true;
      const matchesReplyStatus = filterReplied
        ? filterReplied === "replied"
          ? !!review.reply
          : !review.reply
        : true;
      return matchesSearch && matchesRating && matchesReplyStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        case "oldest":
          return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
          );
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return 0;
      }
    });

  /* ================= PAGINATION LOGIC ================= */

  const totalFiltered = filteredAndSortedReviews.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));

  // Auto-adjust page if exceeds total
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalFiltered, pageSize, currentPage, totalPages]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRating, filterReplied, sortBy, pageSize]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalFiltered);
  const paginatedReviews = filteredAndSortedReviews.slice(
    startIndex,
    endIndex
  );

  // Generate smart page numbers
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  /* ================= EFFECTS ================= */

  useEffect(() => {
    fetchReviews();
  }, []);

  /* ================= HELPERS ================= */

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  /* ================= LOADING STATE ================= */

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="flex justify-center items-center py-32">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-600 mt-6 text-lg font-medium">
                Loading reviews...
              </p>
              <p className="text-gray-400 text-sm mt-2">Please wait a moment</p>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  /* ================= RENDER ================= */

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* ===== HEADER ===== */}
        <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <MessageSquare className="h-8 w-8" />
                </div>
                <h1 className="text-3xl font-bold">Customer Reviews</h1>
              </div>
              <p className="text-orange-100 text-lg">
                Manage and monitor customer feedback
              </p>
              <div className="flex items-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                    <span className="font-semibold text-lg">
                      {reviews.length}
                    </span>
                  </div>
                  <span className="text-orange-100">Total Reviews</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                    <span className="font-semibold text-lg">
                      {reviews.length > 0
                        ? (
                            reviews.reduce((acc, r) => acc + r.rating, 0) /
                            reviews.length
                          ).toFixed(1)
                        : "0.0"}
                    </span>
                  </div>
                  <span className="text-orange-100">Avg Rating</span>
                </div>
                {/* ✅ NEW: Show filtered count */}
                {totalFiltered !== reviews.length && (
                  <div className="flex items-center gap-2">
                    <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                      <span className="font-semibold text-lg">
                        {totalFiltered}
                      </span>
                    </div>
                    <span className="text-orange-100">Filtered</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={fetchReviews}
              className="bg-white text-orange-600 px-6 py-3 rounded-xl hover:bg-orange-50 transition-all flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
        </div>

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl border-0 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Reviews
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {reviews.length}
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-xl">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border-0 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Average Rating
                </p>
                <p className="text-3xl font-bold text-yellow-600">
                  {reviews.length > 0
                    ? (
                        reviews.reduce((acc, r) => acc + r.rating, 0) /
                        reviews.length
                      ).toFixed(1)
                    : "0.0"}
                </p>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-4 rounded-xl">
                <Star className="h-6 w-6 text-white fill-current" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border-0 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Reply Rate
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {reviews.length > 0
                    ? `${Math.round(
                        (reviews.filter((r) => r.reply).length /
                          reviews.length) *
                          100
                      )}%`
                    : "0%"}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${
                        reviews.length > 0
                          ? (reviews.filter((r) => r.reply).length /
                              reviews.length) *
                            100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border-0 shadow-lg hover:shadow-xl transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Needs Attention
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {reviews.filter((r) => r.rating <= 2).length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Low ratings</p>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* ===== FILTERS + PAGE SIZE ===== */}
        <div className="bg-white p-6 rounded-xl border-0 shadow-lg">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search reviews, replies, customers, products, or IDs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
                />
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <select
                value={filterRating || ""}
                onChange={(e) =>
                  setFilterRating(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
              >
                <option value="">All Ratings</option>
                <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                <option value="3">⭐⭐⭐ 3 Stars</option>
                <option value="2">⭐⭐ 2 Stars</option>
                <option value="1">⭐ 1 Star</option>
              </select>

              <select
                value={filterReplied || ""}
                onChange={(e) =>
                  setFilterReplied(
                    e.target.value
                      ? (e.target.value as "replied" | "unreplied")
                      : null
                  )
                }
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
              >
                <option value="">All Reviews</option>
                <option value="replied">✓ With Replies</option>
                <option value="unreplied">○ Without Replies</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
              >
                <option value="newest">↓ Newest First</option>
                <option value="oldest">↑ Oldest First</option>
                <option value="highest">★ Highest Rated</option>
                <option value="lowest">☆ Lowest Rated</option>
              </select>

              {/* ✅ PAGE SIZE SELECTOR */}
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-medium"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            </div>
          </div>
        </div>

        {/* ===== ERROR ===== */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-red-100 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-700 hover:text-red-900 font-bold text-xl"
            >
              ×
            </button>
          </div>
        )}

        {/* ===== PAGINATION INFO BAR ===== */}
        {totalFiltered > 0 && (
          <div className="bg-white px-6 py-4 rounded-xl shadow-lg border-0 flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-sm text-gray-600 font-medium">
              Showing{" "}
              <span className="font-bold text-gray-900">
                {startIndex + 1}
              </span>
              {" - "}
              <span className="font-bold text-gray-900">{endIndex}</span>
              {" of "}
              <span className="font-bold text-gray-900">{totalFiltered}</span>
              {" reviews"}
              {totalFiltered !== reviews.length && (
                <span className="text-gray-400 ml-1">
                  (filtered from {reviews.length} total)
                </span>
              )}
            </p>
            <p className="text-sm text-gray-500">
              Page{" "}
              <span className="font-bold text-gray-900">{currentPage}</span> of{" "}
              <span className="font-bold text-gray-900">{totalPages}</span>
            </p>
          </div>
        )}

        {/* ===== REVIEWS LIST ===== */}
        {filteredAndSortedReviews.length === 0 ? (
          <div className="bg-white rounded-2xl border-0 shadow-lg p-16 text-center">
            <div className="bg-gradient-to-br from-orange-100 to-pink-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-12 w-12 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No reviews found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-4">
              {searchTerm || filterRating || filterReplied
                ? "No reviews match your current filters."
                : "Customer reviews will appear here once they start reviewing products."}
            </p>
            {(searchTerm || filterRating || filterReplied) && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterRating(null);
                  setFilterReplied(null);
                }}
                className="mt-4 bg-gradient-to-r from-orange-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-orange-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* ✅ Uses paginatedReviews (NOT filteredAndSortedReviews) */}
            {paginatedReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white border-0 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Rating Badge */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-20 h-20 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg ${
                        review.rating >= 4
                          ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                          : review.rating >= 3
                          ? "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white"
                          : "bg-gradient-to-br from-red-500 to-red-600 text-white"
                      }`}
                    >
                      {review.rating}.0
                    </div>
                    {review.reply && (
                      <div className="mt-3 text-center">
                        <span className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 justify-center shadow-md">
                          <CheckCircle2 className="w-3 h-3" />
                          Replied
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <div className="flex text-yellow-500 text-lg">
                            {Array.from({ length: review.rating }).map(
                              (_, i) => (
                                <Star
                                  key={i}
                                  className="w-5 h-5 fill-current"
                                />
                              )
                            )}
                            {Array.from({
                              length: 5 - review.rating,
                            }).map((_, i) => (
                              <Star
                                key={i}
                                className="w-5 h-5 text-gray-300"
                              />
                            ))}
                          </div>
                          <span
                            className="font-mono bg-gradient-to-r from-orange-100 to-pink-100 px-3 py-1.5 rounded-full text-xs cursor-pointer hover:from-orange-200 hover:to-pink-200 transition-all font-bold text-orange-700 border-2 border-orange-200"
                            onClick={() =>
                              copyToClipboard(review.id.toString())
                            }
                          >
                            <Copy className="w-3 h-3 inline mr-1" />
                            ID: {review.id}
                          </span>
                        </div>
                        <p className="text-gray-800 text-lg font-medium mt-2 leading-relaxed">
                          "{review.comment}"
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setReplyingReview(review)}
                          className={`font-semibold flex items-center gap-2 px-4 py-2 rounded-xl transition-all shadow-md hover:shadow-lg ${
                            review.reply
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                              : "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                          }`}
                        >
                          <Reply className="w-4 h-4" />
                          {review.reply ? "Edit" : "Reply"}
                        </button>
                        <button
                          onClick={() => setEditingReview(review)}
                          className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-semibold flex items-center gap-2 px-4 py-2 rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingReview(review)}
                          className="bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold flex items-center gap-2 px-4 py-2 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-md hover:shadow-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Admin Reply */}
                    {review.reply && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 mt-4 shadow-md">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-xl flex items-center justify-center shadow-lg">
                              <Shield className="w-6 h-6 text-white" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              <span className="text-sm font-bold text-green-900 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" />
                                Store Response
                              </span>
                              <span className="text-xs text-green-700 bg-green-100 px-3 py-1 rounded-full font-bold border border-green-200">
                                ✓ Official Reply
                              </span>
                              <span className="text-xs text-green-600 font-semibold">
                                {new Date(
                                  review.reply.created_at
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="bg-white rounded-xl p-4 border-2 border-green-100">
                              <p className="text-green-900 font-medium leading-relaxed">
                                {review.reply.comment}
                              </p>
                            </div>
                            <div className="flex justify-between items-center mt-3">
                              <p className="text-xs text-green-700 font-bold flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {review.reply.admin_name ||
                                  "Store Administrator"}
                              </p>
                              {review.reply.updated_at &&
                                review.reply.created_at !==
                                  review.reply.updated_at && (
                                  <p className="text-xs text-green-600 font-semibold">
                                    Edited{" "}
                                    {new Date(
                                      review.reply.updated_at
                                    ).toLocaleDateString()}
                                  </p>
                                )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-4 pt-4 border-t-2 border-gray-100 text-sm text-gray-600 mt-4">
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                        <User className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold">
                          {review.user_name || "Anonymous User"}
                        </span>
                      </div>
                      {review.product_id && (
                        <div
                          className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg cursor-pointer hover:bg-orange-100 transition-all"
                          onClick={() =>
                            copyToClipboard(review.product_id!.toString())
                          }
                        >
                          <Package className="w-4 h-4 text-orange-600" />
                          <span className="font-mono font-semibold">
                            Product: {review.product_id}
                          </span>
                        </div>
                      )}
                      {review.product_name && (
                        <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                          <Package className="w-4 h-4 text-orange-600" />
                          <span className="font-semibold">
                            {review.product_name}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <span className="font-semibold">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===================== PAGINATION CONTROLS ===================== */}
        {totalFiltered > 0 && totalPages > 1 && (
          <div className="bg-white rounded-2xl shadow-lg border-0 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left: Showing info */}
              <p className="text-sm text-gray-600 font-medium">
                Showing{" "}
                <span className="font-bold text-gray-900">
                  {startIndex + 1}
                </span>
                {" - "}
                <span className="font-bold text-gray-900">{endIndex}</span>
                {" of "}
                <span className="font-bold text-gray-900">
                  {totalFiltered}
                </span>
                {" reviews"}
              </p>

              {/* Center: Page Buttons */}
              <div className="flex items-center gap-1.5">
                {/* First Page */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2.5 rounded-xl border-2 border-gray-200 hover:bg-gray-100 
                             disabled:opacity-40 disabled:cursor-not-allowed 
                             transition-all hover:shadow-md"
                  title="First page"
                >
                  <ChevronsLeft className="w-4 h-4 text-gray-700" />
                </button>

                {/* Previous */}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-gray-200 
                             hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed 
                             transition-all font-semibold text-gray-700 hover:shadow-md"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((pageNum, index) => {
                    if (pageNum === "...") {
                      return (
                        <span
                          key={`ellipsis-${index}`}
                          className="w-10 h-10 flex items-center justify-center text-gray-400 font-bold"
                        >
                          ···
                        </span>
                      );
                    }
                    const num = pageNum as number;
                    const isActive = currentPage === num;
                    return (
                      <button
                        key={num}
                        onClick={() => setCurrentPage(num)}
                        className={`w-10 h-10 rounded-xl font-bold text-sm transition-all ${
                          isActive
                            ? "bg-gradient-to-r from-orange-600 to-pink-600 text-white shadow-lg scale-110"
                            : "border-2 border-gray-200 text-gray-700 hover:bg-gray-100 hover:shadow-md"
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                {/* Next */}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border-2 border-gray-200 
                             hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed 
                             transition-all font-semibold text-gray-700 hover:shadow-md"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2.5 rounded-xl border-2 border-gray-200 hover:bg-gray-100 
                             disabled:opacity-40 disabled:cursor-not-allowed 
                             transition-all hover:shadow-md"
                  title="Last page"
                >
                  <ChevronsRight className="w-4 h-4 text-gray-700" />
                </button>
              </div>

              {/* Right: Quick Jump */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">
                  Go to:
                </span>
                <input
                  type="number"
                  min={1}
                  max={totalPages}
                  value={currentPage}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val >= 1 && val <= totalPages)
                      setCurrentPage(val);
                  }}
                  className="w-16 px-3 py-2 border-2 border-gray-200 rounded-xl text-center 
                             font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 
                             focus:border-orange-500 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* ===== MODALS ===== */}
        <EditModal
          isOpen={!!editingReview}
          onClose={() => setEditingReview(null)}
          review={editingReview}
          onSave={handleUpdateReview}
        />
        <DeleteModal
          isOpen={!!deletingReview}
          onClose={() => setDeletingReview(null)}
          review={deletingReview}
          onDelete={handleDeleteReview}
        />
        <ReplyModal
          isOpen={!!replyingReview}
          onClose={() => setReplyingReview(null)}
          review={replyingReview}
          onReply={handleReply}
          onEditReply={handleEditReply}
          onDeleteReply={handleDeleteReply}
        />
      </div>
    </AdminLayout>
  );
}