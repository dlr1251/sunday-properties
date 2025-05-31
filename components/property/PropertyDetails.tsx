import { BedDouble, Bath, Car, Calendar } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function PropertyDetails({ bedrooms, bathrooms, parking_spots, created_at, description, area }: {
  bedrooms: number;
  bathrooms: number;
  parking_spots: number;
  created_at: string;
  description: string;
  area: number;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-2">
          <BedDouble className="w-4 h-4 text-muted-foreground" />
          <span>{bedrooms} Bedrooms</span>
        </div>
        <div className="flex items-center gap-2">
          <Bath className="w-4 h-4 text-muted-foreground" />
          <span>{bathrooms} Bathrooms</span>
        </div>
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-muted-foreground" />
          <span>{parking_spots} Parking</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span>{new Date(created_at).toLocaleDateString()}</span>
        </div>
      </div>
      <Separator />
      <div className="space-y-2">
        <h3 className="font-semibold">Description</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-2">
        <h3 className="font-semibold">Area</h3>
        <p className="text-muted-foreground">{area} m²</p>
      </div>
    </div>
  );
} 