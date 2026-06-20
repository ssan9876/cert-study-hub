// Charts — thin, theme-aware wrappers around Recharts used by the results and
// statistics screens. Centralizing them keeps chart styling consistent and the
// page components declarative.

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import type { DomainScore, AnalyticsSummary } from '../../types/Exam';
import { getDomainMeta } from '../../services/QuestionService';

const AXIS_COLOR = '#94a3b8';
const GRID_COLOR = 'rgba(148,163,184,0.2)';

/** Score-over-time line chart (statistics page). */
export function ScoreTrendChart({ data }: { data: AnalyticsSummary['scoreTrend'] }) {
  if (data.length === 0) {
    return <EmptyChart message="Complete exams to see your score trend." />;
  }
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
        <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" />
        <XAxis dataKey="date" stroke={AXIS_COLOR} fontSize={12} />
        <YAxis domain={[0, 100]} stroke={AXIS_COLOR} fontSize={12} />
        <Tooltip
          contentStyle={{
            background: '#0d1426',
            border: '1px solid #1b2742',
            borderRadius: 8,
            color: '#fff',
            fontSize: 12,
          }}
          formatter={(value) => [`${value}%`, 'Score']}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="#1a7aff"
          strokeWidth={2.5}
          dot={{ r: 3, fill: '#1a7aff' }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Per-domain mastery radar chart (statistics page). */
export function DomainRadarChart({ data }: { data: AnalyticsSummary['domainMastery'] }) {
  const chartData = data.map((d) => ({
    domain: getDomainMeta(d.domain)?.shortName ?? d.domain,
    mastery: d.mastery,
  }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={chartData} outerRadius="72%">
        <PolarGrid stroke={GRID_COLOR} />
        <PolarAngleAxis dataKey="domain" tick={{ fill: AXIS_COLOR, fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fill: AXIS_COLOR, fontSize: 10 }} angle={30} />
        <Radar
          name="Mastery"
          dataKey="mastery"
          stroke="#1a7aff"
          fill="#1a7aff"
          fillOpacity={0.35}
        />
        <Tooltip
          contentStyle={{
            background: '#0d1426',
            border: '1px solid #1b2742',
            borderRadius: 8,
            color: '#fff',
            fontSize: 12,
          }}
          formatter={(value) => [`${value}%`, 'Mastery']}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/** Per-domain score bar chart, colored by domain (results page). */
export function DomainBarChart({ scores }: { scores: DomainScore[] }) {
  const data = scores
    .filter((s) => s.total > 0)
    .map((s) => ({
      domain: getDomainMeta(s.domain)?.shortName ?? s.domain,
      percentage: s.percentage,
      color: getDomainMeta(s.domain)?.color ?? '#1a7aff',
    }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
        <CartesianGrid stroke={GRID_COLOR} strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="domain" stroke={AXIS_COLOR} fontSize={12} />
        <YAxis domain={[0, 100]} stroke={AXIS_COLOR} fontSize={12} />
        <Tooltip
          cursor={{ fill: 'rgba(148,163,184,0.1)' }}
          contentStyle={{
            background: '#0d1426',
            border: '1px solid #1b2742',
            borderRadius: 8,
            color: '#fff',
            fontSize: 12,
          }}
          formatter={(value) => [`${value}%`, 'Score']}
        />
        <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.domain} fill={d.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-400 dark:border-navy-600 dark:text-slate-500">
      {message}
    </div>
  );
}
