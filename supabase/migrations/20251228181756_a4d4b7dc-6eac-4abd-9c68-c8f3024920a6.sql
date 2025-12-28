-- Primeiro, vamos remover todas as políticas existentes da tabela profiles para recriá-las corretamente
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Garantir que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Forçar RLS mesmo para o owner da tabela (extra segurança)
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Criar políticas RESTRITIVAS que exigem autenticação
-- Policy para SELECT - apenas usuários autenticados podem ver seu próprio perfil
CREATE POLICY "Authenticated users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

-- Policy para INSERT - apenas usuários autenticados podem inserir seu próprio perfil
CREATE POLICY "Authenticated users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy para UPDATE - apenas usuários autenticados podem atualizar seu próprio perfil
CREATE POLICY "Authenticated users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

-- Policy para DELETE - adicionar para conformidade com GDPR
CREATE POLICY "Authenticated users can delete own profile" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);