import { useEffect, useRef, useState } from 'react';

interface UseLessonTrackerProps {
  lessonId: string;
  lessonDuration: number; // in minutes
  isActive?: boolean;
}

interface TrackerState {
  timeSpent: number; // in seconds
  progressPercent: number;
  isTracking: boolean;
}

export function useLessonTracker({ 
  lessonId, 
  lessonDuration,
  isActive = true 
}: UseLessonTrackerProps) {
  const [state, setState] = useState<TrackerState>({
    timeSpent: 0,
    progressPercent: 0,
    isTracking: false
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const accumulatedTimeRef = useRef<number>(0);
  const lastSyncRef = useRef<number>(0);

  // Start tracking when component mounts or becomes active
  useEffect(() => {
    if (!isActive || !lessonId) return;

    setState(prev => ({ ...prev, isTracking: true }));
    startTimeRef.current = Date.now();

    // Update time every second
    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const totalTime = accumulatedTimeRef.current + elapsed;
      const progress = Math.min(100, Math.round((totalTime / (lessonDuration * 60)) * 100));

      setState({
        timeSpent: totalTime,
        progressPercent: progress,
        isTracking: true
      });

      // Sync with server every 30 seconds
      if (totalTime - lastSyncRef.current >= 30) {
        syncProgress(totalTime, progress);
        lastSyncRef.current = totalTime;
      }
    }, 1000);

    // Sync on visibility change (tab switch)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab is hidden, accumulate time and stop interval
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        accumulatedTimeRef.current += elapsed;
        const totalTime = accumulatedTimeRef.current;
        const progress = Math.min(100, Math.round((totalTime / (lessonDuration * 60)) * 100));
        
        syncProgress(totalTime, progress);
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      } else {
        // Tab is visible again, restart tracking
        startTimeRef.current = Date.now();
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            const totalTime = accumulatedTimeRef.current + elapsed;
            const progress = Math.min(100, Math.round((totalTime / (lessonDuration * 60)) * 100));

            setState({
              timeSpent: totalTime,
              progressPercent: progress,
              isTracking: true
            });

            if (totalTime - lastSyncRef.current >= 30) {
              syncProgress(totalTime, progress);
              lastSyncRef.current = totalTime;
            }
          }, 1000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Final sync on unmount
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const totalTime = accumulatedTimeRef.current + elapsed;
      const progress = Math.min(100, Math.round((totalTime / (lessonDuration * 60)) * 100));
      syncProgress(totalTime, progress);
    };
  }, [lessonId, lessonDuration, isActive]);

  const syncProgress = async (timeSpent: number, progressPercent: number) => {
    try {
      await fetch(`/api/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeSpent,
          progressPercent
        }),
      });
    } catch (error) {
      console.error('Failed to sync lesson progress:', error);
    }
  };

  const manualSync = () => {
    const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const totalTime = accumulatedTimeRef.current + elapsed;
    const progress = Math.min(100, Math.round((totalTime / (lessonDuration * 60)) * 100));
    syncProgress(totalTime, progress);
  };

  return {
    ...state,
    manualSync
  };
}
