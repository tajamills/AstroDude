import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { luckAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { StickyBannerAd, InFeedAd } from '../components/Ads';
import { toast } from 'sonner';
import { getScoreColor, getScoreLabel, getScoreBadgeClass, COLOR_MAP, formatShortDate } from '../lib/utils';
import { ArrowLeft, Sparkles, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const History = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await luckAPI.getHistory(30);
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const getTrend = (current, previous) => {
    if (!previous) return null;
    const diff = current - previous;
    if (diff > 5) return { icon: TrendingUp, color: 'text-green-400', label: `+${diff}` };
    if (diff < -5) return { icon: TrendingDown, color: 'text-red-400', label: `${diff}` };
    return { icon: Minus, color: 'text-muted-foreground', label: '0' };
  };

  const averageScore = history.length > 0 
    ? Math.round(history.reduce((sum, h) => sum + h.total_score, 0) / history.length)
    : 0;

  const bestDay = history.length > 0 
    ? history.reduce((best, h) => h.total_score > best.total_score ? h : best)
    : null;

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
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Score History</h1>
          <p className="text-muted-foreground mb-8">Track your cosmic journey over time</p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-xl p-4"
            data-testid="stats-total-days"
          >
            <p className="text-xs text-muted-foreground mb-1">Days Tracked</p>
            <p className="text-2xl font-bold">{loading ? '...' : history.length}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl p-4"
            data-testid="stats-average"
          >
            <p className="text-xs text-muted-foreground mb-1">Average Score</p>
            <p className="text-2xl font-bold" style={{ color: getScoreColor(averageScore) }}>
              {loading ? '...' : averageScore}
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-xl p-4 col-span-2 md:col-span-1"
            data-testid="stats-best-day"
          >
            <p className="text-xs text-muted-foreground mb-1">Best Day</p>
            {loading ? (
              <Skeleton className="h-7 w-20" />
            ) : bestDay ? (
              <p className="text-lg font-bold">
                <span style={{ color: getScoreColor(bestDay.total_score) }}>{bestDay.total_score}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  {formatShortDate(bestDay.date)}
                </span>
              </p>
            ) : (
              <p className="text-muted-foreground">No data yet</p>
            )}
          </motion.div>
        </div>

        {/* History List */}
        <div className="space-y-3">
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))
          ) : history.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No history yet. Check back tomorrow!</p>
            </div>
          ) : (
            history.map((item, index) => {
              const trend = getTrend(item.total_score, history[index + 1]?.total_score);
              const TrendIcon = trend?.icon;
              const showAd = index > 0 && index % 5 === 0; // Show ad every 5 items
              
              return (
                <React.Fragment key={item.id}>
                  {showAd && <InFeedAd />}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass-card rounded-xl p-4 flex items-center gap-4"
                    data-testid={`history-item-${index}`}
                  >
                    <div className="flex-shrink-0">
                      <div 
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-bold"
                        style={{ 
                          backgroundColor: `${getScoreColor(item.total_score)}20`,
                          color: getScoreColor(item.total_score)
                        }}
                      >
                        {item.total_score}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium">{formatShortDate(item.date)}</p>
                        <span className={`score-badge text-xs ${getScoreBadgeClass(item.total_score)}`}>
                          {getScoreLabel(item.total_score)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {item.zodiac_sign} • {item.lucky_color} • #{item.lucky_number}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: COLOR_MAP[item.lucky_color] || item.lucky_color }}
                      />
                      {trend && (
                        <div className={`flex items-center gap-1 ${trend.color}`}>
                          <TrendIcon className="w-4 h-4" />
                          <span className="text-xs">{trend.label}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })
          )}
        </div>
      </main>

      {/* Sticky Banner Ad */}
      <StickyBannerAd />
    </div>
  );
};

export default History;
