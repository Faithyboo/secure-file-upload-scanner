import * as React from "react"
import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User as FirebaseUser
} from "firebase/auth";
import { 
  collection, 
  addDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  getDoc,
  setDoc,
  serverTimestamp
} from "firebase/firestore";
import { FAQ, ChatLog, SchoolInfo, UserProfile } from "../types";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  MessageSquare, 
  FileText, 
  Users, 
  LogOut, 
  ShieldCheck,
  AlertCircle,
  LayoutDashboard
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "../lib/utils";

export default function Admin() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Data states
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo[]>([]);
  
  // Edit states
  const [editingFaq, setEditingFaq] = useState<Partial<FAQ> | null>(null);
  const [editingInfo, setEditingInfo] = useState<Partial<SchoolInfo> | null>(null);
  const [isAddingFaq, setIsAddingFaq] = useState(false);
  const [isAddingInfo, setIsAddingInfo] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, "users", u.uid));
        if (userDoc.exists()) {
          setRole(userDoc.data().role);
        } else {
          // Auto-promote first user to admin for demo purposes, otherwise keep as student
          const allUsers = await getDocs(collection(db, "users"));
          const newRole = allUsers.empty ? "admin" : "student";
          await setDoc(doc(db, "users", u.uid), {
            email: u.email,
            role: newRole,
            displayName: u.displayName
          });
          setRole(newRole);
        }
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (role === "admin") {
      fetchData();
    }
  }, [role]);

  const fetchData = async () => {
    try {
      const faqSnap = await getDocs(query(collection(db, "faqs"), orderBy("category")));
      setFaqs(faqSnap.docs.map(d => ({ id: d.id, ...d.data() } as FAQ)));

      const logSnap = await getDocs(query(collection(db, "chatLogs"), orderBy("timestamp", "desc")));
      setChatLogs(logSnap.docs.map(d => ({ id: d.id, ...d.data() } as ChatLog)));

      const infoSnap = await getDocs(collection(db, "schoolInfo"));
      setSchoolInfo(infoSnap.docs.map(d => ({ id: d.id, ...d.data() } as SchoolInfo)));
    } catch (error) {
      console.error("Fetch data error:", error);
      toast.error("Failed to load dashboard data");
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      toast.success("Signed in successfully");
    } catch (error) {
      toast.error("Authentication failed");
    }
  };

  const logout = async () => {
    await signOut(auth);
    toast.info("Signed out");
  };

  // --- CRUD Functions ---

  const handleSaveFAQ = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = editingFaq;
    if (!data?.question || !data?.answer || !data?.category) return;

    try {
      if (data.id) {
        await updateDoc(doc(db, "faqs", data.id), data);
        toast.success("FAQ updated");
      } else {
        await addDoc(collection(db, "faqs"), data);
        toast.success("FAQ added");
      }
      setEditingFaq(null);
      setIsAddingFaq(false);
      fetchData();
    } catch (e) { toast.error("Error saving FAQ"); }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = editingInfo;
    if (!data?.title || !data?.content || !data?.type) return;

    try {
      if (data.id) {
        await updateDoc(doc(db, "schoolInfo", data.id), { ...data, lastUpdated: serverTimestamp() });
        toast.success("Information updated");
      } else {
        await addDoc(collection(db, "schoolInfo"), { ...data, lastUpdated: serverTimestamp() });
        toast.success("Information added");
      }
      setEditingInfo(null);
      setIsAddingInfo(false);
      fetchData();
    } catch (e) { toast.error("Error saving info"); }
  };

  const deleteItem = async (col: string, id: string) => {
    if (!confirm("Are you sure you want to delete this?")) return;
    try {
      await deleteDoc(doc(db, col, id));
      toast.success("Deleted successfully");
      fetchData();
    } catch (e) { toast.error("Delete failed"); }
  };

  if (loading) return <div className="flex items-center justify-center h-96">Loading Admin Portal...</div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-20">
        <Card className="text-center border-none shadow-2xl overflow-hidden rounded-3xl">
          <div className="bg-ttset-green p-12 text-white">
            <ShieldCheck className="w-16 h-16 mx-auto mb-4 text-ttset-orange" />
            <h1 className="text-2xl font-bold">Admin Portal</h1>
            <p className="text-green-200 mt-2">Sign in to manage the TTSET student support system.</p>
          </div>
          <CardContent className="p-8">
            <Button onClick={login} className="w-full bg-ttset-orange hover:bg-orange-600 text-white font-bold py-6 rounded-2xl flex items-center justify-center gap-2">
              Sign In with Google
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (role !== "admin") {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="text-gray-600">You do not have administrative privileges. Contact the school IT department if you believe this is a mistake.</p>
        <Button variant="outline" onClick={logout}>Sign Out</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl border border-gray-100 shadow-sm gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ttset-green flex items-center gap-2">
            <LayoutDashboard className="w-8 h-8 text-ttset-orange" />
            Admin Dashboard
          </h1>
          <p className="text-gray-500">Welcome, {user.displayName} | Total FAQ: {faqs.length}</p>
        </div>
        <Button variant="outline" onClick={logout} className="rounded-xl flex items-center gap-2 text-red-600 border-red-100 hover:bg-red-50">
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </div>

      <Tabs defaultValue="chatbot" className="w-full">
        <TabsList className="bg-white p-1 rounded-2xl border border-gray-100 mb-8 flex overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="chatbot" className="rounded-xl px-6 data-[state=active]:bg-ttset-green data-[state=active]:text-white">
            <MessageSquare className="w-4 h-4 mr-2" /> Chatbot Knowledge
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl px-6 data-[state=active]:bg-ttset-green data-[state=active]:text-white">
            <FileText className="w-4 h-4 mr-2" /> Chat Logs
          </TabsTrigger>
          <TabsTrigger value="info" className="rounded-xl px-6 data-[state=active]:bg-ttset-green data-[state=active]:text-white">
            <Users className="w-4 h-4 mr-2" /> School Information
          </TabsTrigger>
        </TabsList>

        {/* --- Chatbot Knowledge Tab --- */}
        <TabsContent value="chatbot" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Knowledge Base (FAQ)</h2>
            <Button onClick={() => { setIsAddingFaq(true); setEditingFaq({}); }} className="bg-ttset-green flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add FAQ
            </Button>
          </div>

          {(isAddingFaq || editingFaq?.id) && (
            <Card className="bg-white border-ttset-green/20 shadow-lg animate-in fade-in slide-in-from-top-4">
              <CardHeader>
                <CardTitle>{editingFaq?.id ? 'Edit FAQ' : 'New FAQ'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveFAQ} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category</label>
                      <Input 
                        value={editingFaq?.category || ""} 
                        onChange={e => setEditingFaq({...editingFaq, category: e.target.value})}
                        placeholder="e.g. Admission, Fees" 
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Question</label>
                      <Input 
                        value={editingFaq?.question || ""} 
                        onChange={e => setEditingFaq({...editingFaq, question: e.target.value})}
                        placeholder="What is the tuition fee?" 
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Answer</label>
                    <Textarea 
                      value={editingFaq?.answer || ""} 
                      onChange={e => setEditingFaq({...editingFaq, answer: e.target.value})}
                      placeholder="The tuition fee is..." 
                      className="min-h-[100px]"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Save FAQ</Button>
                    <Button type="button" variant="ghost" onClick={() => { setIsAddingFaq(false); setEditingFaq(null); }}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold">Category</TableHead>
                  <TableHead className="font-bold">Question</TableHead>
                  <TableHead className="font-bold">Answer</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell><span className="px-2 py-1 bg-ttset-orange/10 text-ttset-orange rounded text-xs font-bold uppercase">{faq.category}</span></TableCell>
                    <TableCell className="font-medium">{faq.question}</TableCell>
                    <TableCell className="max-w-md truncate text-gray-500">{faq.answer}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingFaq(faq)}>
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteItem("faqs", faq.id!)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* --- Chat Logs Tab --- */}
        <TabsContent value="logs" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Student Interaction Logs</h2>
            <Button variant="outline" onClick={fetchData} className="flex items-center gap-2">
              <RefreshCcw className="w-4 h-4" /> Refresh
            </Button>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold">Timestamp</TableHead>
                  <TableHead className="font-bold">Student Message</TableHead>
                  <TableHead className="font-bold">Bot Response</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chatLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                      {log.timestamp ? format(log.timestamp.toDate(), "MMM dd, HH:mm") : "Just now"}
                    </TableCell>
                    <TableCell className="font-medium text-ttset-green max-w-sm">{log.userMessage}</TableCell>
                    <TableCell className="text-gray-600 italic max-w-sm">{log.botResponse}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* --- School Info Tab --- */}
        <TabsContent value="info" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">School Page Content</h2>
            <Button onClick={() => { setIsAddingInfo(true); setEditingInfo({}); }} className="bg-ttset-green flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Page Data
            </Button>
          </div>

          {(isAddingInfo || editingInfo?.id) && (
            <Card className="bg-white border-ttset-orange/20 shadow-lg animate-in fade-in slide-in-from-top-4">
              <CardHeader>
                <CardTitle>{editingInfo?.id ? 'Edit Content' : 'New Content Block'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveInfo} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Page Type</label>
                      <select 
                        className="w-full border rounded-md p-2"
                        value={editingInfo?.type || ""}
                        onChange={e => setEditingInfo({...editingInfo, type: e.target.value as any})}
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="admission">Admission</option>
                        <option value="fees">Fees</option>
                        <option value="registration">Registration</option>
                        <option value="timetable">Timetable</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Block Title</label>
                      <Input 
                        value={editingInfo?.title || ""} 
                        onChange={e => setEditingInfo({...editingInfo, title: e.target.value})}
                        placeholder="e.g. Important Dates" 
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Content Body</label>
                    <Textarea 
                      value={editingInfo?.content || ""} 
                      onChange={e => setEditingInfo({...editingInfo, content: e.target.value})}
                      placeholder="Enter detailed content here..." 
                      className="min-h-[200px]"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit">Save Content</Button>
                    <Button type="button" variant="ghost" onClick={() => { setIsAddingInfo(false); setEditingInfo(null); }}>Cancel</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold">Type</TableHead>
                  <TableHead className="font-bold">Title</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schoolInfo.map((info) => (
                  <TableRow key={info.id}>
                    <TableCell><span className="font-bold uppercase text-xs text-ttset-green">{info.type}</span></TableCell>
                    <TableCell className="font-medium">{info.title}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => setEditingInfo(info)}>
                        <Edit2 className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteItem("schoolInfo", info.id!)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function RefreshCcw(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}
