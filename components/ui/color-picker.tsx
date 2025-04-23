"use client";

import React, { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { CheckIcon } from 'lucide-react';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

// Predefined color options
const COLOR_PRESETS = [
  '#FFFFFF', // White
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FF9500', // Orange
  '#9C27B0', // Purple
  '#795548', // Brown
  '#607D8B', // Blue Grey
  '#E91E63', // Pink
  '#5856D6', // Indigo
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FFC107', // Amber
  '#9E9E9E', // Grey
  'transparent'
];

export function ColorPicker({ value, onChange, disabled = false }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorChange = (color: string) => {
    onChange(color);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen && !disabled} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-10 p-1 flex items-center space-x-2"
          disabled={disabled}
        >
          <div 
            className="h-6 w-6 rounded border"
            style={{ 
              backgroundColor: value,
              backgroundImage: value === 'transparent' ? 
                'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 
                undefined,
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 4px 4px'
            }} 
          />
          <span className="flex-1 text-sm text-left">
            {value === 'transparent' ? 'Transparent' : value.toUpperCase()}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-2">
        <div className="grid grid-cols-5 gap-1">
          {COLOR_PRESETS.map((color) => (
            <button
              key={color}
              className="w-10 h-10 rounded border relative hover:scale-110 transition-transform"
              style={{ 
                backgroundColor: color,
                backgroundImage: color === 'transparent' ? 
                  'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 
                  undefined,
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 4px 4px'
              }}
              onClick={() => handleColorChange(color)}
            >
              {color === value && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <CheckIcon 
                    size={16}
                    className={color === '#FFFFFF' || color === 'transparent' || color === '#FFFF00' ? 'text-black' : 'text-white'} 
                  />
                </div>
              )}
            </button>
          ))}
        </div>
        <div className="mt-2">
          <input
            type="color"
            value={value !== 'transparent' ? value : '#FFFFFF'}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-full h-8"
            disabled={disabled}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
} 