import { Suspense } from 'react';
import { BannersTab } from '@/components/banners/BannersTab';

export default function Page() {
  return (
    <Suspense>
      <BannersTab />
    </Suspense>
  );
}
