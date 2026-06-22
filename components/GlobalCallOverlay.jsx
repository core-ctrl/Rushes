import { useSelector, useDispatch } from 'react-redux';
import { 
  selectActiveCall, 
  selectActiveWatchParty, 
  endCall, 
  selectIsCallMinimized, 
  minimizeCall, 
  maximizeCall, 
  minimizeWatchParty,
  startCall as startGlobalCall,
  cancelCall,
  setCallerStatus
} from '../store/slices/callSlice';
import RushesCallPanel from './chat/RushesCallPanel';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { selectUser } from '../store/slices/authSlice';
import dynamic from 'next/dynamic';
import { toast } from './ui/Toaster';

const IncomingCallModal = dynamic(() => import('./chat/IncomingCallModal'), { ssr: false });

export default function GlobalCallOverlay() {
  const activeCall = useSelector(selectActiveCall);
  const activeWatchParty = useSelector(selectActiveWatchParty);
  const isMinimized = useSelector(selectIsCallMinimized);
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const router = useRouter();

  const [incomingCall, setIncomingCall] = useState(null);

  const isOnMessagesPage = router.pathname.startsWith('/messages');
  const isWTPage = router.pathname.startsWith('/watch-together');
  const currentWatchRoomID = router.query?.roomId ? `wt_${router.query.roomId}` : null;
  const isActiveWTPage = Boolean(activeWatchParty && isWTPage && activeWatchParty.roomID === currentWatchRoomID);

  useEffect(() => {
    if (activeCall) {
      if (!isOnMessagesPage) {
        dispatch(minimizeCall());
      }
    }
    if (activeWatchParty && !isActiveWTPage) {
      dispatch(minimizeWatchParty());
    }
  }, [router.pathname, activeCall, activeWatchParty, dispatch, isActiveWTPage, isOnMessagesPage]);

  // Global subscription for incoming calls on personal channel
  useEffect(() => {
    if (!user || !supabase) return;

    const currentUserId = user.id || user._id;
    const channel = supabase.channel(`user:${currentUserId}`);

    channel
      .on("broadcast", { event: "call_invite" }, ({ payload }) => {
        if (String(payload.callerId) !== String(currentUserId)) {
          setIncomingCall(payload);
        }
      })
      .on("broadcast", { event: "call_declined" }, () => {
        dispatch(cancelCall());
        toast({ type: "info", message: `The user declined the call.` });
      })
      .on("broadcast", { event: "call_accepted" }, () => {
        dispatch(setCallerStatus('accepted'));
      })
      .on("broadcast", { event: "call_cancelled" }, () => {
        setIncomingCall(null);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, dispatch]);

  const acceptCall = () => {
    if (!incomingCall) return;
    
    const otherUser = {
      _id: incomingCall.callerId,
      id: incomingCall.callerId,
      username: incomingCall.callerName,
      displayName: incomingCall.callerName,
      avatar: incomingCall.callerAvatar
    };

    dispatch(startGlobalCall({
      roomID: incomingCall.roomID,
      mode: incomingCall.callMode,
      otherUser,
      currentUser: user,
      conversationId: incomingCall.conversationId,
    }));

    // Tell the caller we accepted
    const callerChannel = supabase.channel(`user:${incomingCall.callerId}`);
    callerChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        callerChannel.send({
          type: 'broadcast',
          event: 'call_accepted',
          payload: { roomID: incomingCall.roomID, acceptedBy: user.id || user._id },
        });
        setTimeout(() => supabase.removeChannel(callerChannel), 500);
      }
    });
    
    setIncomingCall(null);
  };

  const declineCall = () => {
    if (!incomingCall) return;

    const callerChannel = supabase.channel(`user:${incomingCall.callerId}`);
    callerChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        callerChannel.send({
          type: 'broadcast',
          event: 'call_declined',
          payload: { declinedBy: user.id || user._id },
        });
        setTimeout(() => supabase.removeChannel(callerChannel), 500);
      }
    });

    setIncomingCall(null);
  };

  return (
    <>
      {incomingCall && !activeCall && (
        <IncomingCallModal
          callerName={incomingCall.callerName}
          callerAvatar={incomingCall.callerAvatar}
          mode={incomingCall.callMode}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}
      
      {activeCall && (
        <RushesCallPanel
          roomID={activeCall.roomID}
          mode={activeCall.mode}
          otherUser={activeCall.otherUser}
          currentUser={activeCall.currentUser}
          onClose={() => dispatch(endCall())}
          isMinimized={isMinimized}
          onMinimize={() => dispatch(minimizeCall())}
          onMaximize={() => {
            router.push('/messages');
            dispatch(maximizeCall());
          }}
        />
      )}
    </>
  );
}
