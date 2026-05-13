import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { SchoolInfo } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { GraduationCap, ClipboardCheck, FileText, CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../components/ui/button";

export default function Admission() {
  const [info, setInfo] = useState<SchoolInfo | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const q = query(collection(db, "schoolInfo"), where("type", "==", "admission"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setInfo({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as SchoolInfo);
      }
    };
    fetchInfo();
  }, []);

  const defaultSteps = [
    { title: "Apply Online", desc: "Complete the online application form on our portal." },
    { title: "Submit Documents", desc: "Upload clear copies of required academic credentials." },
    { title: "Interview", desc: "Shortlisted candidates will be invited for a technical assessment." },
    { title: "Payment", desc: "Secure your spot by paying the admission fee upon approval." }
  ];

  const defaultRequirements = [
    "High School Certificate (O' Level or equivalent)",
    "Valid National Identity Document",
    "Passport-sized photographs (Digital copy)",
    "Interest in Technical and Technology fields"
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <GraduationCap className="w-16 h-16 text-ttset-orange mx-auto" />
        <h1 className="text-4xl font-bold text-ttset-green">Admission at TTSET</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Start your journey toward becoming a technical expert. Learn about our clear and straightforward admission process.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Registration Steps */}
        <motion.div
           initial={{ opacity: 0, x: -20 }}
           animate={{ opacity: 1, x: 0 }}
        >
          <Card className="h-full border-none shadow-sm">
            <CardHeader className="bg-ttset-green text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5" />
                Registration Steps
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {defaultSteps.map((step, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-ttset-orange/20 text-ttset-orange flex items-center justify-center font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{step.title}</h4>
                    <p className="text-sm text-gray-600">{step.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Required Documents */}
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
        >
          <Card className="h-full border-none shadow-sm">
            <CardHeader className="bg-ttset-orange text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Required Documents
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-4">
                {defaultRequirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
              
              {info && (
                <div className="mt-8 pt-8 border-t border-gray-100">
                  <h4 className="font-bold mb-2">{info.title}</h4>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap">{info.content}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
      
      <div className="bg-orange-50 border border-orange-100 p-8 rounded-3xl text-center">
        <h3 className="text-xl font-bold text-ttset-green mb-2">Need Help with Your Application?</h3>
        <p className="text-gray-600 mb-6">Our admission officers are ready to guide you through the process.</p>
        <Button className="bg-ttset-green hover:bg-green-900 text-white px-8">Contact Admissions</Button>
      </div>
    </div>
  );
}
