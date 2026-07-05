import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import AppIcon from "../../components/AppIcon";
import { ArrowLeft01Icon, Delete01Icon, Edit01Icon, UserIcon } from "@hugeicons/core-free-icons";
import ListBuilder from "../../components/lists/ListBuilder";
import { toast } from "../../components/ui/Toaster";
import ShareStoryCard from "../../components/lists/ShareStoryCard";
import { Share01Icon } from "@hugeicons/core-free-icons";

export default function ListDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const user = useSelector(selectUser);
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrivate, setEditPrivate] = useState(false);

  useEffect(() => {
    if (!id) return;
    axios.get(`/api/lists/${id}`)
      .then(res => setList(res.data.list))
      .catch(err => {
        console.error(err);
        if (err.response?.status === 403 || err.response?.status === 404) {
          router.push("/lists");
        }
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this list?")) return;
    try {
      await axios.delete(`/api/lists/${id}`);
      router.push("/lists");
    } catch (e) {
      toast({ type: "error", message: "Failed to delete list" });
    }
  };

  const openEditModal = () => {
    setEditTitle(list.title);
    setEditDesc(list.description || "");
    setEditPrivate(list.privacy === "private");
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle) return;
    try {
      const res = await axios.put(`/api/lists/${id}`, {
        title: editTitle,
        description: editDesc,
        privacy: editPrivate ? "private" : "public"
      });
      setList(res.data.list);
      setIsEditOpen(false);
      toast({ type: "success", message: "List updated!" });
    } catch (err) {
      toast({ type: "error", message: "Failed to update list" });
    }
  };

  const handleAddMovie = async (movie) => {
    try {
      await axios.put(`/api/lists/${id}`, {
        action: "add_movie",
        movie
      });
      setList(prev => ({
        ...prev,
        movies: [...(prev.movies || []), movie]
      }));
      toast({ type: "success", message: "Saved to list!" });
    } catch (e) {
      toast({ type: "error", message: "Failed to add movie to list" });
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#050505] pt-24" />
  }

  if (!list) return null;

  const isOwner = user && String(list.userId._id || list.userId) === String(user._id || user.id);

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-20 text-white">
      <Head>
        <title>{list.title} — Rushes</title>
      </Head>

      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-6 text-sm font-medium">
          <AppIcon icon={ArrowLeft01Icon} size={16} />
          Back
        </button>

        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Cover Art */}
          <div className="w-full md:w-1/4 flex-shrink-0">
            <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/10 bg-neutral-900 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              {list.coverImage ? (
                <img src={`https://image.tmdb.org/t/p/w500${list.coverImage}`} alt={list.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-wrap p-2 gap-1 bg-neutral-900">
                  {list.movies?.slice(0, 4).map(m => (
                    <div key={m.tmdbId} className="w-[calc(50%-0.125rem)] aspect-[2/3] bg-neutral-800 rounded">
                      {m.posterPath && <img src={`https://image.tmdb.org/t/p/w200${m.posterPath}`} className="w-full h-full object-cover rounded" />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl font-black mb-4">{list.title}</h1>
            {list.description && <p className="text-neutral-300 text-lg mb-6 leading-relaxed max-w-3xl">{list.description}</p>}
            
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-neutral-400 mb-8">
              <div className="flex items-center gap-2">
                <AppIcon icon={UserIcon} size={18} />
                <span>{list.userId?.displayName || list.userId?.username || "Unknown User"}</span>
              </div>
              <div>{list.movies?.length || 0} items</div>
              <div className="uppercase tracking-wider px-2 py-1 bg-white/10 rounded text-xs">{list.privacy}</div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={() => setIsShareOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-colors text-sm font-bold border border-white/5">
                <AppIcon icon={Share01Icon} size={16} /> Share to Story
              </button>
              {isOwner && (
                <>
                  <button onClick={openEditModal} className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white hover:bg-white/20 rounded-xl transition-colors text-sm font-bold border border-white/5">
                    <AppIcon icon={Edit01Icon} size={16} /> Edit List
                  </button>
                  <button onClick={handleDelete} className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors text-sm font-bold border border-red-500/20">
                    <AppIcon icon={Delete01Icon} size={16} /> Delete List
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Movies Grid */}
        <div>
          <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">Titles</h2>
          {list.movies && list.movies.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {list.movies.map(movie => (
                <Link href={`/${movie.mediaType || 'movie'}s/${movie.tmdbId}`} key={movie.tmdbId}>
                  <div className="group relative aspect-[2/3] rounded-xl overflow-hidden bg-neutral-900 cursor-pointer">
                    {movie.posterPath ? (
                      <img src={`https://image.tmdb.org/t/p/w342${movie.posterPath}`} alt={movie.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                        <span className="font-bold text-sm text-neutral-500">{movie.title}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4 text-center">
                       <span className="font-bold text-sm text-white">{movie.title}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        
        {user && (
          <ListBuilder 
            listId={id}
            existingMovies={list.movies || []} 
            onAddMovie={handleAddMovie} 
          />
        )}
      </div>

        <ShareStoryCard 
          isOpen={isShareOpen}
          onClose={() => setIsShareOpen(false)}
          list={list}
        />

        {isEditOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold mb-6 text-white">Edit List</h2>
              <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                <input 
                  type="text" 
                  placeholder="List name" 
                  className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  required
                />
                <textarea 
                  placeholder="Description (optional)" 
                  className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                />
                <label className="flex items-center gap-2 cursor-pointer mt-2 text-sm text-neutral-300">
                  <input 
                    type="checkbox" 
                    checked={editPrivate} 
                    onChange={e => setEditPrivate(e.target.checked)} 
                    className="accent-red-600 w-4 h-4"
                  />
                  Make this list private
                </label>
                <div className="flex gap-3 justify-end mt-6">
                  <button type="button" onClick={() => setIsEditOpen(false)} className="px-4 py-2 rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white">Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }
