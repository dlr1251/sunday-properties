'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-4 text-lg">Page not found</p>
      <Button
        className="mt-8"
        onClick={() => router.push('/')}
      >
        Go back home
      </Button>
    </div>
  );
} 