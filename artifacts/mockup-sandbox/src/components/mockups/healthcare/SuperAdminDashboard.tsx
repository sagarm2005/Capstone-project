import React, { useState } from 'react';
import './_group.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Building2,
  AlertTriangle,
  Activity,
  Search,
  MapPin,
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
  BellRing,
  Tent,
  ChevronRight,
  ArrowLeft,
  Stethoscope,
  UserCheck,
  X,
  BarChart2,
} from 'lucide-react';

const locations = [
  {
    id: 1,
    name: "Sector 12 — Koramangala",
    totalDoctors: 42,
    activeDoctors: 38,
    onLeave: 4,
    breakdown: { gp: 18, specialists: 16, surgeons: 8 },
    activePatients: 2150,
    facilities: 6,
    disease: { dengue: 412, malaria: 34, cholera: 5, typhoid: 12, severity: "red", trend: 24 },
  },
  {
    id: 2,
    name: "HSR Layout",
    totalDoctors: 35,
    activeDoctors: 32,
    onLeave: 3,
    breakdown: { gp: 15, specialists: 13, surgeons: 7 },
    activePatients: 1840,
    facilities: 5,
    disease: { dengue: 284, malaria: 22, cholera: 0, typhoid: 8, severity: "amber", trend: 12 },
  },
  {
    id: 3,
    name: "BTM Layout",
    totalDoctors: 28,
    activeDoctors: 26,
    onLeave: 2,
    breakdown: { gp: 12, specialists: 10, surgeons: 6 },
    activePatients: 1220,
    facilities: 4,
    disease: { dengue: 156, malaria: 18, cholera: 0, typhoid: 5, severity: "amber", trend: 8 },
  },
  {
    id: 4,
    name: "Whitefield",
    totalDoctors: 52,
    activeDoctors: 50,
    onLeave: 2,
    breakdown: { gp: 20, specialists: 22, surgeons: 10 },
    activePatients: 3100,
    facilities: 8,
    disease: { dengue: 89, malaria: 10, cholera: 0, typhoid: 3, severity: "green", trend: -5 },
  },
  {
    id: 5,
    name: "Electronic City",
    totalDoctors: 44,
    activeDoctors: 41,
    onLeave: 3,
    breakdown: { gp: 17, specialists: 18, surgeons: 9 },
    activePatients: 2450,
    facilities: 7,
    disease: { dengue: 42, malaria: 6, cholera: 0, typhoid: 1, severity: "green", trend: -12 },
  },
  {
    id: 6,
    name: "Jayanagar",
    totalDoctors: 47,
    activeDoctors: 44,
    onLeave: 3,
    breakdown: { gp: 19, specialists: 18, surgeons: 10 },
    activePatients: 1980,
    facilities: 4,
    disease: { dengue: 21, malaria: 4, cholera: 0, typhoid: 0, severity: "green", trend: -18 },
  },
];

const doctors = [
  { name: "Dr. Priya Sharma",   spec: "General Practice",   hosp: "Apollo Jayanagar",        location: "Jayanagar",            count: 145, status: "Active" },
  { name: "Dr. Raj Mehta",      spec: "Pulmonologist",       hosp: "Fortis Bannerghatta",      location: "BTM Layout",           count: 89,  status: "Active" },
  { name: "Dr. Anita Desai",    spec: "Pediatrician",        hosp: "Manipal Whitefield",       location: "Whitefield",           count: 210, status: "Active" },
  { name: "Dr. Vikram Singh",   spec: "General Practice",   hosp: "City Clinic HSR",          location: "HSR Layout",           count: 0,   status: "On Leave" },
  { name: "Dr. Sunita Reddy",   spec: "Infectious Disease", hosp: "Apollo Koramangala",       location: "Sector 12 — Koramangala", count: 312, status: "Active" },
  { name: "Dr. Karthik Rao",    spec: "General Practice",   hosp: "City Clinic BTM",          location: "BTM Layout",           count: 178, status: "Active" },
];

