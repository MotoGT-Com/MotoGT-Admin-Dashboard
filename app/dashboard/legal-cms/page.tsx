"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Save, Shield, ScrollText, Edit, X } from 'lucide-react'
import { useToast } from "@/hooks/use-toast"

export default function LegalCMSPage() {
  const { toast } = useToast()
  
  const [isEditMode, setIsEditMode] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const [privacyPolicy, setPrivacyPolicy] = useState(`Privacy Policy

Last Updated: [Date]

1. Introduction
Welcome to MotoGT. We respect your privacy and are committed to protecting your personal data.

2. Information We Collect
- Personal identification information (name, email address, phone number)
- Payment information
- Shipping and billing addresses
- Order history and preferences

3. How We Use Your Information
- To process and fulfill your orders
- To communicate with you about your orders
- To improve our products and services
- To send promotional materials (with your consent)

4. Data Security
We implement appropriate security measures to protect your personal information.

5. Your Rights
You have the right to access, correct, or delete your personal data.

6. Contact Us
For privacy-related inquiries, please contact us at privacy@motogt.com`)

  const [termsConditions, setTermsConditions] = useState(`Terms & Conditions

Last Updated: [Date]

1. Agreement to Terms
By accessing and using MotoGT, you agree to be bound by these Terms and Conditions.

2. Use License
Permission is granted to temporarily download one copy of the materials on MotoGT's website for personal, non-commercial transitory viewing only.

3. Products and Services
- All product descriptions and pricing are subject to change without notice
- We reserve the right to limit quantities of any products or services
- We do not warrant that product descriptions are accurate, complete, or error-free

4. Pricing
All prices are in Jordanian Dinar (JOD) and are subject to change without notice.

5. Shipping and Delivery
- Shipping times vary based on location
- We are not responsible for delays caused by shipping carriers
- Risk of loss passes to you upon delivery

6. Returns and Refunds
Please refer to our Return Policy for information on returns and refunds.

7. Limitation of Liability
MotoGT shall not be liable for any indirect, incidental, or consequential damages.

8. Governing Law
These terms shall be governed by the laws of Jordan.

9. Contact Information
For questions about these Terms, contact us at support@motogt.com`)

  const [hasChanges, setHasChanges] = useState(false)

  const handlePrivacyChange = (value: string) => {
    setPrivacyPolicy(value)
    setHasChanges(true)
  }

  const handleTermsChange = (value: string) => {
    setTermsConditions(value)
    setHasChanges(true)
  }

  const handleSave = () => {
    // In a real implementation, this would save to a database
    toast({
      title: "Changes saved",
      description: "Legal documents have been updated successfully.",
    })
    setHasChanges(false)
    setIsEditMode(false)
    setShowSaveDialog(false)
  }

  const handleCancel = () => {
    setIsEditMode(false)
    setHasChanges(false)
    setShowCancelDialog(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Legal CMS</h1>
          <p className="text-muted-foreground mt-1">Manage Privacy Policy and Terms & Conditions</p>
        </div>
        <div className="flex gap-2">
          {!isEditMode ? (
            <Button onClick={() => setIsEditMode(true)} className="gap-2">
              <Edit size={18} />
              Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setShowCancelDialog(true)} className="gap-2">
                <X size={18} />
                Cancel
              </Button>
              <Button onClick={() => setShowSaveDialog(true)} disabled={!hasChanges} className="gap-2">
                <Save size={18} />
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Legal Documents</CardTitle>
          <CardDescription>
            Edit your privacy policy and terms & conditions. These will be displayed on your website.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="privacy" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="privacy" className="gap-2">
                <Shield size={16} />
                Privacy Policy
              </TabsTrigger>
              <TabsTrigger value="terms" className="gap-2">
                <ScrollText size={16} />
                Terms & Conditions
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="privacy" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="privacy">Privacy Policy Content</Label>
                <Textarea
                  id="privacy"
                  value={privacyPolicy}
                  onChange={(e) => handlePrivacyChange(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                  placeholder="Enter your privacy policy content..."
                  readOnly={!isEditMode}
                />
                <p className="text-xs text-muted-foreground">
                  This content will be displayed at https://motogt.com/privacy
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="terms" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="terms">Terms & Conditions Content</Label>
                <Textarea
                  id="terms"
                  value={termsConditions}
                  onChange={(e) => handleTermsChange(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                  placeholder="Enter your terms & conditions content..."
                  readOnly={!isEditMode}
                />
                <p className="text-xs text-muted-foreground">
                  This content will be displayed at https://motogt.com/terms
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel? All unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel}>Discard Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save these changes? The updated legal documents will be published on your website.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
