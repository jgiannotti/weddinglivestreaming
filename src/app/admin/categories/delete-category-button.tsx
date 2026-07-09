'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Trash2, Loader2 } from 'lucide-react';

export function DeleteCategoryButton({ categoryId, disabled }: { categoryId: string; disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this category?')) return;
    setLoading(true);
    await fetch(`/api/admin/categories/${categoryId}`, { method: 'DELETE' });
    router.refresh();
    setLoading(false);
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDelete}
      disabled={disabled || loading}
      title={disabled ? 'Cannot delete — listings use this category' : 'Delete category'}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Delete
    </Button>
  );
}
