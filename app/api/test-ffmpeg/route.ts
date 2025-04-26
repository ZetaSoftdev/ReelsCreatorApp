import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

// Try multiple possible paths for FFmpeg
async function testFFmpeg() {
  const possibleCommands = [
    'ffmpeg -version',
    '/usr/bin/ffmpeg -version',
    '/usr/local/bin/ffmpeg -version',
    'which ffmpeg' // This will tell us where ffmpeg is installed
  ];
  
  const results = [];
  
  for (const cmd of possibleCommands) {
    try {
      const { stdout } = await execAsync(cmd);
      results.push({ command: cmd, result: 'success', output: stdout });
      
      // If we found ffmpeg, return success
      if (cmd.includes('ffmpeg -version') && stdout.includes('ffmpeg version')) {
        return { success: true, version: stdout.split('\n')[0], details: results };
      }
    } catch (error) {
      results.push({ command: cmd, result: 'error', message: (error as Error).message });
    }
  }
  
  // Also check the environment info
  try {
    const { stdout: envInfo } = await execAsync('env');
    results.push({ command: 'env', result: 'info', output: envInfo });
  } catch (error) {
    results.push({ command: 'env', result: 'error', message: (error as Error).message });
  }
  
  return { success: false, details: results };
}

export async function GET() {
  try {
    const result = await testFFmpeg();
    
    if (result.success) {
      return NextResponse.json({ 
        status: 'success', 
        message: 'FFmpeg is installed and working!',
        version: result.version,
        details: result.details
      });
    } else {
      return NextResponse.json({ 
        status: 'error', 
        message: 'FFmpeg is not available',
        details: result.details
      }, { status: 500 });
    }
  } catch (error) {
    console.error('FFmpeg test error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'FFmpeg testing failed: ' + (error as Error).message 
    }, { status: 500 });
  }
} 