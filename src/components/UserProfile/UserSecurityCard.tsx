import { useState, useEffect, useRef } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Switch from "../form/switch/Switch";
import { useAuth } from "../../context/auth";
import authService from "../../services/authService";
import { RecoveryCode } from "../../types/auth";

type AuthError = {
  message: string;
};

export default function UserSecurityCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user, updateSecurityPreferences } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<RecoveryCode[]>([]);
  const [manualEntryCode, setManualEntryCode] = useState<string>('LVFG2Q7HRAAHXNP2JZPEAUKTJAUH2SLG');
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [step, setStep] = useState<"setup" | "verify" | "complete" | "disable" | "password">("setup");
  const [error, setError] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const passwordResolveRef = useRef<((value: string | null) => void) | null>(null);

  const refreshMFAStatus = async () => {
    try {
      console.log('refreshMFAStatus: Starting MFA status refresh...');
      const status = await authService.getMFAStatus();
      console.log('refreshMFAStatus: Got MFA status:', status);
      console.log('refreshMFAStatus: Setting twoFactorEnabled to:', status.enabled);
      setTwoFactorEnabled(status.enabled);
      if (updateSecurityPreferences) {
        updateSecurityPreferences({
          multifactorAuthEnabled: status.enabled,
          backupCodesGenerated: status.enabled
        });
        console.log('refreshMFAStatus: Updated security preferences');
      }
      console.log('refreshMFAStatus: MFA status refresh completed');
    } catch (error) {
      console.error('Error refreshing MFA status:', error);
    }
  };

  useEffect(() => {
    refreshMFAStatus();
    console.log('handleDisable2FA function reference:', handleDisable2FA);
  }, []);

  const handleToggle2FA = async (checked: boolean) => {
    console.log('handleToggle2FA called with checked:', checked, 'twoFactorEnabled:', twoFactorEnabled);
    setIsLoading(true);
    try {
      if (checked && !twoFactorEnabled) {
        console.log('Enabling 2FA - opening modal');
        openModal();
        setStep("setup");
      } else if (!checked && twoFactorEnabled) {
        console.log('Disabling 2FA - opening disable confirmation modal');
        openModal();
        setStep("disable");
      }
    } catch (error) {
      console.error('Error toggling 2FA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if a user already has 2FA enabled
  const check2FAStatus = async () => {
    try {
      setIsLoading(true);
      setError("");
      console.log('Checking 2FA status...');
      
      // Get MFA status
      const mfaStatus = await authService.getMFAStatus();
      console.log('MFA Status:', mfaStatus);
      
      if (mfaStatus.enabled) {
        setTwoFactorEnabled(true);
        if (updateSecurityPreferences) {
          updateSecurityPreferences({
            multifactorAuthEnabled: true,
            backupCodesGenerated: true
          });
        }
        setIsLoading(false);
        closeModal();
        return true;
      }
      
      setIsLoading(false);
      return false;
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('Error checking 2FA status:', error);
      setError(authError.message || "Failed to check two-factor authentication status");
      setIsLoading(false);
      return false;
    }
  };
  
  // Handle enabling 2FA
  const handleEnable2FA = async () => {
    try {
      setIsLoading(true);
      setError("");
      console.log('Starting 2FA enrollment process...');
      
      // Check if 2FA is already enabled
      const isEnabled = await check2FAStatus();
      if (isEnabled) {
        console.log('2FA already enabled, not proceeding with enrollment');
        return;
      }
      
      // Call the real 2FA enrollment API
      const result = await authService.enrollMFA();
      
      // Enhanced debugging for QR code data
      console.log('QR Code received:', {
        qrCodeReceived: !!result.qrCode,
        qrCodeLength: result.qrCode ? result.qrCode.length : 0,
        qrCodeStart: result.qrCode ? result.qrCode.substring(0, 50) + '...' : 'No QR code',
        qrCodeFormat: result.qrCode ? 
          (result.qrCode.startsWith('data:image') ? 'data URL' : 
           result.qrCode.startsWith('https://chart.googleapis.com') ? 'Google Charts URL' : 
           'Other URL format') : 'No format',
        secretReceived: !!result.secret,
        secretLength: result.secret ? result.secret.length : 0
      });
      
      setQrCode(result.qrCode);
      setSecret(result.secret);
      if (result.secret) {
        setManualEntryCode(result.secret);
      }
      setShowQRCode(true);
      setIsLoading(false);
      // Move to verification step
      setStep("verify");
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('2FA enrollment failed:', error);
      
      // Special handling for "already exists" errors - probably means 2FA is already setup
      if (authError.message?.toLowerCase().includes('already exists')) {
        await check2FAStatus();
        return;
      }
      
      setError(authError.message || "Failed to set up two-factor authentication");
      setIsLoading(false);
    }
  };

  // Handle disabling 2FA
  const promptForPassword = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      setStep("password");
      passwordResolveRef.current = resolve;
    });
  };

  const handlePasswordSubmit = () => {
    console.log('Password submitted:', passwordInput);
    if (passwordResolveRef.current) {
      passwordResolveRef.current(passwordInput);
      passwordResolveRef.current = null;
    }
    setPasswordInput("");
  };

  const handlePasswordCancel = () => {
    console.log('Password cancelled');
    if (passwordResolveRef.current) {
      passwordResolveRef.current(null);
      passwordResolveRef.current = null;
    }
    setPasswordInput("");
    setStep("disable");
  };
  
  const ensureValidSession = async (): Promise<boolean> => {
    try {
      // Get the current session from supabase
      const { data, error } = await authService.getCurrentSession();
      
      if (error || !data?.session) {
        console.error('Invalid session:', error || 'No session data');
        setError("You must be logged in to use two-factor authentication. Please log in again.");
        setIsLoading(false);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Session check failed:', error);
      setError("Authentication session verification failed.");
      setIsLoading(false);
      return false;
    }
  };
  
  const handleDisable2FA = async () => {
    console.log('handleDisable2FA called - starting disable process');
    try {
      setIsLoading(true);
      setError("");
      
      console.log('Ensuring valid session...');
      if (!await ensureValidSession()) {
        console.log('Session validation failed');
        return;
      }
      
      console.log('Prompting for password...');
      const password = await promptForPassword();
      if (!password) {
        console.log('Password prompt cancelled or failed');
        setIsLoading(false);
        return;
      }
      
      console.log('Calling authService.disableMFA with password');
      const result = await authService.disableMFA(password);
      console.log('disableMFA result:', result);
      
      if (result.success) {
        console.log('2FA disabled successfully, refreshing status and closing modal');
        await refreshMFAStatus();
        closeModal();
      } else {
        console.log('2FA disable failed:', result.message);
        setError(result.message || "Failed to disable two-factor authentication");
      }
      setIsLoading(false);
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('Error in handleDisable2FA:', authError);
      setError(authError.message || "Failed to disable two-factor authentication");
      setIsLoading(false);
    }
  };

  // Handle verification of the 2FA setup
  const handleVerify2FA = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      if (!verificationCode || verificationCode.length !== 6) {
        throw new Error("Please enter a 6-digit verification code");
      }
      
      // Call the real 2FA verification API
      const result = await authService.verifyMFA(verificationCode);
      
      if (!result.success) {
        throw new Error(result.message || "Failed to verify the code");
      }
      
      if (result.recoveryCodes) {
        setRecoveryCodes(result.recoveryCodes);
      }
      
      await refreshMFAStatus();
      setIsLoading(false);
      setStep("complete");
    } catch (error: unknown) {
      const authError = error as AuthError;
      setError(authError.message || "Failed to verify the code");
      setIsLoading(false);
    }
  };

  // Continue to next step based on current step
  const handleContinue = async () => {
    setError(""); // Clear any existing errors
    
    try {
      if (step === "setup") {
        await handleEnable2FA();
      } else if (step === "verify") {
        // Verify the code
        await handleVerify2FA();
      }
    } catch (err) {
      console.error('Error in continue flow:', err);
      // Error is already set in the individual handlers
    }
  };

  // Close the modal and reset states
  const handleFinish = () => {
    closeModal();
    setShowQRCode(false);
    setVerificationCode("");
    setStep("setup");
  };

  return (
    <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-6">
            Security Settings
          </h4>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-1 lg:gap-7">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {twoFactorEnabled ? "Enabled" : "Disabled"}
                </p>
              </div>
              <Switch 
                label="Two-Factor Authentication"
                checked={twoFactorEnabled}
                onChange={handleToggle2FA}
                disabled={isLoading}
                color="blue" 
              />
            </div>

            <div className="mt-2">
              <p className="text-xs leading-normal text-gray-500 dark:text-gray-400">
                Two-factor authentication adds an extra layer of security to your account by requiring more than just a password to sign in.
              </p>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {user?.securityPreferences?.notifyOnNewLogin ? "Enabled" : "Disabled"}
                </p>
              </div>
              <Switch 
                label="Login Notifications"
                defaultChecked={user?.securityPreferences?.notifyOnNewLogin || false}
                onChange={(checked) => {
                  if (updateSecurityPreferences) {
                    updateSecurityPreferences({
                      notifyOnNewLogin: checked
                    });
                  }
                }}
                color="blue"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication Setup Modal */}
      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[500px] m-4">
        <div className="no-scrollbar relative w-full max-w-[500px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-8">
          <div className="px-2">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              {step === "setup" && "Set Up Two-Factor Authentication"}
              {step === "verify" && "Verify Your Device"}
              {step === "complete" && "Setup Complete"}
              {step === "disable" && "Disable Two-Factor Authentication"}
              {step === "password" && "Enter Your Password"}
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {step === "setup" && "Two-factor authentication adds an extra layer of security to your account."}
              {step === "verify" && "Enter the 6-digit code from your authenticator app."}
              {step === "complete" && "Two-factor authentication has been enabled for your account."}
              {step === "disable" && "Are you sure you want to disable two-factor authentication? This will make your account less secure."}
              {step === "password" && "Please enter your current password to confirm disabling two-factor authentication."}
            </p>
            
            {/* Error message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-800 dark:bg-red-900/50 dark:text-red-200">
                {error}
              </div>
            )}

            {/* Step 1: Setup */}
            {step === "setup" && !showQRCode && (
              <div className="mb-6">
                <ol className="list-decimal pl-5 space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <li>Download and install an authenticator app (Google Authenticator, Authy, etc.)</li>
                  <li>Click "Continue" to generate a QR code</li>
                  <li>Scan the QR code with your authenticator app</li>
                  <li>Enter the 6-digit code displayed in your app</li>
                </ol>
                <div className="flex items-center gap-3 mt-6">
                  <Button size="sm" variant="outline" onClick={closeModal} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleContinue} loading={isLoading}>
                    Continue
                  </Button>
                </div>
              </div>
            )}
            
            {/* QR Code and Verification Step */}
            {step === "verify" && showQRCode && (
              <div className="text-center">
                <div className="mb-5">
                  <p className="mb-4 text-gray-700 dark:text-gray-300">
                    Scan this QR code with your authentication app (like Google Authenticator, Microsoft Authenticator, or Authy)
                  </p>
                  <div className="flex justify-center">
                    {/* QR code container with forced white background to ensure visibility in dark mode */}
                    <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg inline-block bg-white shadow-sm">
                      {qrCode ? (
                        <img 
                          src={qrCode} 
                          alt="2FA QR Code" 
                          className="w-40 h-40 bg-white" /* Force white background on image */
                          crossOrigin="anonymous"
                          onLoad={() => console.log('QR code loaded successfully')}
                          onError={(e) => {
                            console.error('QR Code image failed to load, attempting fallback generation');
                            const target = e.target as HTMLImageElement;
                            target.onerror = null; // Prevent infinite error loop
                            
                            // Always try to generate a fallback QR code
                            // Get the current user's email from localStorage or context
                            let userEmail = 'user@example.com';
                            try {
                              // Try multiple storage locations
                              const supabaseSession = localStorage.getItem('supabase.auth.token') || 
                                                     sessionStorage.getItem('supabase.auth.token');
                              if (supabaseSession) {
                                const session = JSON.parse(supabaseSession);
                                userEmail = session?.user?.email || userEmail;
                                console.log('Found user email for QR code:', userEmail);
                              }
                            } catch (error) {
                              console.warn('Error retrieving user email:', error);
                            }
                            
                            // If we have a secret, generate a QR code
                            if (secret && secret.length > 0) {
                              console.log('Generating fallback QR code with secret:', secret.substring(0, 4) + '...');
                              
                              // Format a proper TOTP URI
                              const timestamp = new Date().getTime().toString().slice(-5);
                              const issuer = encodeURIComponent(`TailAdmin-${timestamp}`);
                              const email = encodeURIComponent(userEmail);
                              const secretEncoded = encodeURIComponent(secret);
                              
                              // Create a proper otpauth:// URL
                              const totpUri = `otpauth://totp/${issuer}:${email}?secret=${secretEncoded}&issuer=${issuer}`;
                              
                              // Use Google Charts API for reliable QR code generation
                              const googleChartsUrl = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chld=L|0&chl=${encodeURIComponent(totpUri)}`;
                              
                              console.log('Using Google Charts fallback QR code');
                              target.src = googleChartsUrl;
                            } else if (manualEntryCode && manualEntryCode.length > 0) {
                              // Try with manual entry code if available
                              console.log('Using manual entry code for fallback QR');
                              const timestamp = new Date().getTime().toString().slice(-5);
                              const issuer = encodeURIComponent(`TailAdmin-${timestamp}`);
                              const email = encodeURIComponent(userEmail);
                              const secretEncoded = encodeURIComponent(manualEntryCode);
                              const totpUri = `otpauth://totp/${issuer}:${email}?secret=${secretEncoded}&issuer=${issuer}`;
                              target.src = `https://chart.googleapis.com/chart?cht=qr&chs=200x200&chld=L|0&chl=${encodeURIComponent(totpUri)}`;
                            } else {
                              // Last resort fallback - error message
                              console.error('No secret available for QR code generation');
                              target.src = 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" fill="white"/><text x="50%" y="50%" font-family="sans-serif" font-size="12" text-anchor="middle" dominant-baseline="middle" fill="black">QR Code Error</text></svg>';
                            }
                          }}
                        />
                      ) : (
                        <div className="w-40 h-40 flex items-center justify-center bg-white text-gray-500">
                          <div className="flex flex-col items-center">
                            <svg className="animate-spin h-6 w-6 text-blue-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Loading QR Code...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-center">
                    <button 
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={async () => {
                        console.log('Refreshing QR code');
                        await handleEnable2FA();
                      }}
                      disabled={isLoading}
                    >
                      Refresh QR Code
                    </button>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">If you can't scan the QR code, you can manually enter this setup key:</p>
                    <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono overflow-auto select-all break-all">
                      {manualEntryCode || (secret || '')}
                    </pre>
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enter the 6-digit code from your authenticator app
                  </label>
                  <input 
                    type="text"
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    className="w-full rounded-lg border border-stroke bg-transparent py-4 pl-6 pr-10 text-sm outline-none focus:border-primary focus-visible:shadow-none dark:border-gray-600 dark:text-white/70 dark:focus:border-primary"
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={closeModal} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleVerify2FA} 
                    loading={isLoading}
                    disabled={verificationCode.length !== 6 || isLoading}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            )}

            {/* Recovery Codes Display Step */}
            {step === "complete" && (
              <div className="mb-6">
                <div className="mb-4">
                  <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your recovery codes (save these somewhere safe):
                  </p>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      {recoveryCodes.map((codeObj, index) => (
                        <div key={index} className="text-sm font-mono bg-gray-100 dark:bg-gray-800 p-1 text-center rounded">
                          {codeObj.code}
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                    ⚠️ Keep these codes in a safe place. They allow you to recover your account if you lose access to your authenticator app.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button size="sm" onClick={handleFinish}>
                     Done
                   </Button>
                </div>
              </div>
            )}

            {/* Disable 2FA Confirmation Step */}
            {step === "disable" && (
              <div className="mb-6">
                <div className="mb-4">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4 dark:bg-yellow-900/20 dark:border-yellow-800">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                        Warning: This will reduce your account security
                      </p>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
                      Disabling two-factor authentication will make your account more vulnerable to unauthorized access.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={closeModal} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleDisable2FA} 
                    loading={isLoading}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {isLoading ? "Disabling..." : "Yes, Disable 2FA"}
                  </Button>
                </div>
              </div>
            )}

            {/* Password Input Step */}
            {step === "password" && (
              <div className="mb-6">
                <div className="mb-4">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="Enter your password"
                    autoFocus
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && passwordInput.trim()) {
                        handlePasswordSubmit();
                      }
                    }}
                  />
                </div>
                
                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={handlePasswordCancel} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handlePasswordSubmit}
                    disabled={!passwordInput.trim() || isLoading}
                    loading={isLoading}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirm Disable
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
