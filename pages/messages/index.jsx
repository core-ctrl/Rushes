import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import axios from "axios";
import debounce from "lodash.debounce";
import { MessageCircle, Search } from "lucide-react";
import { useSelector } from "react-redux";
import { selectUser } from "../../store/slices/authSlice";
import ChatPanel from "../../components/chat/ChatPanel";

function conversationKey(currentUser, otherUser) {
  return [currentUser?._id || currentUser?.id, otherUser?._id || otherUser?.id].filter(Boolean).sort().join("_");
}

function ConversationItem({ conv, active, onClick }) {
  const preview = conv.lastMessage?.movieCard ? `Shared ${conv.lastMessage.movieCard.title}` : conv.lastMessage?.content || "No messages yet";

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 border-b border-white/5 p-3 text-left transition-colors ${active ? "bg-white/10" : "hover:bg-white/5"}`}
    >
      <img src={conv.otherUser?.avatar || "/avatar.svg"} className="h-10 w-10 rounded-full object-cover" alt="" />
      <div className="flex-1 overflow-hidden">
        <p className="truncate text-sm font-medium">{conv.otherUser ? (conv.otherUser.displayName || conv.otherUser.username) : "User Unavailable"}</p>
        <p className={`truncate text-xs ${conv.unreadCount > 0 ? "font-bold text-white" : "text-neutral-500"}`}>{preview}</p>
      </div>
      {conv.unreadCount > 0 && <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold">{conv.unreadCount}</span>}
    </button>
  );
}

export default function MessagesPage({ openAuth }) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showChatMobile, setShowChatMobile] = useState(false);
  const currentUser = useSelector(selectUser);

  useEffect(() => {
    if (!currentUser) return;
    axios.get("/api/messages/conversations")
      .then(({ data }) => setConversations(data.conversations || []))
      .catch((error) => console.error("Conversations error:", error));
  }, [currentUser]);

  const searchUsers = useCallback(
    debounce(async (q) => {
      if (!q.trim()) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      try {
        const { data } = await axios.get(`/api/users/search?q=${encodeURIComponent(q)}`);
        setSearchResults(data.users || []);
      } catch (error) {
        console.error("User search failed:", error);
      } finally {
        setSearching(false);
      }
    }, 300),
    []
  );

  const startConversation = (otherUser) => {
    const id = conversationKey(currentUser, otherUser);
    setActiveConv({ id, otherUser });
    setSearchQuery("");
    setSearchResults([]);
    setShowChatMobile(true);
  };

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,rgba(229,9,20,0.14),transparent_34%),#050505] p-8 text-white">
        <Head><title>Messages | MovieFinder</title></Head>
        <div className="max-w-md rounded-[28px] border border-white/10 bg-white/[0.05] p-8 text-center shadow-[0_30px_120px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
          <MessageCircle className="mx-auto mb-6 h-16 w-16 text-red-300" />
          <h1 className="mb-2 text-3xl font-black text-white">Messages are locked</h1>
          <p className="mx-auto mb-8 max-w-md text-neutral-400">Sign in to share titles, voice notes, reactions, and watch plans with friends.</p>
          <button onClick={() => openAuth?.("login")} className="inline-block rounded-2xl bg-red-600 px-8 py-3 font-semibold text-white shadow-glow-red transition-all hover:bg-red-500">
            Sign in to chat
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head><title>Messages | MovieFinder</title></Head>
      <div className="flex h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(229,9,20,0.13),transparent_28%),#050505] pt-16 text-white md:pt-20">
        <div className={`${showChatMobile ? "hidden md:flex" : "flex"} w-full flex-col overflow-hidden border-r border-white/10 bg-black/35 backdrop-blur-2xl md:w-96`}>
          <div className="border-b border-white/8 p-4">
            <h2 className="mb-3 text-lg font-black">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchUsers(e.target.value);
                }}
                placeholder="Search people..."
                className="w-full rounded-2xl border border-white/10 bg-white/[0.06] py-3 pl-10 pr-4 text-sm transition-colors focus:border-red-500 focus:outline-none"
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 overflow-hidden rounded-2xl border border-white/10 bg-black/70 backdrop-blur-2xl">
                {searchResults.map((user) => (
                  <button key={user._id} onClick={() => startConversation(user)} className="flex w-full cursor-pointer items-center gap-3 p-3 text-left transition-colors hover:bg-white/5">
                    <img src={user.avatar || "/avatar.svg"} className="h-8 w-8 rounded-full object-cover" alt="" />
                    <div>
                      <p className="text-sm font-medium">{user.displayName || user.username}</p>
                      <p className="text-xs text-neutral-400">@{user.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {searching && <p className="mt-2 text-center text-xs text-neutral-500">Searching...</p>}
          </div>

          <div className="flex-1 overflow-y-auto" data-lenis-prevent>
            {conversations.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <MessageCircle className="mb-3 h-12 w-12 text-neutral-700" />
                <p className="text-sm font-medium text-neutral-400">No conversations yet</p>
                <p className="mt-1 text-xs text-neutral-600">Search for someone to start chatting</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv._id}
                  conv={conv}
                  active={activeConv?.otherUser?._id === conv.otherUser?._id}
                  onClick={() => {
                    const id = conversationKey(currentUser, conv.otherUser);
                    setActiveConv({ id, otherUser: conv.otherUser });
                    setShowChatMobile(true);
                  }}
                />
              ))
            )}
          </div>
        </div>

        <div className={`${showChatMobile ? "flex" : "hidden md:flex"} flex-1 flex-col h-full overflow-hidden`}>
          {activeConv ? (
            <>
              <button onClick={() => setShowChatMobile(false)} className="border-b border-white/8 bg-black/40 p-3 text-left text-sm text-neutral-400 md:hidden">
                Back to messages
              </button>
              <ChatPanel conversation={activeConv} currentUser={currentUser} />
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center bg-black/20 text-center">
              <MessageCircle className="mb-4 h-16 w-16 text-neutral-700" />
              <h3 className="text-xl font-bold text-neutral-400">Select a conversation</h3>
              <p className="mt-2 text-sm text-neutral-600">or search for someone to chat with</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
