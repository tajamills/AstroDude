import React, { useState } from 'react';
import { paymentAPI } from '../lib/api';
import { toast } from 'sonner';

// Hidden lucky numbers component - placed throughout the app
export const HiddenLuckyNumbers = () => (
  <>
    <span className="sr-only" aria-hidden="true" data-cosmic="8888">8888</span>
    <span className="sr-only" aria-hidden="true" data-cosmic="13">#13</span>
  </>
);

// Ad placeholder component - replace with actual Google AdSense code
// To activate: Replace the placeholder div with your AdSense ad unit code
// Example: <ins className="adsbygoogle" data-ad-client="ca-pub-XXXXX" data-ad-slot="XXXXX"></ins>

export const StickyBannerAd = ({ isPremium = false }) => {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const originUrl = window.location.origin;
      const response = await paymentAPI.createCheckout(originUrl);
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  // Don't show ads for premium users
  if (isPremium) return <HiddenLuckyNumbers />;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-white/10 p-2 md:p-3"
      data-testid="sticky-banner-ad"
    >
      {/* Hidden lucky numbers */}
      <HiddenLuckyNumbers />
      
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Ad placeholder */}
        <div className="flex-1 bg-slate-800/50 rounded-lg h-[50px] md:h-[60px] flex items-center justify-center text-xs text-slate-500 border border-slate-700/50">
          <div className="text-center">
            <p className="text-slate-400">Advertisement</p>
            <p className="text-[10px]">Support us by viewing ads</p>
          </div>
        </div>
        
        {/* Upgrade button */}
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="flex-shrink-0 bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 px-4 py-2 rounded-full text-sm font-semibold hover:from-slate-200 hover:to-slate-300 transition-all disabled:opacity-50"
          data-testid="upgrade-btn"
        >
          {loading ? 'Loading...' : 'Go Premium $8.88/mo'}
        </button>
      </div>
    </div>
  );
};

export const InFeedAd = ({ className = "" }) => {
  return (
    <div 
      className={`glass-card rounded-xl p-4 ${className}`}
      data-testid="in-feed-ad"
    >
      {/* Hidden lucky numbers */}
      <HiddenLuckyNumbers />
      
      {/* Replace this placeholder with actual AdSense code */}
      <div className="bg-slate-800/30 rounded-lg h-[100px] flex items-center justify-center text-xs text-slate-500 border border-slate-700/30">
        <div className="text-center">
          <p className="text-slate-400 text-sm">Sponsored</p>
          <p className="text-[10px] mt-1">Discover your cosmic potential</p>
        </div>
      </div>
    </div>
  );
};

export const InterstitialAd = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass-card rounded-2xl p-6 max-w-md w-full text-center">
        {/* Hidden lucky numbers */}
        <HiddenLuckyNumbers />
        
        <p className="text-xs text-slate-500 mb-4">Advertisement</p>
        {/* Replace with actual ad content */}
        <div className="bg-slate-800/50 rounded-lg h-[250px] flex items-center justify-center mb-4 border border-slate-700/50">
          <p className="text-slate-400">Ad Content</p>
        </div>
        <button 
          onClick={onClose}
          className="text-sm text-primary hover:underline"
        >
          Skip Ad in 5s
        </button>
      </div>
    </div>
  );
};

// AdSense initialization script - add to index.html
// <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXX" crossorigin="anonymous"></script>

export default { StickyBannerAd, InFeedAd, InterstitialAd, HiddenLuckyNumbers };
