import { supabase } from '../lib/supabase';

export interface InviteMemberData {
  email: string;
  full_name: string;
  role: 'admin' | 'editor' | 'viewer';
  service_id?: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'editor' | 'viewer';
  service_id?: string;
  status: 'pending' | 'accepted' | 'expired';
  invited_by: string;
  expires_at: string;
  created_at: string;
}

class InviteService {
  async inviteTeamMember(memberData: InviteMemberData): Promise<TeamInvitation> {
    try {
      // Check if user is already a team member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('email', memberData.email)
        .single();

      if (existingMember) {
        throw new Error('This email address is already a team member');
      }

      // Check if there's already a pending invitation
      const { data: existingInvite } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('email', memberData.email)
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        throw new Error('An invitation has already been sent to this email address');
      }

      // Create the invitation
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const { data: invitation, error } = await supabase
        .from('team_invitations')
        .insert({
          email: memberData.email,
          full_name: memberData.full_name,
          role: memberData.role,
          service_id: memberData.service_id,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email (this would typically be handled by an edge function)
      await this.sendInvitationEmail(invitation);

      return invitation;
    } catch (error: any) {
      console.error('Error inviting team member:', error);
      throw new Error(error.message || 'Failed to send invitation');
    }
  }

  async inviteServiceMember(memberData: InviteMemberData, serviceId: string): Promise<TeamInvitation> {
    try {
      // Check if user is already a service member
      const { data: existingMember } = await supabase
        .from('service_members')
        .select('id')
        .eq('service_id', serviceId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      // Check if there's already a pending service invitation
      const { data: existingInvite } = await supabase
        .from('service_invitations')
        .select('id')
        .eq('email', memberData.email)
        .eq('service_id', serviceId)
        .eq('status', 'pending')
        .single();

      if (existingInvite) {
        throw new Error('An invitation has already been sent to this email address for this service');
      }

      // Create the service invitation
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

      const { data: invitation, error } = await supabase
        .from('service_invitations')
        .insert({
          email: memberData.email,
          full_name: memberData.full_name,
          role: memberData.role,
          service_id: serviceId,
          status: 'pending',
          expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email
      await this.sendServiceInvitationEmail(invitation, serviceId);

      return invitation;
    } catch (error: any) {
      console.error('Error inviting service member:', error);
      throw new Error(error.message || 'Failed to send invitation');
    }
  }

  private async sendInvitationEmail(invitation: TeamInvitation):
Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-invitation', 
{
      body: {
        invitation,
        type: 'team'
      }
    });
                                                                         
    if (error) throw error;
  } catch (error) {
    console.error('Error sending invitation email:', error);
    // Don't throw here as the invitation was created successfully       
  }
}

private async sendServiceInvitationEmail(invitation: TeamInvitation,     
serviceId: string): Promise<void> {
  try {
    const { error } = await supabase.functions.invoke('send-invitation', 
{                                                                        
      body: {
        invitation,
        type: 'service',
        serviceId
      }
    });
                                                                         
    if (error) throw error;
  } catch (error) {
    console.error('Error sending service invitation email:', error);     
  }
}

  async getPendingInvitations(): Promise<TeamInvitation[]> {
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      return [];
    }
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      throw new Error('Failed to cancel invitation');
    }
  }

  async resendInvitation(invitationId: string): Promise<void> {
    try {
      // Update expiry date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data: invitation, error } = await supabase
        .from('team_invitations')
        .update({ 
          expires_at: expiresAt.toISOString(),
          status: 'pending'
        })
        .eq('id', invitationId)
        .select()
        .single();

      if (error) throw error;

      // Resend email
      await this.sendInvitationEmail(invitation);
    } catch (error) {
      console.error('Error resending invitation:', error);
      throw new Error('Failed to resend invitation');
    }
  }
}

export const inviteService = new InviteService();
