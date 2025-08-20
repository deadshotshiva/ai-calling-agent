"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
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
import { Bot, Plus, Settings, Play, Mic, Brain, Thermometer } from "lucide-react"
import type { AIAgent, Voice } from "@/lib/types"

export default function AgentsPage() {
  const [agents, setAgents] = useState<AIAgent[]>([])
  const [voices, setVoices] = useState<Voice[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const { toast } = useToast()

  // Form state for creating agents
  const [agentForm, setAgentForm] = useState({
    name: "",
    systemPrompt: "",
    voiceId: "",
    model: "gpt-4o",
    temperature: [0.7],
    maxTokens: 1000,
  })

  useEffect(() => {
    fetchAgents()
    fetchVoices()
  }, [])

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents")
      const data = await response.json()

      if (data.success) {
        setAgents(data.data.agents)
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch AI agents",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch AI agents",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchVoices = async () => {
    try {
      const response = await fetch("/api/voices")
      const data = await response.json()

      if (data.success) {
        setVoices(data.data.voices)
      }
    } catch (error) {
      console.error("Failed to fetch voices:", error)
    }
  }

  const handleCreateAgent = async () => {
    if (!agentForm.name || !agentForm.systemPrompt || !agentForm.voiceId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setCreateLoading(true)
    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...agentForm,
          temperature: agentForm.temperature[0],
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Success",
          description: "AI agent created successfully",
        })
        setCreateDialogOpen(false)
        setAgentForm({
          name: "",
          systemPrompt: "",
          voiceId: "",
          model: "gpt-4o",
          temperature: [0.7],
          maxTokens: 1000,
        })
        fetchAgents()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create AI agent",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create AI agent",
        variant: "destructive",
      })
    } finally {
      setCreateLoading(false)
    }
  }

  const getVoiceName = (voiceId: string) => {
    const voice = voices.find((v) => v.id === voiceId)
    return voice ? voice.name : "Unknown Voice"
  }

  const getModelBadgeColor = (model: string) => {
    switch (model) {
      case "gpt-4o":
        return "default"
      case "gpt-4":
        return "secondary"
      case "gpt-3.5-turbo":
        return "outline"
      default:
        return "outline"
    }
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
          <h1 className="text-3xl font-bold text-gray-900">AI Agents</h1>
          <p className="text-gray-600 mt-1">Configure and manage your AI voice agents for automated calling</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700">
              <Plus className="h-4 w-4" />
              Create Agent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create AI Agent</DialogTitle>
              <DialogDescription>Configure a new AI voice agent for handling calls.</DialogDescription>
            </DialogHeader>
            <div className="space-y-6 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Agent Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Customer Service Agent"
                    value={agentForm.name}
                    onChange={(e) => setAgentForm((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="model">AI Model</Label>
                  <Select
                    value={agentForm.model}
                    onValueChange={(value) => setAgentForm((prev) => ({ ...prev, model: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="voiceId">Voice *</Label>
                <Select
                  value={agentForm.voiceId}
                  onValueChange={(value) => setAgentForm((prev) => ({ ...prev, voiceId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        <div className="flex items-center gap-2">
                          <span>{voice.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {voice.provider}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="systemPrompt">System Prompt *</Label>
                <Textarea
                  id="systemPrompt"
                  placeholder="You are a helpful customer service representative..."
                  value={agentForm.systemPrompt}
                  onChange={(e) => setAgentForm((prev) => ({ ...prev, systemPrompt: e.target.value }))}
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Define the agent's personality, role, and behavior guidelines
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">
                    Temperature: {agentForm.temperature[0]}
                    <Thermometer className="inline h-3 w-3 ml-1" />
                  </Label>
                  <Slider
                    value={agentForm.temperature}
                    onValueChange={(value) => setAgentForm((prev) => ({ ...prev, temperature: value }))}
                    max={2}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">Controls creativity (0 = focused, 2 = creative)</p>
                </div>
                <div>
                  <Label htmlFor="maxTokens">Max Tokens</Label>
                  <Input
                    id="maxTokens"
                    type="number"
                    min={100}
                    max={4000}
                    value={agentForm.maxTokens}
                    onChange={(e) =>
                      setAgentForm((prev) => ({ ...prev, maxTokens: Number.parseInt(e.target.value) || 1000 }))
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum response length</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateAgent} disabled={createLoading}>
                {createLoading ? "Creating..." : "Create Agent"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {agents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Agents</h3>
            <p className="text-gray-600 text-center mb-6">
              You haven't created any AI agents yet. Create your first agent to start handling calls automatically.
            </p>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-cyan-600 hover:bg-cyan-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Agent
                </Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <Card key={agent.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Bot className="h-5 w-5 text-cyan-600" />
                    {agent.name}
                  </CardTitle>
                  <Badge variant={agent.isActive ? "default" : "secondary"}>
                    {agent.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <Badge variant={getModelBadgeColor(agent.model)}>{agent.model}</Badge>
                  <Badge variant="outline" className="text-xs">
                    <Mic className="h-3 w-3 mr-1" />
                    {getVoiceName(agent.voiceId)}
                  </Badge>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">System Prompt:</p>
                  <p className="text-sm text-gray-800 line-clamp-3">{agent.systemPrompt}</p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Thermometer className="h-3 w-3" />
                    Temperature
                  </span>
                  <span className="font-medium">{agent.temperature}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    Max Tokens
                  </span>
                  <span className="font-medium">{agent.maxTokens}</span>
                </div>
                <div className="pt-2 border-t flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                    <Settings className="h-3 w-3 mr-1" />
                    Configure
                  </Button>
                  <Button variant="outline" size="sm" className="bg-transparent">
                    <Play className="h-3 w-3" />
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
