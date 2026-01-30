'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Sentiment } from '@/types/meeting'

interface SentimentPanelProps {
  sentiment?: Sentiment | null
}

function getSentimentColor(label?: string): string {
  switch (label?.toUpperCase()) {
    case 'POSITIVE':
      return 'bg-green-500/20 text-green-500 border-green-500/30'
    case 'NEGATIVE':
      return 'bg-destructive/20 text-destructive border-destructive/30'
    default:
      return 'bg-muted text-muted-foreground border-border'
  }
}

export function SentimentPanel({ sentiment }: SentimentPanelProps) {
  if (!sentiment) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Sentiment analysis not available yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Overall sentiment */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Sentiment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-3">
            <Badge className={getSentimentColor(sentiment.overall_label)}>
              {sentiment.overall_label || 'NEUTRAL'}
            </Badge>
            {sentiment.overall_score !== undefined && (
              <span className="text-sm text-muted-foreground">
                Score: {sentiment.overall_score.toFixed(3)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* By speaker */}
      {sentiment.by_speaker && sentiment.by_speaker.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>By Speaker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sentiment.by_speaker.map((speaker, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-md border"
                >
                  <div>
                    <p className="font-medium">{speaker.speaker}</p>
                    <p className="text-sm text-muted-foreground">
                      Score: {speaker.score.toFixed(3)}
                    </p>
                  </div>
                  <Badge className={getSentimentColor(speaker.label)}>
                    {speaker.label}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tone features */}
      {sentiment.tone_features && Object.keys(sentiment.tone_features).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tone Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(sentiment.tone_features).map(([speaker, features]) => (
                <div key={speaker} className="p-3 rounded-md border">
                  <p className="font-medium mb-2">{speaker}</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {features.avg_pitch !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Avg Pitch:</span>{' '}
                        <span className="font-medium">{features.avg_pitch.toFixed(2)} Hz</span>
                      </div>
                    )}
                    {features.avg_energy !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Avg Energy:</span>{' '}
                        <span className="font-medium">{features.avg_energy.toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
