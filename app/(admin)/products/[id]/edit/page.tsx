import { ProductFormRoute } from '@/components/products/ProductFormRoute';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductFormRoute productId={id} />;
}
