'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, MapPin, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { EventMap } from '@/components/ui/event-map';
import api from '@/lib/api';
import { toast } from 'sonner';

export function EventDialog({ open, onOpenChange, event, onSave, isPending }) {
  const [formData, setFormData] = useState({
    type: 'together',
    name: '',
    description: '',
    date: '',
    time: '',
    location: {
      address: '',
      city: '',
      state: ''
    },
    hpointsRedemptionAvailable: false,
    hpointsRequired: 0
  });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState(null);

  useEffect(() => {
    if (event) {
      setFormData({
        type: event.type || 'together',
        name: event.name || '',
        description: event.description || '',
        date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
        time: event.time || '',
        location: event.location || { address: '', city: '', state: '', coordinates: null },
        hpointsRedemptionAvailable: event.hpointsRedemptionAvailable || false,
        hpointsRequired: event.hpointsRequired || 0
      });
      setGeocodeError(null);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setFormData({
        type: 'together',
        name: '',
        description: '',
        date: tomorrow.toISOString().split('T')[0],
        time: '',
        location: { address: '', city: '', state: '', coordinates: null },
        hpointsRedemptionAvailable: false,
        hpointsRequired: 0
      });
      setGeocodeError(null);
    }
  }, [event, open]);

  const handleGeocode = async () => {
    const { address, city, state } = formData.location;
    
    if (!address || !city || !state) {
      toast.error('Preencha endereço, cidade e estado antes de buscar a localização');
      return;
    }

    setIsGeocoding(true);
    setGeocodeError(null);

    try {
      const response = await api.get('/events/geocode', {
        params: { address, city, state }
      });

      if (response.data.success && response.data.data.coordinates) {
        const { coordinates, relevance, accuracy, placeName } = response.data.data;
        
        setFormData({
          ...formData,
          location: {
            ...formData.location,
            coordinates
          }
        });
        
        // Aviso se a relevância for baixa
        if (relevance && relevance < 0.5) {
          toast.warning(`Localização encontrada com baixa precisão (${(relevance * 100).toFixed(0)}%). Verifique se está correto.`, {
            duration: 5000
          });
        } else {
          toast.success('Localização encontrada! Verifique o mapa abaixo.');
        }
        
        // Log para debug
        if (placeName && placeName !== `${formData.location.address}, ${formData.location.city}, ${formData.location.state}`) {
          console.log('Nome completo do lugar:', placeName);
        }
      } else {
        throw new Error('Localização não encontrada');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Não foi possível encontrar a localização. Verifique o endereço informado.';
      setGeocodeError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Aviso se não houver coordenadas (mas permite salvar mesmo assim)
    if (!formData.location?.coordinates?.lat || !formData.location?.coordinates?.lng) {
      const shouldContinue = confirm(
        'A localização não foi confirmada no mapa. O sistema tentará encontrar automaticamente ao salvar, mas pode não ser preciso.\n\n' +
        'Deseja continuar mesmo assim?'
      );
      if (!shouldContinue) {
        return;
      }
    }

    onSave({
      ...formData,
      date: new Date(`${formData.date}T${formData.time}`)
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{event ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          <DialogDescription>
            {event ? 'Atualize as informações do evento' : 'Preencha os dados do novo evento'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-white"
              disabled={isPending}
            >
              <option value="together">Together</option>
              <option value="race">Corrida</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-zinc-950 border-zinc-800"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-zinc-950 border-zinc-800"
              disabled={isPending}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                min={new Date().toISOString().split('T')[0]}
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Hora *</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending}
              />
            </div>
          </div>
          <div className="space-y-4 border-t border-zinc-800 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Localização *</h3>
              {formData.location?.coordinates?.lat && formData.location?.coordinates?.lng && (
                <div className="flex items-center gap-1 text-xs text-green-500">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Localização confirmada</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              <Input
                id="address"
                value={formData.location.address}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    location: { ...formData.location, address: e.target.value, coordinates: null }
                  });
                  setGeocodeError(null);
                }}
                required
                className="bg-zinc-950 border-zinc-800"
                disabled={isPending}
                placeholder="Ex: Rua das Flores, 123"
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={formData.location.city}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      location: { ...formData.location, city: e.target.value, coordinates: null }
                    });
                    setGeocodeError(null);
                  }}
                  required
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                  placeholder="Ex: São Paulo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={formData.location.state}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      location: { ...formData.location, state: e.target.value, coordinates: null }
                    });
                    setGeocodeError(null);
                  }}
                  required
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                  placeholder="Ex: SP"
                  maxLength={2}
                />
              </div>
            </div>
            
            {/* Botão para buscar localização */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGeocode}
              disabled={isPending || isGeocoding || !formData.location.address || !formData.location.city || !formData.location.state}
              className="w-full"
            >
              {isGeocoding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando localização...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar Localização no Mapa
                </>
              )}
            </Button>

            {/* Mensagem de erro */}
            {geocodeError && (
              <div className="flex items-start gap-2 p-3 bg-red-950/30 border border-red-800/50 rounded-lg text-sm text-red-400">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Localização não encontrada</p>
                  <p className="text-xs text-red-500 mt-1">{geocodeError}</p>
                  <p className="text-xs text-red-500 mt-1">
                    Verifique se o endereço está correto ou tente ser mais específico (inclua número, bairro, etc).
                  </p>
                </div>
              </div>
            )}

            {/* Preview do mapa se houver coordenadas */}
            {formData.location?.coordinates?.lat && formData.location?.coordinates?.lng && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Preview do Mapa - Verifique se está correto
                </Label>
                <div className="w-full h-64 rounded-xl overflow-hidden border-2 border-green-500/30">
                  <EventMap
                    lat={formData.location.coordinates.lat}
                    lng={formData.location.coordinates.lng}
                    name={formData.name || 'Localização'}
                    address={formData.location.address ? `${formData.location.address}, ${formData.location.city}, ${formData.location.state}` : ''}
                    zoom={15}
                  />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <p className="text-zinc-500">
                    Coordenadas: {formData.location.coordinates.lat.toFixed(6)}, {formData.location.coordinates.lng.toFixed(6)}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        location: { ...formData.location, coordinates: null }
                      });
                    }}
                    className="h-auto py-1 text-xs text-zinc-400 hover:text-white"
                  >
                    Limpar
                  </Button>
                </div>
                <p className="text-xs text-green-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Localização confirmada. O mapa será exibido corretamente ao salvar o evento.
                </p>
              </div>
            )}
          </div>
          <div className="space-y-4 border-t border-zinc-800 pt-4">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hpointsRedemptionAvailable}
                  onChange={(e) => setFormData({ ...formData, hpointsRedemptionAvailable: e.target.checked })}
                  disabled={isPending}
                  className="w-4 h-4"
                />
                <span className="text-sm">Permitir resgate com HPoints</span>
              </label>
            </div>
            {formData.hpointsRedemptionAvailable && (
              <div className="space-y-2">
                <Label htmlFor="hpointsRequired">HPoints Necessários</Label>
                <Input
                  id="hpointsRequired"
                  type="number"
                  min="0"
                  value={formData.hpointsRequired}
                  onChange={(e) => setFormData({ ...formData, hpointsRequired: parseInt(e.target.value) || 0 })}
                  className="bg-zinc-950 border-zinc-800"
                  disabled={isPending}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
