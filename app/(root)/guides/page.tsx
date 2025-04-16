'use client';

import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Play, Video, ScissorsLineDashed, Subtitles, Languages, Globe, Clock, BrainCircuit, Plus, Minus } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BgImage from '@/components/BgImage';
import { useLogoContext } from "@/context/LogoContext";

const GuidesPage = () => {
  const [activeGuide, setActiveGuide] = useState<string | null>('video-shorts');
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const guideContentRef = useRef<HTMLDivElement>(null);
  
  const { branding } = useLogoContext();
  
  // Handle video play/pause
  const toggleVideo = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };


  // Scroll to guide content only when actively clicking on guide navigation
  const handleGuideChange = (guideId: string) => {
    setActiveGuide(guideId);
    if (guideContentRef.current) {
      guideContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const guides = [
    {
      id: 'video-shorts',
      title: 'Turn Long Videos into Shorts',
      description: 'Learn how to automatically extract the most engaging parts of your long-form videos to create viral shorts.',
      icon: <ScissorsLineDashed size={24} />,
      content: [
        {
          step: 'Upload your long-form video',
          description: 'Simply drag and drop your video file or paste a YouTube link. We support videos up to 2 hours and 1GB file size (with Expert plan).',
          image: '/guides/upload.webp',
        },
        {
          step: 'Let AI analyze your content',
          description: 'Our AI will scan your video to identify the most engaging moments based on content, speech, and visual cues.',
          image: '/guides/analyze.webp',
        },
        {
          step: 'Review and customize AI-generated shorts',
          description: 'Browse through the automatically generated short clips, make adjustments if needed, and select the ones you want to export.',
          image: '/guides/review.webp',
        },
        {
          step: 'Export your short clips',
          description: 'Choose your preferred format (9:16 for TikTok/Instagram, 16:9 for YouTube) and export your viral-ready shorts.',
          image: '/guides/export.webp',
        },
      ],
    },
    {
      id: 'faceless-videos',
      title: 'Create Faceless Videos',
      description: 'Generate engaging videos without showing your face using AI-generated visuals.',
      icon: <Video size={24} />,
      content: [
        {
          step: 'Enter your script or topic',
          description: 'Type in your video script or let our AI generate one based on your topic.',
          image: '/guides/script.webp',
        },
        {
          step: 'Select visual style',
          description: 'Choose from different visual styles for your faceless video - illustrations, stock footage, animations, etc.',
          image: '/guides/style.webp',
        },
        {
          step: 'Generate AI visuals',
          description: 'Our AI will create relevant visuals and B-roll that match your content.',
          image: '/guides/visuals.webp',
        },
        {
          step: 'Add voiceover and music',
          description: 'Record your own voiceover or use our AI voice generator, then add background music from our library.',
          image: '/guides/audio.webp',
        },
      ],
    },
    {
      id: 'add-subtitles',
      title: 'Add Subtitles with AI',
      description: 'Automatically generate accurate subtitles for your videos in multiple styles.',
      icon: <Subtitles size={24} />,
      content: [
        {
          step: 'Upload your video',
          description: 'Upload the video you want to add subtitles to.',
          image: '/guides/upload-subtitle.webp',
        },
        {
          step: 'Generate automatic subtitles',
          description: 'Our AI will transcribe your audio with high accuracy, even in noisy environments.',
          image: '/guides/transcribe.webp',
        },
        {
          step: 'Customize subtitle style',
          description: 'Choose from various subtitle styles - font, size, position, background, animations, and more.',
          image: '/guides/subtitle-style.webp',
        },
        {
          step: 'Edit and export',
          description: 'Make any final edits to your subtitles and export your video with the new subtitles embedded.',
          image: '/guides/export-subtitle.webp',
        },
      ],
    },
    {
      id: 'translate-subtitles',
      title: 'Translate Subtitles',
      description: 'Translate your videos into multiple languages to reach a global audience.',
      icon: <Languages size={24} />,
      content: [
        {
          step: 'Upload captioned video',
          description: 'Upload a video that already has subtitles, or create subtitles first using our AI subtitle feature.',
          image: '/guides/captioned-video.webp',
        },
        {
          step: 'Select target languages',
          description: 'Choose which languages you want to translate your subtitles into (over 50 languages available).',
          image: '/guides/languages.webp',
        },
        {
          step: 'AI translation',
          description: 'Our AI will translate your subtitles while maintaining proper context and meaning.',
          image: '/guides/translation.webp',
        },
        {
          step: 'Export multilingual videos',
          description: 'Export versions of your video with the translated subtitles for each language.',
          image: '/guides/multilingual.webp',
        },
      ],
    },
    {
      id: 'clip-maker',
      title: 'Clip Maker',
      description: 'Create shareable clips from your long videos for various social platforms.',
      icon: <Globe size={24} />,
      content: [
        {
          step: 'Import your video',
          description: 'Upload your video or import directly from platforms like YouTube.',
          image: '/guides/import.webp',
        },
        {
          step: 'Select clip duration and format',
          description: 'Choose the optimal duration and aspect ratio for your target platform (TikTok, Instagram, YouTube Shorts, etc.).',
          image: '/guides/duration.webp',
        },
        {
          step: 'Customize and enhance',
          description: 'Add effects, text overlays, filters, transitions, and more to make your clip stand out.',
          image: '/guides/enhance.webp',
        },
        {
          step: 'Publish directly to platforms',
          description: 'Connect your social accounts to publish clips directly to multiple platforms with just one click.',
          image: '/guides/publish.webp',
        },
      ],
    },
    {
      id: 'auto-broll',
      title: 'Auto B-roll',
      description: 'Automatically add relevant B-roll footage to enhance your videos.',
      icon: <BrainCircuit size={24} />,
      content: [
        {
          step: 'Upload your main video',
          description: 'Upload the primary video that needs B-roll enhancement.',
          image: '/guides/main-video.webp',
        },
        {
          step: 'AI analyzes content',
          description: 'Our AI will analyze your video content to determine where B-roll would be most effective.',
          image: '/guides/analyze-broll.webp',
        },
        {
          step: 'Select B-roll sources',
          description: 'Choose from our stock library or upload your own B-roll footage.',
          image: '/guides/broll-source.webp',
        },
        {
          step: 'Review and finalize',
          description: 'Review the automatically inserted B-roll segments, make adjustments if needed, and finalize your enhanced video.',
          image: '/guides/finalize-broll.webp',
        },
      ],
    },
  ];

  return (
    <div className='relative h-screen bg-[#010C0A] pt-6 px-2 sm:px-4 md:px-6 overflow-x-hidden'>
      <BgImage />
      <div className='relative items-center z-10'>
        <Navbar />
      </div>
      
      <div className="container relative mx-auto py-10 px-4 text-white">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Creator Guides & Tutorials</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Comprehensive guides to help you master {branding.siteName} and maximize your content creation efficiency
          </p>
          
          <div className="flex flex-wrap justify-center mt-8 gap-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-blue-900/30 px-6 py-3 rounded-lg border border-blue-500/30"
            >
              <p className="font-semibold">Step-by-step tutorials</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-green-900/30 px-6 py-3 rounded-lg border border-green-500/30"
            >
              <p className="font-semibold">Practical examples</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="bg-purple-900/30 px-6 py-3 rounded-lg border border-purple-500/30"
            >
              <p className="font-semibold">Time-saving tips</p>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Video Demo Section - Improved */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mb-16 relative max-w-6xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 shadow-lg">
            <video
              ref={videoRef}
              src="/video.mp4"
            //   poster="/guides/video-poster.webp"
              className="w-full h-auto"
              preload="metadata"
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            ></video>
            
            {!isPlaying && (
              <div 
                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/30"
                onClick={toggleVideo}
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-purple-600 p-4 rounded-full text-white shadow-lg"
                >
                  <Play className="h-8 w-8" />
                </motion.div>
              </div>
            )}
          </div>
          <p className="text-center text-lg mt-4 text-gray-300">Watch how to create viral shorts in under 2 minutes</p>
        </motion.div>
        
        {/* Guides Navigation and Content - Improved */}
        <div className="grid md:grid-cols-4 gap-8 h-screen pb-20" style={{ overflowY: 'auto', scrollbarWidth: 'none' }}>
          {/* Sidebar Navigation - Made sticky */}
          <div className="md:col-span-1">
            <motion.div 
              ref={sidebarRef}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-4 sticky top-0 left-0"
            >
              <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Guides</h3>
              <nav className="space-y-2">
                {guides.map((guide) => (
                  <button
                    key={guide.id}
                    onClick={() => handleGuideChange(guide.id)}
                    className={`w-full flex items-center gap-2 p-3 rounded-lg text-left text-sm transition ${
                      activeGuide === guide.id
                        ? 'bg-purple-900/50 text-white'
                        : 'text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className={`${activeGuide === guide.id ? 'text-purple-400' : 'text-gray-400'}`}>
                      {guide.icon}
                    </div>
                    <span>{guide.title}</span>
                  </button>
                ))}
              </nav>
            </motion.div>
          </div>
          
          {/* Guide Content */}
          <div className="md:col-span-3" ref={guideContentRef}>
            {guides.map((guide) => (
              activeGuide === guide.id && (
                <motion.div
                  key={guide.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gray-900/40 backdrop-blur-sm rounded-xl overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold mb-2">{guide.title}</h2>
                    <p className="text-gray-300">{guide.description}</p>
                  </div>
                  
                  {/* Steps - More compact and attractive */}
                  <div className="p-6">
                    {guide.content.map((step, index) => (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        key={index}
                        className="mb-8 last:mb-0"
                      >
                        <div className="flex items-start gap-4">
                          <div className="bg-purple-900/50 text-purple-300 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0 mt-1">
                            {index + 1}
                          </div>
                          <div className="space-y-4 flex-1">
                            <h3 className="text-xl font-semibold">{step.step}</h3>
                            <p className="text-gray-300">{step.description}</p>
                            <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
                              <div className="aspect-video bg-gray-800 flex items-center justify-center">
                                {/* Replace with actual images when available */}
                                <div className="text-gray-500 text-center p-4">
                                  <Clock className="mx-auto mb-2 h-12 w-12" />
                                  <p>Image placeholder for: {step.image}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Next Steps */}
                  <div className="p-6 bg-gray-800/30 border-t border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Ready to try it yourself?</h3>
                    <div className="flex flex-wrap gap-4">
                      <Link href="/sign-up">
                        <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition">
                          Try Now for Free
                        </button>
                      </Link>
                      <Link href="/pricing">
                        <button className="bg-transparent hover:bg-gray-700 text-gray-300 border border-gray-600 px-6 py-3 rounded-lg font-medium transition">
                          See Plans & Pricing
                        </button>
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )
            ))}
          </div>
        </div>
        
        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-16 max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <FaqItem 
              question="How long does it take to process a video?"
              answer="Most videos are processed within 2-5 minutes, depending on the length and complexity of the original video. Long-form videos (over 30 minutes) may take up to 10 minutes to analyze and process."
            />
            <FaqItem 
              question="Can I customize the AI-generated subtitles?"
              answer="Yes! You can edit the text, styling, colors, positioning, and animations of your AI-generated subtitles. Our editor gives you complete control over how your subtitles look and feel."
            />
            <FaqItem 
              question="What languages are supported for subtitle translation?"
              answer="We currently support over 50 languages for subtitle translation, including English, Spanish, French, German, Italian, Portuguese, Dutch, Russian, Chinese, Japanese, Korean, Arabic, and many more."
            />
            <FaqItem 
              question="Can I connect my social media accounts for direct posting?"
              answer="Yes, with our Expert plan, you can connect your TikTok, Instagram, YouTube, and other social media accounts to schedule and publish your videos directly from {branding.siteName}."
            />
            <FaqItem 
              question="How accurate is the AI in selecting engaging moments from long videos?"
              answer="Our AI has been trained on millions of viral videos to identify patterns that engage viewers. It typically identifies the most engaging 15-30 second clips with 85-90% accuracy, which you can further refine in the editor."
            />
          </div>
        </motion.div>
        
        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-16 text-center max-w-4xl mx-auto bg-gray-900/40 backdrop-blur-sm rounded-2xl p-12 border border-gray-700"
        >
          <h2 className="text-3xl font-bold mb-6">Ready to Create Viral Content?</h2>
          <p className="text-lg text-gray-300 mb-8">
            Start using {branding.siteName} today and transform your content creation process.
            No credit card required for your free trial!
          </p>
          
          <Link href="/sign-up">
            <button className="bg-purple-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-purple-700 transition">
              Try for free
            </button>
          </Link>
        </motion.div>
      </div>
      
      <Footer />
    </div>
  );
};

// FAQ Component
const FaqItem = ({ question, answer }: { question: string; answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <motion.div 
      className="border border-gray-700 rounded-lg overflow-hidden"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 text-left bg-gray-800/50 flex justify-between items-center"
      >
        <span className="font-medium text-lg">{question}</span>
        {isOpen ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </button>
      
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 bg-gray-900/40 text-gray-300"
        >
          <p>{answer}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export default GuidesPage; 