'use client';

import React, { useRef, useEffect } from 'react';
import { CaptionPreset } from './EditSection';

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

interface CaptionRendererProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  wordTimestamps: WordTimestamps | null;
  preset: CaptionPreset;
  wordsPerLine?: number;
}

const CaptionRenderer: React.FC<CaptionRendererProps> = ({ 
  videoRef, 
  wordTimestamps, 
  preset,
  wordsPerLine = 4
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Helper to calculate Y position based on preset position
  const calculateYPosition = (position: string, canvasHeight: number, fontSize: number): number => {
    switch (position) {
      case 'top':
        return fontSize * 2;
      case 'middle':
        return canvasHeight / 2;
      case 'bottom':
      default:
        return canvasHeight - fontSize * 3;
    }
  };

  // Find segments and words active at the current time
  const getActiveWords = (videoTime: number, segments: Segment[]): { 
    segments: Segment[],
    activeWordIndices: Map<number, number[]> // Map of segment index to array of active word indices
  } => {
    const activeSegments = segments.filter(
      segment => videoTime >= segment.start && videoTime <= segment.end
    );
    
    const activeWordIndices = new Map<number, number[]>();
    
    activeSegments.forEach((segment, segmentIndex) => {
      const activeIndices: number[] = [];
      
      segment.words.forEach((word, wordIndex) => {
        if (videoTime >= word.start && videoTime <= word.end) {
          activeIndices.push(wordIndex);
        }
      });
      
      activeWordIndices.set(segmentIndex, activeIndices);
    });
    
    return { segments: activeSegments, activeWordIndices };
  };

  // Render captions on canvas
  const renderCaptions = () => {
    if (!canvasRef.current || !videoRef.current || !wordTimestamps?.segments) return;
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Match canvas dimensions to video dimensions
    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const videoTime = video.currentTime;
    const { segments, activeWordIndices } = getActiveWords(videoTime, wordTimestamps.segments);
    
    if (segments.length === 0) return;
    
    // Apply font and style based on preset
    ctx.font = `${preset.fontWeight} ${preset.fontSize}px ${preset.fontFamily}`;
    
    // Set text alignment
    if (preset.alignment === 'left') {
      ctx.textAlign = 'left';
    } else if (preset.alignment === 'right') {
      ctx.textAlign = 'right';
    } else {
      ctx.textAlign = 'center';
    }
    
    // Apply text shadow if enabled
    if (preset.textShadow) {
      ctx.shadowColor = preset.shadowColor || 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = preset.shadowBlur || 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
    } else {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
    
    // Calculate base Y position
    const baseYPosition = calculateYPosition(preset.position, canvas.height, preset.fontSize);
    
    // Process each segment
    segments.forEach((segment, segmentIndex) => {
      const words = segment.words;
      const activeWordIndicesToHighlight = activeWordIndices.get(segmentIndex) || [];
      
      // Group words into lines of specified wordsPerLine
      for (let i = 0; i < words.length; i += wordsPerLine) {
        const lineWords = words.slice(i, i + wordsPerLine);
        if (lineWords.length === 0) continue;
        
        // Calculate line position
        const lineYPosition = baseYPosition + (Math.floor(i / wordsPerLine) * (preset.fontSize * (preset.lineHeight || 1.2)));
        
        // Calculate X position based on alignment
        let lineXPosition: number;
        if (ctx.textAlign === 'left') {
          lineXPosition = preset.padding || 10;
        } else if (ctx.textAlign === 'right') {
          lineXPosition = canvas.width - (preset.padding || 10);
        } else {
          lineXPosition = canvas.width / 2;
        }
        
        // Draw background if enabled
        if (preset.backgroundColor) {
          const lineText = lineWords.map(w => w.word).join(' ');
          const textMetrics = ctx.measureText(lineText);
          const textWidth = textMetrics.width;
          const textHeight = preset.fontSize;
          
          const bgX = ctx.textAlign === 'left' ? lineXPosition - (preset.padding || 10) :
                    ctx.textAlign === 'right' ? lineXPosition - textWidth - (preset.padding || 10) :
                    lineXPosition - (textWidth / 2) - (preset.padding || 10);
                    
          ctx.fillStyle = preset.backgroundColor;
          ctx.fillRect(
            bgX,
            lineYPosition - textHeight + 2,
            textWidth + ((preset.padding || 10) * 2),
            textHeight + (preset.padding || 10)
          );
        }
        
        // Draw each word in the line
        let currentX = lineXPosition;
        if (ctx.textAlign === 'center') {
          // For center alignment, we need to calculate the total width
          const lineText = lineWords.map(w => w.word).join(' ');
          const totalWidth = ctx.measureText(lineText).width;
          currentX = lineXPosition - totalWidth / 2;
          ctx.textAlign = 'left'; // Switch to left alignment for per-word rendering
        } else if (ctx.textAlign === 'right') {
          // For right alignment, start from the right and move left
          const lineText = lineWords.map(w => w.word).join(' ');
          const totalWidth = ctx.measureText(lineText).width;
          currentX = lineXPosition - totalWidth;
          ctx.textAlign = 'left'; // Switch to left alignment for per-word rendering
        }
        
        // For calculating word indexes within the segment
        const lineStartIndex = i;
        
        // Render each word in the line
        lineWords.forEach((word, wordIndexInLine) => {
          const globalWordIndex = lineStartIndex + wordIndexInLine;
          const isWordActive = activeWordIndicesToHighlight.includes(globalWordIndex);
          
          // Choose color based on if the word is active
          ctx.fillStyle = isWordActive ? (preset.highlightColor || '#FFFFFF') : (preset.textColor || preset.color);
          
          // Apply animation for active words if enabled
          if (isWordActive && (preset.animationType || preset.animation) !== 'none') {
            applyWordAnimation(
              ctx, 
              word.word, 
              currentX, 
              lineYPosition, 
              preset,
              canvas
            );
          } else {
            // Draw the word normally
            ctx.fillText(word.word, currentX, lineYPosition);
            
            // Draw outline if enabled
            if (preset.textOutline) {
              ctx.strokeStyle = preset.outlineColor || '#000000';
              ctx.lineWidth = preset.outlineWidth || 1;
              ctx.strokeText(word.word, currentX, lineYPosition);
            }
          }
          
          // Move currentX forward for the next word
          currentX += ctx.measureText(word.word).width;
          
          // Add space after word (except for the last word in line)
          if (wordIndexInLine < lineWords.length - 1) {
            const spaceWidth = ctx.measureText(' ').width;
            currentX += spaceWidth;
          }
        });
        
        // Reset text alignment back to preset value for next line
        if (preset.alignment === 'center') {
          ctx.textAlign = 'center';
        } else if (preset.alignment === 'right') {
          ctx.textAlign = 'right';
        }
      }
    });
  };

  // Apply animation effects to active words
  const applyWordAnimation = (
    ctx: CanvasRenderingContext2D, 
    word: string, 
    x: number, 
    y: number, 
    preset: CaptionPreset,
    canvas: HTMLCanvasElement
  ) => {
    // Save the current context state
    ctx.save();
    
    switch (preset.animationType || preset.animation) {
      case 'fade':
        // Apply a slight fade-in effect
        ctx.globalAlpha = 0.8 + (Math.sin(performance.now() / 500) * 0.2);
        break;
        
      case 'pop':
        // Apply a slight scale effect
        const scale = 1 + (Math.sin(performance.now() / 300) * 0.1);
        ctx.translate(x + ctx.measureText(word).width / 2, y);
        ctx.scale(scale, scale);
        ctx.translate(-(x + ctx.measureText(word).width / 2), -y);
        break;
        
      case 'slide':
        // Apply a slight vertical bounce
        const offset = Math.sin(performance.now() / 250) * 3;
        y += offset;
        break;
    }
    
    // Draw the word with animation applied
    ctx.fillText(word, x, y);
    
    // Add outline if enabled
    if (preset.textOutline) {
      ctx.strokeStyle = preset.outlineColor || '#000000';
      ctx.lineWidth = preset.outlineWidth || 1;
      ctx.strokeText(word, x, y);
    }
    
    // Restore the context to its original state
    ctx.restore();
  };

  // Set up animation frame and event listeners
  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    
    // Function to update canvas on each frame
    const animate = () => {
      renderCaptions();
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    // Handle video size changes
    const handleResize = () => {
      if (canvasRef.current && video) {
        canvasRef.current.width = video.clientWidth;
        canvasRef.current.height = video.clientHeight;
        renderCaptions();
      }
    };
    
    // Start animation when video is ready
    const handleVideoReady = () => {
      handleResize();
      animate();
    };
    
    // Make sure the captions update when the video is playing
    video.addEventListener('play', handleVideoReady);
    video.addEventListener('timeupdate', renderCaptions);
    window.addEventListener('resize', handleResize);
    
    // Initial render
    if (video.readyState >= 2) {
      handleVideoReady();
    }
    
    // Clean up
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      video.removeEventListener('play', handleVideoReady);
      video.removeEventListener('timeupdate', renderCaptions);
      window.removeEventListener('resize', handleResize);
    };
  }, [videoRef, preset, wordTimestamps, wordsPerLine]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
};

export default CaptionRenderer; 