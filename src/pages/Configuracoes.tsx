import { useState, useEffect, useRef } from "react";
import { Store, Upload, Palette, Save, User, Bell, Shield, Loader2, LogOut, MessageCircle, Cake, Mail, AlertCircle, Package, Sparkles, Construction, Image, Volume2, Target, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useStore, AlertSettings, PackagingCosts } from "@/hooks/useStore";
import { useAuth } from "@/hooks/useAuth";
import { useGettingStarted } from "@/hooks/useGettingStarted";
import { useGoals, GoalSettings } from "@/hooks/useGoals";
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

// Email configuration status - in production, check if RESEND_API_KEY is configured
const EMAIL_CONFIGURED = true; // Will be controlled by actual secret check

// Helper to adjust color brightness for gradient preview
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export default function Configuracoes() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { store, loading, updateStore, updateAlertSettings, updatePackagingCosts, uploadLogo, updateMaintenanceMode, updateShowPhotosInSales, updateSoundEnabled, updateLabelColor } = useStore();
  const { isHidden, showGuide, allCompleted } = useGettingStarted();
  const { goalSettings, updateGoals, loading: loadingGoals } = useGoals();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [showPhotosInSales, setShowPhotosInSales] = useState(true);
  const [savingPhotos, setSavingPhotos] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [savingSound, setSavingSound] = useState(false);
  const [labelColor, setLabelColor] = useState("#9333EA");
  const [savingLabelColor, setSavingLabelColor] = useState(false);

  const [storeName, setStoreName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#F97316");
  const [birthdayMessage, setBirthdayMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingAlerts, setSavingAlerts] = useState(false);
  const [savingPackaging, setSavingPackaging] = useState(false);
  const [savingGoals, setSavingGoals] = useState(false);

  // Goal settings state
  const [goals, setGoals] = useState<GoalSettings>({
    dailyGoal: 0,
    monthlyGoal: 0,
  });
  const [goalsLoaded, setGoalsLoaded] = useState(false);
  
  // Alert settings state - controlled components
  const [alertSettings, setAlertSettings] = useState<AlertSettings>({
    lowStockEnabled: true,
    expiryAlertEnabled: true,
    billsDueEnabled: true,
    dailyEmailEnabled: false,
    lowStockThreshold: 3,
    expiryDaysBefore: 30,
    billsDaysBefore: 3,
  });
  const [alertsLoaded, setAlertsLoaded] = useState(false);

  // Packaging costs state
  const [packagingCosts, setPackagingCosts] = useState<PackagingCosts>({
    packagingCost1Bag: 0,
    packagingCost2Bags: 0,
  });
  const [packagingLoaded, setPackagingLoaded] = useState(false);

  // Load store data only once on mount or when store changes
  useEffect(() => {
    if (store && !alertsLoaded) {
      setStoreName(store.name);
      setSelectedColor(store.primaryColor);
      setLabelColor(store.labelColor);
      setBirthdayMessage(store.birthdayMessage);
      setAlertSettings(store.alertSettings);
      setMaintenanceMode(store.maintenanceMode);
      setShowPhotosInSales(store.showPhotosInSales);
      setSoundEnabled(store.soundEnabled);
      setAlertsLoaded(true);
    }
    if (store && !packagingLoaded) {
      setPackagingCosts(store.packagingCosts);
      setPackagingLoaded(true);
    }
  }, [store, alertsLoaded, packagingLoaded]);

  // Load goal settings
  useEffect(() => {
    if (goalSettings && !goalsLoaded) {
      setGoals(goalSettings);
      setGoalsLoaded(true);
    }
  }, [goalSettings, goalsLoaded]);

  // Reset loaded flags when user changes
  useEffect(() => {
    setAlertsLoaded(false);
    setPackagingLoaded(false);
    setGoalsLoaded(false);
  }, [user?.id]);

  const handleSaveGoals = async () => {
    setSavingGoals(true);
    const success = await updateGoals(goals);
    setSavingGoals(false);
    
    if (!success) {
      if (goalSettings) {
        setGoals(goalSettings);
      }
    }
  };

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
    await updateStore(storeName, selectedColor, birthdayMessage);
    
    // Apply color to CSS
    const color = colorOptions.find(c => c.value === selectedColor);
    if (color) {
      document.documentElement.style.setProperty("--primary", color.hsl);
    }
    
    setSaving(false);
  };

  const handleSaveAlerts = async () => {
    setSavingAlerts(true);
    const success = await updateAlertSettings(alertSettings);
    setSavingAlerts(false);
    
    if (!success) {
      // If save failed, reload from store to reset local state
      if (store) {
        setAlertSettings(store.alertSettings);
      }
    }
  };

  const handleSavePackaging = async () => {
    setSavingPackaging(true);
    const success = await updatePackagingCosts(packagingCosts);
    setSavingPackaging(false);
    
    if (!success) {
      if (store) {
        setPackagingCosts(store.packagingCosts);
      }
    }
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

  const updateAlertSetting = <K extends keyof AlertSettings>(key: K, value: AlertSettings[K]) => {
    setAlertSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleToggleMaintenance = async () => {
    setSavingMaintenance(true);
    const newValue = !maintenanceMode;
    const success = await updateMaintenanceMode(newValue);
    if (success) {
      setMaintenanceMode(newValue);
    }
    setSavingMaintenance(false);
  };

  const handleToggleShowPhotos = async () => {
    setSavingPhotos(true);
    const newValue = !showPhotosInSales;
    const success = await updateShowPhotosInSales(newValue);
    if (success) {
      setShowPhotosInSales(newValue);
    }
    setSavingPhotos(false);
  };

  const handleToggleSound = async () => {
    setSavingSound(true);
    const newValue = !soundEnabled;
    const success = await updateSoundEnabled(newValue);
    if (success) {
      setSoundEnabled(newValue);
    }
    setSavingSound(false);
  };

  const handleSaveLabelColor = async () => {
    setSavingLabelColor(true);
    await updateLabelColor(labelColor);
    setSavingLabelColor(false);
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

          {/* Label Color */}
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Cor das Etiquetas
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Escolha a cor que será usada nas etiquetas de preços.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={labelColor}
                  onChange={(e) => setLabelColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-border"
                  style={{ backgroundColor: labelColor }}
                />
                <div>
                  <p className="font-medium text-foreground">{labelColor.toUpperCase()}</p>
                  <p className="text-sm text-muted-foreground">Clique para alterar</p>
                </div>
              </div>
              <Button 
                variant="outline"
                className="gap-2 ml-auto"
                onClick={handleSaveLabelColor}
                disabled={savingLabelColor}
              >
                {savingLabelColor ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar Cor
              </Button>
            </div>
            {/* Mini preview */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Prévia:</p>
              <div className="flex items-center gap-2">
                <div 
                  className="w-24 h-10 rounded flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: `linear-gradient(135deg, ${labelColor}, ${adjustColor(labelColor, 40)})` }}
                >
                  PRODUTO
                </div>
                <span className="text-xs text-muted-foreground">← Faixa colorida da etiqueta</span>
              </div>
            </div>
          </div>

          {/* Goals Section */}
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Metas de Vendas
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Defina suas metas para acompanhar o progresso na tela de vendas.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="dailyGoal">Meta Diária (obrigatória)</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="dailyGoal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={goals.dailyGoal || ""}
                    onChange={(e) => setGoals(prev => ({
                      ...prev,
                      dailyGoal: parseFloat(e.target.value) || 0
                    }))}
                    className="pl-10"
                    placeholder="Ex: 500,00"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Exibida na barra de progresso</p>
              </div>
              <div>
                <Label htmlFor="monthlyGoal">Meta Mensal (opcional)</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="monthlyGoal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={goals.monthlyGoal || ""}
                    onChange={(e) => setGoals(prev => ({
                      ...prev,
                      monthlyGoal: parseFloat(e.target.value) || 0
                    }))}
                    className="pl-10"
                    placeholder="Ex: 10.000,00"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Para acompanhamento futuro</p>
              </div>
            </div>
            <Button 
              className="btn-primary gap-2 mt-4" 
              onClick={handleSaveGoals}
              disabled={savingGoals}
            >
              {savingGoals ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar Metas
            </Button>
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

          {/* Getting Started Guide Option */}
          {isHidden && (
            <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Guia de Primeiros Passos
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                O guia de primeiros passos está oculto. Você pode exibi-lo novamente no Painel.
              </p>
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => {
                  showGuide();
                  toast({
                    title: "Guia reativado",
                    description: "O guia de primeiros passos está visível novamente no Painel.",
                  });
                  navigate('/');
                }}
              >
                <Sparkles className="w-4 h-4" />
                Ver Guia Novamente
              </Button>
            </div>
          )}

          {/* Maintenance Mode - Admin only */}
          <div className="bg-card rounded-xl border border-amber-500/30 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Construction className="w-5 h-5 text-amber-500" />
              Modo Manutenção
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Quando ativado, apenas você (admin) poderá acessar o sistema. Outros usuários verão uma página de manutenção.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  {maintenanceMode ? "Sistema em manutenção" : "Sistema operacional"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {maintenanceMode 
                    ? "Usuários comuns não conseguem acessar" 
                    : "Todos os usuários autorizados podem acessar"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {savingMaintenance && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                <Switch 
                  checked={maintenanceMode}
                  onCheckedChange={handleToggleMaintenance}
                  disabled={savingMaintenance}
                />
              </div>
            </div>
          </div>

          {/* Show Photos in Sales */}
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-primary" />
              Fotos na Tela de Vendas
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Exibe miniaturas dos produtos ao buscar e na lista de itens da venda. Desative para uma tela mais leve.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  {showPhotosInSales ? "Fotos ativadas" : "Fotos desativadas"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {showPhotosInSales 
                    ? "Miniaturas serão exibidas na tela de vendas" 
                    : "Tela de vendas sem imagens"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {savingPhotos && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                <Switch 
                  checked={showPhotosInSales}
                  onCheckedChange={handleToggleShowPhotos}
                  disabled={savingPhotos}
                />
              </div>
            </div>
          </div>

          {/* Sound Settings */}
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-primary" />
              Sons do Sistema
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Ativa sons sutis para confirmar ações como vendas finalizadas, produtos adicionados ao carrinho e interações com o mascote de ajuda.
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">
                  {soundEnabled ? "Sons ativados" : "Sons desativados"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {soundEnabled 
                    ? "Feedback sonoro sutil em ações importantes" 
                    : "Nenhum som será tocado"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {savingSound && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                <Switch 
                  checked={soundEnabled}
                  onCheckedChange={handleToggleSound}
                  disabled={savingSound}
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
          {/* Birthday Message */}
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Cake className="w-5 h-5 text-primary" />
              Mensagem de Aniversário
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="birthdayMessage" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Mensagem padrão para WhatsApp
                </Label>
                <Textarea
                  id="birthdayMessage"
                  value={birthdayMessage}
                  onChange={(e) => setBirthdayMessage(e.target.value)}
                  className="mt-1.5 min-h-[100px]"
                  placeholder="Ex: Oi {NOME}! 🎉 Feliz aniversário!"
                />
                <p className="text-sm text-muted-foreground mt-2">
                  Use <code className="bg-muted px-1 py-0.5 rounded text-xs">{"{NOME}"}</code> para incluir o primeiro nome do cliente automaticamente.
                </p>
              </div>
            </div>
          </div>

          {/* Packaging Costs */}
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              Custo de Embalagem (Interno)
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Configure o custo interno de embalagem para cálculo de lucro real. Esses valores não são cobrados do cliente.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="packaging1Bag">Custo (1-2 itens avulsos)</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="packaging1Bag"
                    type="number"
                    step="0.01"
                    min="0"
                    value={packagingCosts.packagingCost1Bag}
                    onChange={(e) => setPackagingCosts(prev => ({
                      ...prev,
                      packagingCost1Bag: parseFloat(e.target.value) || 0
                    }))}
                    className="pl-10"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">1 sacola</p>
              </div>
              <div>
                <Label htmlFor="packaging2Bags">Custo (3-5 itens avulsos)</Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                  <Input
                    id="packaging2Bags"
                    type="number"
                    step="0.01"
                    min="0"
                    value={packagingCosts.packagingCost2Bags}
                    onChange={(e) => setPackagingCosts(prev => ({
                      ...prev,
                      packagingCost2Bags: parseFloat(e.target.value) || 0
                    }))}
                    className="pl-10"
                    placeholder="0,00"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">2 sacolas</p>
              </div>
            </div>
            <Button 
              className="btn-primary gap-2 mt-4" 
              onClick={handleSavePackaging}
              disabled={savingPackaging}
            >
              {savingPackaging ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar Custos de Embalagem
            </Button>
          </div>

          {/* Alert Settings */}
          <div className="bg-card rounded-xl border border-border/50 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Configurar Alertas
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Estoque baixo</p>
                  <p className="text-sm text-muted-foreground">
                    Alertar quando produto tiver menos de {alertSettings.lowStockThreshold} unidades
                  </p>
                </div>
                <Switch 
                  checked={alertSettings.lowStockEnabled}
                  onCheckedChange={(checked) => updateAlertSetting('lowStockEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Validade próxima</p>
                  <p className="text-sm text-muted-foreground">
                    Alertar {alertSettings.expiryDaysBefore} dias antes do vencimento
                  </p>
                </div>
                <Switch 
                  checked={alertSettings.expiryAlertEnabled}
                  onCheckedChange={(checked) => updateAlertSetting('expiryAlertEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium text-foreground">Contas a vencer</p>
                  <p className="text-sm text-muted-foreground">
                    Alertar {alertSettings.billsDaysBefore} dias antes do vencimento
                  </p>
                </div>
                <Switch 
                  checked={alertSettings.billsDueEnabled}
                  onCheckedChange={(checked) => updateAlertSetting('billsDueEnabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between py-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">Resumo diário por e-mail</p>
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">Receber relatório diário das vendas</p>
                  {alertSettings.dailyEmailEnabled ? (
                    <p className="text-xs text-primary mt-1">Ativo - envia diariamente às 20:00</p>
                  ) : (
                    <p className="text-xs text-muted-foreground mt-1">Inativo</p>
                  )}
                  {!EMAIL_CONFIGURED && (
                    <p className="text-xs text-amber-500 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Envio de e-mail precisa ser configurado (Resend/SMTP)
                    </p>
                  )}
                </div>
                <Switch 
                  checked={alertSettings.dailyEmailEnabled}
                  onCheckedChange={(checked) => updateAlertSetting('dailyEmailEnabled', checked)}
                  disabled={!EMAIL_CONFIGURED}
                />
              </div>
            </div>
          </div>

          <Button 
            className="btn-primary gap-2" 
            onClick={handleSaveAlerts}
            disabled={savingAlerts}
          >
            {savingAlerts ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar Alterações
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
