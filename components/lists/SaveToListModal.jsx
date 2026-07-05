import { useEffect, useState } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import { Cancel01Icon, Layers01Icon, PlusSignIcon } from "@hugeicons/core-free-icons";
import AppIcon from "../AppIcon";

export default function SaveToListModal({ isOpen, onClose, media, mediaType }) {
  const user = useSelector(selectUser);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);

  useEffect(() => {
    if (isOpen && user) {
      axios.get(`/api/lists?userId=${user._id}`)
        .then(res => setLists(res.data.lists || []))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleAdd = async (listId) => {
    setSaving(listId);
    try {
      await axios.put(`/api/lists/${listId}`, {
        action: "add_movie",
        movie: {
          tmdbId: media.id,
          mediaType: mediaType || 'movie',
          title: media.title || media.name,
          posterPath: media.poster_path,
        }
      });
      // Update local state to reflect addition
      setLists(lists.map(l => {
        if (l._id === listId) {
          return { ...l, movies: [...(l.movies || []), { tmdbId: media.id }] };
        }
        return l;
      }));
    } catch (e) {
      alert("Failed to save to list");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-neutral-900 border border-white/10 shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-neutral-400 hover:bg-white/10 hover:text-white"
        >
          <AppIcon icon={Cancel01Icon} size={20} />
        </button>
        
        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <AppIcon icon={Layers01Icon} size={20} /> Save to List
        </h2>
        <p className="text-sm text-neutral-400 mb-6">Add "{media.title || media.name}" to one of your custom curated lists.</p>
        
        <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="text-center py-8 text-neutral-500 animate-pulse">Loading your lists...</div>
          ) : lists.length > 0 ? (
            lists.map(list => {
              const hasMovie = list.movies?.some(m => m.tmdbId === media.id);
              return (
                <button
                  key={list._id}
                  disabled={hasMovie || saving === list._id}
                  onClick={() => handleAdd(list._id)}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors text-left ${
                    hasMovie 
                      ? "bg-green-500/10 border-green-500/30 text-green-400" 
                      : "bg-white/5 border-white/10 hover:bg-white/10 text-white"
                  }`}
                >
                  <span className="font-medium truncate pr-4">{list.title}</span>
                  {hasMovie ? (
                    <span className="text-xs font-bold bg-green-500/20 px-2 py-1 rounded">ADDED</span>
                  ) : saving === list._id ? (
                    <span className="text-xs text-neutral-400">Saving...</span>
                  ) : (
                    <AppIcon icon={PlusSignIcon} size={16} className="text-neutral-500" />
                  )}
                </button>
              )
            })
          ) : (
            <div className="text-center py-6">
              <p className="text-neutral-500 text-sm mb-4">You don't have any lists yet.</p>
              <a href="/lists" className="text-red-500 hover:underline text-sm font-bold">Create a List</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
