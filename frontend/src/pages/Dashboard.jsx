import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { luckAPI, paymentAPI, locationsAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { StickyBannerAd, HiddenLuckyNumbers } from '../components/Ads';
import { toast } from 'sonner';
import { 
  getScoreColor, getScoreLabel, getScoreBadgeClass, 
  COLOR_MAP, formatDate 
} from '../lib/utils';
import { 
  Sparkles, LogOut, Calendar, History, User,
  CheckCircle2, XCircle, Star, Flame, Droplets,
  Mountain, Leaf, CircleDot, Briefcase, BookOpen, Award, Search, Crown,
  MapPin, Heart, DollarSign, ChevronRight
} from 'lucide-react';

const ELEMENT_ICONS = {
  Wood: Leaf,
  Fire: Flame,
  Earth: Mountain,
  Metal: CircleDot,
  Water: Droplets,
};

const LuckMeter = ({ score, loading }) => {
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  if (loading) {
    return (
      <div className="luck-meter mx-auto">
        <Skeleton className="w-full h-full rounded-full" />
      </div>
    );
  }

  return (
    <div className="luck-meter mx-auto">
      <svg className="luck-meter-circle w-full h-full" viewBox="0 0 160 160">
        <circle className="luck-meter-bg" cx="80" cy="80" r="70" />
        <motion.circle
          className="luck-meter-progress"
          cx="80"
          cy="80"
          r="70"
          stroke={color}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="luck-meter-score">
        <motion.span
          className="text-5xl font-bold"
          style={{ color }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, type: "spring" }}
        >
          {score}
        </motion.span>
        <p className="text-sm text-muted-foreground mt-1">out of 100</p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [luckData, setLuckData] = useState(null);
  const [weekForecast, setWeekForecast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [topLocations, setTopLocations] = useState([]);

  useEffect(() => {
    fetchData();
    checkPremiumStatus();
    fetchTopLocations();
  }, []);

  const fetchData = async () => {
    try {
      const [todayRes, weekRes] = await Promise.all([
        luckAPI.getToday(),
        luckAPI.getWeekForecast()
      ]);
      setLuckData(todayRes.data);
      setWeekForecast(weekRes.data);
    } catch (error) {
      console.error('Failed to fetch luck data:', error);
      if (error.response?.status === 400) {
        navigate('/onboarding');
        return;
      }
      toast.error('Failed to load your luck score');
    } finally {
      setLoading(false);
    }
  };

  const checkPremiumStatus = async () => {
    try {
      const response = await paymentAPI.getPremiumStatus();
      setIsPremium(response.data.is_premium);
    } catch (error) {
      console.error('Failed to check premium status:', error);
    }
  };

  const fetchTopLocations = async () => {
    try {
      const response = await locationsAPI.getMyLocations();
      // Get top location from each category
      const locations = response.data.locations;
      const top = [];
      if (locations.love?.[0]) top.push({ ...locations.love[0], category: 'love' });
      if (locations.money?.[0]) top.push({ ...locations.money[0], category: 'money' });
      if (locations.spiritual?.[0]) top.push({ ...locations.spiritual[0], category: 'spiritual' });
      setTopLocations(top);
    } catch (error) {
      console.error('Failed to fetch locations:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const ElementIcon = luckData?.dominant_element 
    ? ELEMENT_ICONS[luckData.dominant_element] || Star 
    : Star;

  const luckyColorHex = luckData?.lucky_color 
    ? COLOR_MAP[luckData.lucky_color] || luckData.lucky_color 
    : '#F59E0B';

  return (
    <div className="min-h-screen cosmic-bg pb-20">
      {/* Hidden lucky numbers */}
      <HiddenLuckyNumbers />
      
      {/* Background */}
      <div 
        className="fixed inset-0 bg-cover bg-center opacity-10 pointer-events-none"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1579398707644-ff84b1e6931f?w=1920&q=80)` }}
      />

      {/* Navigation */}
      <nav className="relative z-10 px-4 py-4 border-b border-white/10">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img 
              src="https://static.prod-images.emergentagent.com/jobs/1dbb2fa2-fcd8-42a8-8162-f3f40f16aa0f/images/6ffb8cd872d8f9fcf005a6e679bb1eaaafac262a5a67b5fa1de793b1ab31c7c5.png" 
              alt="8StarLuck" 
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold gradient-text hidden sm:inline">8StarLuck</span>
            {isPremium && <Crown className="w-4 h-4 text-yellow-400" />}
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/decode')}
              className="text-white/70 hover:text-white"
              data-testid="nav-decode-btn"
            >
              <Search className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Decode</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/history')}
              className="text-white/70 hover:text-white"
              data-testid="nav-history-btn"
            >
              <History className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">History</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/70 hover:text-white"
              data-testid="nav-logout-btn"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-6 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <p className="text-muted-foreground mb-1">Welcome back,</p>
          <h1 className="text-2xl md:text-3xl font-bold">{user?.name || 'Cosmic Explorer'}</h1>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          
          {/* Main Luck Score Card - spans 2 columns */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6 md:col-span-2 lg:col-span-2"
            data-testid="luck-score-card"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Today&apos;s Luck Score</p>
                <p className="text-xs text-muted-foreground">
                  {luckData ? formatDate(luckData.date) : 'Loading...'}
                </p>
              </div>
              <span className={`score-badge ${getScoreBadgeClass(luckData?.total_score || 0)}`}>
                {loading ? '...' : getScoreLabel(luckData?.total_score || 0)}
              </span>
            </div>
            
            <LuckMeter score={luckData?.total_score || 0} loading={loading} />
            
            {!loading && luckData && (
              <p className="text-center text-sm text-muted-foreground mt-4 px-4">
                {luckData.interpretation}
              </p>
            )}
          </motion.div>

          {/* Lucky Color */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6"
            data-testid="lucky-info-card"
          >
            <h3 className="text-sm text-muted-foreground mb-4">Lucky Today</h3>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div 
                  className="color-swatch"
                  style={{ backgroundColor: luckyColorHex }}
                />
                <div>
                  <p className="text-xs text-muted-foreground">Color</p>
                  <p className="font-semibold">{loading ? '...' : luckData?.lucky_color}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                  {loading ? '?' : luckData?.lucky_number}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Chinese Lucky #</p>
                  <p className="font-semibold text-sm">{loading ? '...' : luckData?.lucky_number_meaning?.split('(')[0]}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Chinese Calendar - Day Officer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="glass-card rounded-2xl p-6"
            data-testid="day-officer-card"
          >
            <h3 className="text-sm text-muted-foreground mb-4">Chinese Calendar</h3>
            
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-red-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Day Officer</p>
                    <p className="font-semibold text-sm">{luckData?.day_officer} {luckData?.day_officer_chinese}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Business Day</p>
                    <p className={`font-semibold text-sm ${
                      luckData?.business_quality === 'Excellent' ? 'text-green-400' :
                      luckData?.business_quality === 'Good' ? 'text-primary' :
                      luckData?.business_quality === 'Moderate' ? 'text-slate-300' :
                      'text-red-400'
                    }`}>{luckData?.business_quality}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="text-xs text-muted-foreground">Day Zodiac</p>
                    <p className="font-semibold text-sm">{luckData?.day_zodiac} ({luckData?.day_stem_branch})</p>
                  </div>
                </div>
                {luckData?.is_forgiveness_day && (
                  <div className="flex items-center gap-2 bg-primary/20 rounded-lg p-2 mt-2">
                    <Award className="w-4 h-4 text-primary" />
                    <span className="text-xs text-primary font-medium">Day Forgiveness (天赦日) - Highly Auspicious!</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Profile Summary - Enhanced with GG33 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-6"
            data-testid="profile-card"
          >
            <h3 className="text-sm text-muted-foreground mb-4">Your Profile</h3>
            
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-sm">{luckData?.zodiac_sign}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span className="text-sm">{luckData?.chinese_zodiac}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ElementIcon className="w-4 h-4 text-green-400" />
                  <span className="text-sm">{luckData?.dominant_element} Element</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-400" />
                  <div className="flex items-center gap-1">
                    <span className="text-sm">Life Path {luckData?.life_path_number}</span>
                    {luckData?.is_master_number && (
                      <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded">MASTER</span>
                    )}
                  </div>
                </div>
                {luckData?.life_path_energy && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-xs text-muted-foreground">Energy: <span className="text-white">{luckData?.life_path_energy}</span></p>
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* GG33 Numerology Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card rounded-2xl p-6"
            data-testid="numerology-card"
          >
            <h3 className="text-sm text-muted-foreground mb-4">GG33 Numerology</h3>
            
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Lucky Number (Chinese)</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-primary">{luckData?.lucky_number}</span>
                    <span className="text-xs text-muted-foreground">{luckData?.lucky_number_meaning}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Friendly #</p>
                    <div className="flex gap-1 flex-wrap">
                      {luckData?.friendly_numbers?.map(n => (
                        <span key={n} className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">{n}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Challenging #</p>
                    <div className="flex gap-1 flex-wrap">
                      {luckData?.challenging_numbers?.map(n => (
                        <span key={n} className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">{n}</span>
                      ))}
                    </div>
                  </div>
                </div>
                
                {luckData?.lo_shu_strengths?.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <p className="text-xs text-muted-foreground mb-1">Lo Shu Strengths</p>
                    {luckData?.lo_shu_strengths?.slice(0, 2).map((s, i) => (
                      <p key={i} className="text-xs text-white">{s}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>

          {/* Recommended Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-2xl p-6 md:col-span-2"
            data-testid="activities-card"
          >
            <h3 className="text-sm text-muted-foreground mb-4">Today&apos;s Guidance</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">Good For</span>
                </div>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {luckData?.recommended_activities?.map((activity, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-green-400 mt-1">•</span>
                        {activity}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-4 h-4 text-red-400" />
                  <span className="text-sm font-medium text-red-400">Avoid</span>
                </div>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {luckData?.avoid_activities?.map((activity, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <span className="text-red-400 mt-1">•</span>
                        {activity}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>

          {/* Week Forecast */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card rounded-2xl p-6 md:col-span-3 lg:col-span-2"
            data-testid="week-forecast-card"
          >
            <h3 className="text-sm text-muted-foreground mb-4">7-Day Business Forecast</h3>
            
            <div className="flex gap-2 overflow-x-auto pb-2">
              {loading ? (
                Array(7).fill(0).map((_, i) => (
                  <Skeleton key={i} className="min-w-[90px] h-28 rounded-lg" />
                ))
              ) : (
                weekForecast.map((day, i) => {
                  const isToday = i === 0;
                  const color = getScoreColor(day.score);
                  const businessColor = day.business_quality === 'Excellent' ? '#22C55E' :
                                       day.business_quality === 'Good' ? '#F59E0B' :
                                       day.business_quality === 'Moderate' ? '#94A3B8' : '#EF4444';
                  return (
                    <div
                      key={day.date}
                      className={`week-day min-w-[90px] ${isToday ? 'today' : ''} ${day.is_forgiveness_day ? 'ring-1 ring-primary' : ''}`}
                    >
                      <span className="text-xs text-muted-foreground">
                        {isToday ? 'Today' : day.day_name.slice(0, 3)}
                      </span>
                      <span 
                        className="text-xl font-bold my-1"
                        style={{ color }}
                      >
                        {day.score}
                      </span>
                      <span 
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${businessColor}20`, color: businessColor }}
                      >
                        {day.business_quality?.slice(0, 4)}
                      </span>
                      {day.is_forgiveness_day && (
                        <span className="text-[8px] text-primary mt-1">天赦</span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* Score Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card rounded-2xl p-6 lg:col-span-2"
            data-testid="breakdown-card"
          >
            <h3 className="text-sm text-muted-foreground mb-4">Score Breakdown</h3>
            
            {loading ? (
              <div className="space-y-3">
                {Array(4).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  { label: 'Western Astrology', score: luckData?.western_score, max: 40, color: '#F59E0B' },
                  { label: 'Chinese Zodiac', score: luckData?.chinese_score, max: 30, color: '#EF4444' },
                  { label: 'Numerology', score: luckData?.numerology_score, max: 20, color: '#8B5CF6' },
                  { label: 'Element Balance', score: luckData?.element_score, max: 10, color: '#06B6D4' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span>{item.score}/{item.max}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: item.color }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(item.score / item.max) * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Lucky Locations Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card rounded-2xl p-6 md:col-span-2 lg:col-span-2"
            data-testid="lucky-locations-card"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <h3 className="text-sm text-muted-foreground">Lucky Locations</h3>
              </div>
              <button 
                onClick={() => navigate('/locations')}
                className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                data-testid="explore-locations-btn"
              >
                Explore <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            
            {topLocations.length === 0 ? (
              <div className="space-y-2">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {topLocations.map((loc, i) => {
                  const icons = { love: Heart, money: DollarSign, spiritual: Sparkles };
                  const colors = { love: 'text-pink-400', money: 'text-green-400', spiritual: 'text-purple-400' };
                  const bgs = { love: 'bg-pink-500/20', money: 'bg-green-500/20', spiritual: 'bg-purple-500/20' };
                  const Icon = icons[loc.category] || MapPin;
                  return (
                    <div 
                      key={i} 
                      className="flex items-center justify-between p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => navigate('/locations')}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${bgs[loc.category]} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${colors[loc.category]}`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{loc.city}</div>
                          <div className="text-xs text-muted-foreground capitalize">{loc.category}</div>
                        </div>
                      </div>
                      <div className="text-lg font-bold text-primary">{loc.score}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Sticky Banner Ad */}
      <StickyBannerAd isPremium={isPremium} />
    </div>
  );
};

export default Dashboard;
