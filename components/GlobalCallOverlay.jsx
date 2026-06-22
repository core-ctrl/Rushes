import { useSelector, useDispatch } from 'react-redux';
import { selectActiveCall, selectActiveWatchParty, endCall, selectIsCallMinimized, minimizeCall, maximizeCall, endWatchParty, minimizeWatchParty, maximizeWatchParty } from '../store/slices/callSlice';
import RushesCallPanel from './chat/RushesCallPanel';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function GlobalCallOverlay() {
  const activeCall = useSelector(selectActiveCall);
  const activeWatchParty = useSelector(selectActiveWatchParty);
  const isMinimized = useSelector(selectIsCallMinimized);
  const dispatch = useDispatch();
  const router = useRouter();

  const isOnMessagesPage = router.pathname.startsWith('/messages');
  const isWTPage = router.pathname.startsWith('/watch-together');
  const currentWatchRoomID = router.query?.roomId ? `wt_${router.query.roomId}` : null;
  const isActiveWTPage = Boolean(activeWatchParty && isWTPage && activeWatchParty.roomID === currentWatchRoomID);

  // When user navigates AWAY from /messages during a call → minimize the panel so it floats
  // When user returns to /messages → maximize the panel
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

  if (!activeCall && !activeWatchParty) return null;

  if (activeCall) {
    return (
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
    );
  }

  return null;
}
