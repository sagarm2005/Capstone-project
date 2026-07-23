import React, { useState } from 'react';
import './_group.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Activity, Eye, EyeOff, Building } from 'lucide-react';

export function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('patient');

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 relative overflow-hidden">
      {/* Background medical pattern/gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-secondary/10" />
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-secondary/10 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="relative z-10 w-full max-w-md p-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">MediCore HMS</h1>
          <p className="text-muted-foreground mt-2">AI-Powered Healthcare Management</p>
        </div>

        <Card className="border-border/50 shadow-xl shadow-black/5 backdrop-blur-sm bg-card/95">
          <CardHeader className="pb-4">
            <Tabs value={role} onValueChange={setRole} className="w-full">
              <TabsList className="grid grid-cols-5 h-12">
                <TabsTrigger value="patient" className="text-xs">Patient</TabsTrigger>
                <TabsTrigger value="doctor" className="text-xs">Doctor</TabsTrigger>
                <TabsTrigger value="lab" className="text-xs">Lab</TabsTrigger>
                <TabsTrigger value="admin" className="text-xs">Admin</TabsTrigger>
                <TabsTrigger value="super" className="text-xs">Super</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email or Username</Label>
              <Input id="email" placeholder="Enter your email or username" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm font-medium text-primary hover:underline">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Enter your password" 
                />
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-1 pb-2">
              <Checkbox id="remember" />
              <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                Remember me for 30 days
              </Label>
            </div>
            <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-11 text-base">
              Sign In
            </Button>

            {role !== 'patient' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full h-11 border-border/50">
                  <Building className="w-4 h-4 mr-2" />
                  Sign in with Hospital ID
                </Button>
              </>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pb-6">
            {role === 'patient' && (
              <div className="text-center text-sm">
                <span className="text-muted-foreground">New patient? </span>
                <a href="#" className="font-semibold text-primary hover:underline">
                  Create account
                </a>
              </div>
            )}
          </CardFooter>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Secure login powered by MediCore HMS v2.1
        </p>
      </div>
    </div>
  );
}