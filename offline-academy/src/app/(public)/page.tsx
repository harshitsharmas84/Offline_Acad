"use client";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardTitle } from "@/components/ui/Card";
import Link from "next/link";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const features = [
    {
      icon: "📡",
      title: "Works Offline",
      description: "Full access to learning content without internet connection",
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Content cached locally for instant access on any device",
    },
    {
      icon: "💾",
      title: "Minimal Data Usage",
      description: "Text-based lessons and optimized images save bandwidth",
    },
    {
      icon: "🔄",
      title: "Smart Sync",
      description: "Progress syncs automatically when connection returns",
    },
    {
      icon: "📱",
      title: "Works on Old Devices",
      description: "Optimized for low-end smartphones and tablets",
    },
    {
      icon: "🎓",
      title: "Rich Content",
      description: "Comprehensive curriculum for all grade levels",
    },
  ];

  const stats = [
    { number: "50K+", label: "Students" },
    { number: "200+", label: "Lessons" },
    { number: "15+", label: "Subjects" },
    { number: "99.9%", label: "Uptime" },
  ];

  return (
    <main className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-24 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-24 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="grid gap-16 lg:grid-cols-2 lg:gap-8 items-center">
          {/* Hero Content */}
          <div className="space-y-10 animate-fade-in-up">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-sm font-bold">
                ✨ Learning Without Limits
              </div>
              <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight leading-tight">
                Education <br />
                <span className="text-gradient">Everywhere.</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-lg leading-relaxed">
                OfflineAcad brings quality education to students anywhere, anytime—even without internet. 
                Built for rural schools and low-bandwidth regions.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-4">
              {isAuthenticated ? (
                <Button
                  size="lg"
                  onClick={() => router.push("/dashboard")}
                  className="!px-10 !py-4 shadow-xl shadow-indigo-500/25 hover:-translate-y-1"
                >
                  Go to Dashboard
                </Button>
              ) : (
                <>
                  <Button
                    size="lg"
                    onClick={() => router.push("/signup")}
                    className="!px-10 !py-4 shadow-xl shadow-indigo-500/25 hover:-translate-y-1"
                  >
                    Get Started Free
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => router.push("/login")}
                    className="!px-10 !py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Sign In
                  </Button>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8 border-t border-gray-100 dark:border-gray-800">
              {stats.map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <p className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{stat.number}</p>
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image/Illustration */}
          <div className="relative animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="relative z-10 rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600 to-blue-700 shadow-2xl aspect-square flex items-center justify-center group">
              <div className="text-center text-white transform group-hover:scale-110 transition-transform duration-700">
                <div className="text-9xl mb-6 animate-float">📚</div>
                <p className="text-3xl font-black">Knowledge Base</p>
                <p className="text-indigo-100/80 mt-2 font-medium">Fully Accessible Offline</p>
              </div>
              {/* Decorative Overlay */}
              <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-yellow-400 rounded-2xl shadow-xl animate-float flex items-center justify-center text-4xl" style={{ animationDelay: '0.5s' }}>⭐</div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-400 rounded-full shadow-xl animate-float flex items-center justify-center text-5xl" style={{ animationDelay: '1s' }}>✅</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 dark:bg-gray-900/50 py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">
              Why Choose <span className="text-indigo-600">OfflineAcad?</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Designed specifically for students in low-bandwidth regions with a focus on accessibility and performance.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={feature.title} className="card-premium p-8 group animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <CardTitle className="text-2xl mb-3">{feature.title}</CardTitle>
                <CardContent className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white">
              Simple <span className="text-indigo-600">3-Step</span> Process
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { step: "01", title: "Download", desc: "Download lessons once when internet is available", color: "bg-indigo-600" },
              { step: "02", title: "Learn Offline", desc: "Access all content anytime, anywhere offline", color: "bg-blue-600" },
              { step: "03", title: "Auto Sync", desc: "Progress syncs automatically when reconnected", color: "bg-emerald-600" },
            ].map((item, index) => (
              <div key={item.step} className="relative group animate-fade-in-up" style={{ animationDelay: `${index * 0.2}s` }}>
                <div className={`w-20 h-20 rounded-3xl ${item.color} text-white flex items-center justify-center text-3xl font-black mb-8 shadow-xl group-hover:rotate-6 transition-transform`}>
                  {item.step}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">{item.desc}</p>
                {index < 2 && (
                  <div className="hidden lg:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-indigo-200 to-transparent -z-10"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
          <div className="relative rounded-[3rem] bg-gradient-to-br from-indigo-600 to-blue-700 p-12 md:p-20 text-center text-white overflow-hidden shadow-2xl">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-400/20 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
            
            <div className="relative z-10 max-w-3xl mx-auto space-y-10">
              <h2 className="text-4xl md:text-6xl font-black leading-tight">Ready to Transform Your Learning?</h2>
              <p className="text-xl text-indigo-100 font-medium">
                Join 50,000+ students breaking the barriers of internet connectivity.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => router.push("/signup")}
                  className="!px-12 !py-4 !bg-white !text-indigo-600 hover:!bg-indigo-50 font-black text-lg shadow-xl"
                >
                  Start Free Trial
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push("/login")}
                  className="!px-12 !py-4 border-2 border-white/30 text-white hover:bg-white/10 font-black text-lg"
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 bg-indigo-600 text-white rounded-lg font-bold">O</div>
                <span className="text-xl font-bold tracking-tight dark:text-white">OfflineAcad</span>
              </Link>
              <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                Empowering students in remote areas with high-quality, offline-first educational content.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Product</h4>
              <ul className="space-y-4 text-gray-500 dark:text-gray-400">
                <li><Link href="/" className="hover:text-indigo-600 transition-colors">Features</Link></li>
                <li><Link href="/" className="hover:text-indigo-600 transition-colors">Curriculum</Link></li>
                <li><Link href="/" className="hover:text-indigo-600 transition-colors">Offline Mode</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Company</h4>
              <ul className="space-y-4 text-gray-500 dark:text-gray-400">
                <li><Link href="/" className="hover:text-indigo-600 transition-colors">About Us</Link></li>
                <li><Link href="/" className="hover:text-indigo-600 transition-colors">Success Stories</Link></li>
                <li><Link href="/" className="hover:text-indigo-600 transition-colors">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 dark:text-white mb-6 uppercase tracking-widest text-xs">Newsletter</h4>
              <div className="space-y-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Get the latest updates on new courses.</p>
                <div className="flex gap-2">
                  <input type="email" placeholder="Email" className="bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-4 py-2 w-full focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                  <Button className="!px-4">Go</Button>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 pt-10 flex flex-col md:row justify-between items-center gap-6 text-sm text-gray-500 dark:text-gray-500">
            <p>&copy; 2026 OfflineAcad. All rights reserved.</p>
            <div className="flex gap-8">
              <Link href="/" className="hover:text-indigo-600">Privacy Policy</Link>
              <Link href="/" className="hover:text-indigo-600">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
