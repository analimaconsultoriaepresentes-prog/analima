import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting recurring expenses generation...");

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();
    
    // Get the first and last day of the current month
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    console.log(`Processing recurring expenses for ${currentMonth + 1}/${currentYear}`);

    // Fetch all active recurring expenses
    const { data: recurringExpenses, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('is_recurring', true)
      .or(`recurring_end_date.is.null,recurring_end_date.gte.${today.toISOString().split('T')[0]}`);

    if (fetchError) {
      console.error("Error fetching recurring expenses:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${recurringExpenses?.length || 0} active recurring expense templates`);

    let createdCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const expense of recurringExpenses || []) {
      try {
        // Check if start date is in the future
        if (expense.recurring_start_date) {
          const startDate = new Date(expense.recurring_start_date);
          if (startDate > lastDayOfMonth) {
            console.log(`Skipping expense ${expense.id}: start date is in the future`);
            skippedCount++;
            continue;
          }
        }

        // Determine the due date for this month
        let dueDay = expense.recurring_day || 1;
        // Handle months with fewer days
        const maxDaysInMonth = lastDayOfMonth.getDate();
        if (dueDay > maxDaysInMonth) {
          dueDay = maxDaysInMonth;
        }
        
        const dueDateForMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;

        // Check if we already created an expense for this month from this recurring template
        const { data: existingExpense, error: checkError } = await supabase
          .from('expenses')
          .select('id')
          .eq('parent_expense_id', expense.id)
          .gte('due_date', firstDayOfMonth.toISOString().split('T')[0])
          .lte('due_date', lastDayOfMonth.toISOString().split('T')[0])
          .maybeSingle();

        if (checkError) {
          console.error(`Error checking existing expense for ${expense.id}:`, checkError);
          errors.push(`Check error for ${expense.description}: ${checkError.message}`);
          continue;
        }

        if (existingExpense) {
          console.log(`Skipping expense ${expense.id}: already created for this month`);
          skippedCount++;
          continue;
        }

        // Create the new expense for this month
        const { error: insertError } = await supabase
          .from('expenses')
          .insert({
            user_id: expense.user_id,
            description: expense.description,
            category: expense.category,
            amount: expense.amount,
            due_date: dueDateForMonth,
            status: 'pendente',
            expense_type: expense.expense_type,
            is_recurring: false,
            parent_expense_id: expense.id,
          });

        if (insertError) {
          console.error(`Error creating expense from ${expense.id}:`, insertError);
          errors.push(`Insert error for ${expense.description}: ${insertError.message}`);
          continue;
        }

        console.log(`Created expense for ${expense.description} due on ${dueDateForMonth}`);
        createdCount++;

      } catch (err) {
        console.error(`Unexpected error processing expense ${expense.id}:`, err);
        errors.push(`Unexpected error for ${expense.description}: ${String(err)}`);
      }
    }

    const result = {
      success: true,
      message: `Processed recurring expenses`,
      stats: {
        total: recurringExpenses?.length || 0,
        created: createdCount,
        skipped: skippedCount,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
      processedAt: new Date().toISOString(),
    };

    console.log("Recurring expenses processing complete:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Error in generate-recurring-expenses:", error);
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});