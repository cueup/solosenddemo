import { useState, useEffect } from 'react'
import { Plus, Mail, Shield, Clock, MoreVertical, Trash2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useService } from '../../contexts/ServiceContext'
import { inviteService } from '../../services/inviteService'
import { InviteTeamMember } from './InviteTeamMember'

export function TeamManagement() {
  // We'll treat service_members as "Profile" like objects for UI compatibility
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<any | null>(null)
  const { currentService } = useService()

  useEffect(() => {
    if (currentService) {
      fetchTeamMembers()
    } else {
      setLoading(false)
    }
  }, [currentService])

  const fetchTeamMembers = async () => {
    if (!currentService) return

    try {
      // Fetch service members.
      // We now have full_name on service_members for pending invites.
      // For active users, we could join with profiles, but for now we have it on the table.

      const { data, error } = await supabase
        .from('service_members')
        .select('*')
        .eq('service_id', currentService.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTeamMembers(data || [])
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInviteMember = async () => {
    await fetchTeamMembers()
    setShowInviteModal(false)
  }

  const handleUpdateRole = async (memberId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    try {
      const { error } = await supabase
        .from('service_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error

      setTeamMembers(prev =>
        prev.map(member =>
          member.id === memberId ? { ...member, role: newRole } : member
        )
      )
    } catch (error) {
      console.error('Error updating role:', error)
      alert('Failed to update role')
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this member?')) {
      try {
        const { error } = await supabase
          .from('service_members')
          .delete()
          .eq('id', memberId)

        if (error) throw error

        setTeamMembers(prev => prev.filter(member => member.id !== memberId))
      } catch (error) {
        console.error('Error removing member:', error)
        alert('Failed to remove member')
      }
    }
  }

  const handleResendInvite = async (memberId: string) => {
    try {
      await inviteService.resendServiceInvite(memberId)
      alert('Invitation resent successfully')
    } catch (error) {
      console.error('Error resending invite:', error)
      alert('Failed to resend invitation')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700'
      case 'editor': return 'bg-blue-100 text-blue-700'
      case 'viewer': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'inactive': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Team Members</h2>
          <p className="text-gray-600">Manage members for <strong>{currentService?.name}</strong></p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 font-semibold"
        >
          <Plus size={20} />
          Invite Member
        </button>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Total Members</p>
          <p className="text-2xl font-bold text-gray-900">{teamMembers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Active Members</p>
          <p className="text-2xl font-bold text-gray-900">
            {teamMembers.filter(m => m.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Pending Invites</p>
          <p className="text-2xl font-bold text-gray-900">
            {teamMembers.filter(m => m.status === 'pending').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <p className="text-sm text-gray-600 mb-1">Admins</p>
          <p className="text-2xl font-bold text-gray-900">
            {teamMembers.filter(m => m.role === 'admin').length}
          </p>
        </div>
      </div>

      {/* Team Members List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Service Members</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {teamMembers.map((member) => (
            <div key={member.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {(member.full_name || member.email || 'RM').split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{member.full_name || member.email || 'Unknown User'}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail size={14} />
                      <span>{member.email || 'No email available'}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>Added {formatDate(member.created_at || new Date().toISOString())}</span>
                        {/* Service members might not have invited_at or last_sign_in on the table immediately readable if standard select * */}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${getRoleColor(member.role)}`}>
                    <Shield size={12} className="inline mr-1" />
                    {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                  </span>
                  <span className={`text-sm font-medium px-3 py-1 rounded-full ${getStatusColor(member.status)}`}>
                    {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                  </span>

                  <div className="relative">
                    <button
                      onClick={() => setSelectedMember(selectedMember?.id === member.id ? null : member)}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <MoreVertical size={16} className="text-gray-400" />
                    </button>

                    {selectedMember?.id === member.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                        <div className="px-3 py-2 border-b border-gray-200">
                          <p className="text-xs font-medium text-gray-500">Change Role</p>
                        </div>
                        {(['admin', 'editor', 'viewer'] as const).map((role) => (
                          <button
                            key={role}
                            onClick={() => {
                              handleUpdateRole(member.id, role)
                              setSelectedMember(null)
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${member.role === role ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                              }`}
                          >
                            <Shield size={14} className="inline mr-2" />
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </button>
                        ))}

                        <div className="border-t border-gray-200 mt-1">
                          {member.status === 'pending' && (
                            <button
                              onClick={() => {
                                handleResendInvite(member.id)
                                setSelectedMember(null)
                              }}
                              className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-gray-50 transition-colors"
                            >
                              <Mail size={14} className="inline mr-2" />
                              Resend Invite
                            </button>
                          )}
                          <button
                            onClick={() => {
                              handleRemoveMember(member.id)
                              setSelectedMember(null)
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                          >
                            <Trash2 size={14} className="inline mr-2" />
                            Remove Member
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {teamMembers.length === 0 && (
          <div className="p-12 text-center">
            <Shield size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">No team members yet</p>
            <p className="text-sm text-gray-400 mt-1">Invite your first team member to get started</p>
          </div>
        )}
      </div>

      {/* Role Permissions Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-4">Role Permissions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Admin</h4>
            <ul className="text-blue-700 space-y-1">
              <li>• Full access to all features</li>
              <li>• Manage team members</li>
              <li>• Configure settings</li>
              <li>• View all analytics</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Editor</h4>
            <ul className="text-blue-700 space-y-1">
              <li>• Send messages</li>
              <li>• Create templates</li>
              <li>• Manage contacts</li>
              <li>• View basic analytics</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Viewer</h4>
            <ul className="text-blue-700 space-y-1">
              <li>• View sent messages</li>
              <li>• View templates</li>
              <li>• View contacts</li>
              <li>• View analytics</li>
            </ul>
          </div>
        </div>
      </div>

      {showInviteModal && currentService && (
        <InviteTeamMember
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteMember}
          type="service"
          serviceId={currentService.id}
        />
      )}
    </div>
  )
}
