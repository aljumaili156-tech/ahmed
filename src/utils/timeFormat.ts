/**
 * Universal 12-Hour Arabic Time Formatter
 * Strict 12-hour format with 'ص' (AM) and 'م' (PM)
 */

export function formatTimeTo12Hour(timeStr?: string): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (trimmed.includes('ص') || trimmed.includes('م')) {
    return trimmed;
  }

  // Handle format like "HH:mm" or "HH:mm:ss"
  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    const rawH = parseInt(parts[0], 10);
    const rawM = parseInt(parts[1], 10);
    if (!isNaN(rawH) && !isNaN(rawM)) {
      const isPm = rawH >= 12;
      let h12 = rawH % 12;
      if (h12 === 0) h12 = 12;
      const hStr = String(h12).padStart(2, '0');
      const mStr = String(rawM).padStart(2, '0');
      const period = isPm ? 'م' : 'ص';
      return `${hStr}:${mStr} ${period}`;
    }
  }

  return trimmed;
}

export function formatTimeRangeTo12Hour(startTime?: string, endTime?: string): string {
  if (!startTime) return '';
  const start = formatTimeTo12Hour(startTime);
  if (!endTime) return start;
  const end = formatTimeTo12Hour(endTime);
  return `${start} - ${end}`;
}

export function formatDateTo12Hour(d: Date, withSeconds = true): string {
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const seconds = d.getSeconds();
  const isPm = hours >= 12;
  let h12 = hours % 12;
  if (h12 === 0) h12 = 12;

  const hStr = String(h12).padStart(2, '0');
  const mStr = String(minutes).padStart(2, '0');
  const sStr = String(seconds).padStart(2, '0');
  const period = isPm ? 'م' : 'ص';

  if (withSeconds) {
    return `${hStr}:${mStr}:${sStr} ${period}`;
  }
  return `${hStr}:${mStr} ${period}`;
}
