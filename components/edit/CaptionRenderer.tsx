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

  // Helper function to draw a rounded rectangle if the built-in roundRect isn't available
  const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
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
    
    // Apply global scaling if defined in preset, otherwise default to 1.0
    const globalScale = preset.scale || 1.0;
    
    // Apply scaling to font size
    const scaledFontSize = preset.fontSize * previewScaleFactor * globalScale;
    
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
    
    // Set letter spacing if specified (using textLetterSpacing if available in future canvas APIs)
    // Currently we handle letter spacing manually when drawing text
    
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
      // Add a fallback to use bgColor and bgOpacity if backgroundColor is not set
      else if (preset.bgColor && preset.bgColor !== 'transparent') {
        const lineMetrics = ctx.measureText(line);
        const lineWidth = lineMetrics.width;
        const textHeight = scaledFontSize;
        
        const bgX = ctx.textAlign === 'left' ? xPosition - (preset.padding || 10) :
                  ctx.textAlign === 'right' ? xPosition - lineWidth - (preset.padding || 10) :
                  xPosition - (lineWidth / 2) - (preset.padding || 10);
        
        // Convert bgColor and bgOpacity to an rgba string
        const r = parseInt(preset.bgColor.substring(1, 3), 16);
        const g = parseInt(preset.bgColor.substring(3, 5), 16);
        const b = parseInt(preset.bgColor.substring(5, 7), 16);
        const a = preset.bgOpacity !== undefined ? preset.bgOpacity : 1;
        
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
        ctx.fillRect(
          bgX,
          yPosition - textHeight,
          lineWidth + ((preset.padding || 10) * 2),
          textHeight + (preset.padding || 6)
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
          
          // Get the word width for the background
          const wordWidth = ctx.measureText(word).width;
          const padding = preset.padding ? Math.min(preset.padding, 3) : 2; // Reduced padding for word-level background
          const textHeight = scaledFontSize;
          
          // Draw background for highlighted word if enabled and active
          if (isActive && animationEnabled && preset.highlightBgColor && preset.highlightBgColor !== 'transparent') {
            // Background highlighting is disabled for now
            /* 
            // Save current context
            ctx.save();
            
            // Calculate the background position and dimensions
            const wordBgX = currentX - padding;
            
            // Properly handle word background positioning with font metrics
            // Similar fixes to the line background positioning
            const fontAscent = textHeight * 0.75; // Approximate ascent (height above baseline)
            const fontDescent = textHeight * 0.25; // Approximate descent (height below baseline)
            const wordBgY = yPosition - fontAscent - padding;
            const wordBgHeight = fontAscent + fontDescent + (padding * 2);
            
            // Convert highlight background color and opacity to fill style
            if (preset.highlightBgColor.startsWith('#')) {
              const r = parseInt(preset.highlightBgColor.substring(1, 3), 16);
              const g = parseInt(preset.highlightBgColor.substring(3, 5), 16);
              const b = parseInt(preset.highlightBgColor.substring(5, 7), 16);
              const a = preset.highlightBgOpacity !== undefined ? preset.highlightBgOpacity : 1;
              
              ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
            } else {
              ctx.fillStyle = preset.highlightBgColor;
            }
            
            // Draw the word background with more rounded corners
            // Increase border radius for a more rounded appearance
            const borderRadius = Math.min(8, textHeight * 0.4); // Increased from 4 to 8 and 0.2 to 0.4
            
            // Try to use the built-in roundRect if available, otherwise use our helper
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(
                wordBgX,
                wordBgY,
                wordWidth + (padding * 2),
                wordBgHeight,
                borderRadius
              );
              ctx.fill();
            } else {
              drawRoundedRect(
                ctx,
                wordBgX,
                wordBgY,
                wordWidth + (padding * 2),
                wordBgHeight,
                borderRadius
              );
            }
            
            // Restore context for text drawing
            ctx.restore();
            */
          }
          
          // Set color based on whether the word is active
          ctx.fillStyle = isActive && animationEnabled ? 
            (preset.highlightColor || '#FFFF00') : 
            (preset.textColor || preset.color);
          
          // Apply animation to active words
          if (isActive && animationEnabled) {
            // Save context for animation
            ctx.save();
            
            // Apply scaling for highlighted words when highlightScale is set
            if (preset.highlightScale && preset.highlightScale > 1.0) {
              const scaleValue = preset.highlightScale;
              
              // Calculate the center position of the word for scaling
              const wordWidth = ctx.measureText(word).width;
              const wordCenterX = currentX + wordWidth / 2;
              const wordCenterY = yPosition;
              
              // Apply scaling transformation
              ctx.translate(wordCenterX, wordCenterY);
              ctx.scale(scaleValue, scaleValue);
              ctx.translate(-wordCenterX, -wordCenterY);
            }
            
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
                currentX += ctx.measureText(word).width + ctx.measureText(' ').width + (preset.wordSpacing || 0);
                return;
            }
            
            // Draw the word
            if (preset.letterSpacing && preset.letterSpacing !== 0) {
              // Draw character by character with letter spacing
              let charX = currentX;
              for (let i = 0; i < word.length; i++) {
                const char = word[i];
                ctx.fillText(char, charX, yPosition);
                
                // Move position by character width plus letter spacing
                charX += ctx.measureText(char).width + preset.letterSpacing;
              }
            } else {
              // Draw the word normally
            ctx.fillText(word, currentX, yPosition);
            }
            
            // Draw outline if enabled
            if (preset.textOutline) {
              ctx.strokeStyle = preset.outlineColor || '#000000';
              ctx.lineWidth = preset.outlineWidth || 1;
              
              if (preset.letterSpacing && preset.letterSpacing !== 0) {
                // Draw outline character by character with letter spacing
                let charX = currentX;
                for (let i = 0; i < word.length; i++) {
                  const char = word[i];
                  ctx.strokeText(char, charX, yPosition);
                  charX += ctx.measureText(char).width + preset.letterSpacing;
                }
              } else {
                // Draw outline normally
              ctx.strokeText(word, currentX, yPosition);
              }
            }
            
            // Restore context after animation
            ctx.restore();
          } else {
            // Draw the word
            if (preset.letterSpacing && preset.letterSpacing !== 0) {
              // Draw character by character with letter spacing
              let charX = currentX;
              for (let i = 0; i < word.length; i++) {
                const char = word[i];
                ctx.fillText(char, charX, yPosition);
                
                // Move position by character width plus letter spacing
                charX += ctx.measureText(char).width + preset.letterSpacing;
              }
          } else {
            // Draw the word normally
            ctx.fillText(word, currentX, yPosition);
            }
            
            // Draw outline if enabled
            if (preset.textOutline) {
              ctx.strokeStyle = preset.outlineColor || '#000000';
              ctx.lineWidth = preset.outlineWidth || 1;
              
              if (preset.letterSpacing && preset.letterSpacing !== 0) {
                // Draw outline character by character with letter spacing
                let charX = currentX;
                for (let i = 0; i < word.length; i++) {
                  const char = word[i];
                  ctx.strokeText(char, charX, yPosition);
                  charX += ctx.measureText(char).width + preset.letterSpacing;
                }
              } else {
                // Draw outline normally
              ctx.strokeText(word, currentX, yPosition);
              }
            }
          }
          
          // Move X position forward for next word
          currentX += ctx.measureText(word).width + ctx.measureText(' ').width + (preset.wordSpacing || 0);
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
          
          // Get the word width for the background
          const wordWidth = ctx.measureText(word).width;
          const padding = preset.padding ? Math.min(preset.padding, 3) : 2; // Reduced padding for word-level background
          const textHeight = scaledFontSize;
          
          // Draw background for highlighted word if enabled and active
          if (isActive && animationEnabled && preset.highlightBgColor && preset.highlightBgColor !== 'transparent') {
            // Background highlighting is disabled for now
            /* 
            // Save current context
            ctx.save();
            
            // Calculate the background position and dimensions
            const wordBgX = currentX - padding;
            
            // Properly handle word background positioning with font metrics
            // Similar fixes to the line background positioning
            const fontAscent = textHeight * 0.75; // Approximate ascent (height above baseline)
            const fontDescent = textHeight * 0.25; // Approximate descent (height below baseline)
            const wordBgY = yPosition - fontAscent - padding;
            const wordBgHeight = fontAscent + fontDescent + (padding * 2);
            
            // Convert highlight background color and opacity to fill style
            if (preset.highlightBgColor.startsWith('#')) {
              const r = parseInt(preset.highlightBgColor.substring(1, 3), 16);
              const g = parseInt(preset.highlightBgColor.substring(3, 5), 16);
              const b = parseInt(preset.highlightBgColor.substring(5, 7), 16);
              const a = preset.highlightBgOpacity !== undefined ? preset.highlightBgOpacity : 1;
              
              ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
            } else {
              ctx.fillStyle = preset.highlightBgColor;
            }
            
            // Draw the word background with more rounded corners
            // Increase border radius for a more rounded appearance
            const borderRadius = Math.min(8, textHeight * 0.4); // Increased from 4 to 8 and 0.2 to 0.4
            
            // Try to use the built-in roundRect if available, otherwise use our helper
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(
                wordBgX,
                wordBgY,
                wordWidth + (padding * 2),
                wordBgHeight,
                borderRadius
              );
              ctx.fill();
            } else {
              drawRoundedRect(
                ctx,
                wordBgX,
                wordBgY,
                wordWidth + (padding * 2),
                wordBgHeight,
                borderRadius
              );
            }
            
            // Restore context for text drawing
            ctx.restore();
            */
          }
          
          // Set color based on whether the word is active
          ctx.fillStyle = isActive && animationEnabled ? 
            (preset.highlightColor || '#FFFF00') : 
            (preset.textColor || preset.color);
          
          // Apply animation to active words
          if (isActive && animationEnabled) {
            // Save context for animation
            ctx.save();
            
            // Apply scaling for highlighted words when highlightScale is set
            if (preset.highlightScale && preset.highlightScale > 1.0) {
              const scaleValue = preset.highlightScale;
              
              // Calculate the center position of the word for scaling
              const wordWidth = ctx.measureText(word).width;
              const wordCenterX = currentX + wordWidth / 2;
              const wordCenterY = yPosition;
              
              // Apply scaling transformation
              ctx.translate(wordCenterX, wordCenterY);
              ctx.scale(scaleValue, scaleValue);
              ctx.translate(-wordCenterX, -wordCenterY);
            }
            
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
                currentX += ctx.measureText(word).width + ctx.measureText(' ').width + (preset.wordSpacing || 0);
                return;
            }
            
            // Draw the word
            if (preset.letterSpacing && preset.letterSpacing !== 0) {
              // Draw character by character with letter spacing
              let charX = currentX;
              for (let i = 0; i < word.length; i++) {
                const char = word[i];
                ctx.fillText(char, charX, yPosition);
                
                // Move position by character width plus letter spacing
                charX += ctx.measureText(char).width + preset.letterSpacing;
              }
            } else {
              // Draw the word normally
            ctx.fillText(word, currentX, yPosition);
            }
            
            // Draw outline if enabled
            if (preset.textOutline) {
              ctx.strokeStyle = preset.outlineColor || '#000000';
              ctx.lineWidth = preset.outlineWidth || 1;
              
              if (preset.letterSpacing && preset.letterSpacing !== 0) {
                // Draw outline character by character with letter spacing
                let charX = currentX;
                for (let i = 0; i < word.length; i++) {
                  const char = word[i];
                  ctx.strokeText(char, charX, yPosition);
                  charX += ctx.measureText(char).width + preset.letterSpacing;
                }
              } else {
                // Draw outline normally
              ctx.strokeText(word, currentX, yPosition);
              }
            }
            
            // Restore context after animation
            ctx.restore();
          } else {
            // Draw the word
            if (preset.letterSpacing && preset.letterSpacing !== 0) {
              // Draw character by character with letter spacing
              let charX = currentX;
              for (let i = 0; i < word.length; i++) {
                const char = word[i];
                ctx.fillText(char, charX, yPosition);
                
                // Move position by character width plus letter spacing
                charX += ctx.measureText(char).width + preset.letterSpacing;
              }
          } else {
            // Draw the word normally
            ctx.fillText(word, currentX, yPosition);
            }
            
            // Draw outline if enabled
            if (preset.textOutline) {
              ctx.strokeStyle = preset.outlineColor || '#000000';
              ctx.lineWidth = preset.outlineWidth || 1;
              
              if (preset.letterSpacing && preset.letterSpacing !== 0) {
                // Draw outline character by character with letter spacing
                let charX = currentX;
                for (let i = 0; i < word.length; i++) {
                  const char = word[i];
                  ctx.strokeText(char, charX, yPosition);
                  charX += ctx.measureText(char).width + preset.letterSpacing;
                }
              } else {
                // Draw outline normally
              ctx.strokeText(word, currentX, yPosition);
              }
            }
          }
          
          // Move X position forward for next word
          currentX += ctx.measureText(word).width + ctx.measureText(' ').width + (preset.wordSpacing || 0);
        });
        
        // Reset text alignment
        ctx.textAlign = 'right';
      } else {
        // For left alignment, render word by word directly
        
        // Draw each word with appropriate highlighting
        lineWords.forEach((word, wordIndex) => {
          const isActive = hasActiveWords && lineIndex === 0 && activeWordIndices.includes(wordIndex);
          
          // Get the word width for the background
          const wordWidth = ctx.measureText(word).width;
          const padding = preset.padding ? Math.min(preset.padding, 3) : 2; // Reduced padding for word-level background
          const textHeight = scaledFontSize;
          
          // Draw background for highlighted word if enabled and active
          if (isActive && animationEnabled && preset.highlightBgColor && preset.highlightBgColor !== 'transparent') {
            // Background highlighting is disabled for now
            /* 
            // Save current context
            ctx.save();
            
            // Calculate the background position and dimensions
            const wordBgX = currentX - padding;
            
            // Properly handle word background positioning with font metrics
            // Similar fixes to the line background positioning
            const fontAscent = textHeight * 0.75; // Approximate ascent (height above baseline)
            const fontDescent = textHeight * 0.25; // Approximate descent (height below baseline)
            const wordBgY = yPosition - fontAscent - padding;
            const wordBgHeight = fontAscent + fontDescent + (padding * 2);
            
            // Convert highlight background color and opacity to fill style
            if (preset.highlightBgColor.startsWith('#')) {
              const r = parseInt(preset.highlightBgColor.substring(1, 3), 16);
              const g = parseInt(preset.highlightBgColor.substring(3, 5), 16);
              const b = parseInt(preset.highlightBgColor.substring(5, 7), 16);
              const a = preset.highlightBgOpacity !== undefined ? preset.highlightBgOpacity : 1;
              
              ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
            } else {
              ctx.fillStyle = preset.highlightBgColor;
            }
            
            // Draw the word background with more rounded corners
            // Increase border radius for a more rounded appearance
            const borderRadius = Math.min(8, textHeight * 0.4); // Increased from 4 to 8 and 0.2 to 0.4
            
            // Try to use the built-in roundRect if available, otherwise use our helper
            if (typeof ctx.roundRect === 'function') {
              ctx.roundRect(
                wordBgX,
                wordBgY,
                wordWidth + (padding * 2),
                wordBgHeight,
                borderRadius
              );
              ctx.fill();
            } else {
              drawRoundedRect(
                ctx,
                wordBgX,
                wordBgY,
                wordWidth + (padding * 2),
                wordBgHeight,
                borderRadius
              );
            }
            
            // Restore context for text drawing
            ctx.restore();
            */
          }
          
          // Set color based on whether the word is active
          ctx.fillStyle = isActive && animationEnabled ? 
            (preset.highlightColor || '#FFFF00') : 
            (preset.textColor || preset.color);
          
          // Apply animation to active words
          if (isActive && animationEnabled) {
            // Save context for animation
            ctx.save();
            
            // Apply scaling for highlighted words when highlightScale is set
            if (preset.highlightScale && preset.highlightScale > 1.0) {
              const scaleValue = preset.highlightScale;
              
              // Calculate the center position of the word for scaling
              const wordWidth = ctx.measureText(word).width;
              const wordCenterX = currentX + wordWidth / 2;
              const wordCenterY = yPosition;
              
              // Apply scaling transformation
              ctx.translate(wordCenterX, wordCenterY);
              ctx.scale(scaleValue, scaleValue);
              ctx.translate(-wordCenterX, -wordCenterY);
            }
            
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
                currentX += ctx.measureText(word).width + ctx.measureText(' ').width + (preset.wordSpacing || 0);
                return;
            }
            
            // Draw the word
            if (preset.letterSpacing && preset.letterSpacing !== 0) {
              // Draw character by character with letter spacing
              let charX = currentX;
              for (let i = 0; i < word.length; i++) {
                const char = word[i];
                ctx.fillText(char, charX, yPosition);
                
                // Move position by character width plus letter spacing
                charX += ctx.measureText(char).width + preset.letterSpacing;
              }
            } else {
              // Draw the word normally
            ctx.fillText(word, currentX, yPosition);
            }
            
            // Draw outline if enabled
            if (preset.textOutline) {
              ctx.strokeStyle = preset.outlineColor || '#000000';
              ctx.lineWidth = preset.outlineWidth || 1;
              
              if (preset.letterSpacing && preset.letterSpacing !== 0) {
                // Draw outline character by character with letter spacing
                let charX = currentX;
                for (let i = 0; i < word.length; i++) {
                  const char = word[i];
                  ctx.strokeText(char, charX, yPosition);
                  charX += ctx.measureText(char).width + preset.letterSpacing;
                }
              } else {
                // Draw outline normally
              ctx.strokeText(word, currentX, yPosition);
              }
            }
            
            // Restore context after animation
            ctx.restore();
          } else {
            // Draw the word
            if (preset.letterSpacing && preset.letterSpacing !== 0) {
              // Draw character by character with letter spacing
              let charX = currentX;
              for (let i = 0; i < word.length; i++) {
                const char = word[i];
                ctx.fillText(char, charX, yPosition);
                
                // Move position by character width plus letter spacing
                charX += ctx.measureText(char).width + preset.letterSpacing;
              }
          } else {
            // Draw the word normally
            ctx.fillText(word, currentX, yPosition);
            }
            
            // Draw outline if enabled
            if (preset.textOutline) {
              ctx.strokeStyle = preset.outlineColor || '#000000';
              ctx.lineWidth = preset.outlineWidth || 1;
              
              if (preset.letterSpacing && preset.letterSpacing !== 0) {
                // Draw outline character by character with letter spacing
                let charX = currentX;
                for (let i = 0; i < word.length; i++) {
                  const char = word[i];
                  ctx.strokeText(char, charX, yPosition);
                  charX += ctx.measureText(char).width + preset.letterSpacing;
                }
              } else {
                // Draw outline normally
              ctx.strokeText(word, currentX, yPosition);
              }
            }
          }
          
          // Move X position forward for next word
          currentX += ctx.measureText(word).width + ctx.measureText(' ').width + (preset.wordSpacing || 0);
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