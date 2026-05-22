import { useState, useRef, useCallback } from 'react';

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorder = useRef(null);
  const timerInterval = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];

      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerInterval.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Microphone access denied', error);
      alert('Microphone access denied. Please allow microphone permissions.');
    }
  }, []);

  const stopRecording = useCallback(() => {
    return new Promise((resolve) => {
      if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') {
        return resolve(null);
      }

      mediaRecorder.current.onstop = () => {
        window.clearInterval(timerInterval.current);
        setIsRecording(false);
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        
        // Stop all tracks to release mic
        mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
        
        resolve(audioBlob);
      };

      mediaRecorder.current.stop();
    });
  }, []);

  const cancelRecording = useCallback(() => {
      if (!mediaRecorder.current || mediaRecorder.current.state === 'inactive') return;
      mediaRecorder.current.onstop = null;
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
      window.clearInterval(timerInterval.current);
      setIsRecording(false);
      setRecordingTime(0);
      audioChunks.current = [];
  }, []);

  return { isRecording, recordingTime, startRecording, stopRecording, cancelRecording };
}
