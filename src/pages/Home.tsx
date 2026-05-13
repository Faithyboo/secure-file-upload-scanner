import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { MessageSquare, ArrowRight, ShieldCheck, Zap, Globe } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-4"
        >
          <span className="bg-ttset-orange/10 text-ttset-orange px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide uppercase">
            Technical Training School of Excellence and Technology
          </span>
          <h1 className="text-5xl md:text-6xl font-extrabold text-ttset-green leading-tight">
            Empowering Your Future with <span className="text-ttset-orange">Practical Excellence</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Welcome to TTSET Student Support. Get instant answers to your questions, explore courses, and manage your academic journey with ease.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
        >
          <Link to="/chat">
            <Button size="lg" className="bg-ttset-green hover:bg-green-900 text-white px-8 py-6 text-lg rounded-xl flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Start Chat Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <Link to="/admission">
            <Button size="lg" variant="outline" className="border-ttset-green text-ttset-green hover:bg-green-50 px-8 py-6 text-lg rounded-xl">
              Explore Admissions
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4">
        {[
          {
            title: "Instant AI Support",
            desc: "Our smart chatbot provides real-time answers to admission, fees, and course queries.",
            icon: Zap,
            color: "bg-orange-100 text-orange-600"
          },
          {
            title: "Official Information",
            desc: "Access verified data directly from the school administration for total peace of mind.",
            icon: ShieldCheck,
            color: "bg-green-100 text-green-600"
          },
          {
            title: "Mobile Friendly",
            desc: "Manage your academic registration and view timetables on the go, anytime, anywhere.",
            icon: Globe,
            color: "bg-blue-100 text-blue-600"
          }
        ].map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + idx * 0.1 }}
            className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <div className={`${feature.color} w-12 h-12 rounded-xl flex items-center justify-center mb-6`}>
              <feature.icon className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
            <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </section>

      {/* Intro Message */}
      <section className="bg-ttset-green text-white p-12 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-ttset-orange/20 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 max-w-3xl">
          <h2 className="text-3xl font-bold mb-6">Built for the Modern Student</h2>
          <p className="text-lg text-gray-200 leading-relaxed mb-8">
            The TTSET Student Support System is designed to bridge the gap between students and management. Whether you need to know about tuition fees, course registration, or your next exam schedule, our platform is here to help you 24/7.
          </p>
          <div className="flex items-center gap-6">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-12 h-12 rounded-full border-4 border-ttset-green bg-gray-400 overflow-hidden">
                  <img src={`https://picsum.photos/seed/student${i}/100/100`} alt="Avatar" referrerPolicy="no-referrer" />
                </div>
              ))}
            </div>
            <p className="font-medium">Joined by 2,000+ Students</p>
          </div>
        </div>
      </section>
    </div>
  );
}
