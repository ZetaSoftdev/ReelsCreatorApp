"use client";
import AutoTranslateSection from "@/components/edit/AutoTranslateSection";
import CaptionSection from "@/components/edit/CaptionSection";
import CropSection from "@/components/edit/CropSection";
import EditSection from "@/components/edit/EditSection";
import Navbar from "@/components/edit/Navbar";
import Timeline from "@/components/edit/Timeline";
import VideoControls from "@/components/edit/VideoControls";
import VideoPreview from "@/components/edit/VideoPreview";
import { useSearchParams } from "next/navigation";
import { useState, useEffect, useRef, RefObject } from "react";

interface Subtitle {
  startTime: number;
  endTime: number;
  text: string;
}

export default function VideoEditor() {
  const searchParams = useSearchParams();
  const videoUrl = searchParams.get("videoUrl");
  const srtUrl = searchParams.get("srtUrl");
  const videoName = searchParams.get("videoName");

  const [videoSrc, setVideoSrc] = useState<string>("");
  const [isYoutube, setIsYoutube] = useState(false);
  const [selectedTool, setSelectedTool] = useState("caption");
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null) as RefObject<HTMLVideoElement>;

  useEffect(() => {
    if (videoUrl) {
      setVideoSrc(decodeURIComponent(videoUrl));
      setIsYoutube(videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be"));
    }
  }, [videoUrl]);
console.log("subtitle in edit page: ",srtUrl)
  // Load and parse the SRT file
  useEffect(() => {
    const loadSubtitles = async () => {
      if (!srtUrl) {
        console.log("No srtUrl provided");
        return;
      }
      
      try {
        const decodedUrl = decodeURIComponent(srtUrl);
        console.log("Attempting to fetch subtitles from:", decodedUrl);
        
        const response = await fetch(decodedUrl);
        console.log("Subtitle response status:", response.status);
        
        const text = await response.text();
        console.log("Received subtitle text:", text.substring(0, 100) + "..."); // Show first 100 chars
        
        // Parse SRT file
        const parsedSubtitles = parseSRT(text);
        console.log("Parsed subtitles:", parsedSubtitles);
        setSubtitles(parsedSubtitles);
      } catch (error) {
        console.error("Error loading subtitles:", error);
      }
    };
    
    loadSubtitles();
  }, [srtUrl]);

  // Helper function to parse timestamp to seconds
  const parseTimestamp = (timestamp: string): number => {
    const [time, milliseconds] = timestamp.split(/[,\.]/);
    const [hours, minutes, seconds] = time.split(':').map(Number);
    return hours * 3600 + minutes * 60 + seconds + Number(milliseconds) / 1000;
  };

  // Helper function to parse WebVTT format
  const parseWebVTT = (content: string): Subtitle[] => {
    const lines = content.split('\n');
    const subtitles: Subtitle[] = [];
    let currentSubtitle: Partial<Subtitle> = {};
    let collectingText = false;

    lines.forEach(line => {
      if (line.includes(' --> ')) {
        const [start, end] = line.split(' --> ');
        currentSubtitle.startTime = parseTimestamp(start);
        currentSubtitle.endTime = parseTimestamp(end);
        collectingText = true;
      } else if (collectingText && line.trim()) {
        if (!currentSubtitle.text) {
          currentSubtitle.text = line;
        } else {
          currentSubtitle.text += '\n' + line;
        }
      } else if (collectingText && !line.trim()) {
        if (currentSubtitle.text) {
          subtitles.push(currentSubtitle as Subtitle);
          currentSubtitle = {};
          collectingText = false;
        }
      }
    });

    if (currentSubtitle.text) {
      subtitles.push(currentSubtitle as Subtitle);
    }

    return subtitles;
  };

  // Enhanced SRT parser with improved format support
  const parseSRT = (srtContent: string): Subtitle[] => {
    try {
      const parsedSubtitles: Subtitle[] = [];
      
      // Normalize line endings
      const normalizedContent = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      
      // First check if it might be JSON format
      if (normalizedContent.trim().startsWith('{') || normalizedContent.trim().startsWith('[')) {
        try {
          const jsonData = JSON.parse(normalizedContent);
          console.log('Detected JSON format subtitles');
          
          // Handle JSON format (assuming array of objects with start, end, text)
          if (Array.isArray(jsonData)) {
            console.log(`Found ${jsonData.length} JSON subtitle entries`);
            return jsonData.map(item => ({
              startTime: typeof item.start === 'number' ? item.start : 
                        typeof item.startTime === 'number' ? item.startTime : 0,
              endTime: typeof item.end === 'number' ? item.end : 
                      typeof item.endTime === 'number' ? item.endTime : 0,
              text: item.text || item.content || ''
            }));
          }
        } catch (e) {
          console.log('JSON parsing failed, continuing with SRT parsing');
        }
      }
      
      // Check for WebVTT format
      if (normalizedContent.includes('WEBVTT')) {
        console.log('Detected WebVTT format');
        return parseWebVTT(normalizedContent);
      }
      
      // Standard SRT processing
      // Split the SRT content by double newline (subtitle blocks)
      const blocks = normalizedContent.trim().split(/\n\n+/);
      console.log(`Processing ${blocks.length} subtitle blocks`);
      
      blocks.forEach((block, index) => {
        try {
          const lines = block.split(/\n/);
          
          // Skip if not enough lines for a valid subtitle
          if (lines.length < 2) {
            return;
          }
          
          // Find the timestamp line (format: 00:00:00,000 --> 00:00:00,000)
          let timestampLine = '';
          let textLines: string[] = [];
          
          // Search for the timestamp line (it should contain ' --> ')
          for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes(' --> ')) {
              timestampLine = lines[i];
              textLines = lines.slice(i + 1);
              break;
            }
          }
          
          if (!timestampLine) {
            return;
          }
          
          // Parse timestamps using regex that handles both comma and period separators
          const timestampMatch = timestampLine.match(/(\d{1,2}:\d{1,2}:\d{1,2}[,\.]\d{1,3}) --> (\d{1,2}:\d{1,2}:\d{1,2}[,\.]\d{1,3})/);
          
          if (timestampMatch) {
            const startTimeStr = timestampMatch[1];
            const endTimeStr = timestampMatch[2];
            
            // Convert timestamp to seconds
            const startTime = parseTimestamp(startTimeStr);
            const endTime = parseTimestamp(endTimeStr);
            
            // Only include the actual text without timestamp
            const text = textLines.join('\n').trim();
            
            if (text) {
              parsedSubtitles.push({
                startTime,
                endTime,
                text
              });
            }
          }
        } catch (blockError) {
          console.error(`Error parsing block ${index}:`, blockError);
        }
      });
      
      console.log(`Successfully parsed ${parsedSubtitles.length} out of ${blocks.length} subtitle blocks`);
      return parsedSubtitles;
    } catch (error) {
      console.error('Error in SRT parser:', error);
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
          {selectedTool === "style" && <EditSection />}
          {selectedTool === "translate" && <AutoTranslateSection />}
        </div>

        {/* Right side content */}
        <div className="w-2/3 flex flex-col">
          {/* Video Preview */}
          <div className="flex-grow">
            <VideoPreview 
              videoSrc={videoSrc} 
              isYoutube={isYoutube} 
              videoRef={videoRef} 
            />
          </div>

          {/* Video Controls and Timeline */}
          <div className="">
            <VideoControls videoRef={videoRef} />
            <Timeline 
              videoUrl={videoSrc} 
              subtitles={subtitles}
              videoRef={videoRef}
              onCutVideo={handleCutVideo}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 