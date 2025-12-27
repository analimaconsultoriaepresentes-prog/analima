import { useState } from "react";
import { Store, Upload, Palette, Save, User, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const colorOptions = [
  { name: "Coral", value: "12 76% 61%" },
  { name: "Azul", value: "210 80% 55%" },
  { name: "Verde", value: "152 60% 45%" },
  { name: "Roxo", value: "270 60% 55%" },
  { name: "Rosa", value: "340 70% 55%" },
];

export default function Configuracoes() {
  const [storeName, setStoreName] = useState("Essência & Cia");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Personalize sua loja e preferências</p>
      </div>

      <Tabs defaultValue="loja" className="animate-slide-up">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="loja" className="gap-2">
            <Store className="w-4 h-4" />
            Loja
          </TabsTrigger>
          <TabsTrigger value="conta" className="gap-2">
            <User className="w-4 h-4" />
            Conta
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-2">
            <Bell className="w-4 h-4" />
            Alertas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="loja" className="mt-6 space-y-6">
          {/* Store Identity */}
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              Identidade da Loja
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="storeName">Nome da Loja</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="mt-1.5 input-styled"
                />
              </div>
              <div>
                <Label>Logo da Loja</Label>
                <div className="mt-1.5 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border">
                    <Store className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <Button variant="outline" className="gap-2">
                    <Upload className="w-4 h-4" />
                    Enviar Logo
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">PNG ou JPG, máximo 2MB</p>
              </div>
            </div>
          </div>

          {/* Theme */}
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              Cor Principal
            </h3>
            <div className="flex flex-wrap gap-3">
              {colorOptions.map((color) => (
                <button
                  key={color.name}
                  onClick={() => setSelectedColor(color.value)}
                  className={cn(
                    "w-12 h-12 rounded-xl transition-all duration-200",
                    selectedColor === color.value 
                      ? "ring-2 ring-offset-2 ring-foreground scale-110" 
                      : "hover:scale-105"
                  )}
                  style={{ backgroundColor: `hsl(${color.value})` }}
                  title={color.name}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Esta cor será usada nos elementos principais do sistema
            </p>
          </div>

          <Button className="btn-primary gap-2">
            <Save className="w-4 h-4" />
            Salvar Alterações
          </Button>
        </TabsContent>

        <TabsContent value="conta" className="mt-6 space-y-6">
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Dados Pessoais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input id="name" placeholder="Seu nome" className="mt-1.5 input-styled" />
              </div>
              <div>
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" className="mt-1.5 input-styled" />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(00) 00000-0000" className="mt-1.5 input-styled" />
              </div>
              <div>
                <Label htmlFor="cpf">CPF/CNPJ</Label>
                <Input id="cpf" placeholder="000.000.000-00" className="mt-1.5 input-styled" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Segurança
            </h3>
            <Button variant="outline">Alterar Senha</Button>
          </div>
        </TabsContent>

        <TabsContent value="notificacoes" className="mt-6 space-y-6">
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Configurar Alertas
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Estoque baixo</p>
                  <p className="text-sm text-muted-foreground">Alertar quando produto tiver menos de 5 unidades</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Validade próxima</p>
                  <p className="text-sm text-muted-foreground">Alertar 30 dias antes do vencimento</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Contas a vencer</p>
                  <p className="text-sm text-muted-foreground">Alertar 3 dias antes do vencimento</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium text-foreground">Resumo diário por e-mail</p>
                  <p className="text-sm text-muted-foreground">Receber relatório diário das vendas</p>
                </div>
                <Switch />
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
