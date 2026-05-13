import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { SchoolInfo } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { GraduationCap, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";

export default function Registration() {
  const [info, setInfo] = useState<SchoolInfo | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const q = query(collection(db, "schoolInfo"), where("type", "==", "registration"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setInfo({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as SchoolInfo);
      }
    };
    fetchInfo();
  }, []);

  const steps = [
    { title: "Course Selection", desc: "Consult with your department head about available modules." },
    { title: "Portal Login", desc: "Use your student ID and password to access the registration portal." },
    { title: "Form Submission", desc: "Select and submit your course list for the semester." },
    { title: "Advisor Approval", desc: "Wait for your academic advisor to verify and approve your registration." },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-4">
        <GraduationCap className="w-16 h-16 text-ttset-green mx-auto" />
        <h1 className="text-4xl font-bold text-ttset-green">Course Registration</h1>
        <p className="text-gray-600">Follow the steps below to successfully enroll for your semester courses.</p>
      </div>

      <div className="grid gap-6">
        {steps.map((step, idx) => (
          <Card key={idx} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-6">
              <div className="w-12 h-12 rounded-2xl bg-ttset-green text-white flex items-center justify-center text-xl font-bold">
                {idx + 1}
              </div>
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                <p className="text-gray-600">{step.desc}</p>
              </div>
              <CheckCircle className="w-6 h-6 text-green-500 opacity-50" />
            </CardContent>
          </Card>
        ))}
      </div>

      {info && (
        <Card className="bg-ttset-green text-white border-none shadow-lg">
          <CardHeader>
            <CardTitle>{info.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap">{info.content}</div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center pt-8">
        <Button className="bg-ttset-orange hover:bg-orange-600 text-white px-12 py-6 text-lg rounded-2xl flex items-center gap-2">
          Go to Registration Portal
          <ArrowRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
