import { createClient } from '@/lib/supabase/server';
import { CategoryForm } from './category-form';
import { DeleteCategoryButton } from './delete-category-button';

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, sort_order')
    .order('sort_order', { ascending: true });

  const { data: links } = await supabase.from('listing_categories').select('category_id');
  const usedCategoryIds = new Set((links ?? []).map((l: any) => l.category_id));

  return (
    <div>
      <h1 className="font-display text-3xl md:text-4xl font-medium mb-2">Categories</h1>
      <p className="text-muted-foreground mb-8">Vendor service-type categories shown across the site.</p>

      <CategoryForm />

      {!categories || categories.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-10 text-center text-muted-foreground">
          No categories yet.
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-x-auto">
          <table className="w-full text-sm" aria-label="Categories">
            <thead>
              <tr className="border-b bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">In use</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c: any) => {
                const inUse = usedCategoryIds.has(c.id);
                return (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inUse ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      <DeleteCategoryButton categoryId={c.id} disabled={inUse} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
