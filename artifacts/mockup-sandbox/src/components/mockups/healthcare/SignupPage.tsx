import React, { useState } from 'react';
import './_group.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Activity, ChevronDown, CalendarIcon, X } from 'lucide-react';

export function SignupPage() {
  const [isMedicalOpen, setIsMedicalOpen] = useState(false);
  const [tags, setTags] = useState(['Penicillin', 'NSAIDs']);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12 px-4 relative">
      {/* Background medical pattern/gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-96 bg-primary/5 border-b border-primary/10" />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <Activity className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Create Your Patient Account</h1>
          <p className="text-muted-foreground mt-2">MediCore HMS</p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-black/5 bg-card">
          <CardHeader className="bg-muted/30 border-b border-border/50 pb-6 rounded-t-xl">
            <div className="mb-2 flex justify-between items-center text-sm font-medium">
              <span className="text-primary">Step 1 of 3: Personal Details</span>
              <span className="text-muted-foreground">33%</span>
            </div>
            <div className="h-2 w-full bg-border rounded-full overflow-hidden">
              <div className="h-full bg-primary w-1/3 rounded-full"></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="Enter your full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <div className="relative">
                  <Input id="dob" type="date" className="w-full text-foreground" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Gender</Label>
              <RadioGroup defaultValue="female" className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="r1" />
                  <Label htmlFor="r1" className="font-normal cursor-pointer">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="r2" />
                  <Label htmlFor="r2" className="font-normal cursor-pointer">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="r3" />
                  <Label htmlFor="r3" className="font-normal cursor-pointer">Other</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="flex">
                  <Select defaultValue="in">
                    <SelectTrigger className="w-[80px] rounded-r-none border-r-0 focus:ring-0 focus:ring-offset-0 focus:z-10">
                      <SelectValue placeholder="+91" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">+91</SelectItem>
                      <SelectItem value="us">+1</SelectItem>
                      <SelectItem value="uk">+44</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input id="phone" placeholder="98765 43210" className="rounded-l-none focus:z-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" placeholder="you@example.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="password">Create Password</Label>
                <Input id="password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Collapsible open={isMedicalOpen} onOpenChange={setIsMedicalOpen} className="w-full">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full flex justify-between items-center p-4 h-auto bg-muted/20 hover:bg-muted/50 rounded-lg">
                    <span className="font-semibold text-foreground">Optional: Pre-fill Health Info</span>
                    <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isMedicalOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-4 pb-2 space-y-6">
                  <div className="space-y-2">
                    <Label>Blood Group</Label>
                    <Select>
                      <SelectTrigger className="w-full md:w-1/2">
                        <SelectValue placeholder="Select blood group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Known Allergies</Label>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-normal">
                          {tag}
                          <button className="ml-1 hover:text-primary/70"><X className="w-3 h-3" /></button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Type allergy and press Add" className="md:w-1/2" />
                      <Button variant="outline">Add</Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Existing Conditions</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="cond1" />
                        <Label htmlFor="cond1" className="font-normal cursor-pointer">Diabetes</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="cond2" />
                        <Label htmlFor="cond2" className="font-normal cursor-pointer">Hypertension</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="cond3" />
                        <Label htmlFor="cond3" className="font-normal cursor-pointer">Asthma</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="cond4" />
                        <Label htmlFor="cond4" className="font-normal cursor-pointer">Heart Disease</Label>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 bg-muted/10 border-t border-border/50 pt-6 rounded-b-xl">
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-lg">
              Create Account
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">Already have an account? </span>
              <a href="#" className="font-semibold text-primary hover:underline">
                Sign In
              </a>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-4">
              Your health data is encrypted and HIPAA compliant
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}