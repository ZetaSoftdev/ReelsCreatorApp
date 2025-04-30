import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Avatar } from "@/components/ui/avatar";
import { Crop, Edit, Grid, Languages, Save, User, ChevronLeft, Sparkles, Edit2, Edit3Icon, Captions, Edit3, Download, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { CaptionPreset } from "./EditSection";
import { generateASS } from "@/utils/subtitleUtils";
import { toast } from "@/hooks/use-toast";

// Define export stages for tracking progress
type ExportStage = 
  | "preparing" 
  | "fetchingCaptions" 
  | "generatingSubtitles" 
  | "processingVideo" 
  | "finalizing" 
  | "completed";

interface NavbarProps {
  selectedTool: string;
  setSelectedTool: (value: string) => void;
  videoTitle?: string;
  videoSrc?: string;
  wordTimestampsUrl?: string;
  selectedPreset?: CaptionPreset | null;
}

export default function Navbar({ 
  selectedTool, 
  setSelectedTool, 
  videoTitle = "Untitled Video",
  videoSrc,
  wordTimestampsUrl,
  selectedPreset
}: NavbarProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadingSubtitles, setIsDownloadingSubtitles] = useState(false);
  const [exportStage, setExportStage] = useState<ExportStage>("preparing");
  const [exportProgress, setExportProgress] = useState(0);
  
  // Progress animation for smooth progress bar
  useEffect(() => {
    if (!isExporting) return;
    
    let interval: NodeJS.Timeout;
    
    // For each stage, animate progress up to a certain point
    if (exportStage === "preparing") {
      interval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 1, 10));
      }, 50);
    } else if (exportStage === "fetchingCaptions") {
      interval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 1, 30));
      }, 50);
    } else if (exportStage === "generatingSubtitles") {
      interval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 1, 50));
      }, 50);
    } else if (exportStage === "processingVideo") {
      interval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 0.5, 90));
      }, 100);
    } else if (exportStage === "finalizing") {
      interval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 1, 98));
      }, 50);
    } else if (exportStage === "completed") {
      setExportProgress(100);
    }
    
    return () => clearInterval(interval);
  }, [isExporting, exportStage]);
  
  // Handle export button click
  const handleExport = async () => {
    if (!videoSrc || !wordTimestampsUrl || !selectedPreset) {
      toast({
        title: "Missing Requirements",
        description: "Please ensure a video and captions are loaded",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsExporting(true);
      setExportStage("preparing");
      setExportProgress(0);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UI
      
      // Fetch word timestamps data
      setExportStage("fetchingCaptions");
      console.log("Fetching word timestamps from:", wordTimestampsUrl);
      const response = await fetch(decodeURIComponent(wordTimestampsUrl));
      if (!response.ok) {
        throw new Error('Failed to fetch word timestamps');
      }
      const wordTimestampsData = await response.json();
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UI
      
      // Generate subtitles (preparation)
      setExportStage("generatingSubtitles");
      await new Promise(resolve => setTimeout(resolve, 700)); // Small delay for UI
      
      // Call the API with current preset
      setExportStage("processingVideo");
      console.log("Sending data to burn-captions API");
      const apiResponse = await fetch('/api/burn-captions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrl: videoSrc,
          wordTimestamps: wordTimestampsData,
          preset: selectedPreset,
        }),
      });
      
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(`Server error: ${errorData.details || 'Unknown error'}`);
      }
      
      // Get the video blob
      setExportStage("finalizing");
      const videoBlob = await apiResponse.blob();
      
      // Mark as completed
      setExportStage("completed");
      await new Promise(resolve => setTimeout(resolve, 500)); // Show completed state briefly
      
      // Create download link
      const url = URL.createObjectURL(videoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${videoTitle || 'video'}_with_captions.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log("Video exported successfully");
    } catch (error) {
      console.error('Error exporting video:', error);
      toast({
        title: "Export Failed",
        description: `Failed to export video: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      // Small delay before closing to show completion
      setTimeout(() => {
        setIsExporting(false);
        setExportProgress(0);
      }, 1000);
    }
  };
  
  
  
  // Helper function to get stage information
  const getStageInfo = (stage: ExportStage) => {
    switch (stage) {
      case "preparing":
        return { title: "Preparing Resources", description: "Setting up for export..." };
      case "fetchingCaptions":
        return { title: "Fetching Captions", description: "Loading caption data..." };
      case "generatingSubtitles":
        return { title: "Generating Subtitles", description: "Creating ASS subtitle file..." };
      case "processingVideo":
        return { title: "Processing Video", description: "Burning captions to video..." };
      case "finalizing":
        return { title: "Finalizing", description: "Preparing download..." };
      case "completed":
        return { title: "Completed", description: "Your video is ready!" };
    }
  };
  
  // Return the completed status of each step
  const isStepCompleted = (stage: ExportStage) => {
    const stageOrder = ["preparing", "fetchingCaptions", "generatingSubtitles", "processingVideo", "finalizing", "completed"];
    const currentIndex = stageOrder.indexOf(exportStage);
    const stageIndex = stageOrder.indexOf(stage);
    
    return stageIndex < currentIndex;
  };
  
  return (
    <div className="flex items-center justify-between bg-slate50 p-3">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/home" className="border shadow-md py-2 px-3 font-medium flex items-center justify-center gap-1 rounded-md">
          <ChevronLeft size={20} /> Leave
        </Link>
        {/* <div className="flex items-center gap-2 text-yellow-500">
          <p className="text-base">{videoTitle}</p>
        </div> */}
        {/* <Link href="pricing" className="bg-yellow py-2 px-3 text-base flex items-center rounded-md gap-2 hover:shadow-md">
          <Sparkles size={18} /> Upgrade
        </Link> */}
      </div>
      
      {/* Center Section */}
      <ToggleGroup type="single" value={selectedTool} onValueChange={setSelectedTool} variant="dark" className="flex rounded-xl overflow-hidden bg-bgWhite shadow-md border">
        <ToggleGroupItem
          value="crop"
          className="rounded-none"
        >
          <Crop size={20} /> Crop
        </ToggleGroupItem>
        <ToggleGroupItem
          value="caption"
          className="rounded-none"
        >
          <Captions size={20} /> Captions
        </ToggleGroupItem>
        <ToggleGroupItem
          value="style"
          className="rounded-none"
        >
          <Edit size={20} /> Style
        </ToggleGroupItem>
        <ToggleGroupItem
          value="translate"
          className="rounded-none"
        >
          <Languages size={20} /> Auto Translate
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <Button variant="ghost">Tall Portrait (9:16)</Button>
        <Button 
          variant="default" 
          className="bg-[#312F37] text-white hover:scale-105 transition-all duration-200 hover:bg-[#312F37]"
          onClick={handleExport}
          disabled={isExporting || !videoSrc}
        >
          {isExporting ? 'Exporting...' : 'Export'} <Save size={20} className="ml-2" />
        </Button>
        <Avatar>
          <User size={20} />
        </Avatar>
      </div>
      
      {/* Enhanced Export Progress Overlay */}
      {isExporting && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96 max-w-[90vw]">
            <h3 className="text-xl font-medium mb-6 text-center">
              {getStageInfo(exportStage).title}
            </h3>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full transition-all duration-300" 
                style={{ width: `${exportProgress}%` }}
              />
            </div>
            
            {/* Step indicators */}
            <div className="space-y-4 mb-6">
              {(["preparing", "fetchingCaptions", "generatingSubtitles", "processingVideo", "finalizing"] as ExportStage[]).map((stage) => (
                <div key={stage} className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 
                    ${stage === exportStage ? 'bg-purple-500 text-white' : 
                      isStepCompleted(stage) ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {isStepCompleted(stage) ? 
                      <CheckCircle2 size={16} /> : 
                      <span className="text-xs">{["preparing", "fetchingCaptions", "generatingSubtitles", "processingVideo", "finalizing"].indexOf(stage) + 1}</span>}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${stage === exportStage ? 'text-purple-600' : 
                      isStepCompleted(stage) ? 'text-green-600' : 'text-gray-500'}`}>
                      {getStageInfo(stage).title}
                    </p>
                    {stage === exportStage && (
                      <p className="text-xs text-gray-500 mt-1">{getStageInfo(stage).description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-sm text-gray-600 text-center mt-4">
              Please don't close this window while processing.
              {exportStage === "processingVideo" && <span className="block text-xs mt-1 text-yellow-600">This may take a few moments depending on video length.</span>}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
