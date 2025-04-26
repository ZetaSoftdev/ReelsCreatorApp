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
  const previousChunkRef = useRef<string>('');
  const lastUpdateTimeRef = useRef<number>(0);
  const transitionTimeRef = useRef<number>(0);
  const previousPresetRef = useRef<CaptionPreset | null>(null);

  // Helper to calculate Y position based on preset position and marginY
  const calculateYPosition = (position: string, canvasHeight: number, fontSize: number, marginY: number = 0): number => {
    // Always use center position as base
    const centerPosition = canvasHeight / 2;
    
    // Apply marginY adjustment (negative values move up, positive move down)
    // Scale the marginY based on canvas height to make it proportional
    const marginAdjustment = (marginY / 100) * (canvasHeight / 2);
    
    return centerPosition + marginAdjustment;
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
    
    // Calculate font scaling factor for preview only
    // We need to scale the font size in the preview to match what will appear in the exported video
    // The scale factor depends on the video dimensions in the preview vs exported video (1280x720)
    // Typical mobile video preview width is around 300-400px, so we scale accordingly
    const videoWidth = canvas.width;
    const referenceWidth = 400; // Reference width for typical preview player
    
    // Calculate scaling factor based on preview size
    // Use a higher base factor for better visibility and match with exported video appearance
    const baseScaleFactor = 0.4;
    const previewScaleFactor = baseScaleFactor * (videoWidth <= referenceWidth ? 1 : videoWidth / referenceWidth);
    
    // Apply scaling to font size
    const scaledFontSize = preset.fontSize * previewScaleFactor;
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const videoTime = video.currentTime;
    const currentTime = performance.now();
    
    // Use words per line from preset if available, otherwise use default
    const effectiveWordsPerLine = preset.wordsPerLine || wordsPerLine;
    
    // Check if preset has changed
    const presetChanged = previousPresetRef.current && 
                         (previousPresetRef.current.wordsPerLine !== preset.wordsPerLine);
    
    // Update previous preset reference
    previousPresetRef.current = {...preset};
    
    // Find active captions and words at current time
    const { activeSubtitle, activeWords, activeWordIndices } = getActiveCaptionAndWords(videoTime, wordTimestamps.segments, effectiveWordsPerLine);
    
    if (!activeSubtitle) return;
    
    // Check if we should update the transition timer
    if (previousChunkRef.current !== activeSubtitle.text) {
      // We've changed to a new caption chunk
      previousChunkRef.current = activeSubtitle.text;
      lastUpdateTimeRef.current = currentTime;
      
      // Only set transition time for natural caption changes, not preset changes
      if (!presetChanged) {
        transitionTimeRef.current = currentTime;
      }
    }
    
    // Only delay rendering for natural caption transitions, not preset changes
    // This prevents captions from disappearing when changing words per line
    if (!presetChanged && currentTime - transitionTimeRef.current < 30) {
      requestAnimationFrame(renderCaptions);
      return;
    }
    
    // Apply font and style based on preset (with scaled font size)
    ctx.font = `${preset.fontWeight} ${scaledFontSize}px ${preset.fontFamily}`;
    
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
    
    // Get position (always center) and apply marginY
    const captionPosition = 'center'; // Default to center
    const marginY = preset.marginY || 0;
    
    // Calculate base Y position with marginY
    const baseYPosition = calculateYPosition(captionPosition, canvas.height, scaledFontSize, marginY);
    
    // Measure text to ensure it fits within video boundaries
    const textMetrics = ctx.measureText(activeSubtitle.text);
    const textWidth = textMetrics.width;
    const maxWidth = canvas.width - (preset.padding || 20) * 2;
    
    // Check if text is wider than the video
    const needsWrapping = textWidth > maxWidth;
    
    // If the text needs to be wrapped, split it into multiple lines
    const lines: string[] = [];
    if (needsWrapping) {
      const words = activeSubtitle.text.split(' ');
      let currentLine = '';
      
      words.forEach(word => {
        // Check if adding this word would exceed max width
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const testWidth = ctx.measureText(testLine).width;
        
        if (testWidth > maxWidth) {
          // This word would make the line too wide, start a new line
          if (currentLine) {
            lines.push(currentLine);
          }
          currentLine = word;
        } else {
          // This word fits on the current line
          currentLine = testLine;
        }
      });
      
      // Add the last line
      if (currentLine) {
        lines.push(currentLine);
      }
    } else {
      // No wrapping needed
      lines.push(activeSubtitle.text);
    }
    
    // Calculate the offset for vertical positioning based on position
    let verticalOffset = 0;
    const lineHeight = scaledFontSize * (preset.lineHeight || 1.2);
    const totalHeight = lines.length * lineHeight;
    
    if (captionPosition === 'center') {
      // For center position, offset by half the total text height to center it
      verticalOffset = -totalHeight / 2 + scaledFontSize / 2;
    } else if (captionPosition === 'top') {
      // No offset for top
      verticalOffset = 0;
    } else {
      // For bottom, offset upward to fit all lines
      verticalOffset = -totalHeight + lineHeight;
    }
    
    // Calculate the starting Y position for the first line
    let yPosition = baseYPosition + verticalOffset;
    
    // Process each line
    lines.forEach((line, lineIndex) => {
      // Calculate X position based on alignment
      let xPosition: number;
      if (ctx.textAlign === 'left') {
        xPosition = preset.padding || 10;
      } else if (ctx.textAlign === 'right') {
        xPosition = canvas.width - (preset.padding || 10);
      } else {
        xPosition = canvas.width / 2;
      }
      
      // Draw background if enabled
      if (preset.backgroundColor) {
        const lineMetrics = ctx.measureText(line);
        const lineWidth = lineMetrics.width;
        const textHeight = scaledFontSize;
        
        const bgX = ctx.textAlign === 'left' ? xPosition - (preset.padding || 10) :
                  ctx.textAlign === 'right' ? xPosition - lineWidth - (preset.padding || 10) :
                  xPosition - (lineWidth / 2) - (preset.padding || 10);
                  
        ctx.fillStyle = preset.backgroundColor;
        ctx.fillRect(
          bgX,
          yPosition - textHeight,
          lineWidth + ((preset.padding || 10) * 2),
          textHeight + (preset.padding || 10)
        );
      }
      
      // Draw each word in the line
      const lineWords = line.split(' ');
      let currentX = xPosition;
      
      // Define common variables for all alignment cases
      const hasActiveWords = lineIndex === 0 && activeWordIndices.length > 0;
      const animationEnabled = (preset.animation !== 'none' || preset.animationType !== 'none');
      
      // Adjust for center and right alignment when rendering word by word
      if (ctx.textAlign === 'center') {
        const totalWidth = ctx.measureText(line).width;
        currentX = xPosition - totalWidth / 2;
        
        // Don't change the text alignment context property yet
        // This will allow us to properly center the word highlighting
        const originalTextAlign = ctx.textAlign;
        ctx.textAlign = 'left'; // Temporarily switch to left alignment for per-word rendering
        
        // Draw each word with appropriate highlighting
        lineWords.forEach((word, wordIndex) => {
          const isActive = hasActiveWords && lineIndex === 0 && activeWordIndices.includes(wordIndex);
          
          // Set color based on whether the word is active
          ctx.fillStyle = isActive && animationEnabled ? 
            (preset.highlightColor || '#FFFF00') : 
            (preset.textColor || preset.color);
          
          // Apply animation to active words
          if (isActive && animationEnabled) {
            // Save context for animation
            ctx.save();
            
            // Apply animation effect
            switch (preset.animation || preset.animationType) {
              case 'highlight':
                // Just use highlight color, already set above
                break;
              case 'fade':
                ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 300) * 0.4;
                break;
              case 'slide':
                // Apply a slight vertical bounce
                const bounceOffset = Math.sin(Date.now() / 250) * 2;
                ctx.fillText(word, currentX, yPosition + bounceOffset);
                
                // Draw outline if enabled
                if (preset.textOutline) {
                  ctx.strokeStyle = preset.outlineColor || '#000000';
                  ctx.lineWidth = preset.outlineWidth || 1;
                  ctx.strokeText(word, currentX, yPosition + bounceOffset);
                }
                
                // Restore context after animation
                ctx.restore();
                
                // Move X position forward for next word and skip the rest of this iteration
                currentX += ctx.measureText(word).width + ctx.measureText(' ').width;
                return;
            }
            
            // Draw the word
            ctx.fillText(word, currentX, yPosition);
            
            // Draw outline if enabled
            if (preset.textOutline) {
              ctx.strokeStyle = preset.outlineColor || '#000000';
              ctx.lineWidth = preset.outlineWidth || 1;
              ctx.strokeText(word, currentX, yPosition);
            }
            
            // Restore context after animation
            ctx.restore();
          } else {
            // Draw the word normally
            ctx.fillText(word, currentX, yPosition);
            
            // Draw outline if enabled
            if (preset.textOutline) {
              ctx.strokeStyle = preset.outlineColor || '#000000';
              ctx.lineWidth = preset.outlineWidth || 1;
              ctx.strokeText(word, currentX, yPosition);
            }
          }
          
          // Move X position forward for next word
          currentX += ctx.measureText(word).width + ctx.measureText(' ').width;
        });
        
        // Reset text alignment to original
        ctx.textAlign = originalTextAlign;
      } else if (ctx.textAlign === 'right') {
        const totalWidth = ctx.measureText(line).width;
        currentX = xPosition - totalWidth;
        ctx.textAlign = 'left'; // Switch to left alignment for per-word rendering
        
        // Draw each word with appropriate highlighting
        lineWords.forEach((word, wordIndex) => {
          const isActive = hasActiveWords && lineIndex === 0 && activeWordIndices.includes(wordIndex);
          
          // Set color based on whether the word is active
          ctx.fillStyle = isActive && animationEnabled ? 
            (preset.highlightColor || '#FFFF00') : 
            (preset.textColor || preset.color);
          
          // Apply animation to active words
          if (isActive && animationEnabled) {
            // Save context for animation
            ctx.save();
            
            // Apply animation effect
            switch (preset.animation || preset.animationType) {
              case 'highlight':
                // Just use highlight color, already set above
                break;
              case 'fade':
                ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 300) * 0.4;
                break;
              case 'slide':
                // Apply a slight vertical bounce
                const bounceOffset = Math.sin(Date.now() / 250) * 2;
                ctx.fillText(word, currentX, yPosition + bounceOffset);
                
                // Draw outline if enabled
                if (preset.textOutline) {
                  ctx.strokeStyle = preset.outlineColor || '#000000';
                  ctx.lineWidth = preset.outlineWidth || 1;
                  ctx.strokeText(word, currentX, yPosition + bounceOffset);
                }
                
                // Restore context after animation
                ctx.restore();
                
                // Move X position forward for next word and skip the rest of this iteration
                currentX += ctx.measureText(word).width + ctx.measureText(' ').width;
                return;
            }
            
            // Draw the word
            ctx.fillText(word, currentX, yPosition);
            
            // Draw outline if enabled
            if (preset.textOutline) {
              ctx.strokeStyle = preset.outlineColor || '#000000';
              ctx.lineWidth = preset.outlineWidth || 1;
              ctx.strokeText(word, currentX, yPosition);
            }
            
            // Restore context after animation
            ctx.restore();
          } else {
            // Draw the word normally
            ctx.fillText(word, currentX, yPosition);
            
            // Draw outline if enabled
            if (preset.textOutline) {
              ctx.strokeStyle = preset.outlineColor || '#000000';
              ctx.lineWidth = preset.outlineWidth || 1;
              ctx.strokeText(word, currentX, yPosition);
            }
          }
          
          // Move X position forward for next word
          currentX += ctx.measureText(word).width + ctx.measureText(' ').width;
        });
        
        // Reset text alignment
        ctx.textAlign = 'right';
      } else {
        // For left alignment, render word by word directly
        
        // Draw each word with appropriate highlighting
        lineWords.forEach((word, wordIndex) => {
          const isActive = hasActiveWords && lineIndex === 0 && activeWordIndices.includes(wordIndex);
          
          // Set color based on whether the word is active
          ctx.fillStyle = isActive && animationEnabled ? 
            (preset.highlightColor || '#FFFF00') : 
            (preset.textColor || preset.color);
          
          // Apply animation to active words
          if (isActive && animationEnabled) {
            // Save context for animation
            ctx.save();
            
            // Apply animation effect
            switch (preset.animation || preset.animationType) {
              case 'highlight':
                // Just use highlight color, already set above
                break;
              case 'fade':
                ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 300) * 0.4;
                break;
              case 'slide':
                // Apply a slight vertical bounce
                const bounceOffset = Math.sin(Date.now() / 250) * 2;
                ctx.fillText(word, currentX, yPosition + bounceOffset);
                
                // Draw outline if enabled
                if (preset.textOutline) {
                  ctx.strokeStyle = preset.outlineColor || '#000000';
                  ctx.lineWidth = preset.outlineWidth || 1;
                  ctx.strokeText(word, currentX, yPosition + bounceOffset);
                }
                
                // Restore context after animation
                ctx.restore();
                
                // Move X position forward for next word and skip the rest of this iteration
                currentX += ctx.measureText(word).width + ctx.measureText(' ').width;
                return;
            }
            
            // Draw the word
            ctx.fillText(word, currentX, yPosition);
            
            // Draw outline if enabled
            if (preset.textOutline) {
              ctx.strokeStyle = preset.outlineColor || '#000000';
              ctx.lineWidth = preset.outlineWidth || 1;
              ctx.strokeText(word, currentX, yPosition);
            }
            
            // Restore context after animation
            ctx.restore();
          } else {
            // Draw the word normally
            ctx.fillText(word, currentX, yPosition);
            
            // Draw outline if enabled
            if (preset.textOutline) {
              ctx.strokeStyle = preset.outlineColor || '#000000';
              ctx.lineWidth = preset.outlineWidth || 1;
              ctx.strokeText(word, currentX, yPosition);
            }
          }
          
          // Move X position forward for next word
          currentX += ctx.measureText(word).width + ctx.measureText(' ').width;
        });
      }
      
      // Move Y position down for next line
      yPosition += lineHeight;
    });
  };

  // Find the active caption and words at the current time
  const getActiveCaptionAndWords = (
    videoTime: number, 
    segments: Segment[],
    wordsPerLine: number
  ): { 
    activeSubtitle: { text: string; } | null,
    activeWords: Word[],
    activeWordIndices: number[] 
  } => {
    // Find the active segment
    const activeSegment = segments.find(
      segment => videoTime >= segment.start && videoTime <= segment.end
    );
    
    if (!activeSegment) {
      return { activeSubtitle: null, activeWords: [], activeWordIndices: [] };
    }
    
    // Find active words in the segment
    const activeWords = activeSegment.words.filter(
      word => videoTime >= word.start && videoTime <= word.end
    );
    
    // Find which chunk contains the current active word or time
    const words = activeSegment.words;
    let currentChunkWords: Word[] = [];
    let activeWordIndices: number[] = [];
    let chunkStartIndex = 0;
    
    // If we have active words, find the chunk containing the first active word
    if (activeWords.length > 0) {
      // Find index of first active word
      const firstActiveWordIndex = words.findIndex(w => 
        activeWords.some(aw => aw.start === w.start && aw.end === w.end)
      );
      
      if (firstActiveWordIndex !== -1) {
        // Calculate which chunk this word belongs to
        chunkStartIndex = Math.floor(firstActiveWordIndex / wordsPerLine) * wordsPerLine;
      }
    } else {
      // No active words, find chunk based on current time
      for (let i = 0; i < words.length; i += wordsPerLine) {
        const wordChunk = words.slice(i, i + wordsPerLine);
        if (wordChunk.length === 0) continue;
        
        const chunkStartTime = wordChunk[0].start;
        const chunkEndTime = wordChunk[wordChunk.length - 1].end;
        
        // Check if current video time falls within this chunk's time range
        if (videoTime >= chunkStartTime && videoTime <= chunkEndTime) {
          chunkStartIndex = i;
          break;
        }
      }
    }
    
    // Get the words for the current chunk
    currentChunkWords = words.slice(chunkStartIndex, chunkStartIndex + wordsPerLine);
    
    // Create subtitle text from the chunk
    const currentChunkText = currentChunkWords.map(w => w.word).join(' ');
    
    // Find which words in the chunk are active
    activeWordIndices = currentChunkWords.reduce((indices, word, index) => {
      if (activeWords.some(w => w.start === word.start && w.end === word.end)) {
        indices.push(index);
      }
      return indices;
    }, [] as number[]);
    
    return { 
      activeSubtitle: { text: currentChunkText },
      activeWords,
      activeWordIndices
    };
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
    
    // Start animation immediately - don't wait for handleVideoReady
    animate();
    
    // Handle video size changes
    const handleResize = () => {
      if (canvasRef.current && video) {
        canvasRef.current.width = video.clientWidth;
        canvasRef.current.height = video.clientHeight;
        renderCaptions();
      }
    };
    
    // Make sure the captions update when the video is playing
    video.addEventListener('play', handleResize);
    video.addEventListener('timeupdate', renderCaptions);
    window.addEventListener('resize', handleResize);
    
    // Initial render
    handleResize();
    
    // Clean up
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      video.removeEventListener('play', handleResize);
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