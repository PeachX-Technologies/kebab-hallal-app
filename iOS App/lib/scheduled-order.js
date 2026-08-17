export function generateTimeSlots() {
  const now = new Date();
  const bufferMs = 60 * 60 * 1000;
  const cutoffMs = now.getTime() + bufferMs;

  const slots = [];
  const ranges = [
    { startHour: 12, startMin: 0, endHour: 15, endMin: 0 },
    { startHour: 19, startMin: 0, endHour: 26, endMin: 0 },
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

      const pad = (n) => String(n).padStart(2, '0');
      const label = `${pad(startHours)}:${pad(startMins)} - ${pad(endHours)}:${pad(endMins)}`;

      const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHours, startMins);
      if (range.startHour >= 24) {
        slotDate.setDate(slotDate.getDate() + 1);
      }

      const slotTime = slotDate.getTime();
      const disabled = slotTime <= cutoffMs;

      slots.push({
        label,
        value: slotDate.toISOString(),
        disabled,
      });

      slotStart = slotEnd;
    }
  }

  slots.sort((a, b) => new Date(a.value).getTime() - new Date(b.value).getTime());
  return slots;
}
