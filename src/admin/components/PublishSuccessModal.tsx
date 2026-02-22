import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { copyToClipboard } from '../../shared/utils/helpers';
import { AppIcon } from '../../shared/icons/AppIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface PublishSuccessModalProps {
  isOpen: boolean;
  proposalUrl: string;
  shortCode?: string;
  partnerName: string;
  proposalTitle: string;
  onClose: () => void;
}

export function PublishSuccessModal({
  isOpen,
  proposalUrl,
  shortCode,
  partnerName,
  proposalTitle,
  onClose,
}: PublishSuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const sharedUrl = shortCode ? `${window.location.origin}/s/${shortCode}` : proposalUrl;

  const handleCopyLink = async () => {
    await copyToClipboard(sharedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenInNewTab = () => {
    window.open(sharedUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSendEmail = () => {
    if (!emailTo.trim()) return;
    const subject = encodeURIComponent(`${proposalTitle} — Partnership Proposal`);
    const body = encodeURIComponent(
      `Hi,\n\nI'd like to share a partnership proposal with you: "${proposalTitle}".\n\nYou can view the full presentation here:\n${sharedUrl}\n\nLooking forward to your feedback!\n\nBest regards`
    );
    window.open(`mailto:${emailTo.trim()}?subject=${subject}&body=${body}`, '_self');
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSendEmail();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <AnimatePresence mode="wait">
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.25, type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <AppIcon icon="ui.check" className="w-6 h-6 text-green-500" />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          <DialogTitle className="text-center">Proposal published</DialogTitle>
          <DialogDescription className="text-center">
            Your proposal for <span className="font-medium text-gray-700">{partnerName}</span> is
            now live and ready to share.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Proposal link */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Proposal link</label>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={sharedUrl}
                className="text-xs font-mono text-gray-600 bg-gray-50"
                onFocus={(e) => e.target.select()}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex-shrink-0 gap-1.5 text-xs min-w-[5.5rem]"
              >
                {copied ? (
                  <><AppIcon icon="ui.check" className="w-3.5 h-3.5 text-green-500" /> Copied!</>
                ) : (
                  <><AppIcon icon="ui.copy" className="w-3.5 h-3.5" /> Copy link</>
                )}
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Direct link</label>
            <Input
              readOnly
              value={proposalUrl}
              className="text-xs font-mono text-gray-500 bg-gray-50"
              onFocus={(e) => e.target.select()}
            />
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenInNewTab}
              className="flex-1 gap-1.5 text-xs"
            >
              <AppIcon icon="ui.globe" className="w-3.5 h-3.5" />
              Open preview
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="flex-1 gap-1.5 text-xs"
            >
              <AppIcon icon="ui.share" className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Share link'}
            </Button>
          </div>

          {/* Send via email */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Send via email
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="partner@company.com"
                className="text-sm"
              />
              <Button
                type="button"
                size="sm"
                disabled={!emailTo.trim()}
                onClick={handleSendEmail}
                className="flex-shrink-0 gap-1.5 text-xs min-w-[5rem]"
              >
                {emailSent ? (
                  <><AppIcon icon="ui.check" className="w-3.5 h-3.5" /> Sent</>
                ) : (
                  <><AppIcon icon="ui.mail-send" className="w-3.5 h-3.5" /> Send</>
                )}
              </Button>
            </div>
            <p className="mt-1 text-[11px] text-gray-400">
              Opens your default email client with a pre-filled message.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
