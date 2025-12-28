-- Add birthday_message column to stores table
ALTER TABLE public.stores 
ADD COLUMN birthday_message text DEFAULT 'Oi {NOME}! 🎉 Feliz aniversário! Preparamos presentes e cestas personalizadas especialmente para você. Quer que eu te mostre algumas opções?';