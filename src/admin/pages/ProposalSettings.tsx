import { motion } from 'motion/react';

export function ProposalSettings() {
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
        <section className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Brand</h2>
          <p className="text-xs text-gray-400 mb-5">Configure your company's identity for proposals.</p>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Company name</label>
              <input className="admin-input" defaultValue="SecureBags" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Default contact email</label>
              <input className="admin-input" type="email" placeholder="contact@securebags.com" />
            </div>
          </div>
        </section>

        {/* Domain */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Public URL</h2>
          <p className="text-xs text-gray-400 mb-5">Proposals are publicly accessible at this domain.</p>
          <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-sm text-gray-600 font-mono">partners.securebags.com/p/</span>
            <span className="text-sm text-gray-400 font-mono">{'{slug}'}</span>
          </div>
        </section>

        {/* Supabase info */}
        <section className="bg-white border border-gray-100 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Database</h2>
          <p className="text-xs text-gray-400 mb-4">Connected to Supabase.</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-gray-500">Connected</span>
          </div>
        </section>
      </motion.div>
    </div>
  );
}
