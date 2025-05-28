// DeleteModal.tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useModal } from "@/context/ModalProvider";

const DeleteModal = () => {
  const { closeModal } = useModal();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, backdropFilter: "blur(4px)" }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeModal} />
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 p-6 w-full max-w-md"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
          <p className="text-sm text-gray-500 dark:text-gray-300 mb-4">
            Are you sure you want to delete your account?
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              className="px-4 py-2 text-sm rounded-lg border dark:border-gray-600 text-gray-600 dark:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // perform delete logic here
                closeModal();
              }}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Yes, delete
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DeleteModal;
