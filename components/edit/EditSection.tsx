'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Check, Edit2, Save } from 'lucide-react';
import { Switch } from "@/components/ui/switch";
import { ColorPicker } from "../ui/color-picker";
import { generateASS } from '@/utils/subtitleUtils';

// Font options
const FONT_FAMILIES = [
  'Poppins, sans-serif',
  'Roboto, sans-serif',
  'Montserrat, sans-serif',
  'Ubuntu, sans-serif',
  'Pacifico, cursive',
  'Permanent Marker, cursive',
  'Cinzel, serif',
  'Nerko One, cursive',
  'New Amsterdam, cursive',
  'Sniglet, cursive',
  'Jersey10, cursive'
];

// Font weight options
const FONT_WEIGHTS = [
  'normal',
  'bold'
];

// Position options
const POSITION_OPTIONS = [
  { id: 'center', label: 'Center' }
];

// Animation options
const ANIMATION_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'highlight', label: 'Highlight' },
  { id: 'fade', label: 'Fade' },
  { id: 'slide', label: 'Slide' }
];

// Define the CaptionPreset interface
export interface CaptionPreset {
  id: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  bgColor: string;
  bgOpacity: number;
  textShadow: boolean;
  animation: string;
  position: 'center';
  marginY: number;
  // Additional properties for CaptionRenderer
  alignment?: 'left' | 'center' | 'right';
  shadowColor?: string;
  shadowBlur?: number;
  lineHeight?: number;
  padding?: number;
  backgroundColor?: string;
  highlightColor?: string;
  highlightBgColor?: string;  // Background color for highlighted words
  highlightBgOpacity?: number; // Background opacity for highlighted words
  textColor?: string;
  animationType?: string;
  textOutline?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
  wordsPerLine?: number;
  scale?: number; // Global scale factor for captions
  highlightScale?: number; // Scale factor specifically for highlighted words
  letterSpacing?: number; // Space between characters in pixels
  wordSpacing?: number; // Extra space between words in pixels
}

