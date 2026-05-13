import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { SchoolInfo } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { CreditCard, Wallet, Calendar, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

export default function Fees() {
  const [info, setInfo] = useState<SchoolInfo | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const q = query(collection(db, "schoolInfo"), where("type", "==", "fees"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setInfo({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as SchoolInfo);
      }
    };
    fetchInfo();
  }, []);

  const feeItems = [
    { name: "Tuition Fee", amount: "$1,200", period: "Per Semester" },
    { name: "Lab & Library Fee", amount: "$300", period: "Annually" },
    { name: "Registration Fee", amount: "$150", period: "One-time" },
    { name: "Student Union", amount: "$50", period: "Per Semester" },
    { name: "Technology Levy", amount: "$200", period: "Annually" },
  ];

  const paymentStructure = [
    { milestone: "Upon Admission", percentage: "40%", description: "Initial deposit to confirm enrollment" },
    { milestone: "Mid-Semester", percentage: "30%", description: "Second installment before mid-term exams" },
    { milestone: "Pre-Finals", percentage: "30%", description: "Final clearance before end-of-semester exams" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <Wallet className="w-16 h-16 text-ttset-orange mx-auto" />
        <h1 className="text-4xl font-bold text-ttset-green">School Fees Structure</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Transparent and competitive pricing for quality technical education. See the breakdown of our tuition and other charges.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Tuition Breakdown */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-ttset-green text-white">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Tuition Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-none">
                      <TableHead className="font-bold">Charge Name</TableHead>
                      <TableHead className="font-bold">Period</TableHead>
                      <TableHead className="font-bold text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeItems.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-gray-600">{item.period}</TableCell>
                        <TableCell className="text-right font-bold text-ttset-green">{item.amount}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-green-50/50">
                      <TableCell colSpan={2} className="font-bold">Total Estimated (Semester 1)</TableCell>
                      <TableCell className="text-right font-bold text-ttset-orange text-lg">$1,650</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </motion.div>

          {/* Custom DB Info */}
          {info && (
            <motion.div
               initial={{ opacity: 0, scale: 0.98 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm"
            >
              <h3 className="font-bold text-ttset-green text-lg mb-3 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-ttset-orange" />
                {info.title}
              </h3>
              <div className="text-gray-600 whitespace-pre-wrap text-sm leading-relaxed">
                {info.content}
              </div>
            </motion.div>
          )}
        </div>

        {/* Payment Structure */}
        <motion.div
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
        >
          <Card className="border-none shadow-sm h-full">
            <CardHeader className="bg-ttset-orange text-white rounded-t-xl">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Payment Milestones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              {paymentStructure.map((step, idx) => (
                <div key={idx} className="relative pl-8 border-l-2 border-orange-100 pb-2 last:pb-0">
                  <div className="absolute left-[-11px] top-0 w-5 h-5 rounded-full bg-ttset-orange flex items-center justify-center text-[10px] text-white font-bold">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-gray-900">{step.milestone}</h4>
                      <span className="text-xs font-bold text-ttset-orange bg-orange-50 px-2 py-0.5 rounded">{step.percentage}</span>
                    </div>
                    <p className="text-sm text-gray-600">{step.description}</p>
                  </div>
                </div>
              ))}
              
              <div className="p-4 bg-gray-50 rounded-xl mt-4">
                <p className="text-xs text-gray-500 italic">
                  * All payments must be made through the authorized student portal or official bank partners.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
