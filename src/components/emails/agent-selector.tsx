'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Briefcase, User } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  avatarColor: string;
  specialties: string[];
}

interface AgentSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function AgentSelector({ value, onChange, disabled }: AgentSelectorProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/config/status');
        const data = await response.json();
        
        if (data.success && data.data?.agents?.list) {
          setAgents(data.data.agents.list);
        }
      } catch (error) {
        console.error('Error fetching agents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAgents();
  }, []);

  const selectedAgent = agents.find(a => a.id === value);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Carregando agentes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <User className="h-4 w-4" />
        Agente Remetente
      </Label>
      
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o agente" />
        </SelectTrigger>
        <SelectContent>
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              <div className="flex items-center gap-2">
                <span>{agent.avatar}</span>
                <span>{agent.name}</span>
                <span className="text-muted-foreground text-xs">({agent.role})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Selected Agent Info Card */}
      {selectedAgent && (
        <Card className="bg-muted/30">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <Avatar className={`h-10 w-10 ${selectedAgent.avatarColor}`}>
                <AvatarFallback className={`${selectedAgent.avatarColor} text-white text-lg`}>
                  {selectedAgent.avatar}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{selectedAgent.name}</p>
                  <Badge variant="outline" className="text-xs">
                    {selectedAgent.role}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{selectedAgent.email}</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedAgent.specialties.slice(0, 3).map((specialty, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Agent Card for display
export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className={`h-12 w-12 ${agent.avatarColor}`}>
            <AvatarFallback className={`${agent.avatarColor} text-white text-xl`}>
              {agent.avatar}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{agent.name}</p>
            </div>
            <p className="text-sm text-muted-foreground">{agent.role}</p>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Mail className="h-3 w-3" />
              <span className="truncate">{agent.email}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
