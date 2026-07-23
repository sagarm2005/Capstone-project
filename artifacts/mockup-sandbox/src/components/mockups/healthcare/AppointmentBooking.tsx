import React, { useState } from 'react';
import './_group.css';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarUI } from "@/components/ui/calendar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Star, Clock, FileText, CheckCircle2, ChevronRight, Check } from 'lucide-react';

export function AppointmentBooking() {
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Progress Tracker */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-6 text-center">Book an Appointment</h1>
          <div className="flex items-center justify-between max-w-2xl mx-auto relative">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-border -z-10 rounded-full"></div>
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all`} style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
            
            {[
              { num: 1, label: "Select Doctor & Time" },
              { num: 2, label: "Patient Details" },
              { num: 3, label: "Confirm & Pay" }
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center gap-2 bg-background px-2">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= s.num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground border-2 border-border'}`}>
                  {step > s.num ? <Check className="h-4 w-4" /> : s.num}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step >= s.num ? 'text-primary' : 'text-muted-foreground'}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Content Area */}
          <div className="md:col-span-2 space-y-6">
            
            {step === 1 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Select Doctor</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-primary rounded-xl p-4 bg-primary/5 flex gap-4 cursor-pointer relative overflow-hidden">
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded-bl-lg">SELECTED</div>
                      <Avatar className="h-16 w-16">
                        <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" />
                        <AvatarFallback>SC</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-foreground">Dr. Sarah Chen</h3>
                            <p className="text-sm text-muted-foreground">Cardiology Specialist</p>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-medium text-amber-500">
                            <Star className="h-4 w-4 fill-current" /> 4.9
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Next available: Tomorrow</span>
                          <span className="flex items-center gap-1"><Badge variant="outline" className="bg-[#16a34a]/10 text-[#16a34a] border-0 h-5 px-1.5 text-[10px]">Available</Badge></span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Select Date & Time</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex justify-center border rounded-lg p-2 bg-card">
                      <CalendarUI
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md"
                      />
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-sm font-medium">Available Slots</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {["09:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "03:30 PM", "04:00 PM"].map((time, i) => (
                          <Button key={i} variant={i === 1 ? "default" : "outline"} className="w-full text-xs">
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Appointment Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup defaultValue="normal" className="grid grid-cols-1 gap-3">
                      <div className="flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="normal" id="normal" />
                          <Label htmlFor="normal" className="flex flex-col cursor-pointer">
                            <span className="font-semibold">Normal Consultation</span>
                            <span className="text-xs text-muted-foreground font-normal">Standard 30-min visit</span>
                          </Label>
                        </div>
                        <span className="font-bold text-lg">$50</span>
                      </div>
                      <div className="flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="followup" id="followup" />
                          <Label htmlFor="followup" className="flex flex-col cursor-pointer">
                            <span className="font-semibold">Follow-up</span>
                            <span className="text-xs text-muted-foreground font-normal">Brief 15-min checkup</span>
                          </Label>
                        </div>
                        <span className="font-bold text-lg">$30</span>
                      </div>
                      <div className="flex items-center justify-between border border-destructive/30 bg-destructive/5 rounded-lg p-4 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value="emergency" id="emergency" />
                          <Label htmlFor="emergency" className="flex flex-col cursor-pointer">
                            <span className="font-semibold text-destructive">Emergency / Priority</span>
                            <span className="text-xs text-muted-foreground font-normal">Skip the line</span>
                          </Label>
                        </div>
                        <span className="font-bold text-lg">$100</span>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end pt-4">
                  <Button size="lg" onClick={() => setStep(2)} className="gap-2">Continue to Details <ChevronRight className="h-4 w-4" /></Button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Patient Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input defaultValue="John" />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input defaultValue="Doe" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input defaultValue="+1 (555) 123-4567" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input defaultValue="john.doe@example.com" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Reason for visit (Optional)</Label>
                      <Input placeholder="E.g., Routine checkup, chest pain, etc." />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                  <Button size="lg" onClick={() => setStep(3)} className="gap-2">Proceed to Payment <ChevronRight className="h-4 w-4" /></Button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-24 flex flex-col gap-2 border-2 border-primary bg-primary/5">
                        <div className="h-8 w-12 bg-primary/20 rounded"></div>
                        <span className="font-semibold">Credit/Debit Card</span>
                      </Button>
                      <Button variant="outline" className="h-24 flex flex-col gap-2 opacity-50">
                        <div className="h-8 w-12 bg-muted rounded flex items-center justify-center font-bold text-xs">UPI</div>
                        <span className="font-semibold">UPI / Netbanking</span>
                      </Button>
                    </div>
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>Card Number</Label>
                        <Input placeholder="0000 0000 0000 0000" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Expiry Date</Label>
                          <Input placeholder="MM/YY" />
                        </div>
                        <div className="space-y-2">
                          <Label>CVV</Label>
                          <Input placeholder="123" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-between pt-4">
                  <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                  <Button size="lg" className="gap-2 bg-[#16a34a] hover:bg-[#16a34a]/90 text-white w-full max-w-xs">
                    Pay $50.00 & Confirm
                  </Button>
                </div>
              </>
            )}

          </div>

          {/* Order Summary Sidebar */}
          <div className="md:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="bg-muted/30 border-b">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" />
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">Dr. Sarah Chen</p>
                    <p className="text-xs text-muted-foreground">Cardiology</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg border border-border/50">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><CalendarUI className="h-3 w-3 hidden" /> Date</span>
                    <span className="font-medium">Tomorrow, Oct 24</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-3 w-3 hidden" /> Time</span>
                    <span className="font-medium">10:30 AM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">Normal Consult</span>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Consultation Fee</span>
                    <span>$50.00</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxes & Platform Fee</span>
                    <span>$0.00</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 text-foreground">
                    <span>Total</span>
                    <span>$50.00</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-primary/5 border-t p-4 text-xs text-center text-muted-foreground justify-center">
                Secure, encrypted payment powered by Stripe.
              </CardFooter>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
