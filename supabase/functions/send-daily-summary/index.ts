import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SaleItem {
  product_name: string;
  quantity: number;
  subtotal: number;
}

interface Sale {
  id: string;
  total: number;
  created_at: string;
  sale_items: SaleItem[];
}

interface StoreWithEmail {
  user_id: string;
  name: string;
  daily_email_enabled: boolean;
  profiles: { email: string }[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Starting daily summary email job...");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all stores with daily_email_enabled = true
    const { data: stores, error: storesError } = await supabase
      .from("stores")
      .select(`
        user_id,
        name,
        daily_email_enabled,
        profiles!inner(email)
      `)
      .eq("daily_email_enabled", true);

    if (storesError) {
      console.error("Error fetching stores:", storesError);
      throw storesError;
    }

    if (!stores || stores.length === 0) {
      console.log("No stores with daily email enabled");
      return new Response(
        JSON.stringify({ message: "No stores with daily email enabled" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${stores.length} stores with daily email enabled`);

    // Get today's date range (Brazil timezone - UTC-3)
    const now = new Date();
    const brazilOffset = -3 * 60; // -3 hours in minutes
    const localTime = new Date(now.getTime() + (brazilOffset - now.getTimezoneOffset()) * 60000);
    
    const todayStart = new Date(localTime);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(localTime);
    todayEnd.setHours(23, 59, 59, 999);

    // Convert back to UTC for database query
    const todayStartUTC = new Date(todayStart.getTime() - brazilOffset * 60000);
    const todayEndUTC = new Date(todayEnd.getTime() - brazilOffset * 60000);

    const dateFormatted = localTime.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    const results: { userId: string; success: boolean; error?: string }[] = [];

    for (const store of stores as unknown as StoreWithEmail[]) {
      try {
        const userEmail = store.profiles[0]?.email;
        
        if (!userEmail) {
          console.log(`No email found for store ${store.name}`);
          results.push({ userId: store.user_id, success: false, error: "No email found" });
          continue;
        }

        // Fetch today's sales for this user
        const { data: sales, error: salesError } = await supabase
          .from("sales")
          .select(`
            id,
            total,
            created_at,
            sale_items(
              product_name,
              quantity,
              subtotal
            )
          `)
          .eq("user_id", store.user_id)
          .gte("created_at", todayStartUTC.toISOString())
          .lte("created_at", todayEndUTC.toISOString());

        if (salesError) {
          console.error(`Error fetching sales for ${store.name}:`, salesError);
          results.push({ userId: store.user_id, success: false, error: salesError.message });
          continue;
        }

        const typedSales = sales as unknown as Sale[];

        // Calculate statistics
        const totalSales = typedSales.length;
        const totalRevenue = typedSales.reduce((sum, sale) => sum + Number(sale.total), 0);
        const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

        // Calculate total items and products per sale (PA)
        let totalItems = 0;
        const productCounts: Record<string, { name: string; quantity: number; revenue: number }> = {};

        for (const sale of typedSales) {
          for (const item of sale.sale_items || []) {
            totalItems += item.quantity;
            if (!productCounts[item.product_name]) {
              productCounts[item.product_name] = { name: item.product_name, quantity: 0, revenue: 0 };
            }
            productCounts[item.product_name].quantity += item.quantity;
            productCounts[item.product_name].revenue += Number(item.subtotal);
          }
        }

        const averageProductsPerSale = totalSales > 0 ? totalItems / totalSales : 0;

        // Get top 5 products by quantity
        const topProducts = Object.values(productCounts)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);

        // Format currency
        const formatCurrency = (value: number) => {
          return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
        };

        // Build email HTML
        const topProductsHtml = topProducts.length > 0
          ? topProducts.map((p, i) => `
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${i + 1}. ${p.name}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">${p.quantity}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(p.revenue)}</td>
            </tr>
          `).join('')
          : '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #666;">Nenhuma venda hoje</td></tr>';

        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #F97316 0%, #EA580C 100%); padding: 24px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">📊 Resumo Diário</h1>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">${store.name} - ${dateFormatted}</p>
              </div>
              
              <div style="padding: 24px;">
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px;">
                  <div style="background: #FFF7ED; border-radius: 8px; padding: 16px; text-align: center;">
                    <p style="margin: 0; color: #9A3412; font-size: 12px; text-transform: uppercase;">Vendas</p>
                    <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: bold; color: #C2410C;">${totalSales}</p>
                  </div>
                  <div style="background: #F0FDF4; border-radius: 8px; padding: 16px; text-align: center;">
                    <p style="margin: 0; color: #166534; font-size: 12px; text-transform: uppercase;">Faturamento</p>
                    <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: bold; color: #16A34A;">${formatCurrency(totalRevenue)}</p>
                  </div>
                  <div style="background: #EFF6FF; border-radius: 8px; padding: 16px; text-align: center;">
                    <p style="margin: 0; color: #1E40AF; font-size: 12px; text-transform: uppercase;">Ticket Médio</p>
                    <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: bold; color: #2563EB;">${formatCurrency(averageTicket)}</p>
                  </div>
                  <div style="background: #FAF5FF; border-radius: 8px; padding: 16px; text-align: center;">
                    <p style="margin: 0; color: #6B21A8; font-size: 12px; text-transform: uppercase;">PA (Itens/Venda)</p>
                    <p style="margin: 4px 0 0 0; font-size: 28px; font-weight: bold; color: #7C3AED;">${averageProductsPerSale.toFixed(1)}</p>
                  </div>
                </div>

                <h2 style="margin: 0 0 16px 0; font-size: 18px; color: #333;">🏆 Top 5 Produtos</h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                  <thead>
                    <tr style="background: #f9fafb;">
                      <th style="padding: 10px 12px; text-align: left; font-size: 12px; color: #666; border-bottom: 2px solid #eee;">Produto</th>
                      <th style="padding: 10px 12px; text-align: center; font-size: 12px; color: #666; border-bottom: 2px solid #eee;">Qtd</th>
                      <th style="padding: 10px 12px; text-align: right; font-size: 12px; color: #666; border-bottom: 2px solid #eee;">Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${topProductsHtml}
                  </tbody>
                </table>

                <p style="margin: 0; padding: 16px; background: #f9fafb; border-radius: 8px; text-align: center; color: #666; font-size: 14px;">
                  Este é um resumo automático das suas vendas do dia. Acesse o sistema para mais detalhes.
                </p>
              </div>
              
              <div style="background: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #eee;">
                <p style="margin: 0; color: #999; font-size: 12px;">
                  Enviado automaticamente às 20:00 • ${store.name}
                </p>
              </div>
            </div>
          </body>
          </html>
        `;

        // Send email
        const { error: emailError } = await resend.emails.send({
          from: "Resumo Diário <onboarding@resend.dev>",
          to: [userEmail],
          subject: `Resumo diário - ${store.name.toUpperCase()} (${dateFormatted})`,
          html,
        });

        if (emailError) {
          console.error(`Error sending email to ${userEmail}:`, emailError);
          results.push({ userId: store.user_id, success: false, error: emailError.message });
        } else {
          console.log(`Email sent successfully to ${userEmail}`);
          results.push({ userId: store.user_id, success: true });
        }
      } catch (userError) {
        console.error(`Error processing store ${store.name}:`, userError);
        results.push({ 
          userId: store.user_id, 
          success: false, 
          error: userError instanceof Error ? userError.message : "Unknown error" 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`Daily summary complete: ${successCount}/${results.length} emails sent successfully`);

    return new Response(
      JSON.stringify({ 
        message: "Daily summary job completed",
        results,
        successCount,
        totalCount: results.length
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Error in daily summary function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
