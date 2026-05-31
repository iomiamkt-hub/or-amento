'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import type { Cliente } from '@/types';

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório'),
  telefone: z.string().min(8, 'Telefone obrigatório'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  endereco: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (cliente: Cliente) => void;
}

export default function ClienteModal({ open, onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      const cliente = await res.json();
      onSaved(cliente);
      reset();
      onClose();
    } catch {
      alert('Erro ao salvar cliente');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input placeholder="Nome completo" {...register('nome')} />
            {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <Label>Telefone *</Label>
            <Input placeholder="(11) 99999-9999" {...register('telefone')} />
            {errors.telefone && <p className="text-red-500 text-xs mt-1">{errors.telefone.message}</p>}
          </div>
          <div>
            <Label>E-mail</Label>
            <Input type="email" placeholder="email@exemplo.com" {...register('email')} />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <Label>Endereço</Label>
            <Input placeholder="Rua, número, bairro, cidade" {...register('endereco')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
