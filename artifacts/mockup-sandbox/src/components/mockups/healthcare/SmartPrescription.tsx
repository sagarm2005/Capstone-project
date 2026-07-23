import React from 'react';
import './_group.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertTriangle, XCircle, Printer, Download, Plus, FlaskConical } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SmartPrescription() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Prescription Editor */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg border-t-8 border-t-primary">
            {/* Header */}
            <CardHeader className="border-b space-y-4 pb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-primary uppercase tracking-wider">CityCare General Hospital</h1>
                  <p className="text-sm text-muted-foreground mt-1">123 Health Avenue, Medical District, NY 10001</p>
                  <p className="text-sm text-muted-foreground">Ph: +1 (555) 892-4400</p>
                </div>
                <div className="text-right">
                  <h2 className="text-lg font-bold text-foreground">Dr. Sarah Chen</h2>
                  <p className="text-sm text-muted-foreground">MD, Cardiology</p>
                  <p className="text-xs font-mono text-muted-foreground mt-1">Reg No: MD84729</p>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between bg-muted/30 p-4 rounded-lg border gap-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Patient Name</p>
                    <p className="font-semibold mt-0.5">John Doe</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Age / Sex</p>
                    <p className="font-semibold mt-0.5">45 Y / Male</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Date</p>
                    <p className="font-semibold mt-0.5">Oct 23, 2024</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase">Diagnosis</p>
                    <p className="font-semibold mt-0.5">Hypertension</p>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-8">
              {/* Rx Symbol */}
              <div className="text-4xl font-serif italic text-primary">Rx</div>

              {/* Medicines Table */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">Medications</h3>
                  <Button size="sm" variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add Drug</Button>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="w-[250px]">Drug Name</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Route</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Metformin (Glucophage)</TableCell>
                        <TableCell>500 mg</TableCell>
                        <TableCell>1-0-1 (After Meals)</TableCell>
                        <TableCell>30 Days</TableCell>
                        <TableCell>Oral</TableCell>
                      </TableRow>
                      <TableRow className="bg-warning/5 border-l-2 border-l-warning">
                        <TableCell className="font-medium">Lisinopril</TableCell>
                        <TableCell>10 mg</TableCell>
                        <TableCell>1-0-0 (Morning)</TableCell>
                        <TableCell>30 Days</TableCell>
                        <TableCell>Oral</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Atorvastatin</TableCell>
                        <TableCell>20 mg</TableCell>
                        <TableCell>0-0-1 (Bedtime)</TableCell>
                        <TableCell>30 Days</TableCell>
                        <TableCell>Oral</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Lab Tests */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg flex items-center gap-2"><FlaskConical className="h-5 w-5 text-primary" /> Lab Tests Ordered</h3>
                  <Button size="sm" variant="outline" className="gap-2"><Plus className="h-4 w-4" /> Add Test</Button>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="px-3 py-1.5 text-sm bg-muted">Complete Blood Count (CBC) <XCircle className="h-3 w-3 ml-2 cursor-pointer opacity-50 hover:opacity-100" /></Badge>
                  <Badge variant="secondary" className="px-3 py-1.5 text-sm bg-muted">Chest X-Ray (PA View) <XCircle className="h-3 w-3 ml-2 cursor-pointer opacity-50 hover:opacity-100" /></Badge>
                  <Badge variant="secondary" className="px-3 py-1.5 text-sm bg-muted">Lipid Profile <XCircle className="h-3 w-3 ml-2 cursor-pointer opacity-50 hover:opacity-100" /></Badge>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Validation & Controls Sidebar */}
        <div className="space-y-6">
          
          <Card className="border-primary/20 shadow-md">
            <CardHeader className="bg-primary/5 pb-4 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" /> AI Validation Engine
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              
              <div className="space-y-2">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Patient Allergies</p>
                <div className="flex gap-2">
                  <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">Penicillin</Badge>
                  <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20">NSAIDs</Badge>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Interaction Checks</p>
                
                <div className="bg-[#16a34a]/10 border border-[#16a34a]/20 rounded-lg p-3 flex gap-3 items-start">
                  <CheckCircle2 className="h-5 w-5 text-[#16a34a] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#16a34a]">Allergy Check Passed</p>
                    <p className="text-xs text-muted-foreground mt-1">No cross-reactivity with prescribed drugs and documented allergies.</p>
                  </div>
                </div>

                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex gap-3 items-start">
                  <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-warning">Moderate Interaction</p>
                    <p className="text-xs text-muted-foreground mt-1"><span className="font-semibold">Metformin + Lisinopril</span>: Increased risk of lactic acidosis. Monitor renal function closely.</p>
                  </div>
                </div>

                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex gap-3 items-start opacity-50 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="secondary" size="sm">Acknowledge</Button>
                  </div>
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Resolved: NSAID Conflict</p>
                    <p className="text-xs text-muted-foreground mt-1 text-decoration-line-through">Aspirin contraindicated due to NSAID allergy.</p>
                    <p className="text-[10px] mt-1 text-destructive font-medium">Drug removed from Rx.</p>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Follow-up & Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Set Follow-up Date</label>
                <div className="flex gap-2">
                  <Input type="date" defaultValue="2024-11-23" className="flex-1" />
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-4 border-t">
                <Button className="w-full gap-2 bg-primary text-white"><CheckCircle2 className="h-4 w-4" /> Finalize Prescription</Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="w-full gap-2"><Printer className="h-4 w-4" /> Print</Button>
                  <Button variant="outline" className="w-full gap-2"><Download className="h-4 w-4" /> PDF</Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}

// Dummy icon for import resolution
function BrainCircuit(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinelinejoin="round" {...props}><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M9 13a4.5 4.5 0 1 0 4.3-2.5"/><path d="M14 16v-2"/><path d="M21 16v-2a4 4 0 0 0-4-4h-2"/><path d="M18 16v-2a4 4 0 0 0-4-4h-2"/><path d="M15 4v2"/><path d="M18 4v2"/><path d="M21 4v2"/></svg>;
}
