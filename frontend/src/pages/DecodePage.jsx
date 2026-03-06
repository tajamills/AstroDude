import React, { useState } from 'react';
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
  getScoreColor, getScoreLabel, getScoreBadgeClass, COLOR_MAP 
} from '../lib/utils';
import { 
  ArrowLeft, Sparkles, Calendar, Search, Star, 
  Briefcase, CheckCircle2, XCircle, BookOpen, Award
} from 'lucide-react';

const DecodePage = () => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleDecode = async () => {
    if (!selectedDate) {
      toast.error('Please select a date to decode');
      return;
    }

    setLoading(true);
    try {
      const response = await luckAPI.getForDate(selectedDate);
      setResult(response.data);
    } catch (error) {
      console.error('Failed to decode date:', error);
      toast.error('Failed to decode date. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const presetDates = [
    { label: 'Today', getValue: () => new Date().toISOString().split('T')[0] },
    { label: 'Tomorrow', getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    }},
    { label: 'Next Week', getValue: () => {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      return d.toISOString().split('T')[0];
    }},
    { label: 'Next Month', getValue: () => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d.toISOString().split('T')[0];
    }},
  ];

  return (
    <div className="min-h-screen cosmic-bg pb-20">
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-10 pointer-events-none"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1579398707644-ff84b1e6931f?w=1920&q=80)` }}
      />

      {/* Navigation */}
      <nav className="relative z-10 px-4 py-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-white/70 hover:text-white"
            data-testid="back-to-dashboard-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-bold gradient-text hidden sm:inline">AstroLaunch</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Decode Any Date</h1>
          <p className="text-muted-foreground mb-8">Discover the cosmic energy of any date - birthdays, events, business launches</p>
        </motion.div>

        {/* Date Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 mb-6"
        >
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1">
              <Label className="text-muted-foreground mb-2 block">Select a Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="auth-input"
                data-testid="decode-date-input"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleDecode}
                disabled={loading || !selectedDate}
                className="w-full sm:w-auto bg-primary text-primary-foreground rounded-xl px-6 glow-silver"
                data-testid="decode-btn"
              >
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Decoding...' : 'Decode'}
              </Button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2">
            {presetDates.map((preset) => (
              <button
                key={preset.label}
                onClick={() => setSelectedDate(preset.getValue())}
                className="px-3 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 transition-colors"
              >
                {preset.label}
              </button>
            ))}
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
              <Skeleton className="h-48 w-full rounded-2xl" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-32 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
            </motion.div>
          )}

          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Main Score Card */}
              <div className="glass-card rounded-2xl p-6">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div 
                    className="w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold"
                    style={{ 
                      backgroundColor: `${getScoreColor(result.total_score)}20`,
                      color: getScoreColor(result.total_score),
                      boxShadow: `0 0 30px ${getScoreColor(result.total_score)}40`
                    }}
                  >
                    {result.total_score}
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <p className="text-sm text-muted-foreground mb-1">
                      {new Date(selectedDate).toLocaleDateString('en-US', { 
                        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
                      })}
                    </p>
                    <span className={`score-badge ${getScoreBadgeClass(result.total_score)} mb-3 inline-block`}>
                      {getScoreLabel(result.total_score)}
                    </span>
                    <p className="text-muted-foreground">{result.interpretation}</p>
                  </div>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Day Officer */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-red-400" />
                    <h3 className="text-sm font-medium">Day Officer</h3>
                  </div>
                  <p className="text-lg font-bold">{result.day_officer}</p>
                  <p className="text-xs text-muted-foreground">{result.day_officer_chinese}</p>
                </div>

                {/* Business Quality */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-medium">Business Day</h3>
                  </div>
                  <p className={`text-lg font-bold ${
                    result.business_quality === 'Excellent' ? 'text-green-400' :
                    result.business_quality === 'Good' ? 'text-primary' :
                    result.business_quality === 'Moderate' ? 'text-slate-300' :
                    'text-red-400'
                  }`}>{result.business_quality}</p>
                  <p className="text-xs text-muted-foreground">{result.business_description}</p>
                </div>

                {/* Day Zodiac */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-medium">Day Energy</h3>
                  </div>
                  <p className="text-lg font-bold">{result.day_zodiac}</p>
                  <p className="text-xs text-muted-foreground">{result.day_stem_branch}</p>
                </div>

                {/* Lucky Number */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-medium">Lucky Number</h3>
                  </div>
                  <p className="text-2xl font-bold text-primary">{result.lucky_number}</p>
                  <p className="text-xs text-muted-foreground">{result.lucky_number_meaning}</p>
                </div>

                {/* Lucky Color */}
                <div className="glass-card rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLOR_MAP[result.lucky_color] || result.lucky_color }}
                    />
                    <h3 className="text-sm font-medium">Lucky Color</h3>
                  </div>
                  <p className="text-lg font-bold">{result.lucky_color}</p>
                </div>

                {/* Forgiveness Day */}
                {result.is_forgiveness_day && (
                  <div className="glass-card rounded-xl p-4 border border-primary/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="w-4 h-4 text-primary" />
                      <h3 className="text-sm font-medium text-primary">Special Day!</h3>
                    </div>
                    <p className="text-sm">Day Forgiveness (天赦日)</p>
                    <p className="text-xs text-muted-foreground">Highly auspicious for new beginnings</p>
                  </div>
                )}
              </div>

              {/* Activities */}
              <div className="glass-card rounded-xl p-6">
                <h3 className="text-sm font-medium mb-4">Recommended Activities</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-green-400">Good For</span>
                    </div>
                    <ul className="space-y-1">
                      {result.officer_good_for?.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-400">Avoid</span>
                    </div>
                    <ul className="space-y-1">
                      {result.officer_avoid?.map((item, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sticky Banner Ad */}
      <StickyBannerAd />
    </div>
  );
};

export default DecodePage;
