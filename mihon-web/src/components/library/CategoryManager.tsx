"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pencil, Trash2, Check, X } from "lucide-react";

interface CategoryManagerProps {
  categories: string[];
  onUpdate: (categories: string[]) => void;
  onClose: () => void;
}

export function CategoryManager({
  categories,
  onUpdate,
  onClose,
}: CategoryManagerProps) {
  const [newCategory, setNewCategory] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");

  const handleAdd = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      onUpdate([...categories, trimmed]);
      setNewCategory("");
    }
  };

  const handleDelete = (index: number) => {
    const updated = categories.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(categories[index]);
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const trimmed = editValue.trim();
    if (trimmed && !categories.includes(trimmed)) {
      const updated = [...categories];
      updated[editingIndex] = trimmed;
      onUpdate(updated);
    }
    setEditingIndex(null);
    setEditValue("");
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Manage Categories"
      footer={
        <Button variant="secondary" onClick={onClose}>
          Done
        </Button>
      }
    >
      {/* Add new category */}
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="New category name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
        />
        <Button onClick={handleAdd} size="md">
          Add
        </Button>
      </div>

      {/* Category list */}
      <div className="max-h-64 overflow-y-auto space-y-2">
        {categories.length === 0 ? (
          <p className="text-sm text-zinc-500 text-center py-4">
            No categories yet. Add one above.
          </p>
        ) : (
          categories.map((category, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/50 px-3 py-2"
            >
              {editingIndex === index ? (
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEdit();
                    if (e.key === "Escape") cancelEdit();
                  }}
                  className="h-8 text-sm"
                  autoFocus
                />
              ) : (
                <span className="flex-1 text-sm text-zinc-100">{category}</span>
              )}
              <div className="flex items-center gap-1">
                {editingIndex === index ? (
                  <>
                    <button
                      onClick={saveEdit}
                      className="text-green-400 hover:text-green-300 transition-colors p-1"
                      aria-label="Save edit"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="text-zinc-400 hover:text-zinc-100 transition-colors p-1"
                      aria-label="Cancel edit"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(index)}
                      className="text-zinc-400 hover:text-zinc-100 transition-colors p-1"
                      aria-label={`Edit ${category}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="text-zinc-400 hover:text-red-400 transition-colors p-1"
                      aria-label={`Delete ${category}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </Modal>
  );
}
