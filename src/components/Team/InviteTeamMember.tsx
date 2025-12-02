import { useState } from 'react'
import { X, Mail, Shield, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'
import { inviteService, InviteMemberData } from '../../services/inviteService'

interface InviteTeamMemberProps {
  onClose: () => void
  onInvite?: (memberData: InviteMemberData) => void
  serviceId?: string
  type?: 'team' | 'service'
}

export function InviteTeamMember({ onClose, onInvite, serviceId, type = 'team' }: InviteTeamMemberProps) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('editor')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [invitedEmail, setInvitedEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const memberData: InviteMemberData = {
        email: email.toLowerCase().trim(),
        full_name: fullName.trim(),
        role
      }

      if (type === 'service' && serviceId) {
        await inviteService.inviteServiceMember(memberData, serviceId)
      } else {
        await inviteService.inviteTeamMember(memberData)
      }

      // Call the optional callback
      if (onInvite) {
        await onInvite(memberData)
      }

      setInvitedEmail(email)
      setSuccess(true)
      
      // Reset form
      setEmail('')
      setFullName('')
      setRole('editor')
    } catch (err: any) {
      setError(err.message || 'Failed to send invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (success) {
      // If successful, close immediately
      onClose()
    } else {
      // If not successful, just close
      onClose()
    }
  }

  const handleSendAnother = () => {
    setSuccess(false)
    setInvitedEmail('')
    setError('')
  }

  const roleDescriptions = {
    admin: 'Full access to all features including team management and settings',
    editor: 'Can send messages, create templates, and manage contacts',
    viewer: 'Read-only access to view messages, templates, and analytics'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <UserPlus size={24} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {type === 'service' ? 'Invite Service Member' : 'Invite Team Member'}
              </h2>
              <p className="text-sm text-gray-600">
                {type === 'service' 
                  ? 'Send an invitation to join this service' 
                  : 'Send an invitation to join your team'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle size={32} className="text-green-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Invitation Sent!</h3>
            <p className="text-gray-600 mb-6">
              An invitation has been sent to <strong>{invitedEmail}</strong>. 
              They will receive an email with instructions to join your {type === 'service' ? 'service' : 'team'}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleSendAnother}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Send Another
              </button>
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="John Smith"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="john.smith@example.gov.uk"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter a valid email address for the team member
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Role *
            </label>
            <div className="space-y-3">
              {(['admin', 'editor', 'viewer'] as const).map((roleOption) => (
                <label
                  key={roleOption}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    role === roleOption
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={roleOption}
                    checked={role === roleOption}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'editor' | 'viewer')}
                    className="w-4 h-4 text-blue-600 mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield size={16} className="text-gray-600" />
                      <span className="font-medium text-gray-900 capitalize">
                        {roleOption}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {roleDescriptions[roleOption]}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Mail size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900 text-sm">What happens next?</h4>
                <p className="text-blue-800 text-sm mt-1">
                  An invitation email will be sent with a secure sign-in link. 
                  The recipient can join your team by clicking the link and verifying their email.
                </p>
              </div>
            </div>
          </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !email || !fullName}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Send Invitation
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
