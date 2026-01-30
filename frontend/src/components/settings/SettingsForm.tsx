'use client'

import { useSettingsStore } from '@/store/settingsStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function SettingsForm() {
  const { model, temperature, maxTokens, setModel, setTemperature, setMaxTokens, reset } = useSettingsStore()

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Default Model</CardTitle>
          <CardDescription>Choose the default AI model for new prompts</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Temperature</CardTitle>
          <CardDescription>Controls randomness in responses (0 = focused, 1 = creative)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Temperature</Label>
              <span className="text-sm text-muted-foreground">{temperature}</span>
            </div>
            <Slider
              value={[temperature]}
              onValueChange={([value]) => setTemperature(value)}
              min={0}
              max={1}
              step={0.1}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Max Tokens</CardTitle>
          <CardDescription>Maximum number of tokens in the response</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Max Tokens</Label>
            <Input
              type="number"
              value={maxTokens}
              onChange={(e) => setMaxTokens(Number(e.target.value))}
              min={100}
              max={4000}
              step={100}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button variant="outline" onClick={reset}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}
