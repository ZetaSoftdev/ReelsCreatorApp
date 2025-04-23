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
  position: 'top' | 'center' | 'bottom';
  // Additional properties for CaptionRenderer
  alignment?: 'left' | 'center' | 'right';
  shadowColor?: string;
  shadowBlur?: number;
  lineHeight?: number;
  padding?: number;
  backgroundColor?: string;
  highlightColor?: string;
  textColor?: string;
  animationType?: string;
  textOutline?: boolean;
  outlineColor?: string;
  outlineWidth?: number;
}

// Predefined caption presets
export const PRESET_OPTIONS: CaptionPreset[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    fontFamily: 'Arial, sans-serif',
    fontSize: 24,
    fontWeight: 'normal',
    color: '#FFFFFF',
    bgColor: 'transparent',
    bgOpacity: 0,
    textShadow: true,
    animation: 'none',
    position: 'bottom'
  },
  {
    id: 'bold',
    name: 'Bold',
    fontFamily: 'Arial, sans-serif',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    bgColor: '#000000',
    bgOpacity: 0.5,
    textShadow: false,
    animation: 'none',
    position: 'bottom'
  },
  {
    id: 'tiktok',
    name: 'TikTok Style',
    fontFamily: 'Arial, sans-serif',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    bgColor: '#000000',
    bgOpacity: 0.7,
    textShadow: false,
    animation: 'highlight',
    position: 'center'
  },
  {
    id: 'subtitles',
    name: 'Subtitles',
    fontFamily: 'Arial, sans-serif',
    fontSize: 20,
    fontWeight: 'normal',
    color: '#FFFFFF',
    bgColor: '#000000',
    bgOpacity: 0.6,
    textShadow: false,
    animation: 'none',
    position: 'bottom'
  },
  {
    id: 'colorful',
    name: 'Colorful',
    fontFamily: 'Arial, sans-serif',
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FF9500',
    bgColor: '#5856D6',
    bgOpacity: 0.7,
    textShadow: true,
    animation: 'highlight',
    position: 'bottom'
  },
  {
    id: 'outline',
    name: 'Outline',
    fontFamily: 'Arial, sans-serif',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    bgColor: 'transparent',
    bgOpacity: 0,
    textShadow: true,
    animation: 'none',
    position: 'bottom'
  }
];

// Font options
const FONT_FAMILIES = [
  'Arial, sans-serif',
  'Georgia, serif',
  'Verdana, sans-serif',
  'Courier New, monospace',
  'Impact, fantasy'
];

// Font weight options
const FONT_WEIGHTS = [
  'normal',
  'bold'
];

// Position options
const POSITION_OPTIONS = [
  { id: 'top', label: 'Top' },
  { id: 'center', label: 'Center' },
  { id: 'bottom', label: 'Bottom' }
];

// Animation options
const ANIMATION_OPTIONS = [
  { id: 'none', label: 'None' },
  { id: 'highlight', label: 'Highlight' },
  { id: 'fade', label: 'Fade' },
  { id: 'slide', label: 'Slide' }
];

interface EditSectionProps {
  onPresetChange: (preset: CaptionPreset) => void;
  initialPreset?: CaptionPreset;
  videoUrl?: string; // URL to the video for preview
  wordTimestampsUrl?: string; // URL to the word timestamps for captions
}

export default function EditSection({ onPresetChange, initialPreset, videoUrl, wordTimestampsUrl }: EditSectionProps) {
  // Initialize with minimal preset or provided initial preset
  const [selectedPreset, setSelectedPreset] = useState<CaptionPreset>(
    initialPreset || PRESET_OPTIONS.find(p => p.id === 'minimal')!
  );
  
  // For custom preset editing
  const [customPreset, setCustomPreset] = useState<CaptionPreset>({
    ...selectedPreset,
    id: 'custom',
    name: 'Custom'
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
        name: 'Custom'
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
            value={selectedPreset.id} 
            onValueChange={handlePresetSelect}
            className="grid grid-cols-2 gap-2"
          >
            {PRESET_OPTIONS.map((preset) => (
              <div 
                key={preset.id}
                className={`border rounded-lg p-2 relative cursor-pointer ${
                  selectedPreset.id === preset.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
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
                    className="h-16 mt-2 rounded flex items-center justify-center text-center"
                    style={{
                      backgroundColor: preset.bgColor !== 'transparent' 
                        ? `${preset.bgColor}${Math.round(preset.bgOpacity * 255).toString(16).padStart(2, '0')}` 
                        : undefined,
                      color: preset.color,
                      fontFamily: preset.fontFamily,
                      fontSize: `${preset.fontSize / 2}px`, // Half size for preview
                      fontWeight: preset.fontWeight,
                      textShadow: preset.textShadow ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
                    }}
                  >
                    Sample Text
                  </div>
                </div>
                
                {selectedPreset.id === preset.id && (
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
                  selectedPreset.id === preset.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
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
                    className="h-16 mt-2 rounded flex items-center justify-center text-center"
                    style={{
                      backgroundColor: preset.bgColor !== 'transparent' 
                        ? `${preset.bgColor}${Math.round(preset.bgOpacity * 255).toString(16).padStart(2, '0')}` 
                        : undefined,
                      color: preset.color,
                      fontFamily: preset.fontFamily,
                      fontSize: `${preset.fontSize / 2}px`, // Half size for preview
                      fontWeight: preset.fontWeight,
                      textShadow: preset.textShadow ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
                    }}
                  >
                    Sample Text
                  </div>
                </div>
                
                {selectedPreset.id === preset.id && (
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
            className="h-16 mb-4 rounded flex items-center justify-center text-center"
            style={{
              backgroundColor: customPreset.bgColor !== 'transparent' 
                ? `${customPreset.bgColor}${Math.round(customPreset.bgOpacity * 255).toString(16).padStart(2, '0')}` 
                : undefined,
              color: customPreset.color,
              fontFamily: customPreset.fontFamily,
              fontSize: `${customPreset.fontSize / 2}px`, // Half size for preview
              fontWeight: customPreset.fontWeight,
              textShadow: customPreset.textShadow ? '1px 1px 2px rgba(0,0,0,0.8)' : 'none'
            }}
          >
            Sample Text
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
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Font Size</Label>
                <span className="text-sm text-gray-500">{customPreset.fontSize}px</span>
              </div>
              <Slider
                min={16}
                max={42}
                step={1}
                value={[customPreset.fontSize]}
                onValueChange={(value) => handleCustomPresetChange('fontSize', value[0])}
                disabled={!editMode}
              />
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
            
            {/* Background Color */}
            <div className="space-y-2">
              <Label>Background Color</Label>
              <ColorPicker
                value={customPreset.bgColor}
                onChange={(value) => handleCustomPresetChange('bgColor', value)}
                disabled={!editMode}
              />
            </div>
            
            {/* Background Opacity */}
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
            
            {/* Position */}
            <div className="space-y-2">
              <Label>Position</Label>
              <RadioGroup 
                value={customPreset.position} 
                onValueChange={(value: 'top' | 'center' | 'bottom') => 
                  handleCustomPresetChange('position', value)
                }
                disabled={!editMode}
                className="flex gap-4"
              >
                {POSITION_OPTIONS.map((position) => (
                  <div key={position.id} className="flex items-center space-x-2">
                    <RadioGroupItem 
                      value={position.id} 
                      id={`position-${position.id}`} 
                    />
                    <Label htmlFor={`position-${position.id}`}>
                      {position.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
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