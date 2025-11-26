import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  // Use the admin client to bypass RLS for generating the report
  // In a real app, we should verify the requesting user is an admin first
  const supabase = getSupabaseAdmin();
  
  // Get today's logs (local time approximation)
  // Ideally, pass timezone or date from client, but for now using server time (UTC usually)
  // or simple date string matching
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const { data, error } = await supabase
        .from('activity_logs')
        .select(`
        created_at,
        staff:staff(first_name, last_name),
        action_type,
        details
        `)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: true });

    if (error) throw error;

    // Format as TXT
    const txtContent = data.map(log => {
        const date = new Date(log.created_at);
        // Format time as HH:MM:SS
        const time = date.toLocaleTimeString('en-KE', { hour12: false });
        
        const staffName = log.staff 
            ? `${log.staff.first_name} ${log.staff.last_name}` 
            : 'Unknown Staff';
            
        let actionDescription = log.action_type;
        
        // Add relevant details based on action type
        if (log.details) {
            const d = log.details as any;
            if (d.reason) actionDescription += `: ${d.reason}`;
            else if (d.notes) actionDescription += `: ${d.notes}`;
            else if (d.order_total) actionDescription += ` (Total: ${d.order_total})`;
            else if (d.amount) actionDescription += ` (Amount: ${d.amount})`;
            else if (d.menu_item_name) actionDescription += `: ${d.menu_item_name}`;
            else if (d.staff_name) actionDescription += `: ${d.staff_name}`;
        }

        return `[${time}] ${staffName} - ${actionDescription}`;
    }).join('\n');

    // Return as downloadable file
    return new NextResponse(txtContent, {
        headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="osumo-activity-${today}.txt"`
        }
    });
  } catch (error) {
      console.error('Error generating log file:', error);
      return NextResponse.json({ error: 'Failed to generate log file' }, { status: 500 });
  }
}
