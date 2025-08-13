import { useState, useEffect } from "react";
import { Settings, Search, Check, X, FolderOpen, AlertCircle } from "lucide-react";
import {
  GetConfig,
  SaveConfig,
  ValidateGoPath,
  DetectGoPath,
} from "../../wailsjs/go/app/App";

interface GoSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GoSettings({ isOpen, onClose }: GoSettingsProps) {
  const [goPath, setGoPath] = useState("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadConfig();
    }
  }, [isOpen]);

  const loadConfig = async () => {
    try {
      const config = await GetConfig();
      if (config && config.goPath) {
        setGoPath(config.goPath);
        validatePath(config.goPath);
      }
    } catch (error) {
      console.error("Error loading configuration:", error);
    }
  };

  const validatePath = async (path: string) => {
    if (!path) {
      setIsValid(null);
      return;
    }

    setIsChecking(true);
    try {
      const valid = await ValidateGoPath(path);
      setIsValid(valid);
      if (!valid) {
        setMessage("Invalid path or Go not found");
      } else {
        setMessage("Valid Go found!");
      }
    } catch (error) {
      setIsValid(false);
      setMessage("Error validating path");
    } finally {
      setIsChecking(false);
    }
  };

  const handleDetectGo = async () => {
    setIsChecking(true);
    setMessage("Searching for Go in the system...");
    
    try {
      const detectedPath = await DetectGoPath();
      if (detectedPath) {
        setGoPath(detectedPath);
        await validatePath(detectedPath);
        setMessage("Go detected automatically!");
      } else {
        setMessage("Go not found on the system. Please install Go or configure manually.");
        setIsValid(false);
      }
    } catch (error) {
      setMessage("Error detecting Go");
      setIsValid(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSave = async () => {
    if (!goPath) {
      setMessage("Please configure the Go path");
      return;
    }

    setIsSaving(true);
    try {
      await SaveConfig(goPath);
      setMessage("Configuration saved successfully!");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setMessage("Error saving configuration");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dracula-bg rounded-lg p-6 w-[600px] max-w-[90%] border border-dracula-comment">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-dracula-purple" />
            <h2 className="text-xl font-semibold text-dracula-fg">
              Go Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-dracula-comment hover:text-dracula-fg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dracula-comment mb-2">
              Go executable path
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={goPath}
                  onChange={(e) => {
                    setGoPath(e.target.value);
                    setIsValid(null);
                    setMessage("");
                  }}
                  placeholder="/usr/local/go/bin/go"
                  className="w-full px-3 py-2 bg-dracula-current border border-dracula-comment rounded-md text-dracula-fg placeholder-dracula-comment focus:outline-none focus:ring-2 focus:ring-dracula-purple focus:border-transparent"
                />
                {isValid !== null && !isChecking && (
                  <div className="absolute right-2 top-2.5">
                    {isValid ? (
                      <Check className="w-5 h-5 text-dracula-green" />
                    ) : (
                      <X className="w-5 h-5 text-dracula-red" />
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => validatePath(goPath)}
                disabled={!goPath || isChecking}
                className="px-4 py-2 bg-dracula-current text-dracula-comment rounded-md hover:bg-dracula-comment hover:text-dracula-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Validate
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDetectGo}
              disabled={isChecking}
              className="flex items-center gap-2 px-4 py-2 bg-dracula-purple text-dracula-bg rounded-md hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search className="w-4 h-4" />
              Auto Detect
            </button>
            
            <button
              onClick={() => {
                setMessage("Use 'Auto Detect' or enter the path manually");
              }}
              className="flex items-center gap-2 px-4 py-2 bg-dracula-current text-dracula-comment rounded-md hover:bg-dracula-comment hover:text-dracula-bg transition-colors"
            >
              <FolderOpen className="w-4 h-4" />
              Browse
            </button>
          </div>

          {message && (
            <div className={`flex items-start gap-2 p-3 rounded-md ${
              isValid === false ? 'bg-dracula-red bg-opacity-20 text-dracula-red' : 
              isValid === true ? 'bg-dracula-green bg-opacity-20 text-dracula-green' : 
              'bg-dracula-cyan bg-opacity-20 text-dracula-cyan'
            }`}>
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p className="text-sm">{message}</p>
            </div>
          )}

          <div className="bg-dracula-current rounded-md p-4">
            <h3 className="text-sm font-medium text-dracula-comment mb-2">
              Important Information:
            </h3>
            <ul className="space-y-1 text-sm text-dracula-comment">
              <li>• Go must be installed on your system</li>
              <li>• You can download Go at: <a href="https://go.dev/dl/" target="_blank" rel="noopener noreferrer" className="text-dracula-purple hover:underline">go.dev/dl</a></li>
              <li>• Typical macOS path: /usr/local/go/bin/go</li>
              <li>• Typical Linux path: /usr/bin/go</li>
              <li>• Typical Windows path: C:\Program Files\Go\bin\go.exe</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-dracula-comment">
          <button
            onClick={onClose}
            className="px-4 py-2 text-dracula-comment hover:text-dracula-fg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!goPath || isValid === false || isSaving}
            className="px-4 py-2 bg-dracula-green text-dracula-bg rounded-md hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}