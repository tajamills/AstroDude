import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { luckAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { StickyBannerAd } from '../components/Ads';
import { 
  getScoreColor, getScoreLabel, COLOR_MAP 
} from '../lib/utils';
import { 
  ArrowLeft, Calendar, Search, Zap, AlertTriangle, 
  Briefcase, TrendingUp, Share2, Copy, Cake, Plane, Building2
} from 'lucide-react';

// Get launch-focused label
const getLaunchLabel = (score) => {
  if (score >= 85) return 'PERFECT DAY TO LAUNCH';
  if (score >= 70) return 'GOOD DAY TO BUILD';
  if (score >= 55) return 'PROCEED WITH CAUTION';
  if (score >= 40) return 'BETTER FOR PLANNING';
  return 'NOT RECOMMENDED';
};

// Get launch signal
const getLaunchSignal = (score, businessQuality) => {
  if (score >= 85 && businessQuality === 'Excellent') return { label: 'Strong', color: 'text-green-400', bg: 'bg-green-500/20', icon: '⚡' };
  if (score >= 70) return { label: 'Favorable', color: 'text-primary', bg: 'bg-primary/20', icon: '✓' };
  if (score >= 55) return { label: 'Neutral', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: '○' };
  return { label: 'Weak', color: 'text-red-400', bg: 'bg-red-500/20', icon: '⚠' };
};

// Generate quick signals from result
const getSignals = (result) => {
  const signals = [];
  
  // Business signal
  if (result.business_quality === 'Excellent') {
    signals.push({ text: 'Strong business energy', positive: true });
  } else if (result.business_quality === 'Good') {
    signals.push({ text: 'Favorable for networking', positive: true });
  } else if (result.business_quality === 'Moderate') {
    signals.push({ text: 'Good for planning', positive: true });
  } else {
    signals.push({ text: 'Avoid major decisions', positive: false });
  }
  
  // Score-based signal
  if (result.total_score >= 75) {
    signals.push({ text: 'High success probability', positive: true });
  } else if (result.total_score >= 60) {
    signals.push({ text: 'Moderate opportunity day', positive: true });
  } else {
    signals.push({ text: 'Focus on preparation', positive: false });
  }
  
  // Risk signal
  if (result.total_score < 50) {
    signals.push({ text: 'Avoid risky launches', positive: false });
  } else if (result.total_score >= 80) {
    signals.push({ text: 'Green light for action', positive: true });
  } else {
    signals.push({ text: 'Test before committing', positive: null });
  }
  
  return signals;
};

const DecodePage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [compareDate, setCompareDate] = useState('');
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const shareCardRef = useRef(null);

  const handleDecode = async () => {
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    setLoading(true);
    setShowCompare(false);
    setCompareResult(null);
    try {
      const response = await luckAPI.getForDate(selectedDate);
      setResult(response.data);
    } catch (error) {
      toast.error('Failed to decode date');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!compareDate) {
      toast.error('Please select a date to compare');
      return;
    }
    setCompareLoading(true);
    try {
      const response = await luckAPI.getForDate(compareDate);
      setCompareResult(response.data);
    } catch (error) {
      toast.error('Failed to decode comparison date');
    } finally {
      setCompareLoading(false);
    }
  };

  const handleShare = async () => {
    if (!result) return;
    
    const text = `DATE ENERGY - ${formatDate(selectedDate)}\n\nScore: ${result.total_score}\n${getLaunchLabel(result.total_score)}\n\nSignals:\n${getSignals(result).map(s => `${s.positive ? '✓' : '⚠'} ${s.text}`).join('\n')}\n\n8starluck.com`;
    
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ 
          title: '8StarLuck - Date Energy',
          text: text
        });
        return;
      } catch (e) {
        // User cancelled or share failed, fall through to clipboard
        if (e.name !== 'AbortError') {
          copyToClipboard(text);
        }
      }
    } else {
      // Desktop fallback - copy to clipboard
      copyToClipboard(text);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        toast.success('Copied to clipboard!');
      } catch (e) {
        toast.error('Failed to copy');
      }
      document.body.removeChild(textArea);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
    });
  };

  const formatShortDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric' 
    });
  };

  const suggestedDates = [
    { label: 'Your birthday', icon: Cake, placeholder: 'When were you born?' },
    { label: 'Company launch', icon: Building2, placeholder: 'When did you start?' },
    { label: 'Next trip', icon: Plane, placeholder: 'When are you traveling?' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 pb-24">
      {/* Subtle glow effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 px-4 py-4 border-b border-white/5">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-white/60 hover:text-white"
            data-testid="back-to-dashboard-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <img 
              src="https://static.prod-images.emergentagent.com/jobs/1dbb2fa2-fcd8-42a8-8162-f3f40f16aa0f/images/6ffb8cd872d8f9fcf005a6e679bb1eaaafac262a5a67b5fa1de793b1ab31c7c5.png" 
              alt="8StarLuck" 
              className="w-7 h-7 object-contain"
            />
            <span className="font-bold gradient-text hidden sm:inline">8StarLuck</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-8 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Is This a Good Day to Launch?</h1>
          <p className="text-muted-foreground text-lg">
            Decode the hidden signals behind any date — launches, deals, travel, and big decisions.
          </p>
        </motion.div>

        {/* Date Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-800/50 border-white/10 h-12 text-base"
                data-testid="decode-date-input"
              />
            </div>
            <Button
              onClick={handleDecode}
              disabled={loading || !selectedDate}
              className="h-12 px-8 bg-primary text-primary-foreground rounded-xl font-semibold"
              data-testid="decode-btn"
            >
              <Search className="w-4 h-4 mr-2" />
              {loading ? 'Decoding...' : 'Decode Date'}
            </Button>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-xl" />
            </motion.div>
          )}

          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* HERO SCORE */}
              <div 
                ref={shareCardRef}
                className="glass-card rounded-2xl p-8 text-center relative overflow-hidden"
                style={{ 
                  boxShadow: `0 0 60px ${getScoreColor(result.total_score)}15`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
                
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', duration: 0.6 }}
                  className="relative"
                >
                  <div 
                    className="text-7xl md:text-8xl font-bold mb-2"
                    style={{ color: getScoreColor(result.total_score) }}
                  >
                    {result.total_score}
                  </div>
                  <div className="text-xl md:text-2xl font-bold tracking-wide mb-3" style={{ color: getScoreColor(result.total_score) }}>
                    {getLaunchLabel(result.total_score)}
                  </div>
                  <div className="text-muted-foreground">
                    {formatDate(selectedDate)}
                  </div>
                </motion.div>
              </div>

              {/* SIGNALS */}
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Signals Today</h3>
                <div className="space-y-3">
                  {getSignals(result).map((signal, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`text-lg ${signal.positive === true ? 'text-green-400' : signal.positive === false ? 'text-red-400' : 'text-yellow-400'}`}>
                        {signal.positive === true ? '✓' : signal.positive === false ? '⚠' : '○'}
                      </span>
                      <span className="text-white/90">{signal.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* INSIGHT CARDS */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {/* Launch Signal */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span className="text-xs text-muted-foreground uppercase">Launch Signal</span>
                  </div>
                  <div className={`text-lg font-bold ${getLaunchSignal(result.total_score, result.business_quality).color}`}>
                    {getLaunchSignal(result.total_score, result.business_quality).icon} {getLaunchSignal(result.total_score, result.business_quality).label}
                  </div>
                </div>

                {/* Risk Signal */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-orange-400" />
                    <span className="text-xs text-muted-foreground uppercase">Risk Signal</span>
                  </div>
                  <div className={`text-lg font-bold ${result.total_score >= 60 ? 'text-green-400' : result.total_score >= 45 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {result.total_score >= 60 ? '✓ Low Risk' : result.total_score >= 45 ? '○ Caution' : '⚠ High Risk'}
                  </div>
                </div>

                {/* Business Signal */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase">Business Signal</span>
                  </div>
                  <div className={`text-lg font-bold ${
                    result.business_quality === 'Excellent' ? 'text-green-400' :
                    result.business_quality === 'Good' ? 'text-primary' :
                    result.business_quality === 'Moderate' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {result.business_quality === 'Excellent' ? '✓' : result.business_quality === 'Good' ? '✓' : '○'} {result.business_quality}
                  </div>
                </div>

                {/* Energy Animal */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs text-muted-foreground uppercase">Energy Animal</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {result.day_zodiac}
                  </div>
                  <div className="text-xs text-muted-foreground">{result.day_stem_branch}</div>
                </div>

                {/* Lucky Number */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground uppercase">Lucky Number</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {result.lucky_number}
                  </div>
                </div>

                {/* Lucky Color */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLOR_MAP[result.lucky_color] || result.lucky_color }}
                    />
                    <span className="text-xs text-muted-foreground uppercase">Lucky Color</span>
                  </div>
                  <div className="text-lg font-bold text-white">
                    {result.lucky_color}
                  </div>
                </div>
              </div>

              {/* COMPARE DATE */}
              <div className="glass-card rounded-xl p-5">
                <button 
                  onClick={() => setShowCompare(!showCompare)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Compare Another Date</h3>
                    <span className="text-muted-foreground">{showCompare ? '−' : '+'}</span>
                  </div>
                </button>
                
                {showCompare && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-4"
                  >
                    <div className="flex gap-3 mb-4">
                      <Input
                        type="date"
                        value={compareDate}
                        onChange={(e) => setCompareDate(e.target.value)}
                        className="bg-slate-800/50 border-white/10"
                      />
                      <Button
                        onClick={handleCompare}
                        disabled={compareLoading || !compareDate}
                        className="px-6"
                      >
                        {compareLoading ? 'Loading...' : 'Compare'}
                      </Button>
                    </div>

                    {compareResult && (
                      <div className="bg-slate-800/30 rounded-xl p-4">
                        <div className="text-center mb-3 text-sm text-muted-foreground uppercase">Launch Date Battle</div>
                        <div className="flex items-center justify-center gap-4">
                          <div className="text-center flex-1">
                            <div className="text-sm text-muted-foreground mb-1">{formatShortDate(selectedDate)}</div>
                            <div className="text-3xl font-bold" style={{ color: getScoreColor(result.total_score) }}>
                              {result.total_score}
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-muted-foreground">VS</div>
                          <div className="text-center flex-1">
                            <div className="text-sm text-muted-foreground mb-1">{formatShortDate(compareDate)}</div>
                            <div className="text-3xl font-bold" style={{ color: getScoreColor(compareResult.total_score) }}>
                              {compareResult.total_score}
                            </div>
                          </div>
                        </div>
                        <div className="text-center mt-4 pt-3 border-t border-white/10">
                          <span className="text-sm text-muted-foreground">Winner: </span>
                          <span className="font-bold text-green-400">
                            {result.total_score >= compareResult.total_score 
                              ? formatShortDate(selectedDate) 
                              : formatShortDate(compareDate)
                            }
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* SHARE RESULT */}
              <div className="glass-card rounded-xl p-5 border border-primary/20">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Share Result</h3>
                
                {/* Share Preview */}
                <div className="bg-slate-900 rounded-lg p-4 mb-4 border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <img 
                      src="https://static.prod-images.emergentagent.com/jobs/1dbb2fa2-fcd8-42a8-8162-f3f40f16aa0f/images/6ffb8cd872d8f9fcf005a6e679bb1eaaafac262a5a67b5fa1de793b1ab31c7c5.png" 
                      alt="8StarLuck" 
                      className="w-5 h-5"
                    />
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Date Energy</span>
                  </div>
                  <div className="text-lg font-bold mb-1">{formatShortDate(selectedDate)}, {new Date(selectedDate).getFullYear()}</div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-bold" style={{ color: getScoreColor(result.total_score) }}>{result.total_score}</span>
                    <span className="text-sm text-muted-foreground">{getLaunchLabel(result.total_score)}</span>
                  </div>
                  <div className="text-sm space-y-1">
                    {getSignals(result).slice(0, 3).map((s, i) => (
                      <div key={i} className={s.positive ? 'text-green-400/80' : 'text-red-400/80'}>
                        {s.positive ? '✓' : '⚠'} {s.text}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button onClick={handleShare} className="flex-1" variant="outline">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button onClick={() => copyToClipboard(`Check out ${formatShortDate(selectedDate)} - Score: ${result.total_score} (${getLaunchLabel(result.total_score)}) 8starluck.com`)} variant="outline">
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* EXPLORATION PROMPTS */}
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Try Decoding</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {suggestedDates.map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedDate('');
                          setResult(null);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                          toast.info(item.placeholder);
                        }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
                      >
                        <Icon className="w-5 h-5 text-primary" />
                        <span className="text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <StickyBannerAd />
    </div>
  );
};

export default DecodePage;
