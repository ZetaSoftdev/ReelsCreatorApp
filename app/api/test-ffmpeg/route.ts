import { exec } from 'child_process';
import { promisify } from 'util';
import { NextResponse } from 'next/server';

const execAsync = promisify(exec);

export async function GET() {
  try {
    const { stdout } = await execAsync('ffmpeg -version');
    return NextResponse.json({ 
      status: 'success', 
      message: 'FFmpeg is installed and working!',
      version: stdout.split('\n')[0] 
    });
  } catch (error) {
    console.error('FFmpeg test error:', error);
    return NextResponse.json({ 
      status: 'error', 
      message: 'FFmpeg is not available: ' + (error as Error).message 
    }, { status: 500 });
  }
} 