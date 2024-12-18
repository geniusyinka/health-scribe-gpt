'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Heart, 
  Brain, 
  Activity, 
  Sun, 
  ChevronRight,
  Sparkles,
  ArrowRight 
} from 'lucide-react';

const features = [
  { icon: Heart, text: 'Track daily health metrics and habits', color: 'text-rose-500', bgColor: 'bg-rose-50', },
  { icon: Brain, text: 'Get personalized AI health insights', color: 'text-violet-500', bgColor: 'bg-violet-50' },
  { icon: Activity, text: 'Monitor progress with detailed analytics', color: 'text-sky-500', bgColor: 'bg-sky-50' },
  { icon: Sun, text: 'Set and achieve meaningful health goals', color: 'text-amber-500', bgColor: 'bg-amber-50' },
];

// Floating bubbles generator
const BubblesBackground = () => {
  const bubbles = Array.from({ length: 10 }).map((_, i) => ({
    id: i,
    size: Math.random() * 100 + 50,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: Math.random() * 10 + 15
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map(bubble => (
        <div
          key={bubble.id}
          className="absolute rounded-full opacity-[0.03] bg-gradient-to-br from-violet-500 to-indigo-500"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: `${bubble.left}%`,
            animation: `float ${bubble.duration}s ease-in-out ${bubble.delay}s infinite`
          }}
        />
      ))}
    </div>
  );
};

export default function Home() {
  const [username, setUsername] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();

  const handleStartJourney = () => {
    if (username.trim()) {
      router.push('/dashboard');
    } else {
      alert('Please enter a username to continue');
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-white relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <BubblesBackground />
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-grid-black/[0.02] -z-1" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/50" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Enhanced Hero Content */}
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 bg-white/50 rounded-full px-4 py-2 mb-8 
                             shadow-sm border border-violet-100 hover:bg-white/80 transition-colors">
                <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" />
                <span className="text-sm font-medium text-gray-800">AI-Powered Health Tracking</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                Your Personal
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 
                               animate-gradient bg-[length:200%_auto]">
                  AI Health Journal
                </span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Transform your wellness journey with AI-powered insights, personalized tracking, and actionable health recommendations.
              </p>
            </div>

            {/* Enhanced Feature Cards */}
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="group flex items-start space-x-4 p-4 rounded-xl bg-white/50 
                           hover:bg-white/80 transition-all duration-300 hover:-translate-y-1 
                           hover:shadow-lg border border-transparent hover:border-violet-100"
                >
                  <div className={`${feature.bgColor} ${feature.color} p-2 rounded-lg shadow-sm 
                                group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <span className="text-gray-700 font-medium group-hover:text-violet-600 transition-colors">
                    {feature.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Login Form */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-xl border border-violet-100 
                         overflow-hidden transform hover:scale-[1.02] transition-all duration-300">
            <div className="p-8">
              <div className="space-y-8">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r 
                               from-violet-600 to-indigo-600">
                    Start Your Journey
                  </h2>
                  <p className="text-gray-600">Join thousands improving their health with AI assistance</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                      Choose a username
                    </label>
                    <div className="relative">
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="block w-full px-4 py-3 rounded-xl border border-violet-200 
                                 bg-white/50 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 
                                 transition-all duration-300"
                        placeholder="Enter your unique username"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleStartJourney}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="group w-full inline-flex items-center justify-center px-4 py-3 
                             bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl 
                             hover:from-violet-700 hover:to-indigo-700 transition-all duration-300 
                             font-medium relative overflow-hidden"
                  >
                    <span className="relative z-10">Start Your Health Journey</span>
                    <ArrowRight className={`ml-2 h-4 w-4 transition-transform duration-300 
                                         ${isHovered ? 'translate-x-1' : ''}`} />
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600 
                                  opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>

                  <p className="text-sm text-center text-gray-500">
                    By signing up, you agree to our Terms of Service and Privacy Policy
                  </p>
                </div>
              </div>
            </div>

            {/* Enhanced Stats Section */}
            <div className="border-t border-violet-100 bg-violet-50/50 p-6">
              <div className="flex items-center justify-center space-x-8">
                {[
                  { value: '10k+', label: 'Active Users' },
                  { value: '98%', label: 'Satisfaction' },
                  { value: '24/7', label: 'AI Support' }
                ].map((stat, index) => (
                  <div key={index} className="text-center group">
                    <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r 
                                  from-violet-600 to-indigo-600 group-hover:scale-110 transition-transform">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </main>
  );
}