function DiseaseDetailPanel({ location, onClose }: { location: typeof locations[0]; onClose: () => void }) {
  const d = location.disease;
  const severityColor = d.severity === "red" ? "text-destructive" : d.severity === "amber" ? "text-amber-600" : "text-emerald-600";
  const severityBg = d.severity === "red" ? "bg-destructive/10 border-destructive/30" : d.severity === "amber" ? "bg-amber-50 border-amber-200" : "bg-emerald-50 border-emerald-200";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden border border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30">
          <div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-0.5">
              <MapPin className="w-3.5 h-3.5" />
              {location.name}
            </div>
            <h2 className="text-xl font-bold text-foreground">Disease Data Overview</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-5">
          {/* Severity banner */}
          <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${severityBg}`}>
            <div className={`w-3 h-3 rounded-full ${d.severity === "red" ? "bg-destructive animate-pulse" : d.severity === "amber" ? "bg-amber-500" : "bg-emerald-500"}`} />
            <span className={`font-semibold text-sm ${severityColor}`}>
              {d.severity === "red" ? "Critical outbreak level — immediate action required" : d.severity === "amber" ? "Moderate activity — monitor closely" : "Low activity — situation under control"}
            </span>
            <Badge variant="outline" className={`ml-auto text-xs ${severityColor} border-current`}>
              {d.trend > 0 ? `+${d.trend}%` : `${d.trend}%`} this week
            </Badge>
          </div>

          {/* Disease breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Active Cases by Disease — Monsoon 2026</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: "Dengue", count: d.dengue, color: "bg-destructive", max: 500 },
                { name: "Malaria", count: d.malaria, color: "bg-amber-500", max: 100 },
                { name: "Cholera", count: d.cholera, color: "bg-orange-500", max: 50 },
                { name: "Typhoid", count: d.typhoid, color: "bg-blue-500", max: 50 },
              ].map((disease) => (
                <div key={disease.name} className="bg-muted/30 rounded-xl p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{disease.name}</span>
                    <span className="text-lg font-bold">{disease.count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${disease.color}`}
                      style={{ width: `${Math.min((disease.count / disease.max) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{disease.count === 0 ? "No active cases" : "active cases"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI Spread Prediction mini */}
          <div className="bg-muted/20 rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">AI Spread Prediction — Next 14 Days</span>
              <Badge variant="outline" className="ml-auto text-[10px]">91% confidence</Badge>
            </div>
            <svg viewBox="0 0 360 80" className="w-full h-20">
              <line x1="0" y1="60" x2="360" y2="60" stroke="hsl(var(--border))" strokeWidth="1"/>
              <line x1="0" y1="35" x2="360" y2="35" stroke="hsl(var(--border))" strokeWidth="1"/>
              <path d="M0,55 L30,58 L60,50 L90,52 L120,38 L150,42 L180,30" fill="none" stroke="hsl(var(--primary))" strokeWidth="2"/>
              <line x1="180" y1="5" x2="180" y2="75" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="3 3"/>
              <text x="182" y="12" fontSize="7" fill="hsl(var(--muted-foreground))">TODAY</text>
              <circle cx="180" cy="30" r="3" fill="hsl(var(--primary))"/>
              <path d="M180,30 L210,22 L240,14 L270,24 L300,30 L330,12 L360,28" fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 4"/>
              <circle cx="240" cy="14" r="3" fill="#f59e0b"/>
              <circle cx="330" cy="12" r="3" fill="#f59e0b"/>
              <text x="240" y="9" fontSize="6" fill="#b45309" textAnchor="middle">Peak D8</text>
              <text x="330" y="7" fontSize="6" fill="#b45309" textAnchor="middle">Peak D12</text>
            </svg>
            <p className="text-xs text-muted-foreground mt-1">Based on rainfall, population density &amp; historical patterns</p>
          </div>

          <div className="flex gap-3 pt-1">
            <Button className="flex-1 bg-primary hover:bg-primary/90">Generate Area Report</Button>
            <Button variant="outline" className="flex-1">Deploy Medical Camp</Button>
            <Button variant="outline" onClick={onClose} className="flex-1">Close</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SuperAdminDashboard() {
  const [selectedLocation, setSelectedLocation] = useState<typeof locations[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDoctors = doctors.filter(
    d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         d.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
         d.spec.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      {/* Disease Detail Modal */}
      {selectedLocation && (
        <DiseaseDetailPanel
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">District Command Center</h1>
          <p className="text-muted-foreground">Healthcare Authority Oversight — Bangalore Urban District</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2"><BellRing className="w-4 h-4" /> Send Alert</Button>
          <Button variant="outline" size="sm" className="gap-2"><FileText className="w-4 h-4" /> Report</Button>
          <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4" /> Export</Button>
          <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90"><Tent className="w-4 h-4" /> Deploy Camp</Button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Doctors</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">248</div>
            <p className="text-xs text-muted-foreground mt-1">89 GP · 112 Spec · 47 Surg</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Patients</CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,847</div>
            <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +12% from last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Network Facilities</CardTitle>
            <Building2 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-muted-foreground mt-1">12 Hospitals · 22 Clinics</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-destructive/20 bg-destructive/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical Alerts</CardTitle>
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">7</div>
            <p className="text-xs text-destructive mt-1 font-medium">Requires immediate attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Doctors by Location */}
      <Card className="shadow-sm">
        <CardHeader className="border-b pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Active Doctors by Location
              </CardTitle>
              <CardDescription>Total doctors and patient load across all areas — click "View Disease Data" for outbreak details</CardDescription>
            </div>
            <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">6 Areas</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow p-4 space-y-3"
              >
                {/* Location header */}
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5 text-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                    {loc.name}
                  </h3>
                  <Badge variant="secondary" className="text-[10px] shrink-0">{loc.facilities} facilities</Badge>
                </div>

                {/* Doctor count — big */}
                <div className="flex items-end gap-3">
                  <div>
                    <div className="text-4xl font-bold text-primary">{loc.activeDoctors}</div>
                    <div className="text-xs text-muted-foreground">active doctors</div>
                  </div>
                  <div className="pb-1 text-xs text-muted-foreground">
                    <span className="text-destructive font-medium">{loc.onLeave}</span> on leave<br />
                    <span className="font-medium">{loc.totalDoctors}</span> total
                  </div>
                </div>

                {/* Specialty breakdown */}
                <div className="flex gap-2 text-xs">
                  <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5">{loc.breakdown.gp} GP</span>
                  <span className="bg-blue-50 text-blue-700 rounded-md px-2 py-0.5">{loc.breakdown.specialists} Spec</span>
                  <span className="bg-purple-50 text-purple-700 rounded-md px-2 py-0.5">{loc.breakdown.surgeons} Surg</span>
                </div>

                {/* Patient load bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><UserCheck className="w-3 h-3" /> Active Patients</span>
                    <span className="font-semibold">{loc.activePatients.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.min((loc.activePatients / 3500) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* View Disease Data link */}
                <button
                  onClick={() => setSelectedLocation(loc)}
                  className="w-full flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 px-3 py-2 text-sm text-primary font-medium transition-colors group"
                >
                  <span className="flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4" />
                    View Disease Data
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Doctor Roster Table */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
          <div>
            <CardTitle className="flex items-center gap-2"><Stethoscope className="w-5 h-5 text-primary" /> Doctor Roster</CardTitle>
            <CardDescription>Search and manage doctor assignments across all locations</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, specialty..."
                className="pl-9 w-[280px] bg-background"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Doctor Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Hospital / Clinic</TableHead>
                <TableHead>Location</TableHead>
                <TableHead className="text-right">Active Patients</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.map((doc, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{doc.spec}</TableCell>
                  <TableCell className="text-sm">{doc.hosp}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" /> {doc.location}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    <span className={doc.count > 300 ? "text-destructive" : ""}>{doc.count}</span>
                  </TableCell>
                  <TableCell>
                    {doc.status === "Active" ? (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-normal">Active</Badge>
                    ) : (
                      <Badge variant="secondary" className="font-normal text-muted-foreground">On Leave</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">View Profile</Button>
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs text-primary border-primary/20 hover:bg-primary/5">Reassign</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDoctors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground text-sm">No doctors found matching your search.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
