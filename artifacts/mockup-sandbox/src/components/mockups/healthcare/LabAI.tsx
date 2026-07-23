import React from 'react';
import './_group.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UploadCloud, FileImage, Search, Bell, AlertTriangle, Eye, ArrowRight, Activity, Cpu } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

export function LabAI() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Lab Integration & AI Analysis</h1>
            <p className="text-muted-foreground">Process, upload, and automatically analyze medical imaging and reports.</p>
          </div>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search patient ID or test..." className="pl-9 w-[250px] bg-card" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Requests & Upload */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Upload Area */}
            <Card className="border-dashed border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                  <UploadCloud className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-bold text-lg text-foreground mb-1">Upload Lab Report or Scan</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                  Drag and drop DICOM, JPEG, PNG, or PDF files here, or click to browse. AI analysis begins automatically upon upload.
                </p>
                <Button>Select Files</Button>
              </CardContent>
            </Card>

            {/* Pending Requests Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pending Lab Requests</CardTitle>
                <CardDescription>Ordered by doctors, awaiting processing</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient / ID</TableHead>
                      <TableHead>Test Type</TableHead>
                      <TableHead>Ordered By</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <p className="font-medium text-sm">David Smith</p>
                        <p className="text-xs text-muted-foreground">#PT-824</p>
                      </TableCell>
                      <TableCell className="font-medium text-sm">Chest X-Ray (PA)</TableCell>
                      <TableCell className="text-sm text-muted-foreground">Dr. Sarah Chen</TableCell>
                      <TableCell><Badge variant="destructive" className="bg-destructive/10 text-destructive border-0">Urgent</Badge></TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="outline">Upload Result</Button></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <p className="font-medium text-sm">Emma Wilson</p>
                        <p className="text-xs text-muted-foreground">#PT-912</p>
                      </TableCell>
                      <TableCell className="font-medium text-sm">CBC Panel</TableCell>
                      <TableCell className="text-sm text-muted-foreground">Dr. Michael Ross</TableCell>
                      <TableCell><Badge variant="secondary" className="bg-muted text-muted-foreground border-0">Normal</Badge></TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="outline">Upload Result</Button></TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <p className="font-medium text-sm">John Doe</p>
                        <p className="text-xs text-muted-foreground">#PT-105</p>
                      </TableCell>
                      <TableCell className="font-medium text-sm">Lipid Profile</TableCell>
                      <TableCell className="text-sm text-muted-foreground">Dr. Emily Wong</TableCell>
                      <TableCell><Badge variant="secondary" className="bg-muted text-muted-foreground border-0">Normal</Badge></TableCell>
                      <TableCell className="text-right"><Button size="sm" variant="outline">Upload Result</Button></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

          </div>

          {/* Right Column: AI Analysis Panel */}
          <div className="space-y-6">
            
            <Card className="border-primary shadow-md overflow-hidden relative">
              {/* Processing overlay state placeholder (hidden initially, shown during upload) */}
              {/* <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <Activity className="h-8 w-8 text-primary animate-pulse mb-4" />
                <p className="font-medium text-primary">AI Analyzing Scan...</p>
              </div> */}
              
              <div className="bg-primary/10 px-4 py-3 border-b flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2 text-primary">
                  <Cpu className="h-5 w-5" /> AI Analysis Results
                </h3>
                <Badge variant="outline" className="bg-background text-primary border-primary">Report #2847</Badge>
              </div>
              
              <CardContent className="p-4 space-y-6">
                
                {/* Image Thumbnail */}
                <div className="aspect-square bg-black rounded-lg overflow-hidden relative group">
                  <div className="absolute inset-0 flex items-center justify-center text-white/50 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent">
                    <FileImage className="h-16 w-16 opacity-30" />
                    <span className="absolute bottom-4 font-mono font-bold tracking-[0.2em] opacity-50">X-RAY (PA)</span>
                  </div>
                  {/* Simulated bounding box from AI */}
                  <div className="absolute top-[20%] left-[40%] w-[30%] h-[40%] border-2 border-destructive/80 border-dashed rounded-sm bg-destructive/10"></div>
                  
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white border-0"><Eye className="h-4 w-4" /></Button>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Patient: David Smith</p>
                  <p className="text-sm font-medium">Chest X-Ray uploaded 10 mins ago</p>
                </div>

                {/* Predictions */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="font-bold text-destructive">Primary Prediction: Pneumonia</p>
                        <p className="text-xs text-muted-foreground">High confidence detecting right lower lobe infiltrates.</p>
                      </div>
                      <span className="font-mono font-bold text-destructive">87%</span>
                    </div>
                    <Progress value={87} className="h-2 [&>div]:bg-destructive" />
                  </div>

                  <div className="space-y-2 opacity-70">
                    <div className="flex justify-between items-end">
                      <p className="text-sm font-semibold text-foreground">Secondary: Normal</p>
                      <span className="font-mono text-sm text-foreground">9%</span>
                    </div>
                    <Progress value={9} className="h-1.5 [&>div]:bg-muted-foreground" />
                  </div>
                </div>

                {/* Disclaimer Banner */}
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex gap-3 items-start mt-6">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <p className="text-xs text-warning-foreground font-medium text-warning">
                    AI analysis is assistive only. Final diagnosis requires clinical judgment by the attending physician.
                  </p>
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#16a34a]/10 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-[#16a34a]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Doctor Notified</p>
                    <p className="text-xs text-muted-foreground">Dr. Sharma has been alerted of critical findings.</p>
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