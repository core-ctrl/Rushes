import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Check, Copy, ExternalLink, Film, MonitorPlay, PlayCircle, Power, RefreshCw, Send, ShieldCheck, Users, X, Play, Pause, Mic, MicOff, Video, VideoOff, Lock } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectUser } from '../../store/slices/authSlice';
import { startWatchParty, endWatchParty } from '../../store/slices/callSlice';
import { toast } from '../../components/ui/Toaster';
import io from 'socket.io-client';
import FloatingReactions from '../../components/FloatingReactions';

export default function WatchTogetherRoom() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { roomId } = router.query;
  const user = useSelector(selectUser);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [copied, setCopied] = useState(false);
  const [movieTitle, setMovieTitle] = useState('');
  const [streamingUrl, setStreamingUrl] = useState('');
  const [mediaId, setMediaId] = useState('');
  const [mediaType, setMediaType] = useState('movie');
  const [trailerKey, setTrailerKey] = useState('');
  const [posterPath, setPosterPath] = useState('');

  const [hasStarted, setHasStarted] = useState(false);
  const [roomState, setRoomState] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  
  // Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const bottomRef = useRef(null);
  const socketRef = useRef(null);
  const videoPlayerRef = useRef(null);
  const ytPlayerRef = useRef(null);
  const isSyncing = useRef(false);
  const reactionsRef = useRef(null);

  // WebRTC Audio/Video Chat State
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  // Screen share states
  const [localScreenStream, setLocalScreenStream] = useState(null);
  const [sharedScreenStream, setSharedScreenStream] = useState(null);
  const [screenShareHost, setScreenShareHost] = useState(null);

  const localStreamRef = useRef(null);
  const localScreenStreamRef = useRef(null);
  const peerConnections = useRef({});
  const receivedStreams = useRef({});

  const createPeerConnection = (targetUserId, isInitiator) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });
    
    peerConnections.current[targetUserId] = pc;
    
    // Add local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }
    // Add local screen share tracks if sharing
    if (localScreenStreamRef.current) {
      localScreenStreamRef.current.getTracks().forEach(track => {
        const sender = pc.addTrack(track, localScreenStreamRef.current);
        if (!pc.screenSenders) pc.screenSenders = {};
        pc.screenSenders[track.id] = sender;
      });
    }
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current?.emit('webrtc:signal', {
          targetId: targetUserId,
          signal: { type: 'candidate', candidate: event.candidate }
        });
      }
    };
    
    pc.ontrack = (event) => {
      console.log('Received remote track from', targetUserId);
      const remoteStream = event.streams[0];
      
      // Tag stream with userId
      remoteStream.userId = targetUserId;
      receivedStreams.current[remoteStream.id] = remoteStream;

      setScreenShareHost(currentHost => {
        if (currentHost && currentHost.userId === targetUserId && currentHost.streamId === remoteStream.id) {
          setSharedScreenStream(remoteStream);
          // Remove from camera streams just in case
          setRemoteStreams(prev => {
            const next = { ...prev };
            delete next[targetUserId];
            return next;
          });
        } else {
          // Check if this is NOT the screen share stream
          if (!currentHost || currentHost.streamId !== remoteStream.id) {
            setRemoteStreams(prev => ({
              ...prev,
              [targetUserId]: remoteStream
            }));
          }
        }
        return currentHost;
      });
    };
    
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${targetUserId}: ${pc.connectionState}`);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        handlePeerDisconnect(targetUserId);
      }
    };
    
    pc.onnegotiationneeded = async () => {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit('webrtc:signal', {
          targetId: targetUserId,
          signal: pc.localDescription
        });
      } catch (err) {
        console.error('Error creating offer', err);
      }
    };
    
    return pc;
  };

  const initiateCall = (targetUserId) => {
    console.log('Initiating WebRTC call to user:', targetUserId);
    createPeerConnection(targetUserId, true);
  };

  const handlePeerDisconnect = (userId) => {
    const pc = peerConnections.current[userId];
    if (pc) {
      pc.close();
      delete peerConnections.current[userId];
    }
    setRemoteStreams(prev => {
      const next = { ...prev };
      delete next[userId];
      return next;
    });
    // Remove from received streams cache
    Object.keys(receivedStreams.current).forEach(key => {
      if (receivedStreams.current[key].userId === userId) {
        delete receivedStreams.current[key];
      }
    });
  };

  const initWebRtc = async (existingViewers) => {
    let stream = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      console.warn('Failed video+audio, trying audio only...', err);
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch (err2) {
        console.warn('Failed audio, trying video only...', err2);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
        } catch (err3) {
          console.error('No media devices available');
          toast({ type: 'warning', message: 'No camera or microphone found. You are in view-only mode.' });
        }
      }
    }

    if (stream) {
      localStreamRef.current = stream;
      setLocalStream(stream);
      setMicEnabled(stream.getAudioTracks().length > 0);
      setCameraEnabled(stream.getVideoTracks().length > 0);
    } else {
      setMicEnabled(false);
      setCameraEnabled(false);
    }

    const currentUserId = user?.id || user?._id;
    existingViewers.forEach(viewerId => {
      if (viewerId !== currentUserId) {
        initiateCall(viewerId);
      }
    });
  };

  const toggleLocalMic = async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setMicEnabled(audioTrack.enabled);
        return;
      }
    }
    // Track missing, try to acquire it
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const newTrack = stream.getAudioTracks()[0];
      if (!localStreamRef.current) {
        localStreamRef.current = new MediaStream();
        setLocalStream(localStreamRef.current);
      }
      localStreamRef.current.addTrack(newTrack);
      Object.values(peerConnections.current).forEach(pc => pc.addTrack(newTrack, localStreamRef.current));
      setMicEnabled(true);
    } catch (err) {
      toast({ type: 'error', message: 'Could not access microphone.' });
    }
  };

  const toggleLocalCamera = async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setCameraEnabled(videoTrack.enabled);
        return;
      }
    }
    // Track missing, try to acquire it
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const newTrack = stream.getVideoTracks()[0];
      if (!localStreamRef.current) {
        localStreamRef.current = new MediaStream();
        setLocalStream(localStreamRef.current);
      }
      localStreamRef.current.addTrack(newTrack);
      Object.values(peerConnections.current).forEach(pc => pc.addTrack(newTrack, localStreamRef.current));
      setCameraEnabled(true);
    } catch (err) {
      toast({ type: 'error', message: 'Could not access camera.' });
    }
  };

  const startScreenShare = async () => {
    try {
      if (localScreenStream) {
        stopScreenShare();
        return;
      }

      console.log('Requesting screen/tab stream...');
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      localScreenStreamRef.current = stream;
      setLocalScreenStream(stream);

      // Broadcast screen share start to the room
      socketRef.current?.emit('webrtc:screen_share_state', {
        roomId,
        isSharing: true,
        streamId: stream.id
      });

      // Set it locally to display in the main player area
      setSharedScreenStream(stream);
      setScreenShareHost({ userId: user?.id || user?._id, streamId: stream.id });

      // Add track to all active peer connections
      const track = stream.getVideoTracks()[0];
      Object.entries(peerConnections.current).forEach(([peerId, pc]) => {
        const sender = pc.addTrack(track, stream);
        if (!pc.screenSenders) pc.screenSenders = {};
        pc.screenSenders[track.id] = sender;
      });

      // Handle when screen sharing is stopped from browser UI
      track.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error('Failed to start screen share:', err);
      toast({ type: 'error', message: 'Screen sharing cancelled or failed.' });
    }
  };

  const stopScreenShare = () => {
    const stream = localScreenStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      localScreenStreamRef.current = null;
      setLocalScreenStream(null);

      // Broadcast screen share stop
      socketRef.current?.emit('webrtc:screen_share_state', {
        roomId,
        isSharing: false,
        streamId: stream.id
      });

      // Remove screen share track from all peer connections
      Object.entries(peerConnections.current).forEach(([peerId, pc]) => {
        if (pc.screenSenders) {
          Object.values(pc.screenSenders).forEach(sender => {
            try { pc.removeTrack(sender); } catch {}
          });
          pc.screenSenders = {};
        }
      });
    }

    setSharedScreenStream(null);
    setScreenShareHost(null);
  };

  // Parse query parameters
  useEffect(() => {
    if (!router.isReady) return;
    const params = new URLSearchParams(window.location.search);
    const title = params.get('title') || 'Watch Together';
    setMovieTitle(title);
    
    const url = params.get('url');
    if (url) {
      setStreamingUrl(url);
    } else {
      setStreamingUrl(`https://www.google.com/search?q=${encodeURIComponent('Where to watch ' + title)}`);
    }
    
    setMediaId(params.get('mediaId') || '');
    setMediaType(params.get('mediaType') || 'movie');
  }, [router.isReady]);

  // Fetch movie details if mediaId is present
  useEffect(() => {
    if (!mediaId) return;
    
    const fetchMovieData = async () => {
      try {
        const res = await fetch(`/api/media/${mediaType}/${mediaId}`);
        const data = await res.json();
        
        if (data.poster_path) {
          setPosterPath(`https://image.tmdb.org/t/p/w500${data.poster_path}`);
        }
        
        // Find trailer key
        if (data.videos?.results) {
          const trailer = data.videos.results.find(
            (v) => v.site === 'YouTube' && v.type === 'Trailer'
          ) || data.videos.results.find((v) => v.site === 'YouTube');
          
          if (trailer) {
            setTrailerKey(trailer.key);
          }
        }
      } catch (err) {
        console.error('Error fetching media details for trailer:', err);
      }
    };

    fetchMovieData();
  }, [mediaId, mediaType]);

  // Fetch active room details and participants
  const fetchRoomDetails = async () => {
    if (!roomId) return;
    try {
      const res = await fetch(`/api/watch-together/room?roomId=${roomId}`);
      const data = await res.json();
      if (data.room) {
        setRoomState(data.room);
        // Map members to participants excluding current user
        const currentUserId = user?.id || user?._id;
        const list = data.room.members
          .filter(m => m.userId !== currentUserId)
          .map(m => ({ id: m.userId, username: m.userId.slice(0, 8), avatar: '/avatar.svg' })); // Fallback placeholders
        setParticipants(list);
      }
    } catch (err) {
      console.error('Error fetching room details:', err);
    }
  };
  // Verify Password / Invite Token Access
  // Verify Password / Invite Token Access
  useEffect(() => {
    if (!roomId || !user) return; // Wait until user is loaded
    const verifyAccess = async () => {
      try {
        const res = await fetch(`/api/watch-together/room?roomId=${roomId}`);
        const data = await res.json();
        const roomData = data.room;
        
        if (roomData && (roomData.privacy === 'followers' || roomData.privacy === 'custom')) {
          // Allow the Host to bypass
          if (roomData.hostId === (user.id || user._id)) {
             return;
          }

          const { inviteToken } = router.query;
          
          if (!inviteToken) {
            toast({ type: 'error', message: 'This room requires a password to join.' });
            router.push('/watch-party/live');
            return;
          }
          
          // Verify if the token is valid (using the demo token format we created)
          const expectedToken = btoa(`${roomId}:${roomData.password}`);
          if (inviteToken !== expectedToken) {
            toast({ type: 'error', message: 'Invalid or expired invite token.' });
            router.push('/watch-party/live');
            return;
          }
        }

        if (roomData?.isLocked && roomData.hostId !== (user.id || user._id)) {
          toast({ type: 'error', message: 'This room is currently locked by the host.' });
          router.push('/watch-party');
          return;
        }
      } catch (err) {
        console.error("Access verification failed:", err);
      }
    };
    verifyAccess();
  }, [roomId, router.query]);

  // Socket connection
  useEffect(() => {
    if (!roomId || !user) return;

    // Connect to custom Socket.IO backend
    const SOCKET_URL = process.env.NEXT_PUBLIC_WATCH_TOGETHER_URL || 'https://rushes-watchtogether.onrender.com';
    
    let socket;
    let isCleanedUp = false;
    
    const initSocket = async () => {
      try {
        // Fetch JWT token for cross-origin socket auth (since cookie is HttpOnly)
        const res = await axios.get('/api/auth/socket-token');
        const token = res.data.token;
        
        if (isCleanedUp) return;

        socket = io(SOCKET_URL, {
          auth: { token },
          withCredentials: true,
          transports: ['websocket', 'polling']
        });
        socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to watch-together socket server');
      
      // Emit the new join-room event
      socket.emit('webrtc:join-room', { roomId });
    });

    // Listen for successful join
    socket.on('webrtc:room-joined', async (data) => {
      console.log('Joined room, peers:', data.peers);
      fetchRoomDetails();
      await initWebRtc(data.peers || []);
    });

    // Listen for error
    socket.on('webrtc:error', (error) => {
      console.error('WebRTC Error:', error);
      toast({ type: 'error', message: error.message || 'WebRTC Error' });
      if (error.code === 'ROOM_NOT_FOUND' || error.code === 'ROOM_FULL') {
        router.push('/');
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      toast({ type: 'error', message: 'Connection to sync server failed.' });
    });

    // WebRTC signaling receiver
    socket.on('webrtc:signal', async ({ senderId, signal }) => {
      let pc = peerConnections.current[senderId];
      
      try {
        if (signal.type === 'offer') {
          if (!pc) {
            pc = createPeerConnection(senderId, false);
          }
          await pc.setRemoteDescription(new RTCSessionDescription(signal));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc:signal', {
            targetId: senderId,
            signal: pc.localDescription
          });
        } else if (signal.type === 'answer') {
          if (pc) {
            await pc.setRemoteDescription(new RTCSessionDescription(signal));
          }
        } else if (signal.type === 'candidate') {
          if (pc) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          }
        }
      } catch (err) {
        console.error('Error handling WebRTC signal:', err);
      }
    });

    // WebRTC screen share state synchronization receiver
    socket.on('webrtc:screen_share_state', ({ userId, isSharing, streamId }) => {
      console.log('Screen share state updated:', userId, isSharing, streamId);
      if (isSharing) {
        setScreenShareHost({ userId, streamId });
        const stream = receivedStreams.current[streamId];
        if (stream) {
          setSharedScreenStream(stream);
          setRemoteStreams(prev => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        }
      } else {
        setScreenShareHost(null);
        setSharedScreenStream(null);
        const cameraStream = Object.values(receivedStreams.current).find(
          s => s.id !== streamId && s.userId === userId
        );
        if (cameraStream) {
          setRemoteStreams(prev => ({
            ...prev,
            [userId]: cameraStream
          }));
        }
      }
    });

    // Listen to user presence events
    socket.on('webrtc:user-joined', ({ userId }) => {
      fetchRoomDetails();
      setMessages(prev => [...prev, {
        type: 'system',
        content: `A user joined the room`,
        timestamp: new Date().toISOString()
      }]);
    });

    socket.on('webrtc:user-left', ({ userId }) => {
      fetchRoomDetails();
      setMessages(prev => [...prev, {
        type: 'system',
        content: `A user left the room`,
        timestamp: new Date().toISOString()
      }]);
      handlePeerDisconnect(userId);
    });

    // Listen to chat message events
    socket.on('chat:message', (payload) => {
      // payload: { messageId, roomId, userId, content, createdAt }
      setMessages(prev => [...prev, {
        type: 'user',
        userId: payload.userId,
        username: payload.userId.slice(0, 8), // Fallback username
        avatar: '/avatar.svg',
        content: payload.content,
        timestamp: payload.createdAt
      }]);
    });

    // Listen to floating reactions
    socket.on('room:reaction', ({ emoji, userId }) => {
      if (reactionsRef.current) {
        reactionsRef.current.addReaction(emoji);
      }
    });

    // Listen to player sync events
    socket.on('player:play', ({ currentTime, playbackRate }) => {
      console.log('Sync Event [player:play]:', currentTime);
      setIsPlaying(true);
      syncLocalPlayer(true, currentTime);
    });

    socket.on('player:pause', ({ currentTime }) => {
      console.log('Sync Event [player:pause]:', currentTime);
      setIsPlaying(false);
      syncLocalPlayer(false, currentTime);
    });

    socket.on('player:seek', ({ currentTime }) => {
      console.log('Sync Event [player:seek]:', currentTime);
      syncLocalPlayer(null, currentTime);
    });

      } catch (err) {
        console.error('Failed to initialize socket:', err);
      }
    };

    initSocket();

    return () => {
      isCleanedUp = true;
      if (socket) socket.disconnect();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      if (localScreenStreamRef.current) {
        localScreenStreamRef.current.getTracks().forEach(track => track.stop());
        localScreenStreamRef.current = null;
      }
      Object.entries(peerConnections.current).forEach(([userId, pc]) => {
        pc.close();
      });
      peerConnections.current = {};
      receivedStreams.current = {};
    };
  }, [roomId, user]);

  const toggleLockRoom = async () => {
    try {
      const res = await fetch('/api/watch-together/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, isLocked: !roomState?.isLocked })
      });
      const data = await res.json();
      if (data.success) {
        setRoomState(prev => ({ ...prev, isLocked: data.isLocked }));
        toast({ type: 'success', message: data.isLocked ? 'Room is now locked. No new joins allowed.' : 'Room unlocked.' });
      } else {
        toast({ type: 'error', message: data.error || 'Failed to lock room' });
      }
    } catch (err) {
      toast({ type: 'error', message: 'An error occurred' });
    }
  };

  // Sync player wrapper
  const syncLocalPlayer = (play, time) => {
    isSyncing.current = true;
    
    // HTML5 Video Player
    if (videoPlayerRef.current) {
      if (Math.abs(videoPlayerRef.current.currentTime - time) > 1.5) {
        videoPlayerRef.current.currentTime = time;
      }
      if (play === true) {
        videoPlayerRef.current.play().catch(() => {});
      } else if (play === false) {
        videoPlayerRef.current.pause();
      }
    }

    // YouTube Player
    if (ytPlayerRef.current) {
      if (Math.abs(ytPlayerRef.current.getCurrentTime() - time) > 1.5) {
        ytPlayerRef.current.seekTo(time, true);
      }
      if (play === true) {
        ytPlayerRef.current.playVideo();
      } else if (play === false) {
        ytPlayerRef.current.pauseVideo();
      }
    }

    setTimeout(() => {
      isSyncing.current = false;
    }, 500);
  };

  // Check if current user is host
  const isHost = roomState ? (roomState.hostId === (user?.id || user?._id)) : true;

  // Load YouTube script dynamically
  useEffect(() => {
    if (trailerKey) {
      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        initYoutubePlayer();
      }

      window.onYouTubeIframeAPIReady = () => {
        initYoutubePlayer();
      };
    }
  }, [trailerKey, hasStarted]);

  const initYoutubePlayer = () => {
    if (!trailerKey || ytPlayerRef.current) return;
    try {
      new window.YT.Player('yt-player-container', {
        height: '100%',
        width: '100%',
        videoId: trailerKey,
        playerVars: {
          controls: isHost ? 1 : 0, // Disable controls for non-hosts
          disablekb: isHost ? 0 : 1,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: (e) => {
            ytPlayerRef.current = e.target;
            setDuration(e.target.getDuration());
          },
          onStateChange: (e) => {
            if (!isHost || isSyncing.current) return;
            const time = e.target.getCurrentTime() || 0;
            
            if (e.data === window.YT.PlayerState.PLAYING) {
              socketRef.current?.emit('player:play', { roomId, currentTime: time });
            } else if (e.data === window.YT.PlayerState.PAUSED) {
              socketRef.current?.emit('player:pause', { roomId, currentTime: time });
            }
          }
        }
      });
    } catch (err) {
      console.error('Failed to create YouTube player', err);
    }
  };

  // Monitor custom HTML5 player time
  useEffect(() => {
    if (!videoPlayerRef.current) return;
    const interval = setInterval(() => {
      if (videoPlayerRef.current && !isSyncing.current) {
        setCurrentTime(videoPlayerRef.current.currentTime);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [hasStarted]);

  // HTML5 player event handlers
  const handleHtml5Play = () => {
    if (!isHost || isSyncing.current) return;
    const time = videoPlayerRef.current?.currentTime || 0;
    socketRef.current?.emit('player:play', { roomId, currentTime: time });
  };

  const handleHtml5Pause = () => {
    if (!isHost || isSyncing.current) return;
    const time = videoPlayerRef.current?.currentTime || 0;
    socketRef.current?.emit('player:pause', { roomId, currentTime: time });
  };

  const handleHtml5Seek = () => {
    if (!isHost || isSyncing.current) return;
    const time = videoPlayerRef.current?.currentTime || 0;
    socketRef.current?.emit('player:seek', { roomId, currentTime: time });
  };

  // Seeker dragging handlers
  const handleSeekChange = (e) => {
    if (!isHost) return;
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    
    if (videoPlayerRef.current) {
      videoPlayerRef.current.currentTime = val;
    }
    if (ytPlayerRef.current) {
      ytPlayerRef.current.seekTo(val, true);
    }
    
    socketRef.current?.emit('player:seek', { roomId, currentTime: val });
  };

  const handleTogglePlay = () => {
    if (!isHost) return;
    const newPlayState = !isPlaying;
    setIsPlaying(newPlayState);

    const time = videoPlayerRef.current 
      ? videoPlayerRef.current.currentTime 
      : (ytPlayerRef.current ? ytPlayerRef.current.getCurrentTime() : 0);

    if (newPlayState) {
      socketRef.current?.emit('player:play', { roomId, currentTime: time });
    } else {
      socketRef.current?.emit('player:pause', { roomId, currentTime: time });
    }
  };

  const startRoom = () => {
    if (!roomId || !user) return;
    setHasStarted(true);
    
    dispatch(startWatchParty({
      roomID: `wt_${roomId}`,
      movieTitle: movieTitle || 'Watch Together',
      currentUser: user,
      streamingUrl,
    }));
    
    toast({ type: 'success', message: 'Joined Custom watch-together room.' });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!input.trim() || !socketRef.current) return;

    socketRef.current.emit('chat:send', { roomId, content: input.trim() });
    
    // Add locally immediately
    const localMsg = {
      type: 'user',
      userId: user.id || user._id,
      username: user.username || 'You',
      avatar: user.avatar || '/avatar.svg',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, localMsg]);
    setInput('');
  };

  const copyInvite = () => {
    let inviteUrl = window.location.href;
    if (roomState?.password && (roomState.privacy === 'followers' || roomState.privacy === 'custom')) {
      const inviteToken = btoa(`${roomId}:${roomState.password}`);
      const separator = inviteUrl.includes('?') ? '&' : '?';
      inviteUrl = `${inviteUrl}${separator}inviteToken=${encodeURIComponent(inviteToken)}`;
    }
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    toast({ type: 'success', message: 'Invite link copied!' });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-white">
        <div className="text-center">
          <Film className="w-16 h-16 text-neutral-600 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Sign in to join</h2>
          <p className="text-neutral-500">You need to be logged in to join a Watch Together room.</p>
        </div>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <>
        <Head>
          <title>Watch Together Setup - {movieTitle || 'Rushes'}</title>
        </Head>
        <main className="min-h-screen bg-neutral-950 pt-20 text-white">
          <section className="mx-auto grid min-h-[calc(100vh-80px)] max-w-6xl grid-cols-1 gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-6">
            <div className="flex flex-col justify-center">
              <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-purple-200">
                <Film className="h-3.5 w-3.5" />
                Custom Watch Together
              </div>

              <h1 className="max-w-3xl text-3xl font-black leading-tight text-white md:text-5xl">
                {roomState?.title || movieTitle || 'Watch Party Lobby'}
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-400 md:text-base">
                You are in the waiting area. {isHost ? "Click below when you are ready to start the synchronized playback and enter the room." : "Waiting for the host to start the room..."}
              </p>

              <div className="mt-8 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <ShieldCheck className="mb-3 h-5 w-5 text-purple-300" />
                  <h2 className="text-sm font-black text-white">Playback Sync</h2>
                  <p className="mt-2 text-xs leading-5 text-neutral-400">
                    Play, pause, and seek are synced automatically across everyone in the room.
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <AlertTriangle className="mb-3 h-5 w-5 text-amber-300" />
                  <h2 className="text-sm font-black text-white">Shared Player</h2>
                  <p className="mt-2 text-xs leading-5 text-neutral-400">
                    Watch official trailer previews or direct custom video feeds together in real-time.
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <Users className="mb-3 h-5 w-5 text-sky-300" />
                  <h2 className="text-sm font-black text-white">Live Sockets</h2>
                  <p className="mt-2 text-xs leading-5 text-neutral-400">
                    Low latency chat keeps you connected while you enjoy the show.
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={startRoom}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-purple-950/40 transition hover:bg-purple-500"
                >
                  <PlayCircle className="h-5 w-5" />
                  Enter watch lobby
                </button>
                <button
                  onClick={copyInvite}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.08]"
                >
                  {copied ? <Check className="h-4 w-4 text-green-300" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy invite link'}
                </button>
              </div>
            </div>

            <aside className="self-center rounded-lg border border-white/10 bg-black/40 p-5">
              <div className="mb-5 rounded-lg border border-white/10 bg-neutral-900/80 p-4">
                <p className="text-xs uppercase tracking-wide text-neutral-500">Room title</p>
                <h2 className="mt-1 line-clamp-2 text-xl font-black text-white">{roomState?.title || movieTitle || 'Watch Together'}</h2>
                <p className="mt-1 text-xs text-neutral-400 font-medium">Watching: {movieTitle || 'Custom Media'}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-black text-white">
                    <MonitorPlay className="h-4 w-4 text-purple-300" />
                    Host Controls
                  </h3>
                  <p className="mt-2 text-xs leading-5 text-neutral-400">
                    The user who created the room holds playback controls. When the host plays or pauses, everyone else plays or pauses.
                  </p>
                </div>
              </div>
            </aside>
          </section>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Watch Together — {movieTitle} | Rushes</title>
      </Head>
      <div className="min-h-screen bg-neutral-950 pt-20 flex flex-col lg:flex-row">

        {/* Left: Video/Voice area */}
        <div className="flex-1 flex flex-col">
          {/* Header bar */}
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-white/5 bg-black/50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                <Film className="w-4 h-4 text-purple-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-white truncate">{roomState?.title || movieTitle || 'Watch Together'}</h1>
                {movieTitle && <p className="text-[10px] text-neutral-400 truncate">Watching: {movieTitle}</p>}
                <p className="text-[10px] text-neutral-500 flex items-center gap-1">
                  <Users className="w-3 h-3" /> {participants.length + 1} in room
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isHost && (
                <div className="relative group">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-purple-400 text-xs hover:bg-purple-500/10 transition-colors">
                    <ShieldCheck className="w-3 h-3" /> <span className="hidden sm:inline">Host Controls</span>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-neutral-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 py-2">
                    <button onClick={() => toast({ type: 'info', message: 'Transfer Host coming soon' })} className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2">
                      <Users className="w-3 h-3" /> Transfer Host
                    </button>
                    <button onClick={() => toast({ type: 'info', message: 'Muted everyone else' })} className="w-full text-left px-4 py-2 text-xs text-white hover:bg-white/5 flex items-center gap-2">
                      <MicOff className="w-3 h-3" /> Mute All Members
                    </button>
                    <div className="h-px w-full bg-white/5 my-1" />
                    <button onClick={toggleLockRoom} className={`w-full text-left px-4 py-2 text-xs ${roomState?.isLocked ? 'text-amber-400 hover:bg-amber-400/10' : 'text-white hover:bg-white/5'} flex items-center gap-2`}>
                      <Lock className="w-3 h-3" /> {roomState?.isLocked ? 'Unlock Room' : 'Lock Room (Stop Joins)'}
                    </button>
                    <div className="h-px w-full bg-white/5 my-1" />
                    <button onClick={() => { toast({ type: 'error', message: 'Room Ended' }); router.push('/'); }} className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-400/10 flex items-center gap-2">
                      <Power className="w-3 h-3" /> End Room for All
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={copyInvite}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-neutral-400 text-xs hover:bg-white/5 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                <span className="hidden sm:inline">Invite Link</span>
              </button>
            </div>
          </div>

          {/* Sync Video Player Screen */}
          <div className="flex-1 relative bg-black min-h-[300px] flex items-center justify-center">
            {sharedScreenStream ? (
              <div className="w-full h-full relative">
                <video
                  ref={el => { if (el) el.srcObject = sharedScreenStream; }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
                <div className="absolute top-4 left-4 bg-purple-600/80 px-3 py-1.5 rounded-xl text-xs font-bold text-white backdrop-blur-sm shadow-lg">
                  📺 Live Screen Share from @{participants.find(p => p.id === screenShareHost?.userId)?.username || (screenShareHost?.userId === (user?.id || user?._id) ? 'You' : 'User')}
                </div>
              </div>
            ) : (
              /* If direct streaming URL is provided, render native HTML5 video */
              streamingUrl && (streamingUrl.endsWith('.mp4') || streamingUrl.endsWith('.webm') || streamingUrl.endsWith('.m3u8')) ? (
                <div className="w-full h-full relative group">
                  <video
                    ref={videoPlayerRef}
                    src={streamingUrl}
                    onPlay={handleHtml5Play}
                    onPause={handleHtml5Pause}
                    onSeeked={handleHtml5Seek}
                    onLoadedMetadata={(e) => setDuration(e.target.duration)}
                    controls={isHost}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : trailerKey ? (
                /* If YouTube key is found, render YT Player container */
                <div className="w-full h-full flex flex-col justify-between">
                  <div id="yt-player-container" className="flex-1 w-full h-full" />
                  
                  {/* Custom Overlay Control Bar for Host/Clients */}
                  <div className="bg-neutral-900/80 border-t border-white/5 p-3 flex items-center gap-4 justify-between">
                    <div className="flex items-center gap-2">
                      {isHost ? (
                        <button
                          onClick={handleTogglePlay}
                          className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                      ) : (
                        <div className="text-[10px] uppercase font-bold text-neutral-500 border border-neutral-700 px-2 py-1.5 rounded bg-neutral-950">
                          {isPlaying ? 'Watching Sync' : 'Paused by Host'}
                        </div>
                      )}
                    </div>
                    
                    {isHost && duration > 0 && (
                      <input
                        type="range"
                        min={0}
                        max={duration}
                        value={currentTime}
                        onChange={handleSeekChange}
                        className="flex-1 accent-purple-500 bg-neutral-800 rounded-lg h-1.5 cursor-pointer"
                      />
                    )}
                  </div>
                </div>
              ) : (
                /* fallback default room backdrop */
                <div className="text-center p-8 max-w-md">
                  <div className="w-20 h-20 rounded-full bg-purple-950/40 border border-purple-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Film className="w-10 h-10 text-purple-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{roomState?.title || movieTitle || 'Watch Together'} Watch Lobby</h3>
                  <p className="text-sm text-neutral-400 max-w-sm mb-6 text-center">
                    This room is active. Click the "Open on OTT" button to load this title on your provider, and chat in sync with room members.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mt-6">
                    <button
                      onClick={startScreenShare}
                      className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-lg shadow-purple-950/30 border border-purple-500/30"
                    >
                      <MonitorPlay className="w-3.5 h-3.5" /> Share Screen (Desktop)
                    </button>
                  </div>
                </div>
              )
            )}

            {/* Floating WebRTC Video/Voice Feeds */}
            <div className="absolute bottom-4 left-4 z-30 flex items-center gap-3 p-2 bg-neutral-900/80 backdrop-blur-md border border-white/10 rounded-2xl max-w-[calc(100%-2rem)] overflow-x-auto shadow-2xl">
              {/* Local Media Controls */}
              <div className="flex items-center gap-1.5 border-r border-white/10 pr-2 mr-0.5">
                <button
                  type="button"
                  onClick={toggleLocalMic}
                  className={`p-2 rounded-xl transition ${micEnabled ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30' : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'}`}
                  title={micEnabled ? 'Mute Mic' : 'Unmute Mic'}
                >
                  {micEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={toggleLocalCamera}
                  className={`p-2 rounded-xl transition ${cameraEnabled ? 'bg-purple-600/20 text-purple-400 hover:bg-purple-600/30' : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'}`}
                  title={cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
                >
                  {cameraEnabled ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={startScreenShare}
                  className={`p-2 rounded-xl transition ${localScreenStream ? 'bg-green-600/25 text-green-400 hover:bg-green-600/35' : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'}`}
                  title={localScreenStream ? 'Stop Screen Share' : 'Share Screen'}
                >
                  <MonitorPlay className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Video elements container */}
              <div className="flex items-center gap-2">
                {/* Floating Reactions Overlay */}
                <FloatingReactions ref={reactionsRef} />

                {/* Local Camera (PiP) */}
                <div className="relative w-28 h-20 bg-neutral-950 rounded-xl overflow-hidden border border-white/5 flex-shrink-0">
                  {localStream ? (
                    <video
                      ref={el => { if (el) el.srcObject = localStream; }}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-600 bg-neutral-900/50">
                      No Camera
                    </div>
                  )}
                  <div className="absolute bottom-1 left-1 bg-black/60 px-1 py-0.5 rounded text-[8px] text-neutral-300 font-semibold backdrop-blur-sm">
                    You
                  </div>
                </div>

                {/* Remote Video Feeds */}
                {Object.entries(remoteStreams).map(([peerId, stream]) => (
                  <div key={peerId} className="relative w-28 h-20 bg-neutral-950 rounded-xl overflow-hidden border border-white/5 flex-shrink-0">
                    <video
                      ref={el => { if (el) el.srcObject = stream; }}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-1 left-1 bg-black/60 px-1 py-0.5 rounded text-[8px] text-neutral-300 font-semibold backdrop-blur-sm">
                      @{participants.find(p => p.id === peerId)?.username || 'User'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Room bottom bar info */}
          <div className="px-4 py-2 border-t border-white/5 bg-neutral-950/80 flex items-center justify-between text-[10px] text-neutral-500">
            <span>Room ID: {roomId}</span>
            <span>Connected via Custom Sync Sockets</span>
          </div>
        </div>

        {/* Right: Chat sidebar */}
        <div className="w-full lg:w-80 flex flex-col border-l border-white/5 bg-neutral-900/50 max-h-screen lg:max-h-[calc(100vh-80px)]">
          {/* Participants */}
          <div className="px-4 py-3 border-b border-white/5">
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Room Members</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              <img
                src={user.avatar || '/avatar.svg'}
                alt="You"
                title={`${user.username || 'You'} (Owner)`}
                className={`w-7 h-7 rounded-full border-2 object-cover ${isHost ? 'border-purple-500' : 'border-neutral-500'}`}
              />
              {participants.map(p => (
                <img
                  key={p.id}
                  src={p.avatar}
                  alt={p.username}
                  title={`@${p.username}`}
                  className="w-7 h-7 rounded-full border-2 border-neutral-700 object-cover"
                />
              ))}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-8">
                <p className="text-xs text-neutral-600">Chat with friends while watching 🎬</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                {msg.type === 'system' ? (
                  <p className="text-center text-[10px] text-neutral-600 py-1 font-semibold">{msg.content}</p>
                ) : (
                  <div className="flex items-start gap-2">
                    <img src={msg.avatar} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-neutral-500">@{msg.username}</p>
                      <p className="text-xs text-neutral-200 bg-white/5 px-2.5 py-1.5 rounded-xl rounded-tl-sm inline-block max-w-[200px] break-words">
                        {msg.content}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Chat input and Reactions */}
          <div className="flex flex-col border-t border-white/5">
            {/* Reaction Bar */}
            <div className="flex justify-center gap-4 py-2 bg-white/[0.02]">
              {['😂', '😱', '❤️', '🍅', '🔥'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    reactionsRef.current?.addReaction(emoji);
                    socketRef.current?.emit('room:reaction', { roomId, emoji, userId: user?.id || user?._id });
                  }}
                  className="text-xl hover:scale-125 transition-transform origin-bottom"
                >
                  {emoji}
                </button>
              ))}
            </div>
            
            <form onSubmit={sendMessage} className="p-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50 placeholder:text-neutral-600"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center hover:bg-purple-500 disabled:opacity-30 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}
