export function formatMessageTime(date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatLastSeen(isoString) {
  if (!isoString) return "Invalid date";

  const lastSeenDate = new Date(isoString);
  // Use a fixed "now" for consistent demonstration, but in a real app, you'd use new Date().
  // Current time is set to Saturday, August 23, 2025 at 11:36 PM in Bangladesh Standard Time (+06:00)
  const now = new Date("2025-08-23T23:36:00.000+06:00");

  // --- Time Formatting ---
  // Use Intl.DateTimeFormat for robust, locale-aware time formatting.
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const formattedTime = timeFormatter.format(lastSeenDate);

  // --- Date Comparison Logic ---
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );
  const startOfYesterday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - 1
  );
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() - now.getDay()
  );

  // Check if the date is today
  if (lastSeenDate >= startOfToday) {
    return `Today at ${formattedTime}`;
  }

  // Check if the date was yesterday
  if (lastSeenDate >= startOfYesterday) {
    return `Yesterday at ${formattedTime}`;
  }

  // Check if the date was within the last week
  if (lastSeenDate >= startOfWeek) {
    const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
    });
    const weekday = weekdayFormatter.format(lastSeenDate);
    return `${weekday} at ${formattedTime}`;
  }

  // --- Fallback for older dates ---
  // Format as DD/MM/YYYY
  const day = String(lastSeenDate.getDate()).padStart(2, "0");
  const month = String(lastSeenDate.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
  const year = lastSeenDate.getFullYear();
  return `${day}/${month}/${year}`;
}
