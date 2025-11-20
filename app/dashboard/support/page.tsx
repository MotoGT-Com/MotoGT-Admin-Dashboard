"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

const tickets = [
  { id: '#1234', customer: 'John Doe', subject: 'Order not received', status: 'Open', date: '2024-01-14' },
  { id: '#1233', customer: 'Jane Smith', subject: 'Product compatibility question', status: 'In Progress', date: '2024-01-13' },
  { id: '#1232', customer: 'Mike Johnson', subject: 'Return request', status: 'Resolved', date: '2024-01-10' },
  { id: '#1231', customer: 'Sarah Lee', subject: 'Shipping inquiry', status: 'Open', date: '2024-01-09' },
]

export default function SupportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Support</h1>
        <p className="text-muted-foreground mt-1">Manage customer support tickets</p>
      </div>

      {/* Support Table */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>All customer support requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold">Ticket</th>
                  <th className="text-left py-3 px-4 font-semibold">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold">Subject</th>
                  <th className="text-left py-3 px-4 font-semibold">Status</th>
                  <th className="text-left py-3 px-4 font-semibold">Date</th>
                  <th className="text-left py-3 px-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-border hover:bg-card/50 transition">
                    <td className="py-3 px-4 font-medium text-accent">{ticket.id}</td>
                    <td className="py-3 px-4">{ticket.customer}</td>
                    <td className="py-3 px-4">{ticket.subject}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-3 py-1 rounded font-medium ${
                        ticket.status === 'Resolved' ? 'bg-green-900/30 text-green-300' :
                        ticket.status === 'In Progress' ? 'bg-blue-900/30 text-blue-300' :
                        'bg-red-900/30 text-red-300'
                      }`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{ticket.date}</td>
                    <td className="py-3 px-4">
                      <Button variant="ghost" size="sm">Reply</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
