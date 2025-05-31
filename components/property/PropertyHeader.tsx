import { MapPin } from 'lucide-react';

export function PropertyHeader({ title, address, neighborhood, city }: { title: string; address: string; neighborhood: string; city: string }) {
  return (
    <div className="space-y-2">
      <h1 className="text-3xl font-bold">{title}</h1>
      <div className="flex items-center gap-2 text-muted-foreground">
        <MapPin className="w-4 h-4" />
        <span>{address}, {neighborhood}, {city}</span>
      </div>
    </div>
  );
} 