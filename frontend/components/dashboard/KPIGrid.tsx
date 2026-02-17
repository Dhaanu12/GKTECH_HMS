import React from 'react';
import { Activity } from 'lucide-react';

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-5 ${className}`}>
        {children}
    </div>
);

const KPICard = ({ title, value, subtext, color = 'blue' }: any) => {
    const getGradient = () => {
        switch (color) {
            case 'green':
                return 'from-emerald-500 to-teal-600';
            case 'blue':
                return 'from-blue-500 to-cyan-600';
            case 'purple':
                return 'from-purple-500 to-pink-600';
            case 'orange':
                return 'from-orange-500 to-red-600';
            case 'yellow':
                return 'from-amber-500 to-orange-600';
            case 'indigo':
                return 'from-indigo-500 to-purple-600';
            default:
                return 'from-blue-500 to-cyan-600';
        }
    };

    const getIconBg = () => {
        return 'bg-white/20 backdrop-blur-md';
    };

    return (
        <div className={`relative overflow-hidden bg-gradient-to-br ${getGradient()} rounded-2xl shadow-lg border border-white/20 p-6 hover:shadow-xl transition-all transform hover:-translate-y-1`}>
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '20px 20px'
                }}></div>
            </div>

            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 ${getIconBg()} rounded-xl shadow-lg`}>
                        <Activity className="w-6 h-6 text-white" />
                    </div>
                </div>
                <div>
                    <p className="text-sm font-medium text-white/90 mb-1 uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs font-medium text-white/80">
                    <span className="bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">{subtext}</span>
                </div>
            </div>
        </div>
    );
};

export const KPIGrid = ({ data }: { data: any }) => {
    const retentionRate = React.useMemo(() => {
        if (!data?.retention) return 0;
        const returning = data.retention.find((r: any) => r.name === 'Returning')?.value || 0;
        const total = data.retention.reduce((sum: number, r: any) => sum + r.value, 0);
        return total > 0 ? Math.round((returning / total) * 100) : 0;
    }, [data]);

    const claimRate = React.useMemo(() => {
        const submitted = parseInt(data?.kpi?.claims?.submitted || '0');
        const approved = parseInt(data?.kpi?.claims?.approved || '0');
        if (!submitted) return 0;
        return Math.round((approved / submitted) * 100);
    }, [data]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <KPICard
                title="Total Patients"
                value={data?.kpi?.total_patients_today || 0}
                subtext="Total"
                color="blue"
            />
            <KPICard
                title="Total Revenue"
                value={`₹${(data?.kpi?.revenue_month || 0).toLocaleString()}`}
                subtext="This Month"
                color="green"
            />
            <KPICard
                title="Avg/Patient"
                value={`₹${Math.round((data?.kpi?.revenue_month || 0) / (data?.kpi?.total_patients_today || 1)).toLocaleString()}`}
                subtext="Per Visit"
                color="purple"
            />
            <KPICard
                title="Claim Approval"
                value={`${claimRate}%`}
                subtext="Approved"
                color="orange"
            />
            <KPICard
                title="Retention Rate"
                value={`${retentionRate}%`}
                subtext="Returning"
                color="yellow"
            />
            <KPICard
                title="Avg Wait Time"
                value="12m"
                subtext="Average"
                color="indigo"
            />
        </div>
    );
};
