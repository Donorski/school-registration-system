import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ size = 'md' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex items-center justify-center p-8">
      <Loader2 className={`${sizes[size]} animate-spin text-emerald-600`} />
    </div>
  );
}
