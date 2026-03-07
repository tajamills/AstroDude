import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { locationsAPI, paymentAPI } from '../lib/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { 
  ArrowLeft, MapPin, Heart, DollarSign, Sparkles, 
  Lock, Users, Briefcase, Crown, ChevronRight
} from 'lucide-react';
import { StickyBannerAd } from '../components/Ads';

const CATEGORY_CONFIG = {
  love: { icon: Heart, color: 'text-pink-400', bg: 'bg-pink-500/20', label: 'Love & Romance' },
  money: { icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Money & Career' },
  spiritual: { icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-500/20', label: 'Spiritual Growth' }
};

const LocationCard = ({ location, showScore = true }) => {
  const config = CATEGORY_CONFIG[location.category] || CATEGORY_CONFIG.love;
  const Icon = config.icon;
  
  return (
    <div className="glass-card rounded-xl p-4 hover:border-white/20 transition-all" data-testid={`location-${location.city.toLowerCase()}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
            <MapPin className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white">{location.city}</h3>
            <p className="text-sm text-muted-foreground">{location.country}</p>
          </div>
        </div>
        {showScore && (
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{location.score}</div>
            <div className="text-xs text-muted-foreground">Match</div>
          </div>
        )}
      </div>
      <p className="text-sm text-slate-300 mb-2">{location.description}</p>
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
          {location.region}
        </span>
      </div>
    </div>
  );
};

const CompatibilityCard = ({ location }) => {
  const config = CATEGORY_CONFIG[location.best_for] || CATEGORY_CONFIG.love;
  
  return (
    <div className="glass-card rounded-xl p-4 hover:border-white/20 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center">
            <Users className="w-5 h-5 text-pink-300" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{location.city}</h3>
            <p className="text-sm text-muted-foreground">{location.country}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-primary">{Math.round(location.combined_score)}</div>
          <div className="text-xs text-muted-foreground">Combined</div>
        </div>
      </div>
      <p className="text-sm text-slate-300 mb-3">{location.description}</p>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-4">
          <span className="text-muted-foreground">You: <span className="text-white">{location.person1_score}</span></span>
          <span className="text-muted-foreground">Partner: <span className="text-white">{location.person2_score}</span></span>
        </div>
        <span className={`px-2 py-1 rounded-full ${config.bg} ${config.color}`}>
          Best for {location.best_for}
        </span>
      </div>
    </div>
  );
};

export default function LocationsPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  
  // Compatibility state
  const [showCompatibility, setShowCompatibility] = useState(false);
  const [partnerDate, setPartnerDate] = useState('');
  const [compatMode, setCompatMode] = useState('romantic');
  const [compatResults, setCompatResults] = useState(null);
  const [compatLoading, setCompatLoading] = useState(false);

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await locationsAPI.getMyLocations();
      setLocations(response.data.locations);
      setIsPremium(response.data.is_premium);
      setUserProfile(response.data.user_profile);
    } catch (error) {
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const handleCompatibilityCheck = async () => {
    if (!partnerDate) {
      toast.error('Please enter partner birth date');
      return;
    }
    
    setCompatLoading(true);
    try {
      const response = await locationsAPI.getCompatibility(partnerDate, compatMode);
      setCompatResults(response.data);
      toast.success('Compatibility analysis complete!');
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('Premium subscription required');
      } else {
        toast.error('Failed to analyze compatibility');
      }
    } finally {
      setCompatLoading(false);
    }
  };

  const handleUpgrade = async () => {
    try {
      const originUrl = window.location.origin;
      const response = await paymentAPI.createCheckout(originUrl);
      window.location.href = response.data.url;
    } catch (error) {
      toast.error('Failed to start checkout');
    }
  };

  const getFilteredLocations = () => {
    if (!locations) return [];
    if (activeCategory === 'all') {
      return Object.entries(locations).flatMap(([cat, locs]) => 
        locs.map(loc => ({ ...loc, category: cat }))
      ).sort((a, b) => b.score - a.score);
    }
    return locations[activeCategory]?.map(loc => ({ ...loc, category: activeCategory })) || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen cosmic-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen cosmic-bg pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-muted-foreground hover:text-white transition-colors"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="font-semibold">Lucky Locations</span>
          </div>
          {isPremium && <Crown className="w-5 h-5 text-yellow-400" />}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* User Profile Summary */}
        {userProfile && (
          <div className="glass-card rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-2">Your Cosmic Profile</h2>
            <div className="flex flex-wrap gap-3">
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm">
                {userProfile.zodiac}
              </span>
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
                {userProfile.chinese_zodiac}
              </span>
              <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-sm">
                {userProfile.element} Element
              </span>
            </div>
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeCategory === 'all' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-slate-800/50 text-muted-foreground hover:text-white'
            }`}
          >
            All Locations
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  activeCategory === key 
                    ? `${config.bg} ${config.color}` 
                    : 'bg-slate-800/50 text-muted-foreground hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {config.label}
              </button>
            );
          })}
        </div>

        {/* Locations Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {getFilteredLocations().map((location, idx) => (
            <LocationCard key={`${location.city}-${idx}`} location={location} />
          ))}
        </div>

        {/* Premium Upsell for Free Users */}
        {!isPremium && (
          <div className="glass-card rounded-xl p-6 border-primary/30 bg-gradient-to-br from-primary/10 to-transparent">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">Unlock All Locations</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Get access to all lucky locations plus partner compatibility analysis to find the perfect places for you and your partner.
                </p>
                <Button onClick={handleUpgrade} className="glow-gold" data-testid="upgrade-locations-btn">
                  Go Premium - $8.88/mo <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Partner Compatibility Section - Premium Only */}
        {isPremium && (
          <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-pink-400" />
              <h2 className="text-xl font-semibold">Partner Compatibility</h2>
            </div>
            <p className="text-muted-foreground mb-4">
              Find locations that work perfectly for both of you
            </p>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setCompatMode('romantic')}
                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  compatMode === 'romantic' 
                    ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' 
                    : 'bg-slate-800/50 text-muted-foreground'
                }`}
                data-testid="romantic-mode-btn"
              >
                <Heart className="w-4 h-4" />
                Romantic Partner
              </button>
              <button
                onClick={() => setCompatMode('business')}
                className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                  compatMode === 'business' 
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                    : 'bg-slate-800/50 text-muted-foreground'
                }`}
                data-testid="business-mode-btn"
              >
                <Briefcase className="w-4 h-4" />
                Business Partner
              </button>
            </div>

            {/* Partner Birth Date Input */}
            <div className="flex gap-3 mb-4">
              <input
                type="date"
                value={partnerDate}
                onChange={(e) => setPartnerDate(e.target.value)}
                className="flex-1 bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 focus:outline-none"
                data-testid="partner-birthdate-input"
              />
              <Button 
                onClick={handleCompatibilityCheck}
                disabled={compatLoading || !partnerDate}
                className="px-6"
                data-testid="check-compatibility-btn"
              >
                {compatLoading ? 'Analyzing...' : 'Find Locations'}
              </Button>
            </div>

            {/* Compatibility Results */}
            {compatResults && (
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Best Locations for Both of You</h3>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-1 rounded-full bg-primary/20 text-primary">
                      {compatResults.user_profile.zodiac}
                    </span>
                    <span className="text-muted-foreground">+</span>
                    <span className="px-2 py-1 rounded-full bg-pink-500/20 text-pink-400">
                      {compatResults.partner_profile.zodiac}
                    </span>
                  </div>
                </div>
                <div className="grid gap-3">
                  {compatResults.compatible_locations.map((loc, idx) => (
                    <CompatibilityCard key={idx} location={loc} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <StickyBannerAd isPremium={isPremium} />
    </div>
  );
}
