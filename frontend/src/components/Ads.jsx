import React from 'react';

// Ad placeholder component - replace with actual Google AdSense code
// To activate: Replace the placeholder div with your AdSense ad unit code
// Example: <ins className="adsbygoogle" data-ad-client="ca-pub-XXXXX" data-ad-slot="XXXXX"></ins>

export const StickyBannerAd = () => {
  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-white/10 p-2 md:p-3"
      data-testid="sticky-banner-ad"
    >
      <div className="max-w-4xl mx-auto">
        {/* Replace this placeholder with actual AdSense code */}
        <div className="bg-slate-800/50 rounded-lg h-[50px] md:h-[60px] flex items-center justify-center text-xs text-slate-500 border border-slate-700/50">
          <div className="text-center">
            <p className="text-slate-400">Advertisement</p>
            <p className="text-[10px]">Upgrade to Premium for ad-free experience</p>
          </div>
        </div>
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

export default { StickyBannerAd, InFeedAd, InterstitialAd };
