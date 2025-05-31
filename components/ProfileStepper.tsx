'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, User, IdCard, Phone, Banknote } from 'lucide-react';

const steps = [
  { label: 'Personal', icon: User },
  { label: 'Identidad', icon: IdCard },
  { label: 'Contacto', icon: Phone },
  { label: 'Cuenta', icon: Banknote },
];

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

export default function ProfileStepper() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setLoading(false);
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSelectChange = (name: string, value: string) => {
    setProfile({ ...profile, [name]: value });
    setSaved(false);
  };

  const handleNext = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setLoading(false);
    await supabase.from('profiles').update(profile).eq('id', user.id);
    setLoading(false);
    setSaved(true);
  };

  if (loading) return <div className="flex justify-center items-center h-64">Cargando...</div>;

  return (
    <Card className="max-w-2xl mx-auto mt-12 shadow-lg border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold text-center">Completa tu perfil</CardTitle>
        <CardDescription className="text-center text-muted-foreground">
          Completa los pasos para mejorar tu experiencia y seguridad.
        </CardDescription>
        <div className="flex justify-center mt-6 mb-2">
          {steps.map((stepObj, idx) => {
            const Icon = stepObj.icon;
            const isActive = idx === step;
            const isCompleted = idx < step;
            return (
              <div key={stepObj.label} className="flex items-center">
                <div
                  className={`flex flex-col items-center transition-all duration-200 ${
                    isActive ? 'text-primary' : isCompleted ? 'text-green-500' : 'text-muted-foreground'
                  }`}
                >
                  <div className={`rounded-full border-2 w-10 h-10 flex items-center justify-center mb-1
                    ${isActive ? 'border-primary bg-primary/10' : isCompleted ? 'border-green-500 bg-green-100' : 'border-muted'}`}>
                    {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <span className="text-xs font-medium">{stepObj.label}</span>
                </div>
                {idx < steps.length - 1 && (
                  <div className="w-8 h-1 bg-muted mx-2 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
        <Progress value={getProfileCompletion(profile)} className="mt-2" />
        <div className="text-xs text-muted-foreground mt-1 text-center">{getProfileCompletion(profile)}% completado</div>
      </CardHeader>
      <CardContent className="animate-fade-in space-y-6">
        <form className="space-y-4" onSubmit={e => e.preventDefault()}>
          {step === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                name="full_name"
                value={profile.full_name}
                onChange={handleChange}
                placeholder="Nombre completo"
                className="w-full"
                required
              />
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
          )}
          {step === 1 && (
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
          )}
          {step === 2 && (
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
          )}
          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          )}
        </form>
        <div className="flex justify-between items-center mt-6 gap-2">
          <Button variant="outline" onClick={handlePrev} disabled={step === 0}>
            Anterior
          </Button>
          {saved && <span className="text-green-600 text-sm">¡Guardado!</span>}
          {step < steps.length - 1 ? (
            <Button onClick={handleNext}>Siguiente</Button>
          ) : (
            <Button onClick={handleSave} disabled={loading}>
              Guardar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
// Animación fade-in (puedes poner esto en tu CSS global si usas Tailwind)
// @layer utilities {
//   .animate-fade-in {
//     animation: fadeIn 0.4s;
//   }
//   @keyframes fadeIn {
//     from { opacity: 0; transform: translateY(10px);}
//     to { opacity: 1; transform: none;}
//   }
// }