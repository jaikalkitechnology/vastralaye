import { useEffect, useRef, useState } from 'react';
import { api } from '@/api/api';
import { BASE_IMG } from '@/config';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  Clapperboard,
  UploadCloud,
  Trash2,
  Eye,
  Play,
  RefreshCw,
  Link2,
  Pencil,
  X,
} from 'lucide-react';
import { getYouTubeId, youTubeThumb } from '@/lib/media';
import AdminLoading from '@/components/admin/AdminLoading';

interface ReelProduct {
  id: number;
  name: string;
  price: number;
  discount_price?: number | null;
  image?: string | null;
}

interface AdminReel {
  id: number;
  caption: string;
  video_url: string;
  poster_url?: string | null;
  show_on_home: boolean;
  show_on_pdp: boolean;
  is_published: boolean;
  views: number;
  product?: ReelProduct | null;
}

const mediaUrl = (path?: string | null) => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  let s = path.startsWith('/') ? path : `/${path}`;
  if (!s.startsWith('/static/')) s = `/static${s}`;
  return `${(BASE_IMG || '').replace(/\/$/, '')}${s}`;
};

/**
 * Admin › Reels — upload & manage the shoppable product videos shown on
 * the storefront homepage ("Vastraliya in Motion") and product pages
 * ("Watch It Styled"). See admin_design.md §5.9.
 */
