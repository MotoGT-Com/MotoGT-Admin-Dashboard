"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure your admin dashboard and store settings</p>
      </div>

      {/* Store Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Store Information</CardTitle>
          <CardDescription>Update your store details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Store Name</Label>
              <Input defaultValue="MotoGT" />
            </div>
            <div>
              <Label>Store Email</Label>
              <Input defaultValue="admin@motogi.com" type="email" />
            </div>
            <div>
              <Label>Store Phone</Label>
              <Input defaultValue="+1 (555) 123-4567" />
            </div>
            <div>
              <Label>Store URL</Label>
              <Input defaultValue="motogi.com" />
            </div>
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>

      {/* Notifications Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Order Notifications</Label>
              <p className="text-sm text-muted-foreground">Get notified on new orders</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Low Stock Alerts</Label>
              <p className="text-sm text-muted-foreground">Alert when inventory is low</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Customer Messages</Label>
              <p className="text-sm text-muted-foreground">Notifications from customer inquiries</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-900/30 bg-red-900/10">
        <CardHeader>
          <CardTitle className="text-red-400">Danger Zone</CardTitle>
          <CardDescription>Irreversible and destructive actions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="destructive">Clear Cache</Button>
          <Button variant="destructive">Reset Dashboard</Button>
        </CardContent>
      </Card>
    </div>
  )
}
