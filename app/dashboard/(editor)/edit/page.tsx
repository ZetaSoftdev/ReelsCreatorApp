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
  const [wordTimestampsData, setWordTimestampsData] = useState<any>(null);
  const [selectedPreset, setSelectedPreset] = useState<CaptionPreset | null>(
    PRESET_OPTIONS.find(p => p.id === 'minimal') || null
  );
  const videoRef = useRef<HTMLVideoElement>(null) as RefObject<HTMLVideoElement>;

  useEffect(() => {
    if (videoUrl) {
      setVideoSrc(decodeURIComponent(videoUrl));
      setIsYoutube(videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be"));
    }
  }, [videoUrl]);

  console.log("word timestamps in edit page: ", wordTimestampsUrl);
  
  // Parse word timestamps JSON into the subtitle format needed by the UI
  const parseWordTimestamps = (data: any, preset?: CaptionPreset | null): Subtitle[] => {
    try {
      if (!data.segments || !Array.isArray(data.segments)) {
        console.error("Invalid word timestamps format: missing segments array");
        return [];
      }

      const subtitles: Subtitle[] = [];
      const wordsPerLine = preset?.wordsPerLine || 4; // Use preset setting or default to 4
      
      // Process each segment
      data.segments.forEach((segment: any) => {
        // Only process if the segment has words array
        if (segment.words && Array.isArray(segment.words)) {
          const words = segment.words;
          
          // Group words into chunks based on wordsPerLine setting
          for (let i = 0; i < words.length; i += wordsPerLine) {
            const wordChunk = words.slice(i, Math.min(i + wordsPerLine, words.length));
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
      
      // Sort subtitles by start time
      subtitles.sort((a, b) => a.startTime - b.startTime);
      
      return subtitles;
    } catch (error) {
      console.error("Error parsing word timestamps:", error);
      return [];
    }
  };

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
        
        // Store the original word timestamps data
        setWordTimestampsData(jsonData);
        
        // Parse word timestamps to the subtitle format using the selected preset
        const parsedSubtitles = parseWordTimestamps(jsonData, selectedPreset);
        console.log("Parsed subtitles from word timestamps:", parsedSubtitles);
        setSubtitles(parsedSubtitles);
      } catch (error) {
        console.error("Error loading word timestamps:", error);
      }
    };
    
    loadWordTimestamps();
  }, [wordTimestampsUrl, selectedPreset]);

  // Handle editing of subtitle text
  const handleSubtitleEdit = (index: number, newText: string) => {
    if (!wordTimestampsData || !subtitles[index]) return;
    
    console.log(`Editing subtitle ${index} from "${subtitles[index].text}" to "${newText}"`);
    
    // Create a deep copy of the data to avoid mutating state directly
    const updatedData = JSON.parse(JSON.stringify(wordTimestampsData));
    
    // Find the matching segment and words in the JSON structure
    const subtitle = subtitles[index];
    const startTime = subtitle.startTime;
    const endTime = subtitle.endTime;
    
    // Update the text in the wordTimestampsData
    for (const segment of updatedData.segments) {
      // Find words within this time range
      if (segment.words && Array.isArray(segment.words)) {
        const wordsInRange = segment.words.filter(
          (word: any) => word.start >= startTime && word.end <= endTime
        );
        
        if (wordsInRange.length > 0) {
          console.log(`Found ${wordsInRange.length} words to update in segment`);
          
          // If this segment contains words in our subtitle range
          const words = newText.split(' ');
          const wordCount = Math.min(wordsInRange.length, words.length);
          
          // Update words that match our range
          for (let i = 0; i < wordCount; i++) {
            console.log(`Updating word ${i} from "${wordsInRange[i].word}" to "${words[i]}"`);
            wordsInRange[i].word = words[i];
          }
          
          // If fewer new words than original words
          if (words.length < wordsInRange.length) {
            // Set remaining words to empty
            for (let i = words.length; i < wordsInRange.length; i++) {
              wordsInRange[i].word = '';
            }
          }
        }
      }
    }
    
    // Update the wordTimestampsData state
    console.log("Setting updated word timestamps data", updatedData);
    setWordTimestampsData(updatedData);
    
    // Also update the subtitles array to reflect changes immediately in the UI
    const updatedSubtitles = [...subtitles];
    updatedSubtitles[index] = {
      ...updatedSubtitles[index],
      text: newText
    };
    setSubtitles(updatedSubtitles);
  };

  // Handle preset selection from EditSection
  const handlePresetChange = (preset: CaptionPreset) => {
    console.log("Preset changed:", preset);
    setSelectedPreset(preset);
    
    // If we have word timestamps data, reparse it with the new preset
    if (wordTimestampsData) {
      // Reparse with the new preset's wordsPerLine setting
      const parsedSubtitles = parseWordTimestamps(wordTimestampsData, preset);
      setSubtitles(parsedSubtitles);
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
        videoSrc={videoSrc}
        wordTimestampsUrl={wordTimestampsUrl ? decodeURIComponent(wordTimestampsUrl) : undefined}
        selectedPreset={selectedPreset}
        wordTimestampsData={wordTimestampsData}
      />

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-1/3 p-4 bg-bgWhite border-r shadow-md overflow-y-auto">
          {selectedTool === "crop" && <CropSection />}
          {selectedTool === "caption" && (
            <CaptionSection 
              subtitles={subtitles} 
              onSubtitleEdit={handleSubtitleEdit}
            />
          )}
          {selectedTool === "style" && <EditSection onPresetChange={handlePresetChange} />}
          {selectedTool === "translate" && <AutoTranslateSection />}
        </div>

        {/* Right side content */}
        <div className="w-2/3 flex flex-col">
          {/* Video Preview */}
          <div className="flex-grow">
            <VideoPreview 
              videoUrl={videoSrc}
              selectedPreset={selectedPreset || PRESET_OPTIONS.find((p: CaptionPreset) => p.id === 'basic')!}
              wordTimestampsUrl={wordTimestampsUrl ? decodeURIComponent(wordTimestampsUrl) : undefined}
              videoRef={videoRef}
              wordTimestampsData={wordTimestampsData}
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

