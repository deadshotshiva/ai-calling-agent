"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Phone, Plus, RefreshCw, DollarSign, Calendar } from "lucide-react"
import type { PurchasedNumber } from "@/lib/types"

export default function NumbersPage() {
  const [numbers, setNumbers] = useState<PurchasedNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [buyDialogOpen, setBuyDialogOpen] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [buyLoading, setBuyLoading] = useState(false)
  const [areaCode, setAreaCode] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    fetchNumbers()
  }, [])

  const fetchNumbers = async () => {
    try {
      const response = await fetch("/api/numbers")
      const data = await response.json()

      if (data.success) {
        setNumbers(data.data.numbers)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch phone numbers",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch phone numbers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBuyNumber = async () => {
    setBuyLoading(true)
    try {
      const response = await fetch("/api/vapi/numbers/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ areaCode: areaCode || undefined }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Phone number purchased successfully",
        })
        setBuyDialogOpen(false)
        setAreaCode("")
        fetchNumbers()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to purchase phone number",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to purchase phone number",
        variant: "destructive",
      })
    } finally {
      setBuyLoading(false)
    }
  }

  const handleSyncNumbers = async () => {
    setSyncLoading(true)
    try {
      const response = await fetch("/api/vapi/numbers/sync", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "Phone numbers synced successfully",
        })
        fetchNumbers()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to sync phone numbers",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync phone numbers",
        variant: "destructive",
      })
    } finally {
      setSyncLoading(false)
    }
  }

  const formatPhoneNumber = (phoneNumber: string) => {
    // Format US phone numbers as (XXX) XXX-XXXX
    const cleaned = phoneNumber.replace(/\D/g, "")
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      const number = cleaned.slice(1)
      return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`
    }
    return phoneNumber
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Phone Numbers</h1>
          <p className="text-gray-600 mt-1">Manage your purchased phone numbers for AI calling campaigns</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleSyncNumbers}
            disabled={syncLoading}
            className="flex items-center gap-2 bg-transparent"
          >
            <RefreshCw className={`h-4 w-4 ${syncLoading ? "animate-spin" : ""}`} />
            Sync Numbers
          </Button>
          <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700">
                <Plus className="h-4 w-4" />
                Buy Number
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Purchase Phone Number</DialogTitle>
                <DialogDescription>Buy a new phone number through VAPI for your calling campaigns.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="areaCode">Area Code (Optional)</Label>
                  <Input
                    id="areaCode"
                    placeholder="e.g., 555"
                    value={areaCode}
                    onChange={(e) => setAreaCode(e.target.value)}
                    maxLength={3}
                  />
                  <p className="text-sm text-gray-500 mt-1">Leave empty to get any available number</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBuyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBuyNumber} disabled={buyLoading}>
                  {buyLoading ? "Purchasing..." : "Purchase Number"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {numbers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Phone className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Phone Numbers</h3>
            <p className="text-gray-600 text-center mb-6">
              You haven't purchased any phone numbers yet. Buy your first number to start making calls.
            </p>
            <Dialog open={buyDialogOpen} onOpenChange={setBuyDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-600 hover:bg-cyan-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Buy Your First Number
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {numbers.map((number) => (
            <Card key={number.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">{formatPhoneNumber(number.phoneNumber)}</CardTitle>
                  <Badge variant={number.isActive ? "default" : "secondary"}>
                    {number.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">{number.countryCode}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Monthly Cost
                  </span>
                  <span className="font-medium">${number.monthlyCost.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Purchased
                  </span>
                  <span className="font-medium">{new Date(number.purchasedAt).toLocaleDateString()}</span>
                </div>
                <div className="pt-2 border-t">
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Configure
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
