import { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import axios from "axios";
import AppIcon from "../../components/AppIcon";
import { Layers01Icon, LockIcon, Globe02Icon } from "@hugeicons/core-free-icons";
import ListNavigation from "../../components/lists/ListNavigation";

export default function ExploreCommunityLists() {
  const user = useSelector(selectUser);
  const [communityLists, setCommunityLists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunityLists();
  }, [user]);

  const fetchCommunityLists = async () => {
    try {
      setLoading(true);
      const commRes = await axios.get('/api/lists');
      const filteredCommunity = (commRes.data.lists || []).filter(
        list => String(list.userId?._id || list.userId) !== String(user?.id || user?._id)
      );
      setCommunityLists(filteredCommunity);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const categorizeLists = (lists) => {
    const buckets = { Marvel: [], DC: [], Horror: [], Trending: [] };
    lists.forEach(list => {
      const text = (list.title + " " + (list.description || "")).toLowerCase();
      if (text.includes("marvel") || text.includes("mcu") || text.includes("avengers")) {
        buckets.Marvel.push(list);
      } else if (text.includes("dc ") || text.includes("dceu") || text.includes("batman") || text.includes("superman") || text.startsWith("dc")) {
        buckets.DC.push(list);
      } else if (text.includes("horror") || text.includes("scary") || text.includes("spooky") || text.includes("blood")) {
        buckets.Horror.push(list);
      } else {
        buckets.Trending.push(list);
      }
    });
    return buckets;
  };

  const categorized = categorizeLists(communityLists);

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

  const ListRow = ({ title, lists }) => {
    if (lists.length === 0) return null;
    return (
      <div className="mb-8">
        <h3 className="text-lg font-bold mb-4 text-white/90">{title}</h3>
        <div className="flex overflow-x-auto gap-4 pb-4 snap-x hide-scrollbar">
          {lists.map(list => (
            <Link href={`/lists/${list._id}`} key={list._id} className="snap-start flex-shrink-0 w-[280px]">
              <div className="group relative h-64 rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 transition-transform hover:-translate-y-1 hover:border-white/30 cursor-pointer">
                <CardContent list={list} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#050505] pt-24 pb-20 text-white relative">
      <Head>
        <title>Explore Community — Rushes</title>
      </Head>
      <div className="mx-auto max-w-5xl px-4 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-black md:text-5xl tracking-tight">Explore</h1>
            <p className="mt-2 text-neutral-400">Discover curated collections from fans worldwide.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 self-start md:self-auto shrink-0">
            <ListNavigation />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white/5 rounded-2xl"></div>)}
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            <section>
              {communityLists.length > 0 ? (
                <div className="flex flex-col gap-4">
                  <ListRow title="Trending Collections" lists={categorized.Trending} />
                  <ListRow title="Marvel Universe" lists={categorized.Marvel} />
                  <ListRow title="DC Extended" lists={categorized.DC} />
                  <ListRow title="Horror & Spooky" lists={categorized.Horror} />
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl text-neutral-500">
                  <p>No public lists found in the community.</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
