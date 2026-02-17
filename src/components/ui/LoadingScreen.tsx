import { cn } from '../../lib/utils';

interface LoadingScreenProps {
  message?: string;
  className?: string;
}

export function LoadingScreen({ 
  message = 'Loading...', 
  className 
}: LoadingScreenProps): React.ReactElement {
  return (
    <div 
      className={cn(
        'fixed inset-0 flex flex-col items-center justify-center',
        'bg-cport-navy',
        className
      )}
    >
      {/* Loading spinner */}
      <div className="relative mb-6">
        <div className="w-12 h-12 rounded-full border-2 border-cport-gray" />
        <div 
          className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-t-info-400 animate-spin"
        />
      </div>
      
      {/* Message */}
      <p className="text-body-sm text-cport-gray animate-pulse">
        {message}
      </p>
    </div>
  );
}
