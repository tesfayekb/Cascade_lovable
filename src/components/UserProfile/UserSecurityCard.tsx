import { useState } from "react";
import { useModal } from "../../hooks/useModal";
import { Modal } from "../ui/modal";
import Button from "../ui/button/Button";
import Switch from "../form/switch/Switch";
import { useAuth } from "../../context/auth";

export default function UserSecurityCard() {
  const { isOpen, openModal, closeModal } = useModal();
  const { user, updateSecurityPreferences } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    user?.securityPreferences?.multifactorAuthEnabled || false
  );
  const [showQRCode, setShowQRCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [step, setStep] = useState<"setup" | "verify" | "complete">("setup");
  const [error, setError] = useState("");

  // Toggle 2FA setup modal
  const handleToggle2FA = (checked: boolean) => {
    if (checked && !twoFactorEnabled) {
      // User is enabling 2FA
      openModal();
      setStep("setup");
    } else if (!checked && twoFactorEnabled) {
      // User is disabling 2FA
      // Display confirmation dialog to disable 2FA
      // This would typically require password confirmation
      if (window.confirm("Are you sure you want to disable two-factor authentication? This will make your account less secure.")) {
        handleDisable2FA();
      } else {
        // User canceled disabling 2FA - reset the UI toggle
        setTwoFactorEnabled(true);
      }
    }
  };

  // Handle enabling 2FA
  const handleEnable2FA = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      // In production, this would call the real 2FA setup API
      // await authService.setupTwoFactorAuth();
      
      // Mock the QR code setup for development
      setTimeout(() => {
        setShowQRCode(true);
        setIsLoading(false);
        // Move to verification step
        setStep("verify");
      }, 1000);
    } catch (error: any) {
      setError(error.message || "Failed to set up two-factor authentication");
      setIsLoading(false);
    }
  };

  // Handle disabling 2FA
  const handleDisable2FA = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      // In production, this would call the real 2FA disable API
      // await authService.disableTwoFactorAuth();
      
      // Mock disabling 2FA for development
      setTimeout(() => {
        setTwoFactorEnabled(false);
        if (updateSecurityPreferences) {
          updateSecurityPreferences({
            multifactorAuthEnabled: false
          });
        }
        setIsLoading(false);
        closeModal();
      }, 1000);
    } catch (error: any) {
      setError(error.message || "Failed to disable two-factor authentication");
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
      
      // In production, this would call the real 2FA verification API
      // await authService.verifyTwoFactorAuth(verificationCode);
      
      // Mock verification for development
      setTimeout(() => {
        // Generate mock recovery codes
        const mockRecoveryCodes = Array.from({ length: 10 }, () => 
          Math.random().toString(36).substring(2, 10).toUpperCase()
        );
        
        setRecoveryCodes(mockRecoveryCodes);
        setTwoFactorEnabled(true);
        if (updateSecurityPreferences) {
          updateSecurityPreferences({
            multifactorAuthEnabled: true
          });
        }
        setIsLoading(false);
        setStep("complete");
      }, 1000);
    } catch (error: any) {
      setError(error.message || "Failed to verify the code");
      setIsLoading(false);
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
                defaultChecked={twoFactorEnabled}
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
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              {step === "setup" && "Two-factor authentication adds an extra layer of security to your account."}
              {step === "verify" && "Enter the 6-digit code from your authenticator app."}
              {step === "complete" && "Two-factor authentication has been enabled for your account."}
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
                  <Button size="sm" onClick={handleEnable2FA} loading={isLoading}>
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {/* QR Code display */}
            {step === "verify" && showQRCode && (
              <div className="mb-6">
                <div className="mb-6 flex justify-center">
                  <div className="bg-white p-4 rounded-lg">
                    {/* Mock QR code - In production, this would be a real QR code image */}
                    <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                      <p className="text-sm text-gray-600 text-center p-4">
                        QR Code Placeholder<br/>
                        (In production, scan this with your authenticator app)
                      </p>
                    </div>
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

            {/* Step 3: Complete - Show recovery codes */}
            {step === "complete" && (
              <div className="mb-6">
                <div className="mb-4">
                  <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your recovery codes (save these somewhere safe):
                  </p>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4 font-mono text-sm">
                    {recoveryCodes.map((code, index) => (
                      <div key={index} className="mb-1 flex justify-between">
                        <span>{code}</span>
                        <span className="text-gray-500 dark:text-gray-400">{index + 1}/10</span>
                      </div>
                    ))}
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
          </div>
        </div>
      </Modal>
    </div>
  );
}
