import { CaptionPreset } from '@/components/edit/EditSection';

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

// Convert hex color to ASS format (AABBGGRR)
function convertHexToASSColor(hex: string, opacity = 1): string {
  try {
  // Remove # if present
  hex = hex.replace('#', '');
    
    // Ensure hex is 6 characters
    if (hex.length !== 6) {
      console.warn(`Invalid hex color: ${hex}, using default black`);
      hex = '000000';
    }
  
  // Parse RGB components
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
    
    // Validate RGB components
    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      console.warn(`Invalid hex color components: ${hex}, using default black`);
      return '&H00000000';
    }
  
  // Calculate alpha (00 = opaque, FF = transparent in ASS)
    // ASS format uses inverse opacity where 00 is fully opaque and FF is fully transparent
  const alpha = Math.round((1 - opacity) * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  
    // Format the color components with proper padding
    const rHex = r.toString(16).padStart(2, '0').toUpperCase();
    const gHex = g.toString(16).padStart(2, '0').toUpperCase();
    const bHex = b.toString(16).padStart(2, '0').toUpperCase();
    
    // Return in ASS format (AABBGGRR)
    return `&H${alpha}${bHex}${gHex}${rHex}`;
  } catch (error) {
    console.error('Error converting hex to ASS color:', error);
    return '&H00000000'; // Default to opaque black on error
  }
}

// Format time (seconds) to ASS format (h:mm:ss.cc)
function formatAssTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${cs.toString().padStart(2, '0')}`;
}

// Get alignment value for ASS (1-9 numpad style)
function getAssAlignment(position: string, alignment?: string): number {
  // Always use center position (4, 5, 6) as base
  let baseValue = 4; // center vertical position
  
  let offset = 1; // center alignment
  if (alignment === 'left') offset = 0;
  else if (alignment === 'right') offset = 2;
  
  return baseValue + offset;
}

// Calculate vertical position based on marginY (-100 to 100)
function calculateVerticalPosition(marginY: number): number {
  // Convert marginY (-100 to 100) to a value between 0 and 720 (video height)
  // Center position is at 360
  // marginY of -100 should be near top (around 60)
  // marginY of 100 should be near bottom (around 660)
  
  const center = 360;
  const maxOffset = 300; // Maximum distance from center
  
  return center + (marginY / 100) * maxOffset;
}

// Generate ASS subtitle file
export function generateASS(wordTimestamps: WordTimestamps, preset: CaptionPreset): string {
  // Extract font name from font family
  const fontName = preset.fontFamily.split(',')[0].trim();
  
  // Get colors in ASS format
  const primaryColor = convertHexToASSColor(preset.textColor || preset.color);
  const secondaryColor = convertHexToASSColor(preset.highlightColor || '#FFFF00');
  
  // Ensure outline color is defined when text outline is enabled
  const outlineColor = preset.textOutline 
    ? convertHexToASSColor(preset.outlineColor || '#000000') 
    : convertHexToASSColor('#000000', 0); // Transparent if outline not enabled
  
  // Determine background color
  let bgColorHex;
  let bgOpacity;
  
  if (preset.backgroundColor) {
    bgColorHex = preset.backgroundColor;
    bgOpacity = preset.bgOpacity || 0;
  } else if (preset.bgColor && preset.bgColor !== 'transparent') {
    bgColorHex = preset.bgColor;
    bgOpacity = preset.bgOpacity || 0;
  } else {
    bgColorHex = '#000000';
    bgOpacity = 0;
  }
  
  // Convert background color to ASS format
  const backColor = convertHexToASSColor(bgColorHex, bgOpacity);
  
  // Get highlight background color if specified
  let highlightBgColor = '&H00000000'; // Default to transparent
  if (preset.highlightBgColor && preset.highlightBgColor !== 'transparent') {
    const highlightBgOpacity = preset.highlightBgOpacity !== undefined ? preset.highlightBgOpacity : 1;
    highlightBgColor = convertHexToASSColor(preset.highlightBgColor, highlightBgOpacity);
  }
  
  // Determine whether to use background box based on opacity
  const useBgBox = bgOpacity > 0;
  
  // Set BorderStyle based on whether we're using a background
  // BorderStyle=1 for outline/shadow, BorderStyle=3 for opaque box
  const defaultBorderStyle = useBgBox ? 3 : 1;

  // Always use BorderStyle 1 when text outline is enabled
  const effectiveBorderStyle = preset.textOutline ? 1 : defaultBorderStyle;
  
  // Calculate outline width - ensure it's properly scaled for ASS format
  // In ASS, outline width of 1 is already quite thick
  let outlineWidth = 0;
  if (preset.textOutline) {
    // Scale the outline width appropriately to match UI preview
    // Increase the scaling factor to make outlines more prominent
    outlineWidth = preset.outlineWidth ? Math.min(preset.outlineWidth * 3, 10) : 3;
  }
  
  // Get alignment
  let alignmentValue;
  if (preset.marginY > 50) {
    alignmentValue = 2; // Bottom center
  } else if (preset.marginY < -50) {
    alignmentValue = 8; // Top center
  } else {
    alignmentValue = 5; // Middle center
  }
  
  // Get font weight
  const bold = preset.fontWeight === 'bold' ? '1' : '0';
  
  // Get shadow setting
  const shadow = preset.textShadow ? '1' : '0';
  
  // Default font size
  const fontSize = preset.fontSize || 24;
  
  // Apply global scale if defined
  const globalScale = preset.scale || 1.0;
  const scaledFontSize = Math.round(fontSize * globalScale);

  // Start building ASS file
  let assContent = `[Script Info]
