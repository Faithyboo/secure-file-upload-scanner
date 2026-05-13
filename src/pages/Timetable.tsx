import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { SchoolInfo } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Calendar, Clock, MapPin, BookOpen } from "lucide-react";

export default function Timetable() {
  const [info, setInfo] = useState<SchoolInfo | null>(null);

  useEffect(() => {
    const fetchInfo = async () => {
      const q = query(collection(db, "schoolInfo"), where("type", "==", "timetable"));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setInfo({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as SchoolInfo);
      }
    };
    fetchInfo();
  }, []);

  const exams = [
    { date: "May 15, 2026", time: "09:00 AM", course: "Advanced Robotics (AR402)", room: "Lab A1" },
    { date: "May 17, 2026", time: "02:00 PM", course: "Network Security (NS301)", room: "Hall B" },
    { date: "May 19, 2026", time: "09:00 AM", course: "Cloud Architecture (CA205)", room: "Room 12" },
    { date: "May 22, 2026", time: "11:30 AM", course: "Human-Computer Interaction", room: "Lab C2" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 py-8">
      <div className="text-center space-y-4">
        <Calendar className="w-16 h-16 text-ttset-orange mx-auto" />
        <h1 className="text-4xl font-bold text-ttset-green">Academic Calendar & Exam Timetable</h1>
        <p className="text-gray-600">Stay updated with the latest schedules and important academic dates.</p>
      </div>

      <Card className="border-none shadow-xl overflow-hidden">
        <CardHeader className="bg-ttset-green text-white">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-ttset-orange" />
            Mid-Semester Examination Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="py-4 px-6 font-bold">Course Details</TableHead>
                <TableHead className="py-4 px-6 font-bold">Date</TableHead>
                <TableHead className="py-4 px-6 font-bold">Time</TableHead>
                <TableHead className="py-4 px-6 font-bold">Venue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((exam, idx) => (
                <TableRow key={idx} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="py-4 px-6 font-medium text-gray-900">{exam.course}</TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-ttset-orange" />
                      {exam.date}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-ttset-orange" />
                      {exam.time}
                    </div>
                  </TableCell>
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-2 text-gray-600 font-bold">
                      <MapPin className="w-4 h-4" />
                      {exam.room}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {info && (
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <h3 className="text-2xl font-bold text-ttset-green mb-4">{info.title}</h3>
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">{info.content}</div>
        </div>
      )}
    </div>
  );
}
