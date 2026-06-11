import { motion } from 'motion/react';
import { Award, Briefcase, Building2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ExamCenter, Officer } from '../types';

interface DashboardStatsProps {
  centers: ExamCenter[];
  officers: Officer[];
}

export function DashboardStats({ centers, officers }: DashboardStatsProps) {
  const totalCenters = centers.length;
  const totalOfficers = officers.length;
  const totalRequired = centers.reduce((sum, c) => sum + c.capacity, 0);
  const totalAssigned = officers.filter(o => o.assignedCenterCode !== null).length;
  const reserveCount = totalOfficers - totalAssigned;

  const stats = [
    {
      title: 'कुल परीक्षा केंद्र (Exam Centers)',
      value: totalCenters,
      sub: `${totalRequired} पदों की आवश्यकता`,
      color: 'from-blue-500/10 to-indigo-500/10 text-blue-600 border-blue-100',
      icon: Building2
    },
    {
      title: 'कुल पंजीकृत अधिकारी (Total Officers)',
      value: totalOfficers,
      sub: 'मास्टर डेटाबेस',
      color: 'from-purple-500/10 to-pink-500/10 text-purple-600 border-purple-100',
      icon: Briefcase
    },
    {
      title: 'ड्यूटी पर तैनात (Assigned Officers)',
      value: totalAssigned,
      sub: `${Math.min(100, Math.round((totalAssigned / (totalRequired || 1)) * 100))}% सीटें भरी गईं`,
      color: 'from-emerald-500/10 to-teal-500/10 text-emerald-600 border-emerald-100',
      icon: CheckCircle2
    },
    {
      title: 'आरक्षित अधिकारी (Reserve List)',
      value: reserveCount,
      sub: reserveCount < 0 ? 'स्थापना में कमी (Shortage)' : 'सुरक्षित रिजर्व सूची',
      color: reserveCount < 0 ? 'from-amber-500/10 to-red-500/10 text-red-600 border-red-100' : 'from-slate-500/10 to-zinc-500/10 text-slate-600 border-slate-100',
      icon: reserveCount < 0 ? ShieldAlert : Award
    }
  ];

  return (
    <div id="dashboard-statistics" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {stats.map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className={`relative overflow-hidden bg-gradient-to-br ${stat.color} p-6 rounded-2xl border flex flex-col justify-between shadow-xs`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-medium text-slate-500">{stat.title}</span>
              <h3 className="text-3xl font-bold tracking-tight text-slate-800">{stat.value}</h3>
            </div>
            <div className={`p-3 rounded-xl bg-white/60 shadow-xs`}>
              <stat.icon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-200/40 flex items-center justify-between text-xs text-slate-500">
            <span>{stat.sub}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