; Script generated by TROD
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
`;

  // Default style for regular text
  assContent += `Style: Default,${fontName},${scaledFontSize},${primaryColor},${secondaryColor},${outlineColor},${backColor},${bold},0,0,0,100,100,${preset.letterSpacing || 0},0,${effectiveBorderStyle},${outlineWidth},${shadow},${alignmentValue},10,10,${Math.abs(preset.marginY || 0)},1\n`;
  
  // Calculate scale for highlighted words
  const highlightScaleFactor = preset.highlightScale ? preset.highlightScale : 1.1;
  
  // Style for word-level color highlighting only (no background)
  assContent += `Style: WordHighlight,${fontName},${Math.ceil(scaledFontSize * highlightScaleFactor)},${secondaryColor},${secondaryColor},${outlineColor},${backColor},${bold},0,0,0,${Math.round(highlightScaleFactor * 100)},${Math.round(highlightScaleFactor * 100)},${preset.letterSpacing || 0},0,${effectiveBorderStyle},${outlineWidth},${shadow},${alignmentValue},10,10,${Math.abs(preset.marginY || 0)},1\n`;
  
  // Style for word-level highlighting with background - Commented out as feature is incomplete
  /* 
  if (preset.highlightBgColor && preset.highlightBgColor !== 'transparent') {
    // Use BorderStyle=3 (opaque box) with small outline and shadow in the same color
    // This creates a slightly softer appearance while ensuring the background is filled
    const outlineSize = 1; // Reduced from 2 to 1 for less vertical padding
    const shadowSize = 0;  // Reduced from 1 to 0 to minimize vertical padding
    const letterSpacing = 1; // Keep slight spacing between letters
    
    // Note: Using the same highlight background color for both OutlineColour and BackColour is key
    assContent += `Style: BgHighlight,${fontName},${fontSize},${secondaryColor},${secondaryColor},${highlightBgColor},${highlightBgColor},${bold},0,0,0,100,100,${letterSpacing},0,3,${outlineSize},${shadowSize},${alignmentValue},10,10,${Math.abs(preset.marginY || 0)},1\n`;
  }
  */

  assContent += `
[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  // Process segments and words
  if (wordTimestamps?.segments) {
    // Get the effective words per line from preset
    const wordsPerLine = preset.wordsPerLine || 4;
    
    // Process each segment
    wordTimestamps.segments.forEach(segment => {
      const words = segment.words;
      
      // Group words by wordsPerLine
      for (let i = 0; i < words.length; i += wordsPerLine) {
        const wordChunk = words.slice(i, i + wordsPerLine);
        if (wordChunk.length === 0) continue;
        
        // For each word in the chunk, create a dialogue entry for its time period
        wordChunk.forEach((word, index) => {
          const startTime = formatAssTime(word.start);
          const endTime = formatAssTime(word.end);
          
          // Create the text with the current word highlighted
          let lineText = "";
          
          // Build the line with each word
          wordChunk.forEach((w, idx) => {
            // Add a space before words (except first)
            if (idx > 0) {
              // Add extra word spacing if defined
              if (preset.wordSpacing && preset.wordSpacing > 0) {
                // Apply word spacing by adding special ASS tag for additional space
                // \h creates a hard space that can be multiplied
                const extraSpaces = '\\h'.repeat(Math.round(preset.wordSpacing));
                lineText += ` {${extraSpaces}}`;
              } else {
                lineText += " ";
              }
            }
            
            // Determine whether this word is the active one
            if (idx === index) {
              // Background highlighting is disabled for now
              /*
              if (preset.highlightBgColor && preset.highlightBgColor !== 'transparent') {
                // Use the background highlight style
                // The extra spacing is handled by the style definition (ScaleX, ScaleY)
                lineText += `{\\rStyle(BgHighlight)}${w.word}{\\rStyle(Default)}`;
              } else {
              */
                // Just color highlighting, no background
                lineText += `{\\rStyle(WordHighlight)}${w.word}{\\rStyle(Default)}`;
              /*
              }
              */
            } else {
              // Regular word
              lineText += w.word;
            }
          });
          
          // Add position override if needed 
          let finalText = lineText;
          if (preset.marginY !== 0) {
            finalText = `{\\pos(640,${calculateVerticalPosition(preset.marginY || 0)})}${lineText}`;
          }
          
          // Add each dialogue line
          assContent += `Dialogue: 0,${startTime},${endTime},Default,,0,0,0,,${finalText}\n`;
        });
      }
    });
  }
  
  return assContent;
} 