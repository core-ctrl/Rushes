import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import axios from "axios";
import AppIcon from "../../components/AppIcon";
import { PlusSignIcon, Layers01Icon, LockIcon, Globe02Icon, Delete01Icon, Edit01Icon } from "@hugeicons/core-free-icons";
import ListNavigation from "../../components/lists/ListNavigation";

export default function ListsDashboard() {
  const user = useSelector(selectUser);
  const [myLists, setMyLists] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);

  // Edit State
  const [editingList, setEditingList] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editPrivate, setEditPrivate] = useState(false);

  useEffect(() => {
    fetchLists();
  }, [user]);

  const fetchLists = async () => {
    try {
      setLoading(true);
      if (user) {
        const myRes = await axios.get(`/api/lists?userId=${user.id || user._id}`);
        setMyLists(myRes.data.lists || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTitle) return;
    try {
      const res = await axios.post("/api/lists", {
        title: newTitle,
        description: newDesc,
        privacy: isPrivate ? "private" : "public"
      });
      setMyLists([res.data.list, ...myLists]);
      setShowCreate(false);
      setNewTitle("");
      setNewDesc("");
      setIsPrivate(false);
    } catch (e) {
      alert("Failed to create list");
    }
  };

  const handleQuickDelete = async (e, listId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this list?")) return;
    try {
      await axios.delete(`/api/lists/${listId}`);
      setMyLists(prev => prev.filter(l => l._id !== listId));
    } catch (err) {
      alert("Failed to delete list");
    }
  };

  const openEditModal = (e, list) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingList(list);
    setEditTitle(list.title);
    setEditDesc(list.description || "");
    setEditPrivate(list.privacy === "private");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle) return;
    try {
      const res = await axios.put(`/api/lists/${editingList._id}`, {
        title: editTitle,
        description: editDesc,
        privacy: editPrivate ? "private" : "public"
      });
      setMyLists(prev => prev.map(l => l._id === editingList._id ? res.data.list : l));
      setEditingList(null);
    } catch (err) {
      alert("Failed to update list");
    }
  };

  const CardContent = ({ list }) => (
    <>
      {list.coverImage ? (
        <img src={`https://image.tmdb.org/t/p/w500${list.coverImage}`} alt={list.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
      ) : (
        <div className="w-full h-full flex items-center justify-center opacity-20">
          <AppIcon icon={Layers01Icon} size={64} />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent p-6 flex flex-col justify-end">
        <div className="flex items-center gap-2 mb-2">
          <AppIcon icon={list.privacy === "private" ? LockIcon : Globe02Icon} size={14} className="text-neutral-400" />
          <span className="text-xs text-neutral-400 font-medium tracking-wider uppercase">{list.movies?.length || 0} ITEMS</span>
        </div>
        <h3 className="text-xl font-bold text-white mb-1 leading-tight line-clamp-2">{list.title}</h3>
        {list.description && <p className="text-xs text-neutral-300 line-clamp-1">{list.description}</p>}
        {(list.userId?.username || list.userId?.displayName) && (
          <p className="text-xs text-neutral-500 mt-2">by {list.userId.username ? `@${list.userId.username}` : list.userId.displayName}</p>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-20 text-white relative">
      <Head>
        <title>Curated Lists — Rushes</title>
      </Head>
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-black md:text-5xl tracking-tight">Curated Lists</h1>
            <p className="mt-2 text-neutral-400">Collections crafted by you and the community.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 self-start md:self-auto shrink-0">
            {user && (
              <button 
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full font-bold transition-colors text-sm"
              >
                <AppIcon icon={PlusSignIcon} size={18} />
                <span className="hidden md:inline">New List</span>
              </button>
            )}
            
            <ListNavigation />
          </div>
        </div>

        {showCreate && (
          <div className="mb-8 p-6 bg-white/5 border border-white/10 rounded-2xl max-w-xl">
            <h2 className="text-xl font-bold mb-4">Create a New List</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="List name" 
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
                autoFocus
              />
              <textarea 
                placeholder="Description (optional)" 
                className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
              <label className="flex items-center gap-2 cursor-pointer mt-2 text-sm text-neutral-300">
                <input 
                  type="checkbox" 
                  checked={isPrivate} 
                  onChange={e => setIsPrivate(e.target.checked)} 
                  className="accent-red-600 w-4 h-4"
                />
                Make this list private
              </label>
              <div className="flex gap-3 justify-end mt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl font-bold bg-white/10 hover:bg-white/20">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl font-bold bg-red-600 hover:bg-red-500">Create</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white/5 rounded-2xl"></div>)}
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {user && (
              <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  My Lists
                  <span className="text-sm font-medium bg-white/10 px-2 py-0.5 rounded-full">{myLists.length}</span>
                </h2>
                
                {myLists.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {myLists.map(list => (
                      <div key={list._id} className="relative group">
                        <Link href={`/lists/${list._id}`}>
                          <div className="relative h-64 rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 transition-transform hover:-translate-y-1 hover:border-white/30 cursor-pointer">
                            <CardContent list={list} />
                          </div>
                        </Link>
                        {/* Hover Actions */}
                        <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all">
                          <button
                            onClick={(e) => openEditModal(e, list)}
                            className="w-8 h-8 rounded-full bg-black/60 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-sm border border-white/10"
                            title="Edit List"
                          >
                            <AppIcon icon={Edit01Icon} size={14} />
                          </button>
                          <button
                            onClick={(e) => handleQuickDelete(e, list._id)}
                            className="w-8 h-8 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center text-white backdrop-blur-sm border border-white/10"
                            title="Delete List"
                          >
                            <AppIcon icon={Delete01Icon} size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-neutral-500">
                    <p>You haven't created any lists yet.</p>
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingList && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Edit List</h2>
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
                <button type="button" onClick={() => setEditingList(null)} className="px-4 py-2 rounded-xl font-bold bg-white/10 hover:bg-white/20">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl font-bold bg-red-600 hover:bg-red-500">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
