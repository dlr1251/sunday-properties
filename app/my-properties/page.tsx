"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Property {
  id: string;
  title: string;
  created_at: string;
}

export default function MyPropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('User:', user);
      if (userError) {
        console.error('User fetch error:', userError);
      }
      if (!user) {
        setProperties([]);
        setLoading(false);
        console.log('No user found');
        return;
      }
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      console.log('Properties data:', data);
      if (error) {
        console.error('Properties fetch error:', error);
        setProperties([]);
      } else {
        setProperties(data || []);
      }
      setLoading(false);
    };
    fetchProperties();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">My Estate</h1>
        <Link href="/property/new">
          <Button>Create Property</Button>
        </Link>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Uploaded Properties</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6">Cargando...</div>
          ) : properties.length === 0 ? (
            <div className="p-6 text-muted-foreground">No has creado ninguna propiedad aún.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-muted sticky top-0 z-10">
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Fecha de creación</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {properties.map((property, idx) => (
                    <TableRow key={property.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-muted'}>
                      <TableCell className="font-medium">{property.title}</TableCell>
                   
                      <TableCell>{new Date(property.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Link href={`/property/${encodeURIComponent(property.id)}`}>
                          <Button size="sm" variant="outline">Ver Detalles</Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 