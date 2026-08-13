import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminLoading from '@/components/admin/AdminLoading';
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
    <div className="fixed inset-0 bg-espresso/40 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-md border border-border max-w-2xl w-full transform transition-all animate-in zoom-in-95 duration-200">
        <div className="bg-[#FBF8F3] border-b border-border px-6 py-4 rounded-t-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-maroon/10 p-2 rounded-md">
                <Reply className="h-5 w-5 text-maroon" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso">
                {editing ? "Edit Reply" : "Reply to Review"}
              </h3>
            </div>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-espresso p-2 rounded-md transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-[#FBF8F3] p-5 rounded-md border border-border">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex text-gold text-lg">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
                {Array.from({ length: 5 - review.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-sand" />
                ))}
              </div>
              <span className="text-[11px] font-mono bg-white px-2.5 py-1 rounded-full font-semibold text-muted-foreground border border-border">
                ID: {review.id}
              </span>
            </div>
            <p className="text-espresso text-[13.5px] font-medium mb-3 leading-relaxed">
              "{review.comment}"
            </p>
            <div className="flex items-center gap-4 text-[12.5px] text-muted-foreground">
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
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2">
              Your Reply
            </label>
            <textarea
              value={replyComment}
              onChange={(e) => setReplyComment(e.target.value)}
              rows={5}
              maxLength={500}
              className="w-full px-4 py-3 border border-border bg-white text-[13px] rounded-sm focus:outline-none focus:border-maroon resize-none transition-all"
              placeholder="Type your professional response to the customer..."
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-[12px] text-muted-foreground">{replyComment.length}/500 characters</p>
              <div
                className={`text-[12px] font-semibold ${
                  replyComment.length > 450 ? "text-amber-700" : "text-muted-foreground"
                }`}
              >
                {500 - replyComment.length} remaining
              </div>
            </div>
          </div>
          {editing && review.reply && (
            <div className="bg-[#FBF8F3] p-4 rounded-r-md border-l-[3px] border-gold">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-[#8a6414]" />
                <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-espresso">Current Reply</p>
              </div>
              <p className="text-[12.5px] text-muted-foreground mb-2 leading-relaxed">
                {review.reply.comment}
              </p>
              <p className="text-xs text-muted-foreground">
                Posted on {new Date(review.reply.created_at).toLocaleString()}
              </p>
              {!review.reply.id && (
                <p className="text-xs text-sale mt-2 font-semibold">
                  ⚠️ Reply ID missing - cannot edit/delete
                </p>
              )}
            </div>
          )}
        </div>
        <div className="bg-[#FBF8F3] border-t border-border px-6 py-4 rounded-b-md flex gap-3">
          {editing && review.reply?.id && (
            <button
              onClick={handleDeleteReply}
              disabled={submitting}
              className="px-5 py-2.5 bg-sale text-ivory rounded-sm uppercase text-[11px] tracking-[0.12em] hover:bg-sale/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
            >
              <Trash2 className="w-4 h-4" />
              Delete Reply
            </button>
          )}
          <button
            onClick={handleClose}
            disabled={submitting}
            className="flex-1 px-5 py-2.5 border border-espresso text-espresso rounded-sm uppercase text-[11px] tracking-[0.12em] hover:bg-espresso hover:text-ivory transition-all disabled:opacity-50 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || (editing && !review.reply?.id)}
            className="flex-1 px-5 py-2.5 bg-maroon text-ivory rounded-sm uppercase text-[11px] tracking-[0.12em] hover:bg-terracotta transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
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
    <div className="fixed inset-0 bg-espresso/40 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-md border border-border max-w-2xl w-full transform transition-all animate-in zoom-in-95 duration-200">
        <div className="bg-[#FBF8F3] border-b border-border px-6 py-4 rounded-t-md">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-maroon/10 p-2 rounded-md">
                <Edit2 className="h-5 w-5 text-maroon" />
              </div>
              <h3 className="font-serif text-xl font-medium text-espresso">Edit Review</h3>
            </div>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-espresso p-2 rounded-md transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          <div className="bg-[#FBF8F3] p-4 rounded-md border border-border">
            <p className="text-[13px] text-muted-foreground flex items-center gap-2">
              <strong className="font-semibold text-espresso">Review ID:</strong>
              <span
                className="font-mono bg-white px-2.5 py-1 rounded cursor-pointer hover:text-maroon transition-all font-semibold text-espresso border border-border"
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
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-3">Rating</label>
            <div className="flex gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`transition-all ${
                    star <= rating ? "text-gold" : "text-sand"
                  }`}
                >
                  <Star className={`w-8 h-8 ${star <= rating ? "fill-current" : ""}`} />
                </button>
              ))}
            </div>
            <p className="text-[12.5px] text-muted-foreground mt-3 font-semibold">
              Selected: {rating} star{rating !== 1 ? "s" : ""}
            </p>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-espresso mb-2">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={5}
              maxLength={500}
              className="w-full px-4 py-3 border border-border bg-white text-[13px] rounded-sm focus:outline-none focus:border-maroon resize-none transition-all"
              placeholder="Enter your review comment..."
            />
            <p className="text-[12px] text-muted-foreground mt-2">{comment.length}/500 characters</p>
          </div>
          <div className="bg-[#FBF8F3] p-4 rounded-md border border-border space-y-2">
            <p className="text-[13px] text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4 text-maroon" />
              <strong className="text-espresso">Product:</strong> {review.product_name || "Unknown"}
            </p>
            <p className="text-[13px] text-muted-foreground flex items-center gap-2">
              <User className="w-4 h-4 text-maroon" />
              <strong className="text-espresso">User:</strong> {review.user_name || "Anonymous"}
            </p>
          </div>
        </div>
        <div className="bg-[#FBF8F3] border-t border-border px-6 py-4 rounded-b-md flex gap-3">
          <button
            onClick={handleClose}
            disabled={saving}
            className="flex-1 px-5 py-2.5 border border-espresso text-espresso rounded-sm uppercase text-[11px] tracking-[0.12em] hover:bg-espresso hover:text-ivory transition-all disabled:opacity-50 font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-5 py-2.5 bg-maroon text-ivory rounded-sm uppercase text-[11px] tracking-[0.12em] hover:bg-terracotta transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
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
    <div className="fixed inset-0 bg-espresso/40 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-md border border-border max-w-md w-full transform transition-all animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="mx-auto w-16 h-16 bg-sale/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-sale" />
          </div>
          <h3 className="font-serif text-xl font-medium text-espresso mb-2">Delete Review?</h3>
          <p className="text-[13px] text-muted-foreground mb-4">
            Are you sure you want to delete this review?
          </p>
          <div className="bg-[#FBF8F3] p-4 rounded-md border border-border mb-4 text-left">
            <div className="flex justify-between items-start mb-3">
              <div className="flex text-gold text-sm">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
                {Array.from({ length: 5 - review.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-sand" />
                ))}
              </div>
              <span className="text-xs font-mono bg-white px-2 py-1 rounded-full font-semibold text-muted-foreground border border-border">
                ID: {review.id}
              </span>
            </div>
            <p className="text-[13px] text-espresso font-medium line-clamp-2 mb-2">
              "{review.comment}"
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
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
          <div className="bg-sale/5 border border-sale/25 rounded-md p-3 mb-4">
            <p className="text-[13px] text-sale font-semibold">
              ⚠️ This action cannot be undone
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={deleting}
              className="flex-1 px-5 py-2.5 border border-espresso text-espresso rounded-sm uppercase text-[11px] tracking-[0.12em] hover:bg-espresso hover:text-ivory transition-all disabled:opacity-50 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 px-5 py-2.5 bg-sale text-ivory rounded-sm uppercase text-[11px] tracking-[0.12em] hover:bg-sale/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 font-semibold"
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
        <AdminLoading label="reviews" />
      </AdminLayout>
    );
  }

  /* ================= RENDER ================= */

  return (
    <AdminLayout>
      <div className="space-y-6 p-6">
        {/* ===== HEADER ===== */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-xl md:text-2xl font-medium text-espresso">Reviews</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              Manage and monitor customer feedback
              {totalFiltered !== reviews.length && (
                <span className="ml-2">· {totalFiltered} filtered</span>
              )}
            </p>
          </div>
          <button
            onClick={fetchReviews}
            className="border border-espresso text-espresso px-5 py-2.5 rounded-sm uppercase text-[11px] tracking-[0.12em] hover:bg-espresso hover:text-ivory transition-all flex items-center gap-2 font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* ===== STATS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-md border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">
                  Total Reviews
                </p>
                <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">
                  {reviews.length}
                </p>
              </div>
              <div className="bg-maroon/10 text-maroon w-9 h-9 rounded-md flex items-center justify-center">
                <MessageSquare className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-md border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">
                  Average Rating
                </p>
                <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">
                  {reviews.length > 0
                    ? (
                        reviews.reduce((acc, r) => acc + r.rating, 0) /
                        reviews.length
                      ).toFixed(1)
                    : "0.0"}
                </p>
              </div>
              <div className="bg-gold/15 text-[#8a6414] w-9 h-9 rounded-md flex items-center justify-center">
                <Star className="h-4 w-4 fill-current" />
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-md border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">
                  Reply Rate
                </p>
                <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">
                  {reviews.length > 0
                    ? `${Math.round(
                        (reviews.filter((r) => r.reply).length /
                          reviews.length) *
                          100
                      )}%`
                    : "0%"}
                </p>
                <div className="w-full bg-sand rounded-full h-1.5 mt-2">
                  <div
                    className="bg-gold h-1.5 rounded-full transition-all duration-300"
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
              <div className="bg-green-700/10 text-green-800 w-9 h-9 rounded-md flex items-center justify-center flex-none">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
          </div>
          <div className="bg-white p-5 rounded-md border border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground font-semibold mb-1">
                  Needs Attention
                </p>
                <p className="font-serif text-2xl md:text-[27px] font-medium text-espresso">
                  {reviews.filter((r) => r.rating <= 2).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Low ratings</p>
              </div>
              <div className="bg-sale/10 text-sale w-9 h-9 rounded-md flex items-center justify-center flex-none">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>

        {/* ===== FILTERS + PAGE SIZE ===== */}
        <div className="bg-white p-5 rounded-md border border-border">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search reviews, replies, customers, products, or IDs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-border bg-white text-[13px] rounded-sm focus:outline-none focus:border-maroon transition-all"
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
                className="px-3 py-2.5 border border-border bg-white text-[13px] rounded-sm focus:outline-none focus:border-maroon font-medium"
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
                className="px-3 py-2.5 border border-border bg-white text-[13px] rounded-sm focus:outline-none focus:border-maroon font-medium"
              >
                <option value="">All Reviews</option>
                <option value="replied">✓ With Replies</option>
                <option value="unreplied">○ Without Replies</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2.5 border border-border bg-white text-[13px] rounded-sm focus:outline-none focus:border-maroon font-medium"
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
                className="px-3 py-2.5 border border-border bg-white text-[13px] rounded-sm focus:outline-none focus:border-maroon font-medium"
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
          <div className="bg-sale/5 border border-sale/25 text-sale px-6 py-4 rounded-md flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium text-[13px]">{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              className="text-sale hover:text-sale/80 font-bold text-xl"
            >
              ×
            </button>
          </div>
        )}

        {/* ===== PAGINATION INFO BAR ===== */}
        {totalFiltered > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <p className="text-[12.5px] text-muted-foreground">
              Showing{" "}
              <span className="font-semibold text-espresso">
                {startIndex + 1}
              </span>
              {" - "}
              <span className="font-semibold text-espresso">{endIndex}</span>
              {" of "}
              <span className="font-semibold text-espresso">{totalFiltered}</span>
              {" reviews"}
              {totalFiltered !== reviews.length && (
                <span className="text-muted-foreground/70 ml-1">
                  (filtered from {reviews.length} total)
                </span>
              )}
            </p>
            <p className="text-[12.5px] text-muted-foreground">
              Page{" "}
              <span className="font-semibold text-espresso">{currentPage}</span> of{" "}
              <span className="font-semibold text-espresso">{totalPages}</span>
            </p>
          </div>
        )}

        {/* ===== REVIEWS LIST ===== */}
        {filteredAndSortedReviews.length === 0 ? (
          <div className="bg-white rounded-md border border-border p-16 text-center">
            <div className="bg-espresso/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-serif text-xl font-medium text-espresso mb-2">
              No reviews found
            </h3>
            <p className="text-[13px] text-muted-foreground max-w-md mx-auto mb-4">
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
                className="mt-4 bg-maroon text-ivory px-5 py-2.5 rounded-sm uppercase text-[11px] tracking-[0.12em] font-semibold hover:bg-terracotta transition-all"
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
                className="bg-white border border-border rounded-md p-5 transition-colors duration-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Rating Badge */}
                  <div className="flex-shrink-0">
                    <div
                      className={`w-14 h-14 rounded-md flex items-center justify-center font-serif font-medium text-xl ${
                        review.rating >= 4
                          ? "bg-green-700/10 text-green-800"
                          : review.rating >= 3
                          ? "bg-amber-500/10 text-amber-700"
                          : "bg-sale/10 text-sale"
                      }`}
                    >
                      {review.rating}.0
                    </div>
                    {review.reply && (
                      <div className="mt-3 text-center">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full px-2.5 py-0.5 bg-green-700/10 text-green-800 justify-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
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
                          <div className="flex text-gold text-lg">
                            {Array.from({ length: review.rating }).map(
                              (_, i) => (
                                <Star
                                  key={i}
                                  className="w-4 h-4 fill-current"
                                />
                              )
                            )}
                            {Array.from({
                              length: 5 - review.rating,
                            }).map((_, i) => (
                              <Star
                                key={i}
                                className="w-4 h-4 text-sand"
                              />
                            ))}
                          </div>
                          <span
                            className="font-mono bg-[#F7F4EF] px-2.5 py-1 rounded-full text-[11px] cursor-pointer hover:text-maroon transition-all font-semibold text-muted-foreground border border-border"
                            onClick={() =>
                              copyToClipboard(review.id.toString())
                            }
                          >
                            <Copy className="w-3 h-3 inline mr-1" />
                            ID: {review.id}
                          </span>
                        </div>
                        <p className="text-espresso text-[13.5px] font-medium mt-2 leading-relaxed max-w-[110ch]">
                          "{review.comment}"
                        </p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => setReplyingReview(review)}
                          className={`font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] uppercase tracking-[0.12em] transition-all ${
                            review.reply
                              ? "border border-espresso text-espresso hover:bg-espresso hover:text-ivory"
                              : "bg-maroon text-ivory hover:bg-terracotta"
                          }`}
                        >
                          <Reply className="w-3.5 h-3.5" />
                          {review.reply ? "Edit Reply" : "Reply"}
                        </button>
                        <button
                          onClick={() => setEditingReview(review)}
                          className="w-7 h-7 border border-border rounded-[5px] inline-flex items-center justify-center text-muted-foreground bg-white hover:text-espresso hover:border-espresso transition-colors"
                          title="Edit review"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingReview(review)}
                          className="w-7 h-7 border border-sale/35 rounded-[5px] inline-flex items-center justify-center text-sale bg-white hover:bg-sale/5 transition-colors"
                          title="Delete review"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Admin Reply */}
                    {review.reply && (
                      <div className="bg-[#FBF8F3] border-l-[3px] border-gold rounded-r-md p-4 mt-4">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-espresso flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-[#8a6414]" />
                            Store Response
                          </span>
                          <span className="text-xs text-muted-foreground">
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
                        <p className="text-[12.5px] text-muted-foreground leading-relaxed">
                          {review.reply.comment}
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {review.reply.admin_name ||
                              "Store Administrator"}
                          </p>
                          {review.reply.updated_at &&
                            review.reply.created_at !==
                              review.reply.updated_at && (
                              <p className="text-xs text-muted-foreground">
                                Edited{" "}
                                {new Date(
                                  review.reply.updated_at
                                ).toLocaleDateString()}
                              </p>
                            )}
                        </div>
                      </div>
                    )}

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 border-t border-border text-[12px] text-muted-foreground mt-4">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5" />
                        <span className="font-medium">
                          {review.user_name || "Anonymous User"}
                        </span>
                      </div>
                      {review.product_id && (
                        <div
                          className="flex items-center gap-1.5 cursor-pointer transition-all"
                          onClick={() =>
                            copyToClipboard(review.product_id!.toString())
                          }
                          title="Copy product ID"
                        >
                          <Package className="w-3.5 h-3.5 text-maroon" />
                          <span className="font-mono font-medium text-maroon underline underline-offset-[3px]">
                            Product: {review.product_id}
                          </span>
                        </div>
                      )}
                      {review.product_name && (
                        <div className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-maroon" />
                          <span className="font-medium text-maroon underline underline-offset-[3px]">
                            {review.product_name}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="font-medium">
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
          <div className="bg-white rounded-md border border-border p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Left: Showing info */}
              <p className="text-[12.5px] text-muted-foreground">
                Showing{" "}
                <span className="font-semibold text-espresso">
                  {startIndex + 1}
                </span>
                {" - "}
                <span className="font-semibold text-espresso">{endIndex}</span>
                {" of "}
                <span className="font-semibold text-espresso">
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
                  className="w-8 h-8 inline-flex items-center justify-center rounded-[5px] border border-border bg-white hover:bg-[#FBF8F3]
                             disabled:opacity-40 disabled:cursor-not-allowed
                             transition-all"
                  title="First page"
                >
                  <ChevronsLeft className="w-4 h-4 text-espresso" />
                </button>

                {/* Previous */}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center gap-1.5 h-8 px-3 rounded-[5px] border border-border bg-white
                             hover:bg-[#FBF8F3] disabled:opacity-40 disabled:cursor-not-allowed
                             transition-all font-medium text-[12.5px] text-espresso"
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
                          className="w-8 h-8 flex items-center justify-center text-muted-foreground font-bold"
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
                        className={`w-8 h-8 rounded-[5px] font-semibold text-[12.5px] transition-all ${
                          isActive
                            ? "bg-maroon text-ivory hover:bg-terracotta"
                            : "border border-border bg-white text-espresso hover:bg-[#FBF8F3]"
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
                  className="flex items-center gap-1.5 h-8 px-3 rounded-[5px] border border-border bg-white
                             hover:bg-[#FBF8F3] disabled:opacity-40 disabled:cursor-not-allowed
                             transition-all font-medium text-[12.5px] text-espresso"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Last Page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-[5px] border border-border bg-white hover:bg-[#FBF8F3]
                             disabled:opacity-40 disabled:cursor-not-allowed
                             transition-all"
                  title="Last page"
                >
                  <ChevronsRight className="w-4 h-4 text-espresso" />
                </button>
              </div>

              {/* Right: Quick Jump */}
              <div className="flex items-center gap-2">
                <span className="text-[12.5px] text-muted-foreground font-medium">
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
                  className="w-16 h-8 px-2 border border-border bg-white rounded-[5px] text-center text-[12.5px]
                             font-semibold text-espresso focus:outline-none
                             focus:border-maroon transition-all"
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