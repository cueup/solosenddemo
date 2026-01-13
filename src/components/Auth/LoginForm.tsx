import { useState } from 'react'
import { Mail, ArrowRight, Shield, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, verifyOTP, signInWithAzure } = useAuth()

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email)

    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }

    setLoading(false)
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await verifyOTP(email, otp)

    if (error) {
      setError(error.message)
    }

    setLoading(false)
  }

  const handleAzureSignIn = async () => {
    setLoading(true)
    setError('')
    const { error } = await signInWithAzure()
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleBackToEmail = () => {
    setStep('email')
    setOtp('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-black text-white px-4 py-2 font-bold text-lg">SoloSend</div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Sign in to SoloSend
          </h2>
          <p className="mt-2 text-gray-600">
            {step === 'email'
              ? 'Enter your email address to receive a secure sign-in code'
              : 'Enter the 6-digit code sent to your email'
            }
          </p>
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 text-sm">Secure Authentication</h3>
              <p className="text-blue-800 text-sm mt-1">
                We use one-time passwords (OTP) & magic links sent to your email for secure, passwordless authentication.
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          {step === 'email' ? (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@example.gov.uk"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use your government email address
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    Send sign-in code
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAzureSignIn}
                disabled={loading}
                className="w-full bg-[#2F2F2F] text-white py-3 px-4 rounded-lg hover:bg-[#1a1a1a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10.5 0L0 0V10.5H10.5V0Z" fill="#F25022" />
                  <path d="M21 0L10.5 0V10.5H21V0Z" fill="#7FBA00" />
                  <path d="M10.5 10.5L0 10.5V21H10.5V10.5Z" fill="#00A4EF" />
                  <path d="M21 10.5L10.5 10.5V21H21V10.5Z" fill="#FFB900" />
                </svg>
                Sign in with Microsoft
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail size={24} className="text-green-600" />
                </div>
                <p className="text-sm text-gray-600">
                  We've sent a 6-digit code to
                </p>
                <p className="font-semibold text-gray-900">{email}</p>
              </div>

              <div>
                <label htmlFor="otp" className="block text-sm font-semibold text-gray-900 mb-2">
                  Enter verification code
                </label>
                <input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  The code expires in 10 minutes
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      Verify and sign in
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleBackToEmail}
                  className="w-full text-gray-600 hover:text-gray-900 transition-colors text-sm"
                >
                  Use a different email address
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Help Text */}
        <div className="text-center text-sm text-gray-500">
          <p>
            Having trouble signing in?{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
