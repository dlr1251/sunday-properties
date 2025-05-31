'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import DashboardLayout from '@/app/dashboard/layout';

const initialProfile = {
  full_name: '',
  document_type: '',
  document_number: '',
  nationality: '',
  date_of_birth: '',
  phone_number: '',
  physical_address: '',
  bank_account_details: '',
  payment_methods: '',
  verification_status: 'pending',
  verification_level: 'none',
  roles: [],
};

function getProfileCompletion(profile: any) {
  const fields = [
    'full_name',
    'document_type',
    'document_number',
    'nationality',
    'date_of_birth',
    'phone_number',
    'physical_address',
  ];
  const completed = fields.filter((f) => profile?.[f]);
  return Math.round((completed.length / fields.length) * 100);
}

export default function ProfilePage() {
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let subscription: any;
    const fetchProfile = async () => {
      console.log('🔍 Fetching user profile...');
      const { data: { user } } = await supabase.auth.getUser();
      console.log('👤 Current user:', user?.id);
      
      if (!user) {
        console.log('❌ No user found');
        return setLoading(false);
      }
      
      setUserId(user.id);
      const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      console.log('📊 Profile data:', data);
      console.log('❌ Profile error:', error);
      
      if (data) {
        console.log('✅ Setting profile data');
        setProfile(data);
      }
      setLoading(false);

      // Real-time subscription
      console.log('🔄 Setting up real-time subscription for profile changes');
      subscription = supabase
        .channel('public:profiles')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
          (payload) => {
            console.log('📡 Real-time update received:', payload);
            if (payload.new) {
              console.log('🔄 Updating profile with new data:', payload.new);
              setProfile({ ...initialProfile, ...payload.new });
            }
          }
        )
        .subscribe();
    };
    fetchProfile();

    return () => {
      if (subscription) {
        console.log('🧹 Cleaning up subscription');
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('✏️ Field changed:', e.target.name, e.target.value);
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSelectChange = (name: string, value: string) => {
    console.log('✏️ Select changed:', name, value);
    setProfile({ ...profile, [name]: value });
    setSaved(false);
  };

  const handleSave = async () => {
    console.log('💾 Saving profile...', profile);
    setLoading(true);
    setSaved(false);
    
    if (!userId) {
      console.log('❌ No user ID found, cannot save');
      return setLoading(false);
    }

    try {
      // Ensure verification_level is valid
      const profileToSave = {
        ...profile,
        verification_level: profile.verification_level || 'none',
        verification_status: profile.verification_status || 'pending'
      };

      // First check if the profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      console.log('🔍 Checking existing profile:', { existingProfile, checkError });

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('profiles')
          .update(profileToSave)
          .eq('id', userId)
          .select();
      } else {
        // Insert new profile
        result = await supabase
          .from('profiles')
          .insert([{ ...profileToSave, id: userId }])
          .select();
      }

      console.log('📊 Save response:', result);

      if (result.error) {
        console.error('❌ Error saving profile:', result.error);
        throw result.error;
      }

      console.log('✅ Profile saved successfully:', result.data);
      setSaved(true);
    } catch (error) {
      console.error('❌ Error in save operation:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Cargando...</div>;

  return (
    <DashboardLayout>
      <Card className="max-w-2xl mx-auto mt-12 shadow-lg border-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Perfil de usuario</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Consulta y edita tus datos personales.
          </CardDescription>
          <Progress value={getProfileCompletion(profile)} className="mt-4" />
          <div className="text-xs text-muted-foreground mt-1 text-center">{getProfileCompletion(profile)}% completado</div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={e => e.preventDefault()}>
            <Input
              name="full_name"
              value={profile.full_name}
              onChange={handleChange}
              placeholder="Nombre completo"
              className="w-full"
              required
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                value={profile.document_type}
                onValueChange={(val) => handleSelectChange('document_type', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cedula_ciudadania">Cédula de Ciudadanía</SelectItem>
                  <SelectItem value="passport">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
              <Input
                name="document_number"
                value={profile.document_number}
                onChange={handleChange}
                placeholder="Número de documento"
                className="w-full"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="nationality"
                value={profile.nationality}
                onChange={handleChange}
                placeholder="Nacionalidad"
                className="w-full"
                required
              />
              <Input
                type="date"
                name="date_of_birth"
                value={profile.date_of_birth}
                onChange={handleChange}
                className="w-full"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="phone_number"
                value={profile.phone_number}
                onChange={handleChange}
                placeholder="Teléfono"
                className="w-full"
                required
              />
              <Input
                name="physical_address"
                value={profile.physical_address}
                onChange={handleChange}
                placeholder="Dirección física"
                className="w-full"
                required
              />
            </div>
            <Input
              name="bank_account_details"
              value={profile.bank_account_details || ''}
              onChange={handleChange}
              placeholder="Detalles de cuenta bancaria"
              className="w-full"
            />
            <Input
              name="payment_methods"
              value={profile.payment_methods || ''}
              onChange={handleChange}
              placeholder="Métodos de pago"
              className="w-full"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="verification_status"
                value={profile.verification_status || ''}
                onChange={handleChange}
                placeholder="Estado de verificación"
                className="w-full"
                disabled
              />
              <Input
                name="verification_level"
                value={profile.verification_level || ''}
                onChange={handleChange}
                placeholder="Nivel de verificación"
                className="w-full"
                disabled
              />
            </div>
            <Input
              name="roles"
              value={Array.isArray(profile.roles) ? profile.roles.join(', ') : profile.roles || ''}
              onChange={handleChange}
              placeholder="Roles"
              className="w-full"
              disabled
            />
            <div className="flex justify-end mt-6">
              <Button onClick={handleSave} disabled={loading}>
                Guardar cambios
              </Button>
              {saved && <span className="text-green-600 text-sm ml-4">¡Guardado!</span>}
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}