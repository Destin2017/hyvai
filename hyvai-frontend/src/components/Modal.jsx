import React from "react";

const Modal = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-md shadow-md max-w-sm text-center">
        <h2 className="text-lg font-semibold text-red-600">🚫 Warning</h2>
        <p className="text-gray-700 mt-2">{message}</p>
        <button
          className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Modal;
