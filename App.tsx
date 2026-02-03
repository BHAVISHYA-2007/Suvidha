
import React, { useState, useEffect } from 'react';
import { 
  Language, AppView, Department, Complaint, ServiceStatus, User 
} from './types';
import { TRANSLATIONS, DEPARTMENTS_DATA } from './constants';
import { storageService } from './services/storageService';
import { LargeButton, AccessibilityBar } from './components/KioskUI';
import { Assistant } from './components/Assistant';
import { 
  History, PlusCircle, LayoutDashboard, LogOut, ArrowLeft, 
  CheckCircle2, Clock, MapPin, Printer, Download, Share2, ShieldCheck, User as UserIcon
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

const App: React.FC = () => {
  // Global State
  const [view, setView] = useState<AppView>('LANDING');
  const [lang, setLang] = useState<Language>(Language.ENGLISH);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [fontSize, setFontSize] = useState(1);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(storageService.getCurrentUser());
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedService, setSelectedService] = useState<string>('');
  const [lastComplaint, setLastComplaint] = useState<Complaint | null>(null);
  // Controlled inputs
  const [mobileInput, setMobileInput] = useState<string>('');
  const [complaintDescription, setComplaintDescription] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');

  // Receipt printing / PDF helpers
  const receiptRef = React.useRef<HTMLDivElement | null>(null);

  // Timeline / tracking
  const [trackingComplaint, setTrackingComplaint] = useState<Complaint | null>(null);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false);

  // Post a message so the fallback overlay in index.html can hide immediately when app mounts
  React.useEffect(() => {
    try { window.postMessage('SUVIDHA_APP_READY', '*'); } catch (e) { /* ignore */ }
  }, []);

  const handlePrint = () => {
    if (!receiptRef.current) return alert('No receipt available to print');

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) { alert('Unable to open print window'); return; }

    // Inject minimal styles so printed content looks correct
    printWindow.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>SUVIDHA Receipt</title><link rel="stylesheet" href="/index.css"><style>body{background:#09090b;color:#fff;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,'Helvetica Neue',Arial;} .bg-emerald-600{background-color:#16a34a !important} .rounded-3xl{border-radius:1.5rem}</style></head><body>`);
    printWindow.document.write(receiptRef.current.innerHTML);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus();
    // Wait a tick for resources to load then print
    setTimeout(() => printWindow.print(), 300);
  };

  const handleSavePDF = async () => {
    if (!receiptRef.current) return alert('No receipt available to save');
    try {
      const canvas = await html2canvas(receiptRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('portrait', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      const filename = lastComplaint?.id ? `${lastComplaint.id}.pdf` : 'suvidha_receipt.pdf';
      pdf.save(filename);
      alert('PDF saved successfully');
    } catch (err) {
      console.error('PDF generation error', err);
      alert('Failed to save PDF. You can use Print > "Save as PDF" as an alternative.');
    }
  };

  const openTimeline = (complaint: Complaint) => {
    setTrackingComplaint(complaint);
    setIsTimelineOpen(true);
  };
  const closeTimeline = () => {
    setTrackingComplaint(null);
    setIsTimelineOpen(false);
  };

  const advanceStatus = (id: string) => {
    const complaints = storageService.getComplaints();
    const c = complaints.find(x => x.id === id);
    if (!c) return alert('Complaint not found');
    const order = ["Submitted", "Under Review", "Assigned", "Resolved"];
    const idx = order.indexOf(c.status as any);
    const next = idx < order.length - 1 ? order[idx + 1] : order[idx];
    storageService.updateComplaintStatus(id, next);
    // refresh local view if tracking or receipt
    if (lastComplaint?.id === id) setLastComplaint({ ...lastComplaint, status: next as any });
    if (trackingComplaint?.id === id) setTrackingComplaint({ ...trackingComplaint, status: next as any });
    alert(`Status updated to ${next}`);
  };

  const setComplaintAttachment = (file?: File) => {
    if (!file) return;
    setAttachmentName(file.name);
  };

  // Translation Helper
  const t = TRANSLATIONS[lang];

  // Voice Guidance Effect
  useEffect(() => {
    if (isVoiceActive && window.speechSynthesis) {
      const getUtterance = (text: string) => {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang === Language.ENGLISH ? 'en-US' : (lang === Language.HINDI ? 'hi-IN' : 'mr-IN');
        return u;
      };

      const speak = (text: string) => {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(getUtterance(text));
      };

      if (view === 'LANDING') speak(t.selectLanguage);
      if (view === 'DASHBOARD') speak(t.homeTitle);
    }
  }, [view, lang, isVoiceActive, t]);

  // Handlers
  const handleLogin = (mobile: string) => {
    const user: User = { id: `CIT-${Math.random().toString(36).substr(2, 5).toUpperCase()}`, mobile, name: "Citizen" };
    storageService.setCurrentUser(user);
    setCurrentUser(user);
    setView('DASHBOARD');
  };

  const handleLogout = () => {
    storageService.setCurrentUser(null);
    setCurrentUser(null);
    setView('LANDING');
  };

  const submitComplaint = (description: string) => {
    if (!currentUser || !selectedDept) return;
    const newComplaint: Complaint = {
      id: `REQ-${Math.floor(100000 + Math.random() * 900000)}`,
      department: selectedDept,
      serviceType: selectedService,
      description,
      status: ServiceStatus.SUBMITTED,
      timestamp: new Date().toLocaleString(),
      userId: currentUser.id,
      attachmentName: attachmentName || undefined
    };
    storageService.saveComplaint(newComplaint);
    setLastComplaint(newComplaint);
    // reset form
    setComplaintDescription('');
    setSelectedService('');
    setSelectedDept(null);
    setAttachmentName('');
    setView('RECEIPT');
  };

  // Rendering Helpers
  const Header = () => (
    <div className={`p-8 flex justify-between items-center border-b transition-colors ${
      isHighContrast ? 'bg-black text-yellow-400 border-yellow-400' : 'bg-zinc-900 text-zinc-100 border-zinc-800'
    }`}>
      <div className="flex items-center gap-6">
        <div className="w-16 h-16 bg-blue-600 rounded-[1.25rem] flex items-center justify-center font-bold text-3xl shadow-[0_0_20px_rgba(37,99,235,0.4)]">
          S
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tight leading-none">SUVIDHA</h1>
          <p className="text-lg opacity-60 uppercase tracking-[0.2em] font-bold mt-1">Smart Civic Helpdesk</p>
        </div>
      </div>
      <div className="flex items-center gap-8">
        {currentUser && (
          <div className="flex items-center gap-4 bg-zinc-950 px-6 py-3 rounded-2xl border border-zinc-800">
            <UserIcon className="w-6 h-6 text-blue-400" />
            <div className="text-left">
              <p className="text-sm font-bold text-zinc-500 leading-none mb-1">LOGGED IN AS</p>
              <p className="text-xl font-black text-zinc-100">{currentUser.id}</p>
            </div>
            <button onClick={handleLogout} className="ml-4 p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        )}
        <div className="flex bg-zinc-950 p-2 rounded-2xl border border-zinc-800">
          {Object.values(Language).map(l => (
            <button 
              key={l}
              onClick={() => setLang(l)}
              className={`px-6 py-2 rounded-xl font-bold transition-all ${
                lang === l 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const containerBaseClass = isHighContrast 
    ? "min-h-screen bg-black text-yellow-400" 
    : "min-h-screen bg-zinc-950 text-zinc-100";

  return (
    <div 
      className={`transition-all flex flex-col ${containerBaseClass}`}
      style={{ fontSize: `${fontSize * 1}rem` }}
    >
      <Header />
      
      <main className="flex-1 flex flex-col p-12 overflow-y-auto max-w-7xl mx-auto w-full relative">
        {view === 'LANDING' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-12 text-center py-20">
            <div className="space-y-4">
              <h2 className="text-7xl font-black text-white mb-4 tracking-tight drop-shadow-2xl">
                {t.welcome}
              </h2>
              <p className="text-3xl font-medium text-zinc-400">{t.selectLanguage}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
              <LargeButton 
                label="English" 
                onClick={() => { setLang(Language.ENGLISH); setView('AUTH'); }} 
                className="h-72 border-2 border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/40"
                variant="secondary"
              />
              <LargeButton 
                label="हिंदी" 
                onClick={() => { setLang(Language.HINDI); setView('AUTH'); }} 
                className="h-72 border-2 border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 hover:border-amber-500/40"
                variant="secondary"
              />
              <LargeButton 
                label="मराठी" 
                onClick={() => { setLang(Language.MARATHI); setView('AUTH'); }} 
                className="h-72 border-2 border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/40"
                variant="secondary"
              />
            </div>
            
            <button 
              onClick={() => setView('ADMIN')} 
              className="mt-20 flex items-center gap-3 px-8 py-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-500 font-bold text-xl uppercase tracking-widest hover:text-blue-400 hover:border-blue-400/50 transition-all"
            >
              <ShieldCheck className="w-6 h-6" />
              Terminal Admin Login
            </button>
          </div>
        )}

        {view === 'AUTH' && (
          <div className="max-w-xl mx-auto w-full bg-zinc-900 rounded-[3.5rem] p-16 shadow-2xl border border-zinc-800 flex flex-col gap-10 mt-10">
            <div className="text-center space-y-4">
              <h2 className="text-5xl font-black text-white">{t.loginTitle}</h2>
              <p className="text-2xl text-zinc-500 font-medium">{t.enterMobile}</p>
            </div>
            <div className="space-y-8">
              <input 
                type="tel" 
                value={mobileInput}
                onChange={(e) => setMobileInput(e.target.value.replace(/\D/g, ''))}
                placeholder="00000 00000"
                className="w-full p-10 text-6xl font-black text-center tracking-widest bg-zinc-950 rounded-3xl border-4 border-zinc-800 text-blue-400 focus:border-blue-500 outline-none transition-all placeholder:text-zinc-800"
                maxLength={10}
              />
              <LargeButton 
                label={t.verifyOtp} 
                onClick={() => {
                  if (mobileInput.trim().length === 10) {
                    handleLogin(mobileInput.trim());
                  } else {
                    alert('Please enter a valid 10-digit mobile number');
                  }
                }} 
                className="w-full py-12 text-3xl"
              />
              <button onClick={() => setView('LANDING')} className="w-full py-4 text-zinc-500 font-bold flex items-center justify-center gap-3 text-2xl hover:text-zinc-300">
                <ArrowLeft className="w-8 h-8" /> {t.back}
              </button>
            </div>
          </div>
        )}

        {view === 'DASHBOARD' && (
          <div className="space-y-16 py-10">
            <div className="flex flex-col gap-4">
              <h2 className="text-6xl font-black text-white tracking-tight">{t.homeTitle}</h2>
              <p className="text-3xl text-zinc-500 font-medium">Empowering citizens with seamless digital utilities.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <LargeButton 
                icon={<PlusCircle className="w-24 h-24 text-blue-400" />}
                label={t.fileComplaint} 
                subLabel="Request for repairs, billing, or new services"
                onClick={() => setView('SERVICES')} 
                className="h-[32rem] !items-start !text-left !p-12 hover:shadow-[0_0_50px_-10px_rgba(37,99,235,0.2)]"
              />
              <LargeButton 
                icon={<History className="w-24 h-24 text-emerald-400" />}
                label={t.trackStatus} 
                subLabel="Real-time tracking of your active files"
                variant="secondary"
                onClick={() => setView('STATUS')} 
                className="h-[32rem] !items-start !text-left !p-12 border-zinc-800/50"
              />
            </div>
          </div>
        )}

        {view === 'SERVICES' && (
          <div className="space-y-12 py-10">
            <button onClick={() => setView('DASHBOARD')} className="flex items-center gap-3 text-2xl font-bold text-zinc-400 hover:text-blue-400 transition-colors">
              <ArrowLeft className="w-10 h-10" /> {t.back}
            </button>
            <h2 className="text-6xl font-black text-white">Select Department</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {DEPARTMENTS_DATA.map(dept => (
                <button 
                  key={dept.id}
                  onClick={() => { setSelectedDept(dept.id); setView('COMPLAINT_FORM'); }}
                  className={`p-12 rounded-[3.5rem] border-2 transition-all active:scale-95 flex flex-col gap-8 text-left ${dept.color} ${dept.border} ${dept.hoverBorder} hover:shadow-2xl bg-gradient-to-br from-zinc-900 to-zinc-950`}
                >
                  <div className="p-6 rounded-3xl bg-white/5 border border-white/10 w-fit">
                    {dept.icon}
                  </div>
                  <div>
                    <h3 className="text-4xl font-black text-white">{dept.id}</h3>
                    <p className="text-xl text-zinc-400 mt-4 leading-relaxed font-medium">Access all {dept.id.toLowerCase()} related self-service options.</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {view === 'COMPLAINT_FORM' && selectedDept && (
          <div className="space-y-10 py-10">
            <button onClick={() => setView('SERVICES')} className="flex items-center gap-3 text-2xl font-bold text-zinc-400 hover:text-blue-400 transition-colors">
              <ArrowLeft className="w-10 h-10" /> Back to Departments
            </button>
            <div className="bg-zinc-900 rounded-[3.5rem] p-16 shadow-2xl border border-zinc-800">
              <h2 className="text-5xl font-black mb-12 text-white">New Request: <span className="text-blue-400">{selectedDept}</span></h2>
              <div className="space-y-12">
                <div>
                  <label className="text-2xl font-bold text-zinc-500 mb-6 block uppercase tracking-widest">Select Service Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {DEPARTMENTS_DATA.find(d => d.id === selectedDept)?.services.map(s => (
                      <button 
                        key={s}
                        onClick={() => setSelectedService(s)}
                        className={`p-8 rounded-3xl text-xl font-bold border-2 transition-all ${
                          selectedService === s 
                            ? 'bg-blue-600 border-blue-400 text-white shadow-lg' 
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-2xl font-bold text-zinc-500 mb-6 block uppercase tracking-widest">Detailed Description</label>
                  <textarea 
                    className="w-full p-10 bg-zinc-950 rounded-3xl border-2 border-zinc-800 focus:border-blue-500 outline-none text-2xl min-h-[250px] text-zinc-100 placeholder:text-zinc-800"
                    placeholder="Briefly explain the issue for our technicians..."
                  ></textarea>
                </div>
                <div className="upload-wrapper p-10 bg-blue-500/5 border-2 border-dashed border-blue-500/20 rounded-[2.5rem] flex items-center justify-center gap-6 group hover:border-blue-500/50 transition-all cursor-pointer">
                    <Download className="w-12 h-12 text-blue-500" />
                    <div className="text-left">
                      <p className="text-2xl font-black text-blue-400">Upload Evidence / Document</p>
                      <p className="text-lg text-blue-500/60 font-bold uppercase tracking-widest mt-1">Images, PDFs, or Scans</p>
                    </div>
                    <input type="file" onChange={() => alert('File upload not yet connected in this demo')} />
                </div>
                <LargeButton 
                  label={t.submit} 
                  onClick={() => submitComplaint(complaintDescription)} 
                  className="w-full py-12 text-3xl"
                />
              </div>
            </div>
          </div>
        )}

        {view === 'RECEIPT' && lastComplaint && (
          <div className="flex-1 flex flex-col items-center justify-center gap-10 py-10">
            <div ref={receiptRef} id="suvidha-receipt" className="bg-zinc-900 rounded-[3.5rem] shadow-2xl overflow-hidden w-full max-w-2xl border border-zinc-800">
              <div className="bg-emerald-600 p-12 text-center text-white">
                <div className="bg-white/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-16 h-16" />
                </div>
                <h2 className="text-5xl font-black leading-tight">{t.complaintSuccess}</h2>
              </div>
              <div className="p-16 space-y-12 text-center bg-zinc-900">
                <div className="flex flex-col items-center justify-center p-12 bg-zinc-950 border border-zinc-800 rounded-[2.5rem] gap-4 shadow-inner">
                  <span className="text-xl text-zinc-600 uppercase tracking-widest font-black">{t.requestId}</span>
                  <span className="text-7xl font-black text-blue-400 tracking-tighter break-words">{lastComplaint.id}</span>
                </div>
                <div className="flex justify-center p-10 bg-white rounded-3xl shadow-xl">
                   <div className="w-56 h-56 flex items-center justify-center relative overflow-hidden rounded-xl">
                      <div className="grid grid-cols-10 gap-1">
                        {Array.from({length: 100}).map((_, i) => (
                          <div key={i} className={`w-4 h-4 ${Math.random() > 0.4 ? 'bg-black' : 'bg-white'}`}></div>
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white p-2 font-black text-xs border-2 border-black tracking-tight">SUVIDHA AUTH</div>
                      </div>
                   </div>
                </div>
                <p className="text-2xl text-zinc-500 font-medium">Your request has been routed to the local circle office.</p>
                {lastComplaint.attachmentName && (
                  <p className="text-lg text-zinc-400 font-medium">Attachment: <span className="text-zinc-200 font-bold">{lastComplaint.attachmentName}</span></p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <button onClick={handlePrint} aria-label="Print receipt" className="w-full flex items-center justify-center gap-4 p-8 bg-zinc-950 text-zinc-300 rounded-[2rem] border border-zinc-800 font-black text-2xl hover:bg-zinc-800 hover:text-white transition-all">
                    <Printer className="w-10 h-10 text-blue-400" /> Print
                  </button>
                  <button onClick={handleSavePDF} aria-label="Save receipt as PDF" className="w-full flex items-center justify-center gap-4 p-8 bg-zinc-950 text-zinc-300 rounded-[2rem] border border-zinc-800 font-black text-2xl hover:bg-zinc-800 hover:text-white transition-all">
                    <Download className="w-10 h-10 text-emerald-400" /> Save
                  </button>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setView('DASHBOARD')}
              className="text-2xl font-black text-zinc-500 hover:text-white transition-colors"
            >
              Back to Home Screen
            </button>
          </div>
        )}

        {view === 'STATUS' && (
          <div className="space-y-12 py-10">
            <button onClick={() => setView('DASHBOARD')} className="flex items-center gap-3 text-2xl font-bold text-zinc-400 hover:text-blue-400 transition-colors">
              <ArrowLeft className="w-10 h-10" /> {t.back}
            </button>
            <h2 className="text-6xl font-black text-white">Your Applications</h2>
            <div className="grid grid-cols-1 gap-8">
              {storageService.getComplaints().filter(c => c.userId === currentUser?.id).reverse().map(complaint => (
                <div key={complaint.id} className="bg-zinc-900 p-12 rounded-[3rem] shadow-xl border border-zinc-800 flex justify-between items-center group hover:border-zinc-700 transition-all">
                  <div className="space-y-6">
                    <div className="flex items-center gap-6">
                      <span className="text-lg font-black bg-blue-600/20 text-blue-400 px-6 py-2 rounded-full border border-blue-400/20">{complaint.id}</span>
                      <span className="text-xl text-zinc-600 font-bold">{complaint.timestamp}</span>
                    </div>
                    <div>
                      <h3 className="text-4xl font-black text-white">{complaint.serviceType}</h3>
                      <p className="text-2xl text-zinc-500 font-bold mt-2">{complaint.department}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-6">
                    <div className="flex items-center gap-4 px-10 py-5 bg-zinc-950 border border-amber-500/30 text-amber-500 rounded-[2rem] font-black text-2xl shadow-inner">
                      <Clock className="w-10 h-10" /> {complaint.status}
                    </div>
                    <button onClick={() => openTimeline(complaint)} className="text-blue-500 font-black text-2xl hover:text-blue-400 hover:underline">Track Timeline</button>
                  </div>
                </div>
              ))}
              {storageService.getComplaints().filter(c => c.userId === currentUser?.id).length === 0 && (
                <div className="text-center py-40 bg-zinc-900/50 border-4 border-dashed border-zinc-800 rounded-[4rem]">
                  <p className="text-4xl font-black text-zinc-700">No active applications in history.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'ADMIN' && (
          <div className="space-y-16 py-10">
            <div className="flex justify-between items-end">
              <div className="space-y-6">
                <button onClick={() => setView('LANDING')} className="flex items-center gap-3 text-2xl font-bold text-zinc-500 hover:text-white transition-colors">
                  <ArrowLeft className="w-10 h-10" /> System Exit
                </button>
                <h2 className="text-7xl font-black text-white tracking-tight">System Insights</h2>
              </div>
              <div className="flex gap-8">
                <div className="p-10 bg-zinc-900 border border-zinc-800 shadow-2xl rounded-[2.5rem] text-center w-72">
                  <p className="text-lg font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Resolved Rate</p>
                  <p className="text-6xl font-black text-emerald-500">84%</p>
                </div>
                <div className="p-10 bg-zinc-900 border border-zinc-800 shadow-2xl rounded-[2.5rem] text-center w-72">
                  <p className="text-lg font-black text-zinc-600 uppercase tracking-[0.2em] mb-4">Avg Processing</p>
                  <p className="text-6xl font-black text-blue-500">2.4<span className="text-2xl ml-1 text-zinc-500">d</span></p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="bg-zinc-900 p-12 rounded-[3.5rem] border border-zinc-800 shadow-2xl">
                <h3 className="text-3xl font-black mb-12 text-white flex items-center gap-4">
                  <LayoutDashboard className="w-10 h-10 text-blue-400" />
                  Request Volume by Dept
                </h3>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[
                      { name: 'Electricity', count: 120 },
                      { name: 'Gas', count: 45 },
                      { name: 'Municipal', count: 210 }
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 18, fontWeight: 900, fill: '#71717a' }} 
                      />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#71717a' }} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '1rem', color: '#fff' }}
                        cursor={{ fill: '#27272a' }}
                      />
                      <Bar dataKey="count" radius={[15, 15, 0, 0]}>
                        <Cell fill="#fbbf24" />
                        <Cell fill="#fb923c" />
                        <Cell fill="#3b82f6" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-zinc-900 p-12 rounded-[3.5rem] border border-zinc-800 shadow-2xl">
                <h3 className="text-3xl font-black mb-6 text-white">Admin: Manage Complaints</h3>
                <div className="space-y-4">
                  {storageService.getComplaints().slice().reverse().map(c => (
                    <div key={c.id} className="flex items-center justify-between p-6 bg-zinc-950 rounded-2xl border border-zinc-800">
                      <div>
                        <div className="font-black text-xl">{c.id} <span className="text-sm text-zinc-400 ml-2">{c.timestamp}</span></div>
                        <div className="text-zinc-400">{c.serviceType} • {c.department}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="px-4 py-2 bg-zinc-900 rounded-lg border border-zinc-800 font-bold">{c.status}</div>
                        <div className="flex gap-2">
                          <button onClick={() => advanceStatus(c.id)} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold">Advance</button>
                          <button onClick={() => { setView('STATUS'); openTimeline(c); }} className="px-4 py-2 bg-zinc-700 text-white rounded-lg">Open</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {isTimelineOpen && trackingComplaint && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <div className="bg-zinc-900 w-full max-w-xl rounded-2xl p-6 border border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-2xl font-black">Tracking: {trackingComplaint.id}</h3>
                <p className="text-sm text-zinc-400">{trackingComplaint.serviceType} • {trackingComplaint.department}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { navigator.clipboard?.writeText(trackingComplaint.id); alert('Request ID copied'); }} className="px-3 py-2 bg-zinc-800 rounded-md">Copy ID</button>
                <button onClick={closeTimeline} className="px-3 py-2 bg-red-600 text-white rounded-md">Close</button>
              </div>
            </div>

            <div className="space-y-4">
              {['Submitted','Under Review','Assigned','Resolved'].map((s, i) => {
                const active = trackingComplaint.status === s;
                const doneOrder = ['Submitted','Under Review','Assigned','Resolved'];
                const done = doneOrder.indexOf(s) <= doneOrder.indexOf(trackingComplaint.status as any);
                return (
                  <div key={s} className={`flex items-center gap-4 p-4 rounded-lg ${active ? 'bg-blue-600 text-white' : done ? 'bg-zinc-950 text-zinc-300' : 'bg-zinc-900 text-zinc-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${done ? 'bg-emerald-500 text-black' : 'bg-zinc-800'}`}>{i+1}</div>
                    <div>
                      <div className="font-bold">{s}</div>
                      <div className="text-sm text-zinc-500">{done ? 'Completed' : (active ? 'Current stage' : 'Pending')}</div>
                    </div>
                    {active && (
                      <div className="ml-auto">
                        <button onClick={() => advanceStatus(trackingComplaint.id)} className="px-4 py-2 bg-blue-400 text-black rounded-md font-bold">Advance</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <AccessibilityBar 
        onContrastToggle={() => setIsHighContrast(!isHighContrast)}
        onFontSizeChange={(inc) => setFontSize(prev => Math.min(2, Math.max(1, inc ? prev + 0.1 : prev - 0.1)))}
        onVoiceToggle={() => setIsVoiceActive(!isVoiceActive)}
        isVoiceActive={isVoiceActive}
      />
      <Assistant language={lang} />
    </div>
  );
};

export default App;
