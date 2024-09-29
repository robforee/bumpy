// src/components/ui/dialog.jsx
import React, { useEffect, useRef } from 'react';
import { Button } from '@/src/components/ui/button';

export const Dialog = ({ open, onOpenChange, children, hasChanges = false }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !hasChanges) {
        onOpenChange(false);
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange, hasChanges]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div ref={dialogRef} className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[85vh] overflow-auto">
        {children}
      </div>
    </div>
  );
};

export const DialogContent = ({ children }) => {
  return <div className="p-6">{children}</div>;
};

export const DialogHeader = ({ children }) => {
  return <div className="mb-4">{children}</div>;
};

export const DialogTitle = ({ children }) => {
  return <h2 className="text-lg font-semibold">{children}</h2>;
};

export const DialogFooter = ({ children }) => {
  return <div className="mt-6 flex justify-end space-x-2">{children}</div>;
};

export const DialogClose = ({ onClick, children }) => {
  return (
    <button
      onClick={onClick}
      className="text-gray-500 hover:text-gray-700 focus:outline-none"
    >
      {children}
    </button>
  );
};

export const DeleteConfirmationDialog = ({ isOpen, onClose, onConfirm }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <p>Are you sure you want to delete this topic?</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};