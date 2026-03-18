// --- E2EE Conversation Key Management (Demo) ---
// In production, use secure key exchange and storage!

import { axiosInstance } from "./axios";

// Save a base64-encoded AES key for a conversation
export function setConversationKey(conversationId, base64Key) {
  localStorage.setItem(`convkey_${conversationId}`, base64Key);
}

// Retrieve and import the AES key for a conversation
export async function getConversationKey(conversationId) {
  let base64Key = localStorage.getItem(`convkey_${conversationId}`);
  if (!base64Key) {
    // Fetch conversation from backend
    try {
      const res = await axiosInstance.get(`/conversations/convForEncryptionKey/${conversationId}`);
      if (!res.data) throw new Error("Failed to fetch conversation key");
      const conv = res.data;
      base64Key = conv.encryptionKey;
      if (!base64Key) throw new Error("No encryption key in conversation");
      setConversationKey(conversationId, base64Key);
    } catch (err) {
      throw new Error("No key for this conversation");
    }
  }
  const raw = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return window.crypto.subtle.importKey(
    "raw",
    raw,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
}
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

export async function encryptMessage(plaintext, key) {
  const enc = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );
  return {
    iv: Array.from(iv),
    ciphertext: Array.from(new Uint8Array(ciphertext)),
  };
}

export async function decryptMessage({ iv, ciphertext }, key) {
  const dec = new TextDecoder();
  let decrypted;
  try {
    decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(iv) },
      key,
      new Uint8Array(ciphertext)
    );
  } catch (err) {
    console.error("decryptMessage error:", err);
    return "[Decryption failed]";
  }
  const decoded = dec.decode(decrypted);
  return decoded;
}

// Helper to import a base64 key
export async function importAesKey(base64Key) {
  const raw = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0));
  return window.crypto.subtle.importKey(
    "raw",
    raw,
    "AES-GCM",
    true,
    ["encrypt", "decrypt"]
  );
}
