import { useState, useEffect, useRef } from "react";
import { Store, Upload, Palette, Save, User, Bell, Shield, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useStore } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

const colorOptions = [
  { name: "Coral", value: "#F97316", hsl: "24 95% 53%" },
  { name: "Azul", value: "#3B82F6", hsl: "217 91% 60%" },
  { name: "Verde", value: "#22C55E", hsl: "142 71% 45%" },
  { name: "Roxo", value: "#8B5CF6", hsl: "258 90% 66%" },
  { name: "Rosa", value: "#EC4899", hsl: "330 81% 60%" },
  { name: "Âmbar", value: "#F59E0B", hsl: "38 92% 50%" },
];

export default function Configuracoes() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { store, loading, updateStore, uploadLogo } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storeName, setStoreName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#F97316");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (store) {
      setStoreName(store.name);
      setSelectedColor(store.primaryColor);
    }
  }, [store]);

  const handleSave = async () => {
    if (!storeName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Informe o nome da sua loja.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    await updateStore(storeName, selectedColor);
    
    // Apply color to CSS
    const color = colorOptions.find(c => c.value === selectedColor);
    if (color) {
      document.documentElement.style.setProperty("--primary", color.hsl);
    }
    
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O logo deve ter no máximo 2MB.",
        variant: "destructive",
      });
      return;
    }

    await uploadLogo(file);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
                  placeholder="Ex: Minha Loja"
                />
              </div>
              <div>
                <Label>Logo da Loja</Label>
                <div className="mt-1.5 flex items-center gap-4">
                  <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center border-2 border-dashed border-border overflow-hidden">
                    {store?.logoUrl ? (
                      <img src={store.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Store className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
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
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              Esta cor será usada nos elementos principais do sistema
            </p>
          </div>

          <Button 
            className="btn-primary gap-2" 
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Alterações
          </Button>
        </TabsContent>

        <TabsContent value="conta" className="mt-6 space-y-6">
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Dados da Conta
            </h3>
            <div className="space-y-4">
              <div>
                <Label>E-mail</Label>
                <Input 
                  value={user?.email || ""} 
                  disabled 
                  className="mt-1.5 input-styled bg-muted" 
                />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Segurança
            </h3>
            <Button 
              variant="outline" 
              className="gap-2 text-destructive hover:text-destructive"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4" />
              Sair da Conta
            </Button>
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
