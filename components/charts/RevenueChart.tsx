// ============================================================
// components/charts/RevenueChart.tsx
// Recharts-based visualizations for the dashboard
// ============================================================

"use client";

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadialBarChart, RadialBar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ─── Shared tooltip ───────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-overlay border border-border rounded-xl p-3 shadow-card-lg text-xs">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
          {entry.name}: ₨{Number(entry.value).toLocaleString("en-PK")}
        </p>
      ))}
    </div>
  );
};

// ─── AREA CHART (Revenue trend 6 months) ─────────────────────
interface ChartData {
  label:          string;
  roomRevenue:    number;
  productRevenue: number;
  expenses:       number;
  profit:         number;
}

export function RevenueAreaChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorRoom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#C9A84C" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}   />
          </linearGradient>
          <linearGradient id="colorProduct" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#4CAF8C" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#4CAF8C" stopOpacity={0}    />
          </linearGradient>
          <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#E05252" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#E05252" stopOpacity={0}   />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: "#8A8070", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#8A8070", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `₨${(v / 1000).toFixed(0)}K`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: "11px", paddingTop: "16px" }}
          formatter={(val) => <span style={{ color: "#8A8070" }}>{val}</span>}
        />
        <Area type="monotone" dataKey="roomRevenue"    name="Room Revenue"    stroke="#C9A84C" strokeWidth={2} fill="url(#colorRoom)"     />
        <Area type="monotone" dataKey="productRevenue" name="Product Revenue" stroke="#4CAF8C" strokeWidth={2} fill="url(#colorProduct)"  />
        <Area type="monotone" dataKey="expenses"       name="Expenses"        stroke="#E05252" strokeWidth={2} fill="url(#colorExpenses)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── BAR CHART (Occupancy) ───────────────────────────────────
interface OccupancyData {
  date:      string;
  occupied:  number;
  available: number;
  rate:      number;
}

export function OccupancyBarChart({ data }: { data: OccupancyData[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} barGap={1}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "#8A8070", fontSize: 10 }} axisLine={false} tickLine={false} interval={4} />
        <YAxis tick={{ fill: "#8A8070", fontSize: 10 }} axisLine={false} tickLine={false} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            return (
              <div className="bg-surface-overlay border border-border rounded-xl p-3 shadow-card-lg text-xs">
                <p className="font-semibold text-foreground mb-1">{label}</p>
                <p className="text-green-400">{payload[0]?.value} occupied</p>
                <p className="text-slate-400">{payload[1]?.value} available</p>
              </div>
            );
          }}
        />
        <Bar dataKey="occupied"  name="Occupied"  fill="#C9A84C" radius={[3,3,0,0]} />
        <Bar dataKey="available" name="Available" fill="rgba(201,168,76,0.15)" radius={[3,3,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── PIE CHART (Room status donut) ───────────────────────────
interface RoomStatusData {
  name:  string;
  value: number;
  color: string;
}

export function RoomStatusPie({ data }: { data: RoomStatusData[] }) {
  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={140} height={140}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={65}
            dataKey="value"
            strokeWidth={0}
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
            <span className="text-muted-foreground">{item.name}</span>
            <span className="font-bold text-foreground ml-auto pl-4">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── GROUPED BAR (Branch comparison) ─────────────────────────
interface BranchData {
  branchName: string;
  revenue:    number;
  expenses:   number;
  profit:     number;
}

export function BranchComparisonChart({ data }: { data: BranchData[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="branchName" tick={{ fill: "#8A8070", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#8A8070", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₨${(v/1000).toFixed(0)}K`} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} formatter={(val) => <span style={{ color: "#8A8070" }}>{val}</span>} />
        <Bar dataKey="revenue"  name="Revenue"  fill="#C9A84C" radius={[4,4,0,0]} />
        <Bar dataKey="expenses" name="Expenses" fill="#E05252" radius={[4,4,0,0]} />
        <Bar dataKey="profit"   name="Profit"   fill="#4CAF8C" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── OCCUPANCY GAUGE (radial bar) ────────────────────────────
export function OccupancyGauge({ rate }: { rate: number }) {
  const data = [{ name: "Occupancy", value: rate }];
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width={120} height={120}>
        <RadialBarChart
          cx="50%" cy="50%"
          innerRadius={35} outerRadius={55}
          data={data}
          startAngle={90} endAngle={-270}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={8}
            fill="#C9A84C"
            background={{ fill: "rgba(201,168,76,0.1)" }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <p className="text-2xl font-bold text-gold-400 font-serif -mt-2">{rate}%</p>
      <p className="text-xs text-muted-foreground">Occupancy</p>
    </div>
  );
}
