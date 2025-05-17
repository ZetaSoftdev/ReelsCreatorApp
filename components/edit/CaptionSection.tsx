import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Edit2, Check } from 'lucide-react'
import { Input } from '../ui/input'

interface Subtitle {
  startTime: number;
  endTime: number;
  text: string;
}

interface CaptionSectionProps {
  subtitles: Subtitle[];
  onSubtitleEdit?: (index: number, newText: string) => void;
}

const CaptionSection = ({ subtitles, onSubtitleEdit }: CaptionSectionProps) => {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState<string>('');
  const [localSubtitles, setLocalSubtitles] = useState<Subtitle[]>([]);

  // Update local subtitles when prop changes
  useEffect(() => {
    setLocalSubtitles(subtitles);
  }, [subtitles]);

  console.log("CaptionSection rendered with:", { 
    subtitlesCount: subtitles.length,
    hasEditCallback: !!onSubtitleEdit 
  });

  // Helper function to format time in MM:SS:MS format including milliseconds
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;
  };

  // Start editing a caption
  const handleEditStart = (index: number, text: string) => {
    setEditingIndex(index);
    setEditingText(text);
  };

  // Save edited caption
  const handleSave = (index: number) => {
    // Update both local and parent state
    if (onSubtitleEdit) {
      onSubtitleEdit(index, editingText);
    } else {
      console.log(`Edited caption ${index} to: ${editingText}`);
      console.warn("onSubtitleEdit function not provided");
      
      // Update local state so UI reflects changes even without parent callback
      const updatedSubtitles = [...localSubtitles];
      if (updatedSubtitles[index]) {
        updatedSubtitles[index] = {
          ...updatedSubtitles[index],
          text: editingText
        };
        setLocalSubtitles(updatedSubtitles);
      }
    }
    setEditingIndex(null);
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Captions</h2>
      
      <div className="space-y-4">
        {localSubtitles.length > 0 ? (
          localSubtitles.map((subtitle, index) => (
            <Card key={index} className="border rounded-md shadow-sm hover:shadow transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {formatTime(subtitle.startTime)} - {formatTime(subtitle.endTime)}
                  </p>
                  {editingIndex !== index && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditStart(index, subtitle.text)}
                      className="bg-purple-300/30 hover:bg-purple-400/40 text-purple-600 rounded-lg p-2"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {editingIndex === index ? (
                  <div className="mt-2">
                    <Input
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="mb-2"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleSave(index)}
                      className="mt-1 bg-purple-500 hover:bg-purple-600 text-white"
                    >
                      <Check className="h-4 w-4 mr-1" /> Save
                    </Button>
                  </div>
                ) : (
                  <p className="text-lg font-semibold mt-1">{subtitle.text}</p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div>
            <Card>
              <CardContent className="p-4">
                <p className="text-center py-2">Loading captions...</p>
              </CardContent>
            </Card>
            <div className="mt-4">
              <p className="text-sm text-gray-500 text-center">If captions don't load, try refreshing the page.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CaptionSection