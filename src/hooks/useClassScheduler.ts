import { useState, useEffect, useRef } from 'react';
import { ClassSchedule } from '../types';
import { isClassAcknowledgedToday } from '../utils/offlineStorage';
import { playSchoolBell, stopSchoolBell, unlockAudio } from '../utils/audioBell';
import { sendClassAlertNotification } from '../utils/notifications';
import { getSavedSoundType, getSavedSoundVolume } from '../utils/offlineStorage';

interface SchedulerResult {
  currentTime: Date;
  activeAlarmClass: ClassSchedule | null;
  secondsRemainingToAlarmClass: number;
  nextUpcomingClass: ClassSchedule | null;
  secondsToNextClass: number;
  currentRunningClass: ClassSchedule | null;
  todaysClasses: ClassSchedule[];
  dismissAlarm: () => void;
  ringAlarmNow: () => void;
}

export function useClassScheduler(
  teacherId: string | null,
  classes: ClassSchedule[],
  defaultAlertMinutes = 2,
  isOnLeave = false
): SchedulerResult {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [activeAlarmClass, setActiveAlarmClass] = useState<ClassSchedule | null>(null);
  const [secondsRemainingToAlarmClass, setSecondsRemainingToAlarmClass] = useState<number>(0);
  const [nextUpcomingClass, setNextUpcomingClass] = useState<ClassSchedule | null>(null);
  const [secondsToNextClass, setSecondsToNextClass] = useState<number>(0);
  const [currentRunningClass, setCurrentRunningClass] = useState<ClassSchedule | null>(null);

  // Track if notification has already been pushed for this class instance to prevent spamming
  const notifiedClassesRef = useRef<Set<string>>(new Set());

  const dismissAlarm = () => {
    stopSchoolBell();
    setActiveAlarmClass(null);
  };

  const ringAlarmNow = () => {
    if (isOnLeave) return; // Do not ring if on leave
    unlockAudio();
    const soundType = getSavedSoundType();
    const volume = getSavedSoundVolume();
    playSchoolBell(soundType, 12, volume);
  };

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setCurrentTime(now);

      if (!teacherId || !classes || classes.length === 0) {
        setActiveAlarmClass(null);
        setNextUpcomingClass(null);
        setCurrentRunningClass(null);
        return;
      }

      // If the teacher is currently on leave ("مجاز"), silence all alarms and bells immediately!
      if (isOnLeave) {
        stopSchoolBell();
        setActiveAlarmClass(null);
      }

      const currentDay = now.getDay(); // 0 = الأحد, etc.
      const teacherTodayClasses = classes.filter(
        (c) => c.teacherId === teacherId && c.dayOfWeek === currentDay && c.isActive
      );

      // Sort today's classes by startTime
      teacherTodayClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

      let alarmTarget: ClassSchedule | null = null;
      let alarmDiffSecs = 0;
      let nextTarget: ClassSchedule | null = null;
      let minUpcomingDiff = Infinity;
      let runningTarget: ClassSchedule | null = null;

      for (const item of teacherTodayClasses) {
        const [startH, startM] = item.startTime.split(':').map(Number);
        const [endH, endM] = item.endTime.split(':').map(Number);

        const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startH, startM, 0);
        const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), endH, endM, 0);

        const diffStartSecs = Math.floor((startTime.getTime() - now.getTime()) / 1000);
        const diffEndSecs = Math.floor((endTime.getTime() - now.getTime()) / 1000);

        const alertThresholdSecs = (item.alertMinutesBefore || defaultAlertMinutes) * 60;

        // Check if currently running
        if (diffStartSecs <= 0 && diffEndSecs > 0) {
          runningTarget = item;
        }

        // Check for upcoming next class
        if (diffStartSecs > 0 && diffStartSecs < minUpcomingDiff) {
          minUpcomingDiff = diffStartSecs;
          nextTarget = item;
        }

        // Check if within alert window and NOT yet acknowledged by the teacher today
        // ONLY if the teacher is NOT on leave!
        if (!isOnLeave) {
          const isAcknowledged = isClassAcknowledgedToday(item.id);
          if (!isAcknowledged) {
            // Alert window: From alertThresholdSecs before start time until 5 minutes after start time
            if (diffStartSecs <= alertThresholdSecs && diffStartSecs >= -300) {
              alarmTarget = item;
              alarmDiffSecs = diffStartSecs;
            }
          }
        }
      }

      setActiveAlarmClass(isOnLeave ? null : alarmTarget);
      setSecondsRemainingToAlarmClass(alarmDiffSecs);
      setNextUpcomingClass(nextTarget);
      setSecondsToNextClass(minUpcomingDiff === Infinity ? 0 : minUpcomingDiff);
      setCurrentRunningClass(runningTarget);

      // Trigger bell sound and push notification ONLY if NOT ON LEAVE
      if (alarmTarget && !isOnLeave) {
        const notificationKey = `${alarmTarget.id}_${now.toISOString().split('T')[0]}`;
        if (!notifiedClassesRef.current.has(notificationKey)) {
          notifiedClassesRef.current.add(notificationKey);

          // Push browser notification and vibrate
          sendClassAlertNotification(
            `🔔 تنبيه موعد الحصة: ${alarmTarget.subject}`,
            `حان موعد التوجه إلى ${alarmTarget.gradeAndSection}! تبدأ الحصة خلال دقيقتين.`
          );

          // Play school bell with Lock Screen metadata
          unlockAudio();
          const soundType = getSavedSoundType();
          const volume = getSavedSoundVolume();
          playSchoolBell(
            soundType,
            15,
            volume,
            {
              subject: alarmTarget.subject,
              gradeAndSection: alarmTarget.gradeAndSection,
              room: alarmTarget.room,
            },
            dismissAlarm
          );
        }
      }
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [teacherId, classes, defaultAlertMinutes, isOnLeave]);

  const currentDay = currentTime.getDay();
  const todaysClasses = (classes || []).filter(
    (c) => (!teacherId || c.teacherId === teacherId) && c.dayOfWeek === currentDay && c.isActive
  );
  todaysClasses.sort((a, b) => a.startTime.localeCompare(b.startTime));

  return {
    currentTime,
    activeAlarmClass,
    secondsRemainingToAlarmClass,
    nextUpcomingClass,
    secondsToNextClass,
    currentRunningClass,
    todaysClasses,
    dismissAlarm,
    ringAlarmNow,
  };
}
