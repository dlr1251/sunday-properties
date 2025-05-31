'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, DollarSign, Users, Home, TrendingUp, Heart, Briefcase, Calendar, Clock, Target, BarChart3, Percent } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const [propertiesCount, setPropertiesCount] = useState(0);
  const [negotiationsCount, setNegotiationsCount] = useState(0);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [visitsCount, setVisitsCount] = useState(0);
  const [activeListings, setActiveListings] = useState(0);
  const [pendingOffers, setPendingOffers] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [avgResponseTime, setAvgResponseTime] = useState(0);
  
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [loadingNegotiations, setLoadingNegotiations] = useState(true);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Fetch basic counts
        setLoadingProperties(true);
        const { count: properties, error: propertiesError } = await supabase
          .from('properties')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (propertiesError) {
          console.error('Error fetching properties count:', propertiesError);
        } else {
          setPropertiesCount(properties || 0);
        }
        setLoadingProperties(false);

        setLoadingNegotiations(true);
        const { count: negotiations, error: negotiationsError } = await supabase
          .from('offers')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (negotiationsError) {
          console.error('Error fetching negotiations count:', negotiationsError);
        } else {
          setNegotiationsCount(negotiations || 0);
        }
        setLoadingNegotiations(false);

        // Simulate additional metrics for now
        setFavoritesCount(12);
        setLoadingFavorites(false);
        setVisitsCount(8);
        setLoadingVisits(false);
        setActiveListings(5);
        setLoadingListings(false);
        setPendingOffers(3);
        setLoadingOffers(false);
        setConversionRate(65);
        setAvgResponseTime(2.5);
        setLoadingMetrics(false);
      } else {
        setLoadingProperties(false);
        setLoadingNegotiations(false);
        setLoadingFavorites(false);
        setLoadingVisits(false);
        setLoadingListings(false);
        setLoadingOffers(false);
        setLoadingMetrics(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-8 p-8">
      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Properties</CardTitle>
            <Home className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingProperties ? '...' : propertiesCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Properties you own or manage
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Favorites</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingFavorites ? '...' : favoritesCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Properties you've favorited
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Visits</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingVisits ? '...' : visitsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Upcoming and past property visits
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Negotiations</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingNegotiations ? '...' : negotiationsCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Active and past negotiations
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Listings</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingListings ? '...' : activeListings}
            </div>
            <p className="text-xs text-muted-foreground">
              Currently active property listings
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Offers</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingOffers ? '...' : pendingOffers}
            </div>
            <p className="text-xs text-muted-foreground">
              Offers awaiting response
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingMetrics ? '...' : `${conversionRate}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              View to offer conversion rate
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingMetrics ? '...' : `${avgResponseTime}h`}
            </div>
            <p className="text-xs text-muted-foreground">
              Average response time to inquiries
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Market Insights and Activities */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Featured Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Luxury Penthouse', location: 'El Poblado', price: '$850,000', views: 245, days: 12 },
                { name: 'Modern Apartment', location: 'Laureles', price: '$320,000', views: 189, days: 8 },
                { name: 'Family Villa', location: 'Envigado', price: '$1.2M', views: 156, days: 15 },
              ].map((property, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{property.name}</p>
                    <p className="text-sm text-muted-foreground">{property.location}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {property.views} views
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {property.days}d ago
                    </div>
                    <div className="text-sm font-medium">{property.price}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'New Listing', property: 'Luxury Penthouse', price: '$850,000', time: '2h ago' },
                { type: 'Offer Received', property: 'Modern Apartment', price: '$310,000', time: '5h ago' },
                { type: 'Property Sold', property: 'Family Villa', price: '$1.15M', time: '1d ago' },
                { type: 'New View', property: 'Luxury Penthouse', views: '245', time: '2h ago' },
                { type: 'Price Update', property: 'Modern Apartment', price: '$320,000', time: '1d ago' },
              ].map((activity, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.type}</p>
                    <p className="text-sm text-muted-foreground">{activity.property}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {activity.time}
                    </div>
                    <div className="text-sm font-medium">
                      {activity.price || activity.views}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
