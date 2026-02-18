import { supabase, Profile } from '../lib/supabase';

export interface InviteMemberData {
  email: string;
  full_name: string;
  role: 'admin' | 'editor' | 'viewer';
  service_id?: string;
}

export class InviteService {
  async inviteTeamMember(memberData: InviteMemberData): Promise<Profile> {
    try {
      // Check if user is already a member (active or pending)
      const { data: existingMember } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', memberData.email)
        .single();

      if (existingMember) {
        if (existingMember.status === 'active') {
          throw new Error('This email address is already an active platform member');
        } else {
          throw new Error('An invitation has already been sent to this email address');
        }
      }

      const { data: user } = await supabase.auth.getUser();

      // Create the pending member directly in profiles
      const { data: newMember, error } = await supabase
        .from('profiles')
        .insert({
          email: memberData.email,
          full_name: memberData.full_name,
          role: memberData.role,
          status: 'pending',
          invited_by: user.user?.id,
          invited_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email
      await this.sendInvitationEmail(newMember);

      return newMember;
    } catch (error: any) {
      console.error('Error inviting platform member:', error);
      throw new Error(error.message || 'Failed to send invitation');
    }
  }

  async inviteServiceMember(memberData: InviteMemberData, serviceId: string): Promise<any> {
    try {
      const { data: user } = await supabase.auth.getUser();

      // Check if user is already a service member (by email) in this service
      const { data: existingMember } = await supabase
        .from('service_members')
        .select('*')
        .eq('service_id', serviceId)
        .eq('email', memberData.email)
        .maybeSingle();

      if (existingMember) {
        if (existingMember.status === 'active') {
          throw new Error('This email address is already an active member of this service');
        } else {
          throw new Error('An invitation has already been sent to this email address for this service');
        }
      }

      const { data: newMember, error } = await supabase
        .from('service_members')
        .insert({
          email: memberData.email,
          full_name: memberData.full_name,
          role: memberData.role,
          service_id: serviceId,
          status: 'pending',
          invited_by: user.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      // Send invitation email
      await this.sendServiceInvitationEmail(newMember, serviceId);

      return newMember;
    } catch (error: any) {
      console.error('Error inviting service member:', error);
      throw new Error(error.message || 'Failed to send invitation');
    }
  }

  private async sendServiceInvitationEmail(member: any, serviceId: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('send-invitation', {
        body: {
          invitation: member,
          type: 'service',
          serviceId,
          link: `${window.location.origin}/signup?email=${encodeURIComponent(member.email)}&serviceId=${serviceId}`
        }
      });

      if (error) {
        console.error('Failed to invoke send-invitation function:', error);
      }
    } catch (error) {
      console.error('Error sending service invitation email:', error);
    }
  }

  private async sendInvitationEmail(member: Profile): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('send-invitation', {
        body: {
          invitation: member, // Passing the member object which has email/name/role
          type: 'team',
          link: `${window.location.origin}/signup?email=${encodeURIComponent(member.email)}` // Basic link
        }
      });

      if (error) {
        // Log but don't fail the operation since the DB part worked
        console.error('Failed to invoke send-invitation function:', error);
      }
    } catch (error) {
      console.error('Error sending invitation email:', error);
    }
  }

  async resendInvite(memberId: string): Promise<void> {
    try {
      const { data: member, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error || !member) throw new Error('Member not found');

      await this.sendInvitationEmail(member);
    } catch (error) {
      console.error('Error resending invitation:', error);
    }
  }

  async resendServiceInvite(memberId: string): Promise<void> {
    try {
      const { data: member, error } = await supabase
        .from('service_members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error || !member) throw new Error('Member not found');

      await this.sendServiceInvitationEmail(member, member.service_id);
    } catch (error) {
      console.error('Error resending service invitation:', error);
    }
  }
}

export const inviteService = new InviteService();
