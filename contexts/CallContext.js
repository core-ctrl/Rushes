import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

const CallContext = createContext();

export const useCall = () => useContext(CallContext);

export const CallProvider = ({ children }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [callDetails, setCallDetails] = useState(null); // { roomId, type: 'voice' | 'video', members: [] }
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const zegoInstanceRef = useRef(null);
  const router = useRouter();

  const isCallPage = router.pathname.startsWith('/room/');

  // Initialize call globally
  const joinCall = (details, instance) => {
    setCallDetails(details);
    setIsInCall(true);
    zegoInstanceRef.current = instance;
    if (details.type === 'voice') setIsVideoOff(true);
  };

  const leaveCall = () => {
    if (zegoInstanceRef.current) {
      zegoInstanceRef.current.destroy();
      zegoInstanceRef.current = null;
    }
    setIsInCall(false);
    setCallDetails(null);
  };

  const toggleMute = () => {
    if (zegoInstanceRef.current) {
      zegoInstanceRef.current.turnMicrophoneOn(isMuted); // toggle
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (zegoInstanceRef.current && callDetails?.type !== 'voice') {
      zegoInstanceRef.current.turnCameraOn(isVideoOff); // toggle
      setIsVideoOff(!isVideoOff);
    }
  };

  return (
    <CallContext.Provider value={{
      isInCall,
      callDetails,
      isMuted,
      isVideoOff,
      isCallPage,
      joinCall,
      leaveCall,
      toggleMute,
      toggleVideo,
      zegoInstanceRef
    }}>
      {children}
    </CallContext.Provider>
  );
};
