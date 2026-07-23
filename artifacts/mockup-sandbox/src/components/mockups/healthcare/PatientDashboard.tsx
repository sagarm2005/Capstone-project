import React from 'react';
import './_group.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Calendar, Syringe, FileText, MessageSquare, Clock, ArrowRight, Pill, Activity } from 'lucide-react';

export function PatientDashboard() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-6 rounded-xl border shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Patient" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-foreground">John Doe</h1>
              <div className="flex items-center gap-3 text-muted-foreground mt-1">
                <span>34 yrs, Male</span>
                <span className="w-1 h-1 rounded-full bg-border"></span>
                <span>Blood Type: O+</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">Allergies</span>
              <Badge variant="destructive" className="mt-1">Penicillin</Badge>
            </div>
            <Button variant="outline" size="icon" className="relative h-12 w-12 rounded-full">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                3
              </span>
            </Button>
          </div>
        </header>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button className="h-auto py-4 flex flex-col items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl">
            <Calendar className="h-6 w-6" />
            <span className="font-semibold">Book Appointment</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 rounded-xl bg-card border-primary/20 hover:border-primary/50 text-foreground hover:bg-primary/5">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-semibold">Check Lab Results</span>
          </Button>
          <Button variant="outline" className="h-auto py-4 flex flex-col items-center justify-center gap-2 rounded-xl bg-card border-primary/20 hover:border-primary/50 text-foreground hover:bg-primary/5">
            <MessageSquare className="h-6 w-6 text-primary" />
            <span className="font-semibold">Chat with Bot</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Column */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Active Follow-ups */}
            <Card className="border-warning/30 bg-warning/5 shadow-none">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-warning/20 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-warning" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Follow-up Due: Cardiology</h3>
                    <p className="text-sm text-muted-foreground">Dr. Sarah Chen • Post-op review</p>
                  </div>
                </div>
                <Button size="sm" className="bg-warning text-warning-foreground hover:bg-warning/90">Book Now</Button>
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Upcoming Appointments</CardTitle>
                  <CardDescription>Your scheduled visits</CardDescription>
                </div>
                <Button variant="ghost" size="sm">View All</Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { dr: "Dr. Sarah Chen", spec: "Cardiology", date: "Tomorrow, 10:00 AM", status: "Confirmed", type: "Follow-up" },
                  { dr: "Dr. Michael Ross", spec: "General Practice", date: "Oct 24, 2:30 PM", status: "Pending", type: "Normal" }
                ].map((apt, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-card/50">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {apt.date.split(',')[0].slice(0,3)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{apt.dr}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{apt.spec}</span>
                          <span>•</span>
                          <span>{apt.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={apt.status === 'Confirmed' ? 'default' : 'secondary'} className={apt.status === 'Confirmed' ? 'bg-[#16a34a]' : ''}>
                        {apt.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{apt.type}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent Prescriptions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Recent Prescriptions</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { med: "Atorvastatin 20mg", desc: "1 tablet daily • 30 days", dr: "Dr. Sarah Chen" },
                  { med: "Metformin 500mg", desc: "1 tablet twice daily • 60 days", dr: "Dr. Emily Wong" },
                  { med: "Amoxicillin 250mg", desc: "1 capsule every 8 hours • 7 days", dr: "Dr. Michael Ross" }
                ].map((rx, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                        <Pill className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{rx.med}</h4>
                        <p className="text-xs text-muted-foreground">{rx.desc} • Prescribed by {rx.dr}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon"><ArrowRight className="h-4 w-4" /></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            
            {/* Vaccination Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="h-5 w-5 text-primary" />
                  Vaccinations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-[#16a34a] flex items-center gap-1">COVID-19 Booster</span>
                    <span className="text-muted-foreground">Updated</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-[#16a34a] w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-[#16a34a] flex items-center gap-1">Influenza (Flu)</span>
                    <span className="text-muted-foreground">Updated</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-[#16a34a] w-full" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-warning flex items-center gap-1">Tetanus</span>
                    <span className="text-muted-foreground">Due in 2 mos</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-warning w-3/4" />
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4 text-sm">View Full History</Button>
              </CardContent>
            </Card>

            {/* Notifications Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Recent Alerts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  <div>
                    <p className="text-sm font-medium">Appointment Confirmed</p>
                    <p className="text-xs text-muted-foreground">Your visit with Dr. Chen is confirmed for tomorrow.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  <div>
                    <p className="text-sm font-medium">Lab Results Ready</p>
                    <p className="text-xs text-muted-foreground">CBC panel results from Oct 12 are now available.</p>
                  </div>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                  <div>
                    <p className="text-sm font-medium">Follow-up Due</p>
                    <p className="text-xs text-muted-foreground">Please schedule your cardiology follow-up.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
