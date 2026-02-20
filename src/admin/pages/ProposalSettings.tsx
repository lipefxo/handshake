import { motion } from 'motion/react';
import { useState, useRef, useCallback } from 'react';
import { AppIcon } from '../../shared/icons/AppIcon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const LIMITS = {
  companyName: 50,
  email: 100,
};

function CharCounter({ value, max }: { value: string; max: number }) {
  const remaining = max - value.length;
  const isNearLimit = remaining <= Math.floor(max * 0.15);
  return (
    <span
      className="text-xs tabular-nums"
      style={{ color: isNearLimit ? (remaining <= 0 ? '#ef4444' : '#f59e0b') : '#9ca3af' }}
    >
      {value.length}/{max}
    </span>
  );
}

interface LogoUploadProps {
  logo: string | null;
  onLogoChange: (dataUrl: string | null) => void;
}

function LogoUpload({ logo, onLogoChange }: LogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => onLogoChange(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="flex items-start gap-4">
      {/* Preview */}
      <div
        className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)' }}
      >
        {logo ? (
          <img src={logo} alt="Company logo" className="w-full h-full object-contain" />
        ) : (
          <AppIcon icon="ui.image" className="w-6 h-6 text-gray-300" />
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        role="button"
        tabIndex={0}
        className="flex-1 cursor-pointer rounded-xl border-2 border-dashed px-4 py-4 transition-colors duration-150 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 focus-visible:ring-offset-2"
        style={{
          borderColor: dragging ? '#6366f1' : '#e5e7eb',
          background: dragging ? 'rgba(99,102,241,0.04)' : '#fafafa',
        }}
      >
        <p className="text-xs font-medium text-gray-600">
          {dragging ? 'Drop to upload' : 'Click or drag to upload logo'}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">PNG, JPG, SVG · Recommended 256×256</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {logo && (
        <Button
          type="button"
          onClick={() => onLogoChange(null)}
          variant="ghost"
          size="sm"
          className="mt-1 h-auto flex-shrink-0 px-2 py-1 text-xs text-gray-500 hover:text-red-500"
          title="Remove logo"
        >
          Remove
        </Button>
      )}
    </div>
  );
}

export function ProposalSettings() {
  const [companyName, setCompanyName] = useState('SecureBags');
  const [email, setEmail] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [companyNameTouched, setCompanyNameTouched] = useState(false);

  const companyNameError = companyNameTouched && companyName.trim() === ''
    ? 'Company name is required'
    : companyName.length > LIMITS.companyName
    ? `Max ${LIMITS.companyName} characters`
    : null;

  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Global settings for your proposal workspace.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Brand */}
        <Card className="rounded-2xl border-gray-100">
          <CardHeader>
            <CardTitle className="text-sm text-gray-900">Brand</CardTitle>
            <CardDescription className="text-xs">Configure your company's identity for proposals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Logo */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Company logo</label>
              <LogoUpload logo={logo} onLogoChange={setLogo} />
            </div>

            {/* Company name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600">
                  Company name
                  <span className="text-red-500 ml-0.5">*</span>
                </label>
                <CharCounter value={companyName} max={LIMITS.companyName} />
              </div>
              <Input
                className={cn(companyNameError && 'border-red-400 focus-visible:ring-red-200')}
                value={companyName}
                maxLength={LIMITS.companyName}
                required
                onChange={(e) => setCompanyName(e.target.value)}
                onBlur={() => setCompanyNameTouched(true)}
              />
              {companyNameError && (
                <p className="text-xs text-red-500 mt-1">{companyNameError}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-gray-600">Default contact email</label>
                <CharCounter value={email} max={LIMITS.email} />
              </div>
              <Input
                type="email"
                placeholder="contact@securebags.com"
                value={email}
                maxLength={LIMITS.email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Domain */}
        <Card className="rounded-2xl border-gray-100">
          <CardHeader>
            <CardTitle className="text-sm text-gray-900">Public URL</CardTitle>
            <CardDescription className="text-xs">Proposals are publicly accessible at this domain.</CardDescription>
          </CardHeader>
          <CardContent>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
            <AppIcon icon="ui.external-link" className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 font-mono">partners.securebags.com/p/</span>
            <span className="text-sm text-gray-400 font-mono">{'{slug}'}</span>
          </div>
          </CardContent>
        </Card>

        {/* Supabase info */}
        <Card className="rounded-2xl border-gray-100">
          <CardHeader>
            <CardTitle className="text-sm text-gray-900">Database</CardTitle>
            <CardDescription className="text-xs">Connected to Supabase.</CardDescription>
          </CardHeader>
          <CardContent>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-gray-500">Connected</span>
          </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