// Predefined caption presets
export const PRESET_OPTIONS: CaptionPreset[] = [
  {
    id: 'basic',
    name: 'Basic',
    fontFamily: 'Poppins, sans-serif',
    fontSize: 42,
    fontWeight: 'normal',
    color: '#FFFFFF',
    bgColor: 'transparent',
    bgOpacity: 0,
    textShadow: false,
    animation: 'highlight',
    position: 'center',
    marginY: 0,
    wordsPerLine: 4,
    highlightColor: '#FFFFFF'
  },
  {
    id: 'basic-yellow',
    name: 'Basic Yellow',
    fontFamily: 'Poppins, sans-serif',
    fontSize: 42,
    fontWeight: 'normal',
    color: '#FFFF00',
    bgColor: 'transparent',
    bgOpacity: 0,
    textShadow: false,
    animation: 'highlight',
    position: 'center',
    marginY: 0,
    wordsPerLine: 4,
    highlightColor: '#FFFF00'
  },
  // {
  //   id: 'word-highlight',
  //   name: 'Word Highlight',
  //   fontFamily: 'Poppins, sans-serif',
  //   fontSize: 42,
  //   fontWeight: 'normal',
  //   color: '#FFFFFF',
  //   bgColor: 'transparent',
  //   bgOpacity: 0,
  //   textShadow: false,
  //   animation: 'highlight',
  //   position: 'center',
  //   marginY: 0,
  //   wordsPerLine: 4,
  //   highlightColor: '#FFFFFF',
  //   highlightBgColor: '#FF00FF',  // Magenta background for highlighted words
  //   highlightBgOpacity: 1,        // Fully opaque
  //   textOutline: false
  // },
  {
    id: 'yallow',
    name: 'Yallow Highlight',
    fontFamily: 'Poppins, sans-serif',
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    bgColor: 'transparent',
    bgOpacity: 0,
    textShadow: false,
    animation: 'highlight',
    position: 'center',
    marginY: 0,
    wordsPerLine: 4,
    highlightColor: '#FFFF00',
    textOutline: false
  },
  // {
  //   id: 'highlight-box',
  //   name: 'Highlight Box',
  //   fontFamily: 'Roboto, sans-serif',
  //   fontSize: 42,
  //   fontWeight: 'normal',
  //   color: '#ffffff',
  //   bgColor: 'transparent',
  //   bgOpacity: 0,
  //   textShadow: false,
  //   animation: 'highlight',
  //   position: 'center',
  //   marginY: 0,
  //   wordsPerLine: 4,
  //   highlightColor: '#000000',
  //   highlightBgColor: '#FFFF00',  // Yellow highlight background
  //   highlightBgOpacity: 1,        // Fully opaque
  //   textOutline: false
  // },
  // {
  //   id: 'subtle-highlight',
  //   name: 'Subtle Highlight',
  //   fontFamily: 'Montserrat, sans-serif',
  //   fontSize: 42,
  //   fontWeight: 'normal',
  //   color: '#FFFFFF',
  //   bgColor: '#000000',
  //   bgOpacity: 0.5,
  //   textShadow: false,
  //   animation: 'highlight',
  //   position: 'center',
  //   marginY: 0,
  //   wordsPerLine: 4,
  //   highlightColor: '#FFFFFF',
  //   highlightBgColor: '#FFFFFF',  // White highlight background
  //   highlightBgOpacity: 0.3,      // Very transparent
  //   textOutline: false
  // },
  {
    id: 'one-word',
    name: 'One Word Color',
    fontFamily: 'Poppins, sans-serif',
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    bgColor: 'transparent',
    bgOpacity: 0,
    textShadow: false,
    animation: 'highlight',
    position: 'center',
    marginY: 0,
    wordsPerLine: 4,
    highlightColor: '#FF0000'
  },
  {
    id: 'iman-v1',
    name: 'Iman V1',
    fontFamily: 'Poppins, sans-serif',
    fontSize: 42,
    fontWeight: 'normal',
    color: '#FFFFFF',
    bgColor: 'transparent',
    bgOpacity: 0,
    textShadow: true,
    animation: 'highlight',
    position: 'center',
    marginY: 0,
    wordsPerLine: 4,
    highlightColor: '#FFFF00'
  },
  {
    id: 'mirage',
    name: 'Mirage',
    fontFamily: 'Poppins, sans-serif',
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    bgColor: 'transparent',
    bgOpacity: 0,
    textShadow: true,
    animation: 'highlight',
    position: 'center',
    marginY: 0,
    wordsPerLine: 4,
    highlightColor: '#02FFFF'
  },
  {
    id: 'iman',
    name: 'Iman',
    fontFamily: 'Poppins, sans-serif',
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
    bgColor: 'transparent',
    bgOpacity: 0,
    textShadow: true,
    animation: 'highlight',
    position: 'center',
    marginY: 0,
    wordsPerLine: 4,
    highlightColor: '#FFFFFF'
  },
  {
    id: "Highlight-Box",
    name: "Highlight Box",
    fontFamily: "Nerko One, cursive",
    fontSize: 42,
    fontWeight: "normal",
    color: "#FFFFFF",
    bgColor: "transparent",
    bgOpacity: 0,
    textShadow: true,
    animation: "highlight",
    position: "center",
    marginY: 0,
    wordsPerLine: 4,
    highlightColor: "#FFFF00"
  },
  {
    id: "new-amsterdam",
    name: "New Amsterdam",
    animation: "highlight",
    bgColor: "transparent",
    bgOpacity: 0,
    color: "#FFFFFF",
    fontFamily: "New Amsterdam, cursive",
    fontSize: 42,
    fontWeight: "bold",
    highlightColor: "#FF0000",
    marginY: 0,
    position: "center",
    textShadow: false,
    wordsPerLine: 3,
    scale: 1.0, // Default scale
    highlightScale: 1.3 // Scale up highlighted words by 30%
  }
];

interface EditSectionProps {
  onPresetChange: (preset: CaptionPreset) => void;
  initialPreset?: CaptionPreset;
  videoUrl?: string; // URL to the video for preview
  wordTimestampsUrl?: string; // URL to the word timestamps for captions
}

