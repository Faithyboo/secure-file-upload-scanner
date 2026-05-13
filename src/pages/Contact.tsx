import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin, Send } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";

export default function Contact() {
  const contactDetails = [
    { icon: Phone, title: "Phone Number", detail: "+234 (0) 812 345 6789", color: "bg-blue-100 text-blue-600" },
    { icon: Mail, title: "Email Address", detail: "info@ttset.edu.ng", color: "bg-orange-100 text-orange-600" },
    { icon: MapPin, title: "Physical Location", detail: "123 Excellence Way, Tech City, Plateau State", color: "bg-green-100 text-green-600" },
  ];

  const socials = [
    { icon: Facebook, name: "Facebook" },
    { icon: Twitter, name: "Twitter" },
    { icon: Instagram, name: "Instagram" },
    { icon: Linkedin, name: "LinkedIn" },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-ttset-green">Get in Touch</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">Have questions? We're here to help. Reach out to us through any of the following channels or send us a message below.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Contact info */}
        <div className="space-y-8">
          <div className="grid gap-6">
            {contactDetails.map((item, idx) => (
              <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-all">
                <CardContent className="p-6 flex items-center gap-6">
                  <div className={`${item.color} p-4 rounded-2xl`}>
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                    <p className="text-gray-600">{item.detail}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-ttset-green">Follow Us</h3>
            <div className="flex gap-4">
              {socials.map((social, idx) => (
                <a key={idx} href="#" className="w-12 h-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-gray-600 hover:text-ttset-orange hover:border-ttset-orange transition-all">
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <Card className="border-none shadow-xl rounded-3xl overflow-hidden">
          <div className="bg-ttset-green p-8 text-white">
            <h3 className="text-2xl font-bold">Send us a Message</h3>
            <p className="text-green-200">We typically respond within 24 hours.</p>
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input placeholder="John" className="bg-gray-50 border-none rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input placeholder="Doe" className="bg-gray-50 border-none rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input type="email" placeholder="john@example.com" className="bg-gray-50 border-none rounded-xl" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea placeholder="How can we help you?" className="bg-gray-50 border-none rounded-xl min-h-[150px]" />
            </div>
            <Button className="w-full bg-ttset-orange hover:bg-orange-600 text-white py-6 rounded-xl flex items-center gap-2 text-lg">
              <Send className="w-5 h-5" />
              Send Message
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="w-full h-[400px] bg-gray-200 rounded-3xl overflow-hidden grayscale contrast-125">
        <iframe 
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d115160.03212876127!2d8.891157147743494!3d9.89664483750808!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1053730e6a394ec3%3A0x3be6797cc7318e80!2sJos%2C%20Plateau!5e0!3m2!1sen!2sng!4v1713636000000!5m2!1sen!2sng" 
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  );
}
