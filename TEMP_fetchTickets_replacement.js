// Updated fetchTickets function with RPC call
// Replace lines 113-172 in PlatformDashboard.tsx with this code:

const fetchTickets = async () => {
  try {
    // First fetch all tickets
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError);
      setTickets([]);
      return;
    }

    if (!ticketsData || ticketsData.length === 0) {
      console.log('No tickets found');
      setTickets([]);
      return;
    }

    console.log(`Fetching details for ${ticketsData.length} tickets...`);

    // Now fetch profile and tenant data for each ticket
    const ticketsWithDetails = await Promise.all(
      ticketsData.map(async (ticket) => {
        let profileData = null;
        let tenantData = null;

        // Fetch user email using RPC function (fallback to auth.users if not in profiles)
        if (ticket.created_by) {
          console.log(`Fetching user info for ticket #${ticket.ticket_number}, created_by:`, ticket.created_by);
          
          try {
            const { data: userInfo, error: userError } = await supabase
              .rpc('get_user_email_by_id', { user_id: ticket.created_by });
            
            if (userError) {
              console.error(`Error fetching user info for ticket #${ticket.ticket_number}:`, userError);
            } else if (userInfo && userInfo.length > 0) {
              const user = userInfo[0];
              profileData = {
                id: ticket.created_by,
                email: user.email,
                full_name: user.full_name
              };
              console.log(`User info fetched for ticket #${ticket.ticket_number}:`, profileData);
            } else {
              console.warn(`No user found for ticket #${ticket.ticket_number}, created_by:`, ticket.created_by);
            }
          } catch (err) {
            console.error(`Exception fetching user for ticket #${ticket.ticket_number}:`, err);
          }
        } else {
          console.warn(`Ticket #${ticket.ticket_number} has no created_by field`);
        }

        // Fetch tenant
        if (ticket.tenant_id) {
          const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('id, name')
            .eq('id', ticket.tenant_id)
            .single();
          
          if (tenantError) {
            console.error(`Error fetching tenant for ticket #${ticket.ticket_number}:`, tenantError);
          } else {
            tenantData = tenant;
          }
        }

        return {
          ...ticket,
          profiles: profileData,
          tenants: tenantData
        };
      })
    );

    console.log('=== TICKETS WITH DETAILS ===');
    ticketsWithDetails.forEach(ticket => {
      console.log(`Ticket #${ticket.ticket_number}:`, {
        id: ticket.id,
        created_by: ticket.created_by,
        profiles: ticket.profiles,
        email: ticket.profiles?.email,
        name: ticket.profiles?.full_name
      });
    });
    console.log('=== END TICKETS ===');

    setTickets(ticketsWithDetails || []);
  } catch (error) {
    console.error('Error in fetchTickets:', error);
    setTickets([]);
  }
};
