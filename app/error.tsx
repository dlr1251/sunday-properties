'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">Something went wrong!</h1>
      <p className="mt-4 text-lg">An error occurred while processing your request</p>
      <div className="mt-8 flex gap-4">
        <Button
          onClick={() => reset()}
        >
          Try again
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/')}
        >
          Go back home
        </Button>
      </div>
    </div>
  );
} 