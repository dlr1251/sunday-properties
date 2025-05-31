import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function OwnerPanel({
  property,
  onSaveDescription,
  onSaveMinConditions,
  onCreateOwnerOffer,
}: {
  property: any;
  onSaveDescription: (desc: string) => void;
  onSaveMinConditions: (min: { price: number; timing: string; conditions: string }) => void;
  onCreateOwnerOffer: (offer: { price: number; timing: string; conditions: string }) => void;
}) {
  const [desc, setDesc] = useState(property.description || '');
  const [minPrice, setMinPrice] = useState(property.min_price || '');
  const [minTiming, setMinTiming] = useState(property.min_timing || '');
  const [minCond, setMinCond] = useState(property.min_conditions || '');
  const [offerPrice, setOfferPrice] = useState('');
  const [offerTiming, setOfferTiming] = useState('');
  const [offerCond, setOfferCond] = useState('');

  return (
    <div className="space-y-6">
      {/* Edit Description */}
      <Card>
        <CardHeader>
          <CardTitle>Edit Description</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full"
          />
          <Button className="mt-2" onClick={() => onSaveDescription(desc)}>
            Save Description
          </Button>
        </CardContent>
      </Card>
      {/* Minimum Conditions */}
      <Card>
        <CardHeader>
          <CardTitle>Minimum Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            type="number"
            placeholder="Minimum Price"
            value={minPrice}
            onChange={e => setMinPrice(e.target.value)}
          />
          <Input
            placeholder="Minimum Timing (e.g. closing date)"
            value={minTiming}
            onChange={e => setMinTiming(e.target.value)}
          />
          <Input
            placeholder="Other Conditions"
            value={minCond}
            onChange={e => setMinCond(e.target.value)}
          />
          <Button className="mt-2" onClick={() => onSaveMinConditions({ price: Number(minPrice), timing: minTiming, conditions: minCond })}>
            Save Minimum Conditions
          </Button>
        </CardContent>
      </Card>
      {/* Owner Offer */}
      <Card>
        <CardHeader>
          <CardTitle>Create Owner Offer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Input
            type="number"
            placeholder="Offer Price"
            value={offerPrice}
            onChange={e => setOfferPrice(e.target.value)}
          />
          <Input
            placeholder="Offer Timing"
            value={offerTiming}
            onChange={e => setOfferTiming(e.target.value)}
          />
          <Input
            placeholder="Offer Conditions"
            value={offerCond}
            onChange={e => setOfferCond(e.target.value)}
          />
          <Button className="mt-2" onClick={() => onCreateOwnerOffer({ price: Number(offerPrice), timing: offerTiming, conditions: offerCond })}>
            Create Owner Offer
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 