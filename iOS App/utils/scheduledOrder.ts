export type SlotPeriod = 'lunch' | 'dinner';

export interface TimeSlot {
  label: string;
  value: string;
  disabled: boolean;
  period: SlotPeriod;
}

export function generateTimeSlots(): TimeSlot[] {
  const now = new Date();
  const bufferMs = 60 * 60 * 1000;
  const cutoffMs = now.getTime() + bufferMs;

  const slots: TimeSlot[] = [];
  const ranges: { period: SlotPeriod; startHour: number; startMin: number; endHour: number; endMin: number }[] = [
    { period: 'lunch', startHour: 12, startMin: 0, endHour: 15, endMin: 0 },
    { period: 'dinner', startHour: 19, startMin: 0, endHour: 26, endMin: 0 },
  ];

  for (const range of ranges) {
    const startTotal = range.startHour * 60 + range.startMin;
    const endTotal = range.endHour * 60 + range.endMin;

    let slotStart = startTotal;
    while (slotStart + 30 <= endTotal) {
      const slotEnd = slotStart + 30;
      const startHours = Math.floor(slotStart / 60) % 24;
      const startMins = slotStart % 60;
      const endHours = Math.floor(slotEnd / 60) % 24;
      const endMins = slotEnd % 60;

      const pad = (n: number) => String(n).padStart(2, '0');
      const label = `${pad(startHours)}:${pad(startMins)} - ${pad(endHours)}:${pad(endMins)}`;

      const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHours, startMins);
      if (slotStart >= 24 * 60) {
        slotDate.setDate(slotDate.getDate() + 1);
      }

      const slotTime = slotDate.getTime();
      const disabled = slotTime <= cutoffMs;

      slots.push({
        label,
        value: slotDate.toISOString(),
        disabled,
        period: range.period,
      });

      slotStart = slotEnd;
    }
  }

  slots.sort((a, b) => new Date(a.value).getTime() - new Date(b.value).getTime());
  return slots;
}
