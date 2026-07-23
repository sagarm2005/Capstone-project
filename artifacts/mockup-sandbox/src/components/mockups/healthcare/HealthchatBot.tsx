import React from 'react';
import './_group.css';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Calendar, FlaskConical, Activity, HeartPulse } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

export function HealthchatBot() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 h-[800px]">
        
        {/* Chat Interface Column */}
        <div className="md:col-span-2 h-full flex flex-col bg-card border rounded-xl shadow-lg overflow-hidden">
          
          {/* Header */}
          <div className="p-4 border-b bg-primary/5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-sm">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-lg">HealthAssist AI</h2>
              <p className="text-xs text-[#16a34a] font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#16a34a] animate-pulse"></span>
                Online • Ready to help
              </p>
            </div>
          </div>

          {/* Chat History */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-6">
              
              {/* Bot Msg */}
              <div className="flex gap-3 max-w-[85%]">
                <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <div className="bg-muted p-3 rounded-2xl rounded-tl-sm text-sm text-foreground">
                    Hello John! I'm your healthcare assistant. How can I help you today?
                  </div>
                </div>
              </div>

              {/* User Msg */}
              <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
                <Avatar className="h-8 w-8 border shrink-0">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex flex-col items-end">
                  <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm text-sm">
                    Is Dr. Sharma available tomorrow?
                  </div>
                </div>
              </div>

              {/* Bot Msg with Intent Tag */}
              <div className="flex gap-3 max-w-[85%]">
                <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <Badge variant="outline" className="mb-1 text-[10px] h-5 bg-background border-primary/20 text-muted-foreground flex w-fit gap-1">
                    <Activity className="h-3 w-3" /> Intent: Check Availability
                  </Badge>
                  <div className="bg-muted p-3 rounded-2xl rounded-tl-sm text-sm text-foreground">
                    Dr. Sharma has slots at 10:00 AM and 3:00 PM tomorrow. Would you like to book an appointment?
                  </div>
                </div>
              </div>

              {/* User Msg */}
              <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
                <Avatar className="h-8 w-8 border shrink-0">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex flex-col items-end">
                  <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm text-sm">
                    Book 10 AM
                  </div>
                </div>
              </div>

              {/* Bot Msg - Action Success */}
              <div className="flex gap-3 max-w-[85%]">
                <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Badge variant="outline" className="text-[10px] h-5 bg-background border-[#16a34a]/30 text-[#16a34a] flex w-fit gap-1">
                    <Calendar className="h-3 w-3" /> Action: Book Appointment
                  </Badge>
                  <div className="bg-muted p-3 rounded-2xl rounded-tl-sm text-sm text-foreground border border-[#16a34a]/20">
                    <p className="font-semibold text-[#16a34a] mb-1 flex items-center gap-1.5"><HeartPulse className="h-4 w-4" /> Appointment confirmed!</p>
                    <p>Confirmation <strong>#APT-2847</strong> with Dr. Sharma for tomorrow at 10:00 AM.</p>
                    <p className="mt-1 text-xs text-muted-foreground">You'll receive a notification shortly.</p>
                  </div>
                </div>
              </div>

               {/* User Msg */}
               <div className="flex gap-3 max-w-[85%] ml-auto flex-row-reverse">
                <Avatar className="h-8 w-8 border shrink-0">
                  <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="space-y-1 flex flex-col items-end">
                  <div className="bg-primary text-primary-foreground p-3 rounded-2xl rounded-tr-sm text-sm">
                    What's my vaccination status?
                  </div>
                </div>
              </div>

               {/* Bot Msg */}
               <div className="flex gap-3 max-w-[85%]">
                <Avatar className="h-8 w-8 border border-primary/20 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <Badge variant="outline" className="mb-1 text-[10px] h-5 bg-background border-primary/20 text-muted-foreground flex w-fit gap-1">
                    <Activity className="h-3 w-3" /> Intent: Medical Records Query
                  </Badge>
                  <div className="bg-muted p-3 rounded-2xl rounded-tl-sm text-sm text-foreground">
                    You're up to date on all mandatory vaccines. Your next due vaccine is the <strong>Flu shot in November 2024</strong>.
                  </div>
                </div>
              </div>

            </div>
          </ScrollArea>

          {/* Quick Actions & Input */}
          <div className="p-4 border-t bg-background space-y-3">
            <ScrollArea className="w-full whitespace-nowrap pb-2 -mb-2">
              <div className="flex gap-2 w-max">
                <Badge variant="outline" className="px-3 py-1.5 cursor-pointer hover:bg-muted font-normal text-xs bg-card"><Calendar className="h-3 w-3 mr-1.5" /> Book Appointment</Badge>
                <Badge variant="outline" className="px-3 py-1.5 cursor-pointer hover:bg-muted font-normal text-xs bg-card"><FlaskConical className="h-3 w-3 mr-1.5" /> Check Lab Results</Badge>
                <Badge variant="outline" className="px-3 py-1.5 cursor-pointer hover:bg-muted font-normal text-xs bg-card"><Activity className="h-3 w-3 mr-1.5" /> Vaccination Status</Badge>
                <Badge variant="outline" className="px-3 py-1.5 cursor-pointer hover:bg-muted font-normal text-xs bg-card">Prescription Refill</Badge>
              </div>
            </ScrollArea>
            <div className="relative">
              <Input placeholder="Type your health query..." className="pr-12 rounded-full bg-muted/50 border-transparent focus-visible:ring-primary/30" />
              <Button size="icon" className="absolute right-1 top-1 h-7 w-7 rounded-full bg-primary hover:bg-primary/90 text-white">
                <Send className="h-3 w-3 -ml-0.5" />
              </Button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground">HealthAssist AI can make mistakes. In case of emergency, please call 911.</p>
          </div>

        </div>

        {/* Sidebar Column */}
        <div className="hidden md:block h-full">
          <Card className="h-full border bg-muted/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="bg-card p-3 rounded-lg border shadow-sm border-l-4 border-l-[#16a34a]">
                <p className="text-xs font-bold text-[#16a34a] mb-0.5">Appointment Confirmed</p>
                <p className="text-sm font-medium">Dr. Sharma (Cardiology)</p>
                <p className="text-xs text-muted-foreground mt-1">Tomorrow, 10:00 AM</p>
              </div>

              <div className="bg-card p-3 rounded-lg border shadow-sm border-l-4 border-l-primary">
                <p className="text-xs font-bold text-primary mb-0.5">Lab Result Ready</p>
                <p className="text-sm font-medium">Complete Blood Count</p>
                <Button variant="link" className="h-auto p-0 text-xs mt-1 text-primary">View Report <ArrowRight className="h-3 w-3 ml-1" /></Button>
              </div>

              <div className="bg-card p-3 rounded-lg border shadow-sm border-l-4 border-l-warning">
                <p className="text-xs font-bold text-warning mb-0.5">Follow-up Reminder</p>
                <p className="text-sm font-medium">General Checkup Due</p>
                <p className="text-xs text-muted-foreground mt-1">Last visit: 6 months ago</p>
                <Button variant="outline" size="sm" className="w-full mt-2 h-7 text-xs">Schedule Now</Button>
              </div>

            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}