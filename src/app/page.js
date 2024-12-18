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
  Check,
  Star,
  Settings,
  MessageSquare,
  Shield,
  Clock,
  BarChart,
  ChevronLeft
} from 'lucide-react';

const features = [
  { 
    icon: Heart, 
    text: 'Track daily health metrics and habits',
    color: 'text-rose-500',
    bgColor: 'bg-rose-50'
  },
  { 
    icon: Brain, 
    text: 'Get personalized AI health insights',
    color: 'text-violet-500',
    bgColor: 'bg-violet-50'
  },
  { 
    icon: Activity, 
    text: 'Monitor progress with detailed analytics',
    color: 'text-sky-500',
    bgColor: 'bg-sky-50'
  },
  { 
    icon: Sun, 
    text: 'Set and achieve meaningful health goals',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50'
  },
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'Fitness Enthusiast',
    content: 'The AI recommendations have completely transformed my wellness routine. Highly recommended!',
    rating: 5
  },
  {
    name: 'Michael Chen',
    role: 'Health Coach',
    content: 'As a professional coach, I\'m impressed by the accuracy of the AI insights. Game changer!',
    rating: 5
  },
  {
    name: 'Emma Davis',
    role: 'Yoga Instructor',
    content: 'The personalized recommendations and tracking features are exactly what I needed.',
    rating: 5
  }
];

export default function Home() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const router = useRouter();

  const handleStartJourney = async () => {
    if (username.trim()) {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 800));
      router.push('/dashboard');
    } else {
      alert('Please enter a username to continue');
    }
  };

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-violet-600" />
              <span className="text-xl font-bold">HealthAI</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-white">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-grid-black/[0.02] -z-1 animate-pulse" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/50" />
            <div className="absolute top-20 left-10 w-72 h-72 bg-violet-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob" />
            <div className="absolute top-40 right-10 w-72 h-72 bg-rose-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Hero Left */}
              <div className="space-y-12">
                <div className="space-y-6">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-violet-50 rounded-full text-violet-600 text-sm font-medium">
                    <Sparkles className="h-4 w-4" />
                    <span>Powered by Advanced AI</span>
                  </div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                    Your Personal
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 animate-gradient">
                      AI Health Journal
                    </span>
                  </h1>
                  <p className="text-xl text-gray-600 leading-relaxed max-w-2xl">
                    Transform your wellness journey with AI-powered insights, personalized tracking, and actionable health recommendations tailored just for you.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  {features.map((feature, index) => (
                    <div
                      key={index}
                      className="group flex items-start space-x-4 p-6 rounded-xl bg-white hover:bg-gradient-to-br hover:from-white hover:to-gray-50 transition-all duration-300 shadow-sm hover:shadow-md"
                    >
                      <div className={`${feature.color} ${feature.bgColor} p-3 rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <span className="text-gray-700 font-medium group-hover:text-gray-900 transition-colors">
                        {feature.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hero Right - Login Form */}
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transform hover:scale-[1.02] transition-transform duration-300">
                <div className="p-8">
                  <div className="space-y-8">
                    <div className="text-center space-y-3">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-500 rounded-2xl shadow-lg mb-4">
                        <Brain className="h-8 w-8 text-white" />
                      </div>
                      <h2 className="text-2xl font-bold">Start Your Journey</h2>
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
                            className="block w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all duration-200"
                            placeholder="Enter your unique username"
                          />
                        </div>
                      </div>

                      <button
                        onClick={handleStartJourney}
                        disabled={isLoading}
                        className="group relative w-full inline-flex items-center justify-center px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl hover:from-violet-700 hover:to-indigo-700 transition-all duration-300 font-medium overflow-hidden"
                      >
                        <span className={`flex items-center ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                          <span>Get Started</span>
                          <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                        {isLoading && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6">
                  <div className="flex items-center justify-center space-x-12">
                    <div className="text-center group cursor-pointer">
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 group-hover:scale-110 transition-transform">
                        10k+
                      </div>
                      <div className="text-sm text-gray-600">Active Users</div>
                    </div>
                    <div className="text-center group cursor-pointer">
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 group-hover:scale-110 transition-transform">
                        98%
                      </div>
                      <div className="text-sm text-gray-600">Satisfaction</div>
                    </div>
                    <div className="text-center group cursor-pointer">
                      <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600 group-hover:scale-110 transition-transform">
                        24/7
                      </div>
                      <div className="text-sm text-gray-600">AI Support</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Showcase Section */}
        <section id="features" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Advanced AI Features</h2>
              <p className="text-gray-600">Experience the power of AI-driven health insights and personalized recommendations.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[/* ... */].map((feature, index) => (
                <div key={index} className="group relative bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="absolute -inset-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-3 bg-violet-50 rounded-xl text-violet-600">
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-bold mb-4">Loved by Health Enthusiasts</h2>
              <p className="text-gray-600">See what our users have to say about their experience with our AI health platform.</p>
            </div>

            <div className="max-w-2xl mx-auto relative">
              <div className="relative overflow-hidden">
                <div 
                  className="transition-transform duration-500 ease-in-out"
                  style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}
                >
                  <div className="flex">
                    {testimonials.map((testimonial, index) => (
                      <div 
                        key={index} 
                        className="w-full flex-shrink-0 bg-white p-8 rounded-2xl shadow-sm"
                        style={{ minWidth: '100%' }}
                      >
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                          <p className="text-sm text-gray-600">{testimonial.role}</p>
                        </div>
                        <div className="flex mb-4">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                          ))}
                        </div>
                        <p className="text-gray-600">{testimonial.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={prevTestimonial}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="h-6 w-6 text-gray-600" />
              </button>
              <button 
                onClick={nextTestimonial}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="h-6 w-6 text-gray-600" />
              </button>

              <div className="flex justify-center mt-6 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentTestimonial === index ? 'bg-violet-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-8">Ready to Transform Your Health Journey?</h2>
            <p className="text-xl text-violet-100 mb-12 max-w-2xl mx-auto">
              Join thousands of users who are already experiencing the power of AI-driven health insights.
            </p>
            <button 
              onClick={handleStartJourney}
              className="px-8 py-3 bg-white text-violet-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Get Started
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