export default function EditSection({ onPresetChange, initialPreset, videoUrl, wordTimestampsUrl }: EditSectionProps) {
  // Initialize with a default preset or provided initial preset
  const [selectedPreset, setSelectedPreset] = useState<CaptionPreset>(() => {
    // If initialPreset is provided, use it
    if (initialPreset) return initialPreset;
    
    // Otherwise look for basic preset
    const defaultPreset = PRESET_OPTIONS.find(p => p.id === 'basic');
    
    // If basic preset is not found, use the first available preset
    return defaultPreset || PRESET_OPTIONS[0];
  });
  
  // For custom preset editing
  const [customPreset, setCustomPreset] = useState<CaptionPreset>({
    ...selectedPreset,
    id: 'custom',
    name: 'Custom',
    letterSpacing: selectedPreset.letterSpacing || 0,
    wordSpacing: selectedPreset.wordSpacing || 0,
    textOutline: selectedPreset.textOutline || false,
    outlineColor: selectedPreset.outlineColor || '#000000',
    outlineWidth: selectedPreset.outlineWidth || 1
  });
  
  // State for user's saved custom presets
  const [customPresets, setCustomPresets] = useState<CaptionPreset[]>([]);
  
  // State for tracking if we're in edit mode
  const [editMode, setEditMode] = useState(false);

  // When initialPreset changes, update the selected preset
  useEffect(() => {
    if (initialPreset) {
      setSelectedPreset(initialPreset);
      setCustomPreset({
        ...initialPreset,
        id: 'custom',
        name: 'Custom',
        letterSpacing: initialPreset.letterSpacing || 0,
        wordSpacing: initialPreset.wordSpacing || 0,
        textOutline: initialPreset.textOutline || false,
        outlineColor: initialPreset.outlineColor || '#000000',
        outlineWidth: initialPreset.outlineWidth || 1
      });
    }
  }, [initialPreset]);

  // Load custom presets from localStorage
  useEffect(() => {
    const savedPresets = localStorage.getItem('customCaptionPresets');
    if (savedPresets) {
      try {
        setCustomPresets(JSON.parse(savedPresets));
      } catch (error) {
        console.error('Failed to parse saved presets:', error);
      }
    }
  }, []);

  // Save custom presets to localStorage when they change
  useEffect(() => {
    if (customPresets.length > 0) {
      localStorage.setItem('customCaptionPresets', JSON.stringify(customPresets));
    }
  }, [customPresets]);

  // Handle preset selection
  const handlePresetSelect = (presetId: string) => {
    // Find from predefined options
    let preset = PRESET_OPTIONS.find(p => p.id === presetId);
    
    // If not found, check custom presets
    if (!preset) {
      preset = customPresets.find(p => p.id === presetId);
    }
    
    if (preset) {
      setSelectedPreset(preset);
      setCustomPreset({ ...preset, id: 'custom', name: 'Custom' });
      setEditMode(false);
      onPresetChange(preset);
    }
  };

  // Handle custom preset property changes
  const handleCustomPresetChange = <K extends keyof CaptionPreset>(
    property: K, 
    value: CaptionPreset[K]
  ) => {
    const updatedPreset = { ...customPreset, [property]: value };
    setCustomPreset(updatedPreset);
    
    // Auto-apply changes if in edit mode
    if (editMode) {
      onPresetChange(updatedPreset);
    }
  };

  // Save current custom preset
  const saveCustomPreset = () => {
    const timestamp = new Date().getTime();
    const newCustomPreset = {
      ...customPreset,
      id: `custom-${timestamp}`,
      name: `Custom ${customPresets.length + 1}`
    };
    
    const updatedCustomPresets = [...customPresets, newCustomPreset];
    setCustomPresets(updatedCustomPresets);
    setSelectedPreset(newCustomPreset);
    onPresetChange(newCustomPreset);
    setEditMode(false);
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (!editMode) {
      // When entering edit mode, apply the custom preset
      onPresetChange(customPreset);
    }
  };

  // Apply custom preset
  const applyCustomPreset = () => {
    onPresetChange(customPreset);
  };

  return (
    <div className="px-4 py-3 rounded-lg border border-gray-200 max-w-md">
      <h3 className="text-xl font-bold mb-4">Caption Styles</h3>
      
      <Tabs defaultValue="presets">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="presets">Preset Styles</TabsTrigger>
          <TabsTrigger value="custom">Customize</TabsTrigger>
        </TabsList>
        
        {/* Preset Selection Section */}
        <TabsContent value="presets" className="space-y-4">
          <RadioGroup 
            value={selectedPreset?.id || ""} 
            onValueChange={handlePresetSelect}
            className="grid grid-cols-2 gap-2"
          >
            {PRESET_OPTIONS.map((preset) => (
              <div 
                key={preset.id}
                className={`border rounded-lg p-2 relative cursor-pointer ${
                  selectedPreset?.id === preset.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}
                onClick={() => handlePresetSelect(preset.id)}
              >
                <RadioGroupItem 
                  value={preset.id} 
                  id={preset.id} 
                  className="sr-only" 
                />
                <div className="flex flex-col h-full">
                  <Label 
                    htmlFor={preset.id} 
                    className="font-medium cursor-pointer"
                  >
                    {preset.name}
                  </Label>
                  
                  {/* Preset Preview */}
                  <div 
                    className="h-16 mt-2 rounded flex items-center justify-center text-center p-2"
                    style={{
                      backgroundColor: '#49556c',
                      color: preset.color,
                      fontFamily: preset.fontFamily,
                      fontSize: `16px`, // Half size for preview with scaling
                      fontWeight: preset.fontWeight,
                      textShadow: preset.textShadow ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <span style={{
                      textTransform: preset.id.includes('word') || preset.id === 'mirage' || preset.id === 'iman' ? 'uppercase' : 'none',
                      fontWeight: preset.fontWeight
                    }}>
                      This is <span style={{
                        color: preset.highlightColor,
                        padding: preset.id === 'Highlight-Box' ? '0 4px' : 0,
                        textShadow: preset.id === 'mirage' ? '0 0 8px #ffffff, 0 0 12px rgba(255,255,255,0.8)' : 
                                  preset.id === 'iman' ? '0 0 10px rgba(255,255,255,0.9)' : 'inherit',
                        // Apply special scaling for New Amsterdam preset
                        transform: preset.id === 'new-amsterdam' && preset.highlightScale ? 
                                  `scale(${preset.highlightScale})` : 'none',
                        display: 'inline-block', // Required for transform to work properly
                        transformOrigin: 'center', // Scale from center
                        WebkitTextStroke: preset.textOutline ? 
                          `${preset.outlineWidth || 1}px ${preset.outlineColor || '#000000'}` : 'inherit'
                      }}>how</span> the subtitles look
                    </span>
                  </div>
                </div>
                
                {selectedPreset?.id === preset.id && (
                  <div className="absolute top-2 right-2 text-purple-600">
                    <Check size={16} />
                  </div>
                )}
              </div>
            ))}
            
            {/* Show saved custom presets */}
            {customPresets.map((preset) => (
              <div 
                key={preset.id}
                className={`border rounded-lg p-2 relative cursor-pointer ${
                  selectedPreset?.id === preset.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                }`}
                onClick={() => handlePresetSelect(preset.id)}
              >
                <RadioGroupItem 
                  value={preset.id} 
                  id={preset.id} 
                  className="sr-only" 
                />
                <div className="flex flex-col h-full">
                  <Label 
                    htmlFor={preset.id} 
                    className="font-medium cursor-pointer flex justify-between"
                  >
                    <span>{preset.name}</span>
                  </Label>
                  
                  {/* Custom Preset Preview */}
                  <div 
                    className="h-16 mt-2 rounded flex items-center justify-center text-center p-2"
                    style={{
                      backgroundColor: '#49556c',
                      color: preset.color,
                      fontFamily: preset.fontFamily,
                      fontSize: `16px`, // Half size for preview with scaling
                      fontWeight: preset.fontWeight,
                      textShadow: preset.textShadow ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none',
                      position: 'relative',
                      overflow: 'hidden',
                      WebkitTextStroke: preset.textOutline ? 
                        `${preset.outlineWidth || 1}px ${preset.outlineColor || '#000000'}` : 'inherit'
                    }}
                  >
                    <span style={{
                      textTransform: preset.id.includes('word') || preset.id === 'mirage' || preset.id === 'iman' ? 'uppercase' : 'none',
                      fontWeight: preset.fontWeight
                    }}>
                      This is <span style={{
                        color: preset.highlightColor,
                        padding: preset.id === 'Highlight-Box' ? '0 4px' : 0,
                        textShadow: preset.id === 'mirage' ? '0 0 8px #ffffff, 0 0 12px rgba(255,255,255,0.8)' : 
                                  preset.id === 'iman' ? '0 0 10px rgba(255,255,255,0.9)' : 'inherit',
                        // Apply special scaling for New Amsterdam preset
                        transform: preset.id === 'new-amsterdam' && preset.highlightScale ? 
                                  `scale(${preset.highlightScale})` : 'none',
                        display: 'inline-block', // Required for transform to work properly
                        transformOrigin: 'center', // Scale from center
                        WebkitTextStroke: preset.textOutline ? 
                          `${preset.outlineWidth || 1}px ${preset.outlineColor || '#000000'}` : 'inherit'
                      }}>how</span> the subtitles look
                    </span>
                  </div>
                </div>
                
                {selectedPreset?.id === preset.id && (
                  <div className="absolute top-2 right-2 text-purple-600">
                    <Check size={16} />
                  </div>
                )}
              </div>
            ))}
          </RadioGroup>
        </TabsContent>
        
        {/* Custom Section */}
        <TabsContent value="custom" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">
              {editMode ? 'Editing Style' : 'Custom Style'}
            </h4>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={toggleEditMode}
                className="gap-1"
              >
                <Edit2 size={16} />
                {editMode ? 'Editing...' : 'Edit'}
              </Button>
              
              {editMode && (
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={saveCustomPreset}
                  className="gap-1"
                >
                  <Save size={16} />
                  Save
                </Button>
              )}
            </div>
          </div>
          
          {/* Preview of custom style */}
          <div 
            className="h-16 mb-4 rounded flex items-center justify-center text-center p-2"
            style={{
              backgroundColor: '#49556c', 
              color: customPreset.color,
              fontFamily: customPreset.fontFamily,
              fontSize: `${(customPreset.fontSize / 2) * (customPreset.scale || 1.0)}px`, 
              fontWeight: customPreset.fontWeight,
              textShadow: customPreset.textShadow ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none',
              position: 'relative',
              overflow: 'hidden',
              WebkitTextStroke: customPreset.textOutline ? 
                `${customPreset.outlineWidth || 1}px ${customPreset.outlineColor || '#000000'}` : 'inherit'
            }}
          >
            <span style={{
              textTransform: customPreset.id.includes('word') || customPreset.id === 'mirage' || customPreset.id === 'iman' ? 'uppercase' : 'none',
              fontWeight: customPreset.fontWeight
            }}>
              This is <span style={{
                color: customPreset.highlightColor,
                padding: customPreset.id === 'Highlight-Box' ? '0 4px' : 0,
                textShadow: customPreset.id === 'mirage' ? '0 0 8px #ffffff, 0 0 12px rgba(255,255,255,0.8)' : 
                                  customPreset.id === 'iman' ? '0 0 10px rgba(255,255,255,0.9)' : 'inherit',
                // Apply special scaling for New Amsterdam preset
                transform: customPreset.id === 'new-amsterdam' && customPreset.highlightScale ? 
                                  `scale(${customPreset.highlightScale})` : 'none',
                display: 'inline-block', // Required for transform to work properly
                transformOrigin: 'center', // Scale from center
                WebkitTextStroke: customPreset.textOutline ? 
                  `${customPreset.outlineWidth || 1}px ${customPreset.outlineColor || '#000000'}` : 'inherit'
              }}>how</span> the subtitles look
            </span>
          </div>
          
          {/* Customization Controls */}
          <div className="space-y-4">
            {/* Font Family */}
            <div className="space-y-2">
              <Label>Font Family</Label>
              <select 
                value={customPreset.fontFamily}
                onChange={(e) => handleCustomPresetChange('fontFamily', e.target.value)}
                className="w-full p-2 border rounded"
                disabled={!editMode}
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font.split(',')[0]}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Font Size */}
            <div>
                <Label>Font Size</Label>
              <Slider
                defaultValue={[customPreset.fontSize]}
                min={12}
                max={72}
                step={1}
                onValueChange={(value) => handleCustomPresetChange('fontSize', value[0])}
                disabled={!editMode}
              />
              <div className="flex justify-between text-xs">
                <span>12px</span>
                <span>{customPreset.fontSize}px</span>
                <span>72px</span>
              </div>
            </div>
            
            {/* Font Weight */}
            <div className="space-y-2">
              <Label>Font Weight</Label>
              <RadioGroup 
                value={customPreset.fontWeight} 
                onValueChange={(value) => handleCustomPresetChange('fontWeight', value)}
                disabled={!editMode}
                className="flex gap-4"
              >
                {FONT_WEIGHTS.map((weight) => (
                  <div key={weight} className="flex items-center space-x-2">
                    <RadioGroupItem value={weight} id={`weight-${weight}`} />
                    <Label htmlFor={`weight-${weight}`} style={{ fontWeight: weight }}>
                      {weight.charAt(0).toUpperCase() + weight.slice(1)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            {/* Text Color */}
            <div className="space-y-2">
              <Label>Text Color</Label>
              <ColorPicker
                value={customPreset.color}
                onChange={(value) => handleCustomPresetChange('color', value)}
                disabled={!editMode}
              />
            </div>
            
            {/* Highlight Color */}
            <div>
              <Label>Highlight Color</Label>
              <div className="flex items-center gap-2">
              <ColorPicker
                value={customPreset.highlightColor || '#FFFF00'}
                onChange={(value) => handleCustomPresetChange('highlightColor', value)}
              />
              </div>
            </div>
            
            {/* Highlight Background Color */}
            {/* Commented out for now as feature is incomplete
            <div>
              <Label>Highlight BG Color</Label>
              <div className="flex items-center gap-2">
                <ColorPicker
                  value={customPreset.highlightBgColor || 'transparent'}
                  onChange={(value) => handleCustomPresetChange('highlightBgColor', value)}
                />
              </div>
            </div>
            */}
            
            {/* Highlight Background Opacity (Only show if highlightBgColor is set) */}
            {/* Commented out for now as feature is incomplete
            {customPreset.highlightBgColor && customPreset.highlightBgColor !== 'transparent' && (
              <div>
                <Label>
                  Highlight BG Opacity: {customPreset.highlightBgOpacity !== undefined ? 
                    Math.round(customPreset.highlightBgOpacity * 100) : 100}%
                </Label>
                <Slider
                  value={[customPreset.highlightBgOpacity !== undefined ? 
                    customPreset.highlightBgOpacity * 100 : 100]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(value) => 
                    handleCustomPresetChange('highlightBgOpacity', value[0] / 100)
                  }
                />
              </div>
            )}
            */}
            
            {/* Background Color */}
            {/* Commented out for now as feature is incomplete
            <div>
              <Label>Background Color</Label>
              <div className="flex items-center gap-2">
              <ColorPicker
                value={customPreset.bgColor}
                onChange={(value) => handleCustomPresetChange('bgColor', value)}
              />
              </div>
            </div>
            */}
            
            {/* Background Opacity */}
            {/* Commented out for now as feature is incomplete
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Background Opacity</Label>
                <span className="text-sm text-gray-500">{Math.round(customPreset.bgOpacity * 100)}%</span>
              </div>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={[customPreset.bgOpacity]}
                onValueChange={(value) => handleCustomPresetChange('bgOpacity', value[0])}
                disabled={!editMode}
              />
            </div>
            */}
            
            {/* Text Shadow */}
            <div className="flex items-center justify-between">
              <Label htmlFor="text-shadow">Text Shadow</Label>
              <Switch
                id="text-shadow"
                checked={customPreset.textShadow}
                onCheckedChange={(value) => handleCustomPresetChange('textShadow', value)}
                disabled={!editMode}
              />
            </div>
            
            {/* Text Outline */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="text-outline">Text Outline</Label>
                <Switch
                  id="text-outline"
                  checked={customPreset.textOutline || false}
                  onCheckedChange={(value) => handleCustomPresetChange('textOutline', value)}
                  disabled={!editMode}
                />
              </div>
              
              {/* Outline Settings (only show when textOutline is enabled) */}
              {customPreset.textOutline && (
                <div className="space-y-4 mt-2 pl-4 border-l-2 border-purple-100">
                  {/* Outline Color */}
                  <div>
                    <Label>Outline Color</Label>
                    <ColorPicker
                      value={customPreset.outlineColor || '#000000'}
                      onChange={(value) => handleCustomPresetChange('outlineColor', value)}
                      disabled={!editMode}
                    />
                  </div>
                  
                  {/* Outline Width */}
                  <div>
                    <div className="flex justify-between">
                      <Label>Outline Width</Label>
                      <span className="text-sm text-gray-500">
                        {customPreset.outlineWidth || 1}px
                      </span>
                    </div>
                    <Slider
                      defaultValue={[customPreset.outlineWidth || 1]}
                      min={0.5}
                      max={3}
                      step={0.5}
                      onValueChange={(value) => handleCustomPresetChange('outlineWidth', value[0])}
                      disabled={!editMode}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Vertical Position */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Vertical Position</Label>
                <span className="text-sm text-gray-500">
                  {customPreset.marginY > 0 ? `Bottom +${customPreset.marginY}` : 
                   customPreset.marginY < 0 ? `Top ${customPreset.marginY}` : 'Center'}
                </span>
              </div>
              <Slider
                min={-100}
                max={100}
                step={10}
                value={[customPreset.marginY]}
                onValueChange={(value) => handleCustomPresetChange('marginY', value[0])}
                disabled={!editMode}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Top</span>
                <span>Center</span>
                <span>Bottom</span>
              </div>
            </div>
            
            {/* Animation */}
            <div className="space-y-2">
              <Label>Animation</Label>
              <RadioGroup 
                value={customPreset.animation} 
                onValueChange={(value) => handleCustomPresetChange('animation', value)}
                disabled={!editMode}
                className="grid grid-cols-2 gap-2"
              >
                {ANIMATION_OPTIONS.map((animation) => (
                  <div key={animation.id} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={animation.id} 
                      id={`animation-${animation.id}`} 
                    />
                    <Label htmlFor={`animation-${animation.id}`}>
                      {animation.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            
            {/* Scale */}
            <div>
              <Label>Caption Scale</Label>
              <Slider
                defaultValue={[customPreset.scale || 1.0]}
                min={0.5}
                max={2.0}
                step={0.1}
                onValueChange={(value) => handleCustomPresetChange('scale', value[0])}
                disabled={!editMode}
              />
              <div className="flex justify-between text-xs">
                <span>0.5x</span>
                <span>{(customPreset.scale || 1.0).toFixed(1)}x</span>
                <span>2.0x</span>
              </div>
            </div>

            {/* Highlight Scale (only for New Amsterdam preset or custom preset based on it) */}
            {(customPreset.id === 'new-amsterdam' || customPreset.id === 'custom') && (
              <div>
                <Label>Highlighted Word Scale</Label>
                <Slider
                  defaultValue={[customPreset.highlightScale || 1.0]}
                  min={1.0}
                  max={1.5}
                  step={0.1}
                  onValueChange={(value) => handleCustomPresetChange('highlightScale', value[0])}
                  disabled={!editMode}
                />
                <div className="flex justify-between text-xs">
                  <span>1.0x</span>
                  <span>{(customPreset.highlightScale || 1.0).toFixed(1)}x</span>
                  <span>1.5x</span>
                </div>
              </div>
            )}

            {/* Letter Spacing */}
            <div>
              <Label>Letter Spacing</Label>
              <Slider
                defaultValue={[customPreset.letterSpacing || 0]}
                min={-2}
                max={10}
                step={0.5}
                onValueChange={(value) => handleCustomPresetChange('letterSpacing', value[0])}
                disabled={!editMode}
              />
              <div className="flex justify-between text-xs">
                <span>Tight</span>
                <span>{(customPreset.letterSpacing || 0).toFixed(1)}px</span>
                <span>Wide</span>
              </div>
            </div>

            {/* Word Spacing */}
            <div>
              <Label>Word Spacing</Label>
              <Slider
                defaultValue={[customPreset.wordSpacing || 0]}
                min={0}
                max={20}
                step={1}
                onValueChange={(value) => handleCustomPresetChange('wordSpacing', value[0])}
                disabled={!editMode}
              />
              <div className="flex justify-between text-xs">
                <span>Normal</span>
                <span>{customPreset.wordSpacing || 0}px</span>
                <span>Wide</span>
              </div>
            </div>
            
            {/* Words Per Line */}
            <div>
                <Label>Words Per Line</Label>
              <Slider
                defaultValue={[customPreset.wordsPerLine || 4]}
                min={2}
                max={8}
                step={1}
                onValueChange={(value) => handleCustomPresetChange('wordsPerLine', value[0])}
                disabled={!editMode}
              />
              <div className="flex justify-between text-xs">
                <span>2</span>
                <span>{customPreset.wordsPerLine || 4}</span>
                <span>8</span>
                  </div>
            </div>
            
            {/* Apply Button */}
            {!editMode && (
              <Button 
                variant="default" 
                className="w-full mt-4"
                onClick={applyCustomPreset}
              >
                Apply Custom Style
              </Button>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}