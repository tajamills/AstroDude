import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';
import { HiddenLuckyNumbers } from '../components/Ads';
import { Sparkles, Star, Moon, Sun, ArrowRight } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Star className="w-6 h-6" />,
      title: "Daily Luck Score",
      desc: "Personalized 0-100 score based on 4 metaphysical systems"
    },
    {
      icon: <Moon className="w-6 h-6" />,
      title: "Chinese Astrology",
      desc: "Zodiac compatibility and element balance analysis"
    },
    {
      icon: <Sun className="w-6 h-6" />,
      title: "Western Astrology",
      desc: "Planetary transits affecting your decisions"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Numerology",
      desc: "Life path numbers and date calculations"
    }
  ];

  return (
    <div className="min-h-screen cosmic-bg overflow-hidden">
      {/* Hidden lucky numbers */}
      <HiddenLuckyNumbers />
      
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background image overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(https://images.unsplash.com/photo-1579398707644-ff84b1e6931f?w=1920&q=80)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />

        {/* Navigation */}
        <nav className="relative z-10 px-4 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <img 
              src="https://static.prod-images.emergentagent.com/jobs/1dbb2fa2-fcd8-42a8-8162-f3f40f16aa0f/images/6ffb8cd872d8f9fcf005a6e679bb1eaaafac262a5a67b5fa1de793b1ab31c7c5.png" 
              alt="8StarLuck" 
              className="w-10 h-10 object-contain"
            />
            <span className="text-xl font-bold gradient-text">8StarLuck</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex gap-3"
          >
            <Button 
              variant="ghost" 
              className="text-white/80 hover:text-white"
              onClick={() => navigate('/login')}
              data-testid="nav-login-btn"
            >
              Login
            </Button>
            <Button 
              className="bg-primary text-primary-foreground rounded-full px-6 glow-gold"
              onClick={() => navigate('/register')}
              data-testid="nav-register-btn"
            >
              Get Started
            </Button>
          </motion.div>
        </nav>

        {/* Hero Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-3xl"
          >
            <span className="inline-block px-4 py-1.5 rounded-full text-xs uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 mb-6">
              Cosmic Guidance Engine
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-white">Unlock Your </span>
              <span className="gradient-text">Daily Luck</span>
              <span className="text-white"> Score</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
              Discover your personalized luck score using Western Astrology, Chinese Zodiac, Numerology, and Element Balance
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                className="bg-primary text-primary-foreground rounded-full px-8 py-6 text-lg glow-gold hover:scale-105 transition-transform"
                onClick={() => navigate('/register')}
                data-testid="hero-get-started-btn"
              >
                Start Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="rounded-full px-8 py-6 text-lg border-white/20 hover:bg-white/5"
                onClick={() => navigate('/login')}
                data-testid="hero-login-btn"
              >
                I Have an Account
              </Button>
            </div>
          </motion.div>

          {/* Decorative elements */}
          <div className="absolute top-1/4 left-10 w-2 h-2 rounded-full bg-primary/50 twinkle" />
          <div className="absolute top-1/3 right-20 w-3 h-3 rounded-full bg-accent/50 twinkle" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-1/3 left-1/4 w-2 h-2 rounded-full bg-white/30 twinkle" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      {/* Features Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-semibold mb-4">
              Four Systems, One <span className="gradient-text">Score</span>
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Our algorithm combines ancient wisdom with modern analysis
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-2xl p-6 text-center hover:border-primary/30 transition-colors"
                data-testid={`feature-card-${index}`}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto glass-card rounded-3xl p-8 sm:p-12 text-center"
        >
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-6" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Discover Your <span className="gradient-text">Cosmic Path</span>?
          </h2>
          <p className="text-muted-foreground mb-8">
            Takes only 30-60 seconds to get your personalized astrology profile
          </p>
          <Button 
            size="lg"
            className="bg-primary text-primary-foreground rounded-full px-8 py-6 text-lg glow-gold hover:scale-105 transition-transform"
            onClick={() => navigate('/register')}
            data-testid="cta-get-started-btn"
          >
            Begin Your Journey <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-semibold">8StarLuck</span>
          </div>
          <p className="text-sm text-muted-foreground">
            2026 8StarLuck Core Engine. Cosmic guidance for modern decisions.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
