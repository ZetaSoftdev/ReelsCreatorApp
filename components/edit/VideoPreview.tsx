'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Eye, ZoomIn, Scissors, Sliders, Shuffle } from 'lucide-react';
import CaptionRenderer from './CaptionRenderer';
import { CaptionPreset } from './EditSection';

// Define interfaces for word timestamps
interface Word {
  word: string;
  start: number;
  end: number;
}

interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
  words: Word[];
}

interface WordTimestamps {
  text: string;
  segments: Segment[];
}

interface VideoPreviewProps {
  videoUrl: string;
  wordTimestampsUrl?: string;
  wordTimestampsData?: any;
  selectedPreset: CaptionPreset;
  // For backward compatibility
  videoSrc?: string;
  isYoutube?: boolean;
  videoRef?: React.RefObject<HTMLVideoElement>;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ 
  videoUrl, 
  wordTimestampsUrl,
  wordTimestampsData,
  selectedPreset,
  videoSrc,
  isYoutube,
  videoRef: externalVideoRef
}) => {
  const internalVideoRef = useRef<HTMLVideoElement>(null);
  // Use external ref if provided, otherwise use internal ref
  const actualVideoRef = externalVideoRef || internalVideoRef;
  
  const [wordTimestamps, setWordTimestamps] = useState<WordTimestamps | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use wordTimestampsData if provided, otherwise fetch from URL
  useEffect(() => {
    if (wordTimestampsData) {
      console.log("VideoPreview: Updating wordTimestamps from prop data");
      setWordTimestamps(wordTimestampsData);
      setIsLoading(false);
      return;
    }
    
    const fetchWordTimestamps = async () => {
      if (!wordTimestampsUrl) {
        setWordTimestamps(null);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(wordTimestampsUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch word timestamps: ${response.status}`);
        }
        
        const data = await response.json();
        setWordTimestamps(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load captions');
        console.error('Error loading word timestamps:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWordTimestamps();
  }, [wordTimestampsUrl, wordTimestampsData]);

  return (
    <div className="video-preview w-full h-full relative">
      {isLoading && <div className="flex justify-center items-center h-full">Loading video...</div>}
      {error && <div className="text-red-500 p-4">{error}</div>}
      
      <div className="relative bg-white w-full h-full flex justify-center items-center py-6">
        <div className="relative w-auto h-auto" style={{ maxWidth: '100%' }}>
          <video 
            ref={actualVideoRef}
            src={videoUrl || videoSrc}
            className="w-full h-auto rounded-lg"
            style={{ height: '55vh' }}
            preload="auto"
          />
          
          {/* Caption renderer overlay */}
          {wordTimestamps && selectedPreset && (
            <CaptionRenderer
              key={JSON.stringify(wordTimestamps) + selectedPreset.id}
              videoRef={actualVideoRef as React.RefObject<HTMLVideoElement>}
              wordTimestamps={wordTimestamps}
              preset={selectedPreset}
              wordsPerLine={selectedPreset.wordsPerLine || 4}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoPreview;
