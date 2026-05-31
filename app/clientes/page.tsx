'use client';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ClienteModal from '@/components/ClienteModal';
import type { Cliente } from '@/types';
import { Users, PlusCircle, Search, Phone, Mail, MapPin } from 'lucide-react';

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [busca, setBusca] = useState('');

  useEffect(() => { fetchClientes(); }, []);

  async function fetchClientes() {
    setLoading(true);
    try {
      const res = await fetch('/api/clientes');
      if (res.ok) setClientes(await res.json());
    } catch {}
    setLoading(false);
  }

  const filtrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.telefone.includes(busca) ||
      (c.email ?? '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500 text-sm mt-1">{clientes.length} cliente(s) cadastrado(s)</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <PlusCircle className="w-4 h-4" />
          Novo Cliente
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-10"
              placeholder="Buscar por nome, telefone ou email..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum cliente encontrado.</p>
          <Button className="mt-4" onClick={() => setModalOpen(true)}>
            Cadastrar Primeiro Cliente
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtrados.map((cliente) => (
            <Card key={cliente.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 font-bold text-sm">
                      {cliente.nome.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{cliente.nome}</p>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{cliente.telefone}</span>
                      </div>
                      {cliente.email && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{cliente.email}</span>
                        </div>
                      )}
                      {cliente.endereco && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="truncate">{cliente.endereco}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ClienteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={(c) => setClientes((prev) => [c, ...prev])}
      />
    </div>
  );
}
