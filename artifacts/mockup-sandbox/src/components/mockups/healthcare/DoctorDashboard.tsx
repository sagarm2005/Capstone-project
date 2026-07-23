import React from 'react';
import './_group.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Users, FlaskConical, FileText, Check, X, Clock, BrainCircuit } from 'lucide-react';

export function DoctorDashboard() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="Dr. Sarah" />
              <AvatarFallback>SC</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Dr. Sarah Chen</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Cardiology Specialist</Badge>
                <span className="text-sm text-muted-foreground">License: #MD84729</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Write Prescription
            </Button>
            <Button className="gap-2">
              <Calendar className="h-4 w-4" />
              Manage Schedule
            </Button>
          </div>
        </header>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Today's Patients", value: "12", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "Pending Labs", value: "3", icon: FlaskConical, color: "text-amber-500", bg: "bg-amber-500/10" },
            { label: "Prescriptions Written", value: "8", icon: FileText, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "Follow-ups Due", value: "5", icon: Clock, color: "text-purple-500", bg: "bg-purple-500/10" }
          ].map((stat, i) => (
            <Card key={i} className="border-0 shadow-sm">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                  <h3 className="text-2xl font-bold">{stat.value}</h3>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Schedule Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Pending Requests */}
            <Card className="border-warning/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                  Pending Requests
                  <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">2 New</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "Robert Fox", time: "Tomorrow, 11:30 AM", type: "Normal" },
                  { name: "Emma Wilson", time: "Oct 25, 09:00 AM", type: "Follow-up" }
                ].map((req, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div>
                      <p className="font-medium text-sm">{req.name}</p>
                      <p className="text-xs text-muted-foreground">{req.time} • {req.type}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="outline" className="h-8 w-8 text-destructive border-destructive/20 hover:bg-destructive/10"><X className="h-4 w-4" /></Button>
                      <Button size="icon" variant="outline" className="h-8 w-8 text-[#16a34a] border-[#16a34a]/20 hover:bg-[#16a34a]/10"><Check className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card>
              <CardHeader className="pb-4 border-b">
                <CardTitle className="text-lg flex items-center justify-between">
                  Today's Schedule
                  <span className="text-sm font-normal text-muted-foreground">Oct 23, 2024</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {[
                    { time: "09:00 AM", name: "Alice Johnson", type: "Normal", status: "Completed" },
                    { time: "10:00 AM", name: "John Doe", type: "Follow-up", status: "In Progress", active: true },
                    { time: "11:30 AM", name: "Michael Chang", type: "Emergency", status: "Waiting" },
                    { time: "02:00 PM", name: "Sophia Martinez", type: "Normal", status: "Upcoming" },
                  ].map((apt, i) => (
                    <div key={i} className={`flex items-stretch p-4 hover:bg-muted/30 transition-colors ${apt.active ? 'bg-primary/5 border-l-4 border-l-primary' : 'border-l-4 border-l-transparent'}`}>
                      <div className="w-24 shrink-0 text-sm font-medium text-muted-foreground pt-1">
                        {apt.time}
                      </div>
                      <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-semibold text-foreground">{apt.name}</h4>
                          <span className="text-xs text-muted-foreground">ID: #PT-82{i}9 • 45 yrs, M</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={
                            apt.type === 'Emergency' ? 'border-destructive text-destructive' : 
                            apt.type === 'Follow-up' ? 'border-primary text-primary' : 'border-muted-foreground text-muted-foreground'
                          }>
                            {apt.type}
                          </Badge>
                          {apt.active && (
                            <Button size="sm" className="h-8 bg-primary">Start Consult</Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            
            {/* Lab Reports Awaiting Review */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Lab Reports for Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { patient: "David Smith", test: "Chest X-Ray", ai: "Pneumonia", conf: 87, critical: true },
                  { patient: "Lisa Wong", test: "CBC Panel", ai: "Normal", conf: 94, critical: false }
                ].map((lab, i) => (
                  <div key={i} className="p-3 rounded-lg border bg-card space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-sm">{lab.patient}</p>
                        <p className="text-xs text-muted-foreground">{lab.test}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs">Review</Button>
                    </div>
                    <div className={`p-2 rounded flex items-center justify-between text-xs font-medium ${lab.critical ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                      <div className="flex items-center gap-1.5">
                        <BrainCircuit className="h-3.5 w-3.5" />
                        AI: {lab.ai}
                      </div>
                      <span>{lab.conf}% Confidence</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Follow-up Queue */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Follow-up Queue</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "James Wilson", reason: "Post-op check", days: "2 days ago" },
                  { name: "Maria Garcia", reason: "Medication review", days: "Yesterday" }
                ].map((pt, i) => (
                  <div key={i} className="flex flex-col gap-2 p-3 rounded-lg border bg-card/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{pt.name}</p>
                        <p className="text-xs text-muted-foreground">{pt.reason}</p>
                      </div>
                      <span className="text-[10px] text-warning font-medium">{pt.days}</span>
                    </div>
                    <Button variant="outline" size="sm" className="w-full h-7 text-xs mt-1">Assign Date</Button>
                  </div>
                ))}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
