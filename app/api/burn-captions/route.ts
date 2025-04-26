import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { generateASS } from '@/utils/subtitleUtils';

const execPromise = util.promisify(exec);

// Ensure temp directory exists
const tempDir = path.join(process.cwd(), '/public/temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

export async function POST(req: NextRequest) {
  const timestamp = Date.now();
  const inputPath = path.join(tempDir, `input-${timestamp}.mp4`);
  const outputPath = path.join(tempDir, `output-${timestamp}.mp4`);
  const assPath = path.join(tempDir, `subtitles-${timestamp}.ass`);

  try {
    const data = await req.json();
    const { videoUrl, wordTimestamps, preset } = data;

    console.log(`⬇️ Downloading video from: ${videoUrl}`);
    const videoResponse = await fetch(videoUrl);
    const videoBuffer = await videoResponse.arrayBuffer();
    fs.writeFileSync(inputPath, Buffer.from(videoBuffer));
    console.log(`✅ Video saved at: ${inputPath}`);

    console.log('📝 Generating ASS subtitle file...');
    const assContent = generateASS(wordTimestamps, preset);
    fs.writeFileSync(assPath, assContent);
    console.log(`✅ Subtitle file saved at: ${assPath}`);

    const fontsDir = path.join(process.cwd(), 'public/fonts/');

    // Convert all paths to FFmpeg-friendly format (use forward slashes)
    function toFFmpegPath(filePath: string) {
      // Convert to Windows-safe format for FFmpeg (e.g., C\\:/path/to/file)
      return filePath.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, drive) => `${drive}\\\\:/`);
    }
    
    const ffmpegInput = inputPath.replace(/\\/g, '/');
    const ffmpegOutput = outputPath.replace(/\\/g, '/');
    const ffmpegASS = toFFmpegPath(assPath);
    const ffmpegFonts = toFFmpegPath(fontsDir);
    
    const ffmpegCommand = `ffmpeg -i "${ffmpegInput}" -vf "ass=${ffmpegASS}:fontsdir=${ffmpegFonts}" -c:a copy "${ffmpegOutput}"`;
    

    console.log(`🚀 Running FFmpeg:\n${ffmpegCommand}`);

    const { stdout, stderr } = await execPromise(ffmpegCommand);
    console.log('✅ FFmpeg finished.');
    if (stderr) console.warn('FFmpeg stderr:', stderr);
    if (stdout) console.log('FFmpeg stdout:', stdout);

    if (!fs.existsSync(outputPath)) {
      throw new Error('FFmpeg processing failed — output file not found.');
    }

    const outputVideo = fs.readFileSync(outputPath);
    console.log('🎉 Returning processed video');

    return new NextResponse(outputVideo, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': 'attachment; filename="captioned-video.mp4"',
      },
    });
  } catch (error) {
    console.error('❌ Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ error: 'Failed to process video', details: message }, { status: 500 });
  } finally {
    // Optional cleanup (uncomment if needed)
    [inputPath, outputPath, assPath].forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
  }
}
