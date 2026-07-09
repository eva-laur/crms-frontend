function formatDate(dateInput) {
  const date = new Date(dateInput);

  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");

  return `${yyyy}${mm}${dd}T${hh}${min}${ss}Z`;
}

export function generateICS(bookings = []) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Campus MRS//EN",
  ];

  bookings.forEach((booking) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${booking._id}@campusmrs`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(booking.startTime)}`,
      `DTEND:${formatDate(booking.endTime)}`,
      `SUMMARY:${booking.purpose}`,
      `DESCRIPTION:Booking for ${booking.resource?.name || "Resource"}`,
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");

  return lines.join("\r\n");
}
export default { generateICS };