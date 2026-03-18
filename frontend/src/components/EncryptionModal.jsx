import { useState, useEffect } from 'react';

export default function EncryptionModal({ isOpen, onClose }) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isAnimating) return null;

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4 transition-all duration-300 ease-in-out ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          End-to-End Encryption
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-3">
          <p>
            Your messages are protected with end-to-end encryption, meaning only you and the recipient can read them.
          </p>
          <p>
            <strong>How it works:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Each conversation has a unique encryption key</li>
            <li>Messages are encrypted before sending and decrypted only on your device</li>
            <li>Not even the server can read your messages</li>
            <li>Keys are securely managed and stored locally</li>
          </ul>
          <p>
            This ensures your conversations remain private and secure.
          </p>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}