const AdminReels = () => {
  const [reels, setReels] = useState<AdminReel[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [caption, setCaption] = useState('');
  const [productId, setProductId] = useState<string>('');
  const [showOnHome, setShowOnHome] = useState(true);
  const [showOnPdp, setShowOnPdp] = useState(true);
  const [publishNow, setPublishNow] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [videoSource, setVideoSource] = useState<'upload' | 'link'>('upload');
  const [videoLink, setVideoLink] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const posterInputRef = useRef<HTMLInputElement>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [reelsRes, productsRes] = await Promise.all([
        api.get('/admin/reels'),
        api.get('/api/v1/admin/products').catch(() => api.get('/admin/products')),
      ]);
      setReels(Array.isArray(reelsRes.data) ? reelsRes.data : []);
      const prods: any = productsRes?.data;
      setProducts(Array.isArray(prods) ? prods : prods?.products || prods?.items || []);
    } catch (err) {
      console.error('Failed to load reels', err);
      toast({ title: 'Failed to load reels' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setCaption('');
    setProductId('');
    setShowOnHome(true);
    setShowOnPdp(true);
    setPublishNow(true);
    setVideoFile(null);
    setVideoLink('');
    setVideoSource('upload');
    setPosterFile(null);
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (posterInputRef.current) posterInputRef.current.value = '';
  };

  const startEdit = (reel: AdminReel) => {
    setEditingId(reel.id);
    setCaption(reel.caption || '');
    setProductId(reel.product ? String(reel.product.id) : '');
    setShowOnHome(reel.show_on_home);
    setShowOnPdp(reel.show_on_pdp);
    setPublishNow(reel.is_published);
    setVideoFile(null);
    setPosterFile(null);
    if (/^https?:\/\//i.test(reel.video_url || '')) {
      setVideoSource('link');
      setVideoLink(reel.video_url);
    } else {
      setVideoSource('upload');
      setVideoLink('');
    }
    if (videoInputRef.current) videoInputRef.current.value = '';
    if (posterInputRef.current) posterInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    /* When editing, media is optional — leaving it empty keeps the existing video. */
    if (!editingId && videoSource === 'upload' && !videoFile)
      return toast({ title: 'Please choose a video file (MP4)' });
    if (videoSource === 'link') {
      const link = videoLink.trim();
      if ((!editingId || link) && !/^https?:\/\/.+/.test(link))
        return toast({ title: 'Please paste a valid video link (YouTube or MP4 URL)' });
    }
    if (!caption.trim()) return toast({ title: 'Please add a caption' });

    const form = new FormData();
    form.append('caption', caption.trim());
    if (productId) form.append('product_id', productId);
    form.append('show_on_home', String(showOnHome));
    form.append('show_on_pdp', String(showOnPdp));
    form.append('is_published', String(publishNow));
    if (videoSource === 'upload' && videoFile) form.append('video_file', videoFile);
    if (videoSource === 'link' && videoLink.trim()) form.append('video_link', videoLink.trim());
    if (posterFile) form.append('poster_file', posterFile);

    setUploading(true);
    try {
      if (editingId) {
        await api.put(`/admin/reels/${editingId}`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast({ title: 'Reel updated' });
      } else {
        await api.post('/admin/reels', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast({ title: 'Reel uploaded' });
      }
      resetForm();
      fetchAll();
    } catch (err: any) {
      toast({ title: err?.response?.data?.detail || (editingId ? 'Update failed' : 'Upload failed') });
    } finally {
      setUploading(false);
    }
  };

  const togglePublish = async (reel: AdminReel) => {
    try {
      await api.patch(`/admin/reels/${reel.id}/publish`);
      setReels((prev) =>
        prev.map((r) => (r.id === reel.id ? { ...r, is_published: !r.is_published } : r))
      );
    } catch {
      toast({ title: 'Failed to update reel' });
    }
  };

  const deleteReel = async (reel: AdminReel) => {
    if (!window.confirm(`Delete reel "${reel.caption}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/reels/${reel.id}`);
      setReels((prev) => prev.filter((r) => r.id !== reel.id));
      if (editingId === reel.id) resetForm();
      toast({ title: 'Reel deleted' });
    } catch {
      toast({ title: 'Failed to delete reel' });
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <Clapperboard className="h-6 w-6 text-maroon" /> Reels
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload product videos shown on the homepage and product pages.
          </p>
        </div>
        <Button variant="outline" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* Upload panel */}
        <form onSubmit={handleUpload} className="bg-white border border-border rounded-md p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em]">
              {editingId ? `Edit Reel #${editingId}` : 'Upload New Reel'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-muted-foreground hover:text-espresso inline-flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" /> Cancel edit
              </button>
            )}
          </div>

          {/* Video source toggle: upload a file or paste a link (e.g. YouTube) */}
          <div className="flex border border-border rounded-sm overflow-hidden mb-3">
            <button
              type="button"
              onClick={() => setVideoSource('upload')}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                videoSource === 'upload' ? 'bg-maroon text-ivory' : 'bg-white text-muted-foreground hover:text-espresso'
              }`}
            >
              <UploadCloud className="h-3.5 w-3.5" /> Upload File
            </button>
            <button
              type="button"
              onClick={() => setVideoSource('link')}
              className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] border-l border-border transition-colors ${
                videoSource === 'link' ? 'bg-maroon text-ivory' : 'bg-white text-muted-foreground hover:text-espresso'
              }`}
            >
              <Link2 className="h-3.5 w-3.5" /> Video Link
            </button>
          </div>

          {videoSource === 'upload' ? (
            <label
              htmlFor="reel-video"
              className="block border-2 border-dashed border-sand rounded-md bg-ivory text-center px-4 py-8 cursor-pointer hover:border-gold transition-colors"
            >
              <UploadCloud className="h-8 w-8 mx-auto text-maroon mb-2" strokeWidth={1.5} />
              <span className="block text-sm font-medium text-espresso">
                {videoFile
                  ? videoFile.name
                  : editingId
                  ? 'Choose a new video (optional — current one is kept)'
                  : 'Click to choose a video'}
              </span>
              <span className="block text-xs text-muted-foreground mt-1">
                Vertical 9:16 · MP4 · up to 30s · max 30 MB
              </span>
            </label>
          ) : (
            <div className="border border-border rounded-md bg-ivory px-4 py-4">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5">
                Video link (YouTube or MP4 URL)
              </label>
              <input
                type="url"
                value={videoLink}
                onChange={(e) => setVideoLink(e.target.value)}
                placeholder="https://youtube.com/shorts/…"
                className="w-full border border-input rounded-sm px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-maroon"
              />
              <span className="block text-xs text-muted-foreground mt-1.5">
                YouTube links play in an embedded player; YouTube thumbnails are used
                automatically when no poster is uploaded.
              </span>
              {getYouTubeId(videoLink) && (
                <span className="inline-flex items-center gap-1.5 mt-2 text-[11px] font-semibold text-green-700">
                  ✓ YouTube link detected
                </span>
              )}
            </div>
          )}
          <input
            id="reel-video"
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
          />

          <div className="mt-4">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5">
              Caption
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. 3 ways to drape this saree"
              className="w-full border border-input rounded-sm px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-maroon"
            />
          </div>

          <div className="mt-4">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5">
              Linked Product (optional)
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full border border-input rounded-sm px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-maroon"
            >
              <option value="">— No linked product —</option>
              {products.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-2">
              Show On
            </label>
            <label className="flex items-center gap-2.5 text-sm mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showOnHome}
                onChange={(e) => setShowOnHome(e.target.checked)}
                className="accent-[#7A1F2B]"
              />
              Homepage — “Vastraliya in Motion” row
            </label>
            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={showOnPdp}
                onChange={(e) => setShowOnPdp(e.target.checked)}
                className="accent-[#7A1F2B]"
              />
              Product page — “Watch It Styled”
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] mb-1.5">
              Poster Image (optional)
            </label>
            <input
              ref={posterInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPosterFile(e.target.files?.[0] || null)}
              className="w-full text-xs text-muted-foreground file:mr-3 file:px-3 file:py-2 file:border file:border-input file:rounded-sm file:bg-ivory file:text-espresso file:text-xs"
            />
          </div>

          <label className="flex items-center gap-2.5 text-sm mt-4 cursor-pointer">
            <input
              type="checkbox"
              checked={publishNow}
              onChange={(e) => setPublishNow(e.target.checked)}
              className="accent-[#7A1F2B]"
            />
            Publish immediately
          </label>

          <Button type="submit" disabled={uploading} className="w-full mt-5">
            <UploadCloud className="h-4 w-4" />
            {uploading ? 'Saving…' : editingId ? 'Update Reel' : 'Upload Reel'}
          </Button>
        </form>

        {/* Library */}
        <div>
          {loading ? (
            <AdminLoading label="reels" compact />
          ) : reels.length === 0 ? (
            <div className="border border-dashed border-border rounded-md bg-white text-center py-16 px-6">
              <Clapperboard className="h-10 w-10 mx-auto text-muted-foreground mb-3" strokeWidth={1.2} />
              <p className="text-sm text-muted-foreground">
                No reels yet. Upload your first product video — it will appear on the storefront
                homepage and product pages.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {reels.map((reel) => (
                <div key={reel.id} className="bg-white border border-border rounded-md overflow-hidden">
                  <div className="relative aspect-[9/14] bg-sand">
                    {reel.poster_url ? (
                      <img
                        src={mediaUrl(reel.poster_url)}
                        alt={reel.caption}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : getYouTubeId(reel.video_url) ? (
                      <img
                        src={youTubeThumb(getYouTubeId(reel.video_url) as string)}
                        alt={reel.caption}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <video
                        src={mediaUrl(reel.video_url)}
                        className="absolute inset-0 w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    )}
                    {getYouTubeId(reel.video_url) && (
                      <span className="absolute top-2 right-2 z-10 text-[9px] font-bold uppercase tracking-[0.08em] bg-white/95 text-sale px-1.5 py-0.5 rounded-sm">
                        YouTube
                      </span>
                    )}
                    <a
                      href={mediaUrl(reel.video_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Preview video"
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow"
                    >
                      <Play className="h-4 w-4 text-maroon fill-maroon ml-0.5" />
                    </a>
                    <span
                      className={`absolute top-2 left-2 text-[10px] font-semibold uppercase tracking-[0.1em] px-2 py-0.5 rounded-full bg-white/95 ${
                        reel.is_published ? 'text-green-700' : 'text-muted-foreground'
                      }`}
                    >
                      {reel.is_published ? 'Published' : 'Draft'}
                    </span>
                    <span className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[11px] drop-shadow">
                      <Eye className="h-3 w-3" /> {reel.views}
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="text-xs font-semibold truncate">{reel.caption}</div>
                    {reel.product && (
                      <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                        {reel.product.name}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 mt-2">
                      {reel.show_on_home && (
                        <span className="text-[10px] border border-border rounded-full px-2 py-0.5 text-muted-foreground">
                          Home
                        </span>
                      )}
                      {reel.show_on_pdp && (
                        <span className="text-[10px] border border-border rounded-full px-2 py-0.5 text-muted-foreground">
                          PDP
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => togglePublish(reel)}
                        className="ml-auto text-[10px] font-semibold uppercase tracking-[0.08em] text-maroon hover:underline"
                      >
                        {reel.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        aria-label="Edit reel"
                        onClick={() => startEdit(reel)}
                        className="text-muted-foreground hover:text-espresso"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete reel"
                        onClick={() => deleteReel(reel)}
                        className="text-sale hover:text-red-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReels;
