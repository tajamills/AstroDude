import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { 
  Sparkles, ArrowRight, ArrowLeft, Check,
  Briefcase, TrendingUp, Lightbulb, Heart, Compass,
  Building2, Wallet, Code, Palette, Users,
  Clock, Calculator, MapPin, Calendar
} from 'lucide-react';

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Sparkles },
  { id: 'birth', title: 'Birth Info', icon: Calendar },
  { id: 'location', title: 'Location', icon: MapPin },
  { id: 'career', title: 'Interests', icon: Briefcase },
  { id: 'focus', title: 'Focus', icon: Compass },
  { id: 'partner', title: 'Compatibility', icon: Heart },
  { id: 'generating', title: 'Results', icon: Sparkles },
  { id: 'upgrade', title: 'Upgrade', icon: TrendingUp },
];

const GOALS = [
  { id: 'career', label: 'Career guidance', icon: Briefcase },
  { id: 'business', label: 'Business decisions', icon: Building2 },
  { id: 'timing', label: 'Lucky days & timing', icon: Clock },
  { id: 'compatibility', label: 'Compatibility', icon: Heart },
  { id: 'growth', label: 'Personal growth', icon: Lightbulb },
];

const CAREER_INTERESTS = [
  { id: 'entrepreneur', label: 'Entrepreneurship', icon: Building2 },
  { id: 'finance', label: 'Finance & Trading', icon: Wallet },
  { id: 'tech', label: 'Technology', icon: Code },
  { id: 'creative', label: 'Creative Work', icon: Palette },
  { id: 'consulting', label: 'Consulting & Coaching', icon: Users },
];

const LIFE_FOCUS = [
  { id: 'career_path', label: 'Best career path', icon: Briefcase },
  { id: 'business_timing', label: 'Business launch timing', icon: Clock },
  { id: 'lucky_numbers', label: 'Lucky numbers & colors', icon: Calculator },
  { id: 'relationships', label: 'Relationship compatibility', icon: Heart },
  { id: 'wealth', label: 'Wealth cycles', icon: TrendingUp },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    goals: [],
    birth_date: '',
    birth_time: '',
    birth_time_known: 'exact',
    birth_location: '',
    career_interests: [],
    life_focus: [],
    has_partner: false,
    partner_birth_date: '',
  });

  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const toggleSelection = (field, value) => {
    setData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(v => v !== value)
        : [...prev[field], value]
    }));
  };

  const handleNext = async () => {
    // Validate current step
    if (currentStep === 1 && !data.birth_date) {
      toast.error('Please enter your birth date');
      return;
    }
    if (currentStep === 2 && !data.birth_location) {
      toast.error('Please enter your birth location');
      return;
    }

    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }

    // Submit on generating step
    if (currentStep === 5) {
      setLoading(true);
      try {
        await userAPI.updateOnboarding({
          onboarding: {
            goals: data.goals,
            birth_date: data.birth_date,
            birth_time: data.birth_time_known === 'unknown' ? null : data.birth_time,
            birth_location: data.birth_location,
            career_interests: data.career_interests,
            life_focus: data.life_focus,
            has_partner: data.has_partner,
            partner_birth_date: data.has_partner ? data.partner_birth_date : null,
          }
        });
        // Don't update user yet - wait for upgrade step to complete
        
        // Simulate calculation time
        await new Promise(resolve => setTimeout(resolve, 2000));
        setCurrentStep(7); // Go to upgrade step
      } catch (error) {
        toast.error('Failed to save. Please try again.');
        setCurrentStep(5); // Go back to partner step
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipToResults = () => {
    // Mark onboarding complete when user clicks Continue Free
    updateUser({ onboarding_complete: true });
    navigate('/dashboard');
  };

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              What would you like <span className="gradient-text">help with</span>?
            </h2>
            <p className="text-muted-foreground mb-8">Select all that apply</p>
            
            <div className="grid gap-3">
              {GOALS.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => toggleSelection('goals', goal.id)}
                  className={`option-card flex items-center gap-4 text-left ${
                    data.goals.includes(goal.id) ? 'selected' : ''
                  }`}
                  data-testid={`goal-${goal.id}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    data.goals.includes(goal.id) ? 'bg-primary text-black' : 'bg-white/5 text-white'
                  }`}>
                    <goal.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{goal.label}</span>
                  {data.goals.includes(goal.id) && (
                    <Check className="w-5 h-5 text-primary ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 'birth':
        return (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              When were you <span className="gradient-text">born</span>?
            </h2>
            <p className="text-muted-foreground mb-8">This helps calculate your cosmic profile</p>

            <div className="space-y-6 max-w-sm mx-auto">
              <div className="space-y-2 text-left">
                <Label className="text-muted-foreground">Birth Date</Label>
                <Input
                  type="date"
                  value={data.birth_date}
                  onChange={(e) => setData({ ...data, birth_date: e.target.value })}
                  className="auth-input"
                  data-testid="birth-date-input"
                />
              </div>

              <div className="space-y-2 text-left">
                <Label className="text-muted-foreground">Birth Time (optional)</Label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {['exact', 'approximate', 'unknown'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setData({ ...data, birth_time_known: opt })}
                      className={`py-2 px-3 rounded-lg text-sm transition-colors ${
                        data.birth_time_known === opt 
                          ? 'bg-primary text-black' 
                          : 'bg-white/5 text-white/70 hover:bg-white/10'
                      }`}
                      data-testid={`birth-time-${opt}`}
                    >
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </button>
                  ))}
                </div>
                {data.birth_time_known !== 'unknown' && (
                  <Input
                    type="time"
                    value={data.birth_time}
                    onChange={(e) => setData({ ...data, birth_time: e.target.value })}
                    className="auth-input"
                    data-testid="birth-time-input"
                  />
                )}
              </div>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Where were you <span className="gradient-text">born</span>?
            </h2>
            <p className="text-muted-foreground mb-8">Enter your birth city and country</p>

            <div className="max-w-sm mx-auto">
              <Input
                type="text"
                placeholder="e.g., New York, USA"
                value={data.birth_location}
                onChange={(e) => setData({ ...data, birth_location: e.target.value })}
                className="auth-input text-center"
                data-testid="birth-location-input"
              />
            </div>
          </div>
        );

      case 'career':
        return (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Which areas <span className="gradient-text">interest you</span>?
            </h2>
            <p className="text-muted-foreground mb-8">Select all that apply</p>
            
            <div className="grid gap-3">
              {CAREER_INTERESTS.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleSelection('career_interests', item.id)}
                  className={`option-card flex items-center gap-4 text-left ${
                    data.career_interests.includes(item.id) ? 'selected' : ''
                  }`}
                  data-testid={`career-${item.id}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    data.career_interests.includes(item.id) ? 'bg-primary text-black' : 'bg-white/5 text-white'
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                  {data.career_interests.includes(item.id) && (
                    <Check className="w-5 h-5 text-primary ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 'focus':
        return (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Compass className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              What do you want to <span className="gradient-text">discover</span>?
            </h2>
            <p className="text-muted-foreground mb-8">Select your main interests</p>
            
            <div className="grid gap-3">
              {LIFE_FOCUS.map(item => (
                <button
                  key={item.id}
                  onClick={() => toggleSelection('life_focus', item.id)}
                  className={`option-card flex items-center gap-4 text-left ${
                    data.life_focus.includes(item.id) ? 'selected' : ''
                  }`}
                  data-testid={`focus-${item.id}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    data.life_focus.includes(item.id) ? 'bg-primary text-black' : 'bg-white/5 text-white'
                  }`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium">{item.label}</span>
                  {data.life_focus.includes(item.id) && (
                    <Check className="w-5 h-5 text-primary ml-auto" />
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 'partner':
        return (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Check <span className="gradient-text">compatibility</span>?
            </h2>
            <p className="text-muted-foreground mb-8">Would you like to analyze compatibility with someone?</p>
            
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-6">
              <button
                onClick={() => setData({ ...data, has_partner: true })}
                className={`option-card py-4 ${data.has_partner ? 'selected' : ''}`}
                data-testid="partner-yes"
              >
                <span className="font-medium">Yes</span>
              </button>
              <button
                onClick={() => setData({ ...data, has_partner: false, partner_birth_date: '' })}
                className={`option-card py-4 ${!data.has_partner ? 'selected' : ''}`}
                data-testid="partner-no"
              >
                <span className="font-medium">No, skip</span>
              </button>
            </div>

            {data.has_partner && (
              <div className="max-w-sm mx-auto">
                <Label className="text-muted-foreground text-left block mb-2">Partner&apos;s Birth Date</Label>
                <Input
                  type="date"
                  value={data.partner_birth_date}
                  onChange={(e) => setData({ ...data, partner_birth_date: e.target.value })}
                  className="auth-input"
                  data-testid="partner-birth-date-input"
                />
              </div>
            )}
          </div>
        );

      case 'generating':
        return (
          <div className="text-center py-8">
            <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-8 animate-pulse">
              <Sparkles className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Calculating your <span className="gradient-text">cosmic profile</span>...
            </h2>
            <p className="text-muted-foreground mb-6">Analyzing Western Astrology, Chinese Zodiac, Numerology & Elements</p>
            
            <div className="max-w-xs mx-auto space-y-3">
              {['Destiny Chart', 'Lucky Numbers', 'Lucky Colors', 'Daily Luck Score'].map((item, i) => (
                <div 
                  key={item}
                  className="flex items-center gap-3 glass-card rounded-lg p-3"
                  style={{ animationDelay: `${i * 0.5}s` }}
                >
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary animate-pulse" />
                  </div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'upgrade':
        return (
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Your profile is <span className="gradient-text">ready</span>!
            </h2>
            <p className="text-muted-foreground mb-8">Unlock deeper insights with premium</p>
            
            <div className="glass-card rounded-2xl p-6 mb-6 text-left">
              <h3 className="font-semibold mb-4">Premium includes:</h3>
              <ul className="space-y-3">
                {['Advanced compatibility reports', 'Yearly forecasts', 'Business launch timing', 'Ad-free experience'].map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary" />
                    <span className="text-sm">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-2xl font-bold gradient-text">$8.88<span className="text-sm text-muted-foreground font-normal">/month</span></p>
              </div>
            </div>

            <div className="grid gap-3">
              <Button
                onClick={handleSkipToResults}
                className="w-full bg-primary text-primary-foreground rounded-full py-6 text-lg font-semibold glow-gold"
                data-testid="continue-free-btn"
              >
                Continue Free
              </Button>
              {/* Premium is now available */}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen cosmic-bg flex flex-col">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-15"
        style={{ backgroundImage: `url(https://images.unsplash.com/photo-1579398707644-ff84b1e6931f?w=1920&q=80)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-background" />

      {/* Progress bar */}
      <div className="relative z-10 w-full h-1 bg-white/10">
        <motion.div 
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 px-4 py-4 flex items-center justify-between">
        {currentStep > 0 && currentStep < 6 ? (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleBack}
            className="text-white/70 hover:text-white"
            data-testid="onboarding-back-btn"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        ) : (
          <div />
        )}
        <span className="text-sm text-muted-foreground">
          {currentStep + 1} of {STEPS.length}
        </span>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 pb-8">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      {currentStep < 6 && (
        <div className="relative z-10 px-4 pb-8 pt-4">
          <div className="max-w-md mx-auto">
            <Button
              onClick={handleNext}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-full py-6 text-lg font-semibold glow-gold hover:scale-[1.02] transition-transform"
              data-testid="onboarding-next-btn"
            >
              {currentStep === 5 ? 'Calculate My Score' : 'Continue'}
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
