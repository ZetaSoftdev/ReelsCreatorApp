import React from 'react'
import { Card, CardContent } from '../ui/card'

interface Subtitle {
  startTime: number;
  endTime: number;
  text: string;
}

interface CaptionSectionProps {
  subtitles: Subtitle[];
}

const CaptionSection = ({ subtitles }: CaptionSectionProps) => {
  // Helper function to format time in MM:SS format
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Captions</h2>
      
      
      <div className="space-y-4">
        {subtitles.length > 0 ? (
          subtitles.map((subtitle, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <p className="text-sm text-gray-500">
                  {formatTime(subtitle.startTime)} - {formatTime(subtitle.endTime)}
                </p>
                <p className="text-lg font-semibold">{subtitle.text}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm">00:11 - 00:92</p>
              <p className="text-lg font-semibold">Hello et bienvenue sur</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default CaptionSection