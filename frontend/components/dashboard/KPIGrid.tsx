import React from 'react';
import { Activity } from 'lucide-react';

const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 p-5 ${className}`}>
        {children}
    </div>
);

const KPICard = ({ title, value, subtext, color = 'blue' }: any) => {
    const getStatusColor = () => {
        switch (color) {
            case 'green':
                return 'border-l-emerald-500 bg-emerald-50';
            case 'blue':
                return 'border-l-blue-500 bg-blue-50';
            case 'red':
                return 'border-l-rose-500 bg-rose-50';
            case 'yellow':
                return 'border-l-amber-500 bg-amber-50';
            default:
                return 'border-l-blue-500 bg-white';
        }
    };

    return (
        <div className={`rounded-lg border border-slate-200 border-l-4 p-4 ${getStatusColor()}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{title}</p>
                    <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
                </div>
                {/* Icon removed to match reference style or kept if desired? Reference has optional icon. Keeping simple for now. */}
            </div>
            <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="text-slate-500">{subtext}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <KPICard
                title="Total Patients"
                value={data?.kpi?.total_patients_today || 0}
                subtext="Today"
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
                subtext="Revenue Per Visit"
                color="blue"
            />
            <KPICard
                title="Claim Approval"
                value={`${claimRate}%`}
                subtext={`${data?.kpi?.claims?.approved || 0} / ${data?.kpi?.claims?.submitted || 0} Approved`}
                color="green"
            />
            <KPICard
                title="Retention Rate"
                value={`${retentionRate}%`}
                subtext="Returning Patients"
                color="yellow"
            />
            <KPICard
                title="Avg Wait Time"
                value="N/A"
                subtext="Data not available"
                color="yellow"
            />
        </div>
    );
};
