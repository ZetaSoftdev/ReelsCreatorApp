"use client";
import AutoTranslateSection from "@/components/edit/AutoTranslateSection";
import CropSection from "@/components/edit/CropSection";
import CaptionSection from "@/components/edit/CaptionSection";
import EditSection, { CaptionPreset, PRESET_OPTIONS } from "@/components/edit/EditSection";
import Navbar from "@/components/edit/Navbar";
import Timeline from "@/components/edit/Timeline";
import VideoControls from "@/components/edit/VideoControls";
import VideoPreview from "@/components/edit/VideoPreview";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, RefObject, Suspense } from "react";

interface Subtitle {
  startTime: number;
  endTime: number;
  text: string;
}

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

// Create a client component that uses searchParams
function VideoEditorContent() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get("videoUrl");
  const wordTimestampsUrl = searchParams.get("wordTimestampsUrl");
  const videoName = searchParams.get("videoName");

  const [videoSrc, setVideoSrc] = useState<string>("");
  const [isYoutube, setIsYoutube] = useState(false);
  const [selectedTool, setSelectedTool] = useState("caption");
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<CaptionPreset | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null) as RefObject<HTMLVideoElement>;

  useEffect(() => {
    if (videoUrl) {
      setVideoSrc(decodeURIComponent(videoUrl));
      setIsYoutube(videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be"));
    }
  }, [videoUrl]);

  console.log("word timestamps in edit page: ", wordTimestampsUrl);
  
  // Load and parse the word timestamps JSON file
  useEffect(() => {
    const loadWordTimestamps = async () => {
      if (!wordTimestampsUrl) {
        console.log("No wordTimestampsUrl provided");
        return;
      }
      
      try {
        const decodedUrl = decodeURIComponent(wordTimestampsUrl);
        console.log("Attempting to fetch word timestamps from:", decodedUrl);
        
        const response = await fetch(decodedUrl);
        console.log("Word timestamps response status:", response.status);
        
        const jsonData = await response.json();
        console.log("Received word timestamps data:", jsonData);
        
        // Parse word timestamps to the subtitle format
        const parsedSubtitles = parseWordTimestamps(jsonData);
        console.log("Parsed subtitles from word timestamps:", parsedSubtitles);
        setSubtitles(parsedSubtitles);
      } catch (error) {
        console.error("Error loading word timestamps:", error);
      }
    };
    
    loadWordTimestamps();
  }, [wordTimestampsUrl]);

  // Handle preset selection from EditSection
  const handlePresetChange = (preset: CaptionPreset) => {
    setSelectedPreset(preset);
  };

  // Format seconds to MM:SS:MS display format (including milliseconds)
  const formatDisplayTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.floor((timeInSeconds % 1) * 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}:${milliseconds.toString().padStart(3, '0')}`;
  };

  // Parse word timestamps JSON into the subtitle format needed by the UI
  const parseWordTimestamps = (data: any): Subtitle[] => {
    try {
      if (!data.segments || !Array.isArray(data.segments)) {
        console.error("Invalid word timestamps format: missing segments array");
        return [];
      }

      const subtitles: Subtitle[] = [];
      
      // Process each segment
      data.segments.forEach((segment: any) => {
        // Group words into chunks of approximately 4 words each
        if (segment.words && Array.isArray(segment.words)) {
          const words = segment.words;
          const wordsPerLine = 4; // Display 4 words per line
          
          for (let i = 0; i < words.length; i += wordsPerLine) {
            const wordChunk = words.slice(i, i + wordsPerLine);
            if (wordChunk.length === 0) continue;
            
            // Get start time from first word and end time from last word
            const startTime = wordChunk[0].start;
            const endTime = wordChunk[wordChunk.length - 1].end;
            
            // Create text by joining the words
            const text = wordChunk.map((w: any) => w.word).join(' ');
            
            // Add to subtitles array
            subtitles.push({
              startTime,
              endTime,
              text
            });
          }
        } else {
          // Fallback if words array is missing or invalid
          subtitles.push({
            startTime: segment.start,
            endTime: segment.end,
            text: segment.text
          });
        }
      });
      
      return subtitles;
    } catch (error) {
      console.error("Error parsing word timestamps:", error);
      return [];
    }
  };

  const handleCutVideo = (start: number, end: number) => {
    // Handle video cutting logic here
    console.log(`Cut video from ${start} to ${end}`);
  };

  return (
    <div className="bg-slate50 h-screen flex flex-col">
      <Navbar 
        selectedTool={selectedTool} 
        setSelectedTool={setSelectedTool}
        videoTitle={videoName || "Untitled Video"}
      />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-1/3 p-4 bg-bgWhite border-r shadow-md overflow-y-auto">
          {selectedTool === "crop" && <CropSection />}
          {selectedTool === "caption" && <CaptionSection subtitles={subtitles} />}
          {selectedTool === "style" && <EditSection onPresetChange={handlePresetChange} />}
          {selectedTool === "translate" && <AutoTranslateSection />}
        </div>

        {/* Right side content */}
        <div className="w-2/3 flex flex-col">
          {/* Video Preview */}
          <div className="flex-grow">
            <VideoPreview 
              videoUrl={videoSrc}
              selectedPreset={selectedPreset || PRESET_OPTIONS.find((p: CaptionPreset) => p.id === 'minimal')!}
              wordTimestampsUrl={wordTimestampsUrl ? decodeURIComponent(wordTimestampsUrl) : undefined}
              videoRef={videoRef}
            />
          </div>

          {/* Video Controls and Timeline */}
          <div className="">
            <VideoControls videoRef={videoRef} />
            <Timeline 
              videoUrl={videoSrc} 
              subtitles={subtitles} 
              onCutVideo={handleCutVideo} 
              videoRef={videoRef} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrap the component with Suspense in the default export
export default function VideoEditor() {
  return (
    <Suspense fallback={<div className="p-4">Loading editor...</div>}>
      <VideoEditorContent />
    </Suspense>
  );
}

