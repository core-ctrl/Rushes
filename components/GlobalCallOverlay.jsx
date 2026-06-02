import { useSelector, useDispatch } from 'react-redux';
import { selectActiveCall, selectActiveWatchParty, endCall, selectIsCallMinimized, minimizeCall, maximizeCall, endWatchParty, minimizeWatchParty, maximizeWatchParty } from '../store/slices/callSlice';
import ZegoCallPanel from './chat/ZegoCallPanel';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function GlobalCallOverlay() {
  const activeCall = useSelector(selectActiveCall);
  const activeWatchParty = useSelector(selectActiveWatchParty);
  const isMinimized = useSelector(selectIsCallMinimized);
  const dispatch = useDispatch();
  const router = useRouter();

  const isWTPage = router.pathname.startsWith('/watch-together');
  const currentWatchRoomID = router.query?.roomId ? `wt_${router.query.roomId}` : null;
  const isActiveWTPage = Boolean(activeWatchParty && isWTPage && activeWatchParty.roomID === currentWatchRoomID);

  // Auto-minimize when navigating away
  useEffect(() => {
    if (activeCall && !router.pathname.startsWith('/messages')) {
      dispatch(minimizeCall());
    }
    if (activeWatchParty && !isActiveWTPage) {
      dispatch(minimizeWatchParty());
    }
  }, [router.pathname, activeCall, activeWatchParty, dispatch, isActiveWTPage]);

  if (!activeCall && !activeWatchParty) return null;

  if (activeCall) {
    return (
      <ZegoCallPanel
        roomID={activeCall.roomID}
        mode={activeCall.mode}
        otherUser={activeCall.otherUser}
        currentUser={activeCall.currentUser}
        onClose={() => dispatch(endCall())}
        isMinimized={isMinimized}
        onMinimize={() => dispatch(minimizeCall())}
        onMaximize={() => {
          if (!router.pathname.startsWith('/messages')) {
            router.push('/messages');
          }
          dispatch(maximizeCall());
        }}
      />
    );
  }

  if (activeWatchParty) {
    return (
      <ZegoCallPanel
        roomID={activeWatchParty.roomID}
        mode="video"
        isWatchTogether={true}
        otherUser={{ username: 'Watch Party' }}
        currentUser={activeWatchParty.currentUser}
        onClose={() => dispatch(endWatchParty())}
        isMinimized={!isActiveWTPage}
        onMinimize={() => {
          if (isActiveWTPage) router.push('/');
        }}
        onMaximize={() => {
          if (!isWTPage) {
            router.push(`/watch-together/${activeWatchParty.roomID.replace('wt_', '')}`);
          }
        }}
        movieTitle={activeWatchParty.movieTitle}
      />
    );
  }
}
