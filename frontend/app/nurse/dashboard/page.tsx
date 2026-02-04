'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../lib/AuthContext';
import { 
    Activity, 
    Clock, 
    AlertTriangle, 
    Beaker, 
    Pill, 
    ClipboardList, 
    Sun, 
    Moon, 
    ArrowRight, 
    CheckCircle2, 
    Syringe, 
    FileText,
    Thermometer,
    Stethoscope,
    AlertOctagon,
    MoreVertical
} from 'lucide-react';

export default function NurseDashboard() {
    const { user } = useAuth();
    const [shift, setShift] = useState<'Day' | 'Night'>('Day');
    const [activeTab, setActiveTab] = useState<'Tasks' | 'Handover'>('Tasks');

    // Auto-detect shift based on time (mock logic)
    useEffect(() => {
        const hour = new Date().getHours();
        setShift(hour >= 7 && hour < 19 ? 'Day' : 'Night');
    }, []);

    // --- Mock Data ---

    const metrics = [
        { label: 'Assigned Patients', value: 12, icon: UsersCardIcon, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
        { label: 'Tasks Due Now', value: 5, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
        { label: 'Critical Alerts', value: 2, icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-100' },
        { label: 'Pending Samples', value: 3, icon: Beaker, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    ];

    const tasks = [
        {
            id: 1,
            type: 'Medication',
            patient: 'Sarah Jenkins',
            room: '204-A',
            time: '14:00',
            status: 'Due',
            details: { name: 'Amoxicillin', dosage: '500mg', route: 'Oral' },
            priority: 'High'
        },
        {
            id: 2,
            type: 'Sample',
            patient: 'Michael Chen',
            room: '205-B',
            time: '14:15',
            status: 'Pending',
            details: { name: 'Blood Glucose (Fasting)', type: 'Blood' },
            priority: 'Normal'
        },
        {
            id: 3,
            type: 'Vitals',
            patient: 'Emma Wilson',
            room: 'ICU-02',
            time: '14:30',
            status: 'Upcoming',
            details: { name: 'Hourly Vitals Check', instructions: 'BP, SPO2, Temp' },
            priority: 'Critical'
        },
        {
            id: 4,
            type: 'Medication',
            patient: 'Robert Ford',
            room: '208',
            time: '14:45',
            status: 'Upcoming',
            details: { name: 'Insulin Glargine', dosage: '10 Units', route: 'Subcutaneous (SC)' },
            priority: 'High'
        }
    ];

    const highRiskPatients = [
        { id: 101, name: 'Emma Wilson', status: 'Critical', location: 'ICU-02', reason: 'Unstable BP', aiScore: 92, lastSeen: '10m ago' },
        { id: 102, name: 'James Carter', status: 'Watch', location: '210-A', reason: 'Missed Medication (Yesterday)', aiScore: 78, lastSeen: '2h ago' },
        { id: 103, name: 'Linda Martinez', status: 'Stable', location: '201', reason: 'Post-Op Observation', aiScore: 45, lastSeen: '30m ago' },
    ];

    const activeAlerts = [
        { id: 1, msg: 'Patient Emma Wilson (ICU-02) SPO2 dropped below 90%', time: '2m ago', level: 'Critical' },
        { id: 2, msg: 'Lab Results Ready: Michael Chen (205-B)', time: '15m ago', level: 'Info' },
    ];

    return (
        <div className="space-y-8 pb-20">
            {/* --- Header Section --- */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 font-heading">
                        Welcome, Nurse {user?.first_name || user?.username || 'Olivia'} 👋
                    </h1>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${shift === 'Day' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                            {shift === 'Day' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                            {shift} Shift Active
                        </span>
                        <span className="text-xs text-slate-400 font-medium ml-1">
                             •  Shift ends in 4h 30m
                        </span>
                    </div>
                </div>

                <button 
                    onClick={() => setActiveTab(activeTab === 'Tasks' ? 'Handover' : 'Tasks')}
                    className="group flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all shadow-lg hover:shadow-xl active:scale-95 border border-slate-700"
                >
                    <ClipboardList className="w-4 h-4 text-emerald-400 group-hover:animate-pulse" />
                    <span className="font-bold text-sm">
                        {activeTab === 'Tasks' ? 'End Shift / Handover' : 'Back to Dashboard'}
                    </span>
                </button>
            </div>

            {activeTab === 'Handover' ? (
                <HandoverScreen tasks={tasks} highRiskPatients={highRiskPatients} />
            ) : (
                <>
                    {/* --- Metrics Grid --- */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        {metrics.map((m, idx) => (
                            <div key={idx} className={`bg-white p-5 rounded-2xl border ${m.border} shadow-sm hover:shadow-md transition-all group`}>
                                <div className="flex justify-between items-start mb-3">
                                    <div className={`p-2.5 rounded-xl ${m.bg} ${m.color} group-hover:scale-110 transition-transform`}>
                                        <m.icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-2xl font-bold text-slate-800">{m.value}</span>
                                </div>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{m.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* --- Left Column: Smart Task Stream (65%) --- */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-600" />
                                    Smart Task Stream
                                </h2>
                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Timeline View</span>
                            </div>

                            <div className="space-y-4">
                                {tasks.map((task) => (
                                    <div key={task.id} className="relative pl-6 md:pl-0">
                                        {/* Mobile Timeline Line (Hidden on Desktop for card style) */}
                                        <div className="md:hidden absolute left-2 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                                        
                                        <div className={`
                                            group relative bg-white rounded-2xl p-5 border-l-4 shadow-sm hover:shadow-md transition-all
                                            ${task.priority === 'Critical' ? 'border-l-red-500 border-y border-r border-slate-100' : 
                                              task.priority === 'High' ? 'border-l-amber-500 border-y border-r border-slate-100' : 
                                              'border-l-blue-500 border-y border-r border-slate-100'}
                                        `}>
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                {/* Time & Patient */}
                                                <div className="flex items-start gap-4">
                                                    <div className="flex flex-col items-center min-w-[60px]">
                                                        <span className="text-lg font-bold text-slate-700">{task.time}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 ${
                                                            task.status === 'Due' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'
                                                        }`}>
                                                            {task.status}
                                                        </span>
                                                    </div>
                                                    
                                                    <div>
                                                        <h3 className="text-base font-bold text-slate-800">{task.patient}</h3>
                                                        <p className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                                                            Room {task.room} • {task.type.toUpperCase()}
                                                        </p>

                                                        {/* Smart Details Block */}
                                                        <div className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-3 inline-block min-w-[250px]">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                {task.type === 'Medication' ? <Pill className="w-4 h-4 text-purple-500" /> : 
                                                                 task.type === 'Sample' ? <Beaker className="w-4 h-4 text-blue-500" /> :
                                                                 <Thermometer className="w-4 h-4 text-emerald-500" />}
                                                                <span className="text-sm font-bold text-slate-700">{task.details.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-xs text-slate-500 pl-6">
                                                                {task.type === 'Medication' && (
                                                                    <>
                                                                        <span><b className="text-slate-700">Dose:</b> {task.details.dosage}</span>
                                                                        <span><b className="text-slate-700">Route:</b> {task.details.route}</span>
                                                                    </>
                                                                )}
                                                                {task.type === 'Vitals' && (
                                                                    <span>{task.details.instructions}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                <div className="flex items-center">
                                                    <button className="flex items-center justify-center w-12 h-12 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:shadow-blue-500/30">
                                                        <CheckCircle2 className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* --- Right Column: AI Priority & Alerts (35%) --- */}
                        <div className="space-y-6">
                            
                            {/* Critical Alerts Card */}
                            <div className="bg-red-50/50 rounded-2xl border border-red-100 overflow-hidden">
                                <div className="p-4 border-b border-red-100 flex items-center justify-between bg-red-50">
                                    <h3 className="font-bold text-red-800 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Critical Alerts
                                    </h3>
                                    <span className="bg-red-200 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">{activeAlerts.length}</span>
                                </div>
                                <div className="p-2">
                                    {activeAlerts.map(alert => (
                                        <div key={alert.id} className="p-3 hover:bg-white rounded-xl transition-colors mb-1 last:mb-0 cursor-pointer group">
                                            <p className="text-sm font-bold text-slate-700 leading-tight group-hover:text-red-700 transition-colors">
                                                {alert.msg}
                                            </p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">{alert.time}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* AI Priority Patient Watchlist */}
                            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <AlertOctagon className="w-4 h-4 text-indigo-500" /> 
                                        AI Priority Watchlist
                                    </h3>
                                    <span className="text-[10px] font-bold text-indigo-500 tracking-wider">LIVE</span>
                                </div>
                                <div>
                                    {highRiskPatients.map((p, idx) => (
                                        <div key={idx} className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors group relative">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                                                    <p className="text-xs text-slate-500 font-medium">{p.location} • {p.reason}</p>
                                                </div>
                                                <div className={`
                                                    w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                                                    ${p.aiScore > 90 ? 'bg-red-100 text-red-700' : p.aiScore > 70 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}
                                                `}>
                                                    {p.aiScore}
                                                </div>
                                            </div>
                                            
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-[10px] font-semibold text-slate-400">Last Seen: {p.lastSeen}</span>
                                                <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full rounded-full ${p.aiScore > 80 ? 'bg-red-500' : 'bg-amber-500'}`} 
                                                        style={{ width: `${p.aiScore}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 text-center border-t border-slate-50 bg-slate-50/50">
                                    <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700">View All High Risk Patients</button>
                                </div>
                            </div>

                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// --- Icons & Sub-components ---

function UsersCardIcon({ className }: { className?: string }) {
    return <div className={className}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
}

function HandoverScreen({ tasks, highRiskPatients }: { tasks: any[], highRiskPatients: any[] }) {
    return (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <ClipboardList className="w-6 h-6 text-emerald-400" />
                            <h2 className="text-2xl font-bold">Shift Handover Summary</h2>
                        </div>
                        <p className="text-slate-400">Review these items before ending your shift.</p>
                    </div>
                    {/* Decor */}
                    <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                </div>

                <div className="p-8 space-y-8">
                    {/* 1. Pending Tasks */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Pending Items ({tasks.filter(t => t.status !== 'Completed').length})
                        </h3>
                        <div className="bg-slate-50 rounded-xl border border-slate-200 p-1">
                            {tasks.filter(t => t.status === 'Due' || t.status === 'Pending').map(t => (
                                <div key={t.id} className="p-3 border-b border-slate-200 last:border-0 flex justify-between items-center group hover:bg-white transition-colors rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${t.priority === 'Critical' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{t.details.name}</p>
                                            <p className="text-xs text-slate-500">{t.patient} • Room {t.room}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-400">{t.time}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* 2. Critical Patients */}
                    <section>
                         <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-500" /> Critical Watchlist
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {highRiskPatients.filter(p => p.aiScore > 70).map(p => (
                                <div key={p.id} className="bg-red-50 border border-red-100 p-4 rounded-xl">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-red-900">{p.name}</span>
                                        <span className="bg-red-200 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">Score: {p.aiScore}</span>
                                    </div>
                                    <p className="text-xs text-red-700 font-medium">Reason: {p.reason}</p>
                                    <p className="text-xs text-red-600/70 mt-1">Room: {p.location}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                    
                    {/* 3. Notes */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Notes for Next Shift
                        </h3>
                        <textarea 
                            className="w-full h-32 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none placeholder:text-slate-400"
                            placeholder="Type any specific instructions or observations..."
                        ></textarea>
                    </section>

                    <button className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/30 active:scale-[0.99] flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-6 h-6" />
                        Complete Handover & Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
}


