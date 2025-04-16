'use client';

import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Subtitles, 
  Languages, 
  Globe, 
  BrainCircuit, 
  Clock, 
  TrendingUp, 
  Zap, 
  Layout, 
  PenTool, 
  Plus, 
  Minus,
  Sparkles,
  Bot,
  Share2,
  BarChart3,
  Play
} from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BgImage from '@/components/BgImage';
import { useLogoContext } from "@/context/LogoContext";

const FeaturesPage = () => {
  const [activeFeature, setActiveFeature] = useState<string | null>('ai-clips');
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const featureContentRef = useRef<HTMLDivElement>(null);
  
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


  // Handle feature change and scroll to content area
  const handleFeatureChange = (featureId: string) => {
    setActiveFeature(featureId);
    if (featureContentRef.current) {
      featureContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };
  
  const features = [
    {
      id: 'ai-clips',
      title: 'AI Clip Generation',
      description: 'Automatically extract the most engaging clips from your long-form videos.',
      icon: <Sparkles size={24} />,
      content: [
        {
          title: 'Smart Clip Detection',
          description: 'Our AI analyzes your content to identify the most engaging and shareable moments.',
          points: [
            'Content analysis for emotional peaks and key information',
            'Speech pattern recognition to identify compelling statements',
            'Visual scene detection for impactful moments',
            'Audience retention optimization'
          ],
          image: '/features/smart-clip.webp'
        },
        {
          title: 'Multi-platform Format Support',
          description: 'Export clips in various formats optimized for different social platforms.',
          points: [
            'Vertical format (9:16) for TikTok, Instagram Reels, and YouTube Shorts',
            'Square format (1:1) for Instagram feed and Facebook',
            'Horizontal format (16:9) for YouTube and traditional video platforms',
            'Custom aspect ratio options for specialized needs'
          ],
          image: '/features/multi-platform.webp'
        },
        {
          title: 'Batch Processing',
          description: 'Process multiple videos at once to save time and streamline your workflow.',
          points: [
            'Queue unlimited videos with the Expert plan',
            'Apply consistent settings across all videos',
            'Background processing while you work on other tasks',
            'Email notifications when batch processing is complete'
          ],
          image: '/features/batch-processing.webp'
        }
      ]
    },
    {
      id: 'subtitle-generator',
      title: 'AI Subtitle Generator',
      description: 'Generate accurate subtitles with customizable styles and animations.',
      icon: <Subtitles size={24} />,
      content: [
        {
          title: 'Accurate Transcription',
          description: 'High-accuracy transcription for clear and precise subtitles.',
          points: [
            'Industry-leading 98% accuracy for clear speech',
            'Noise-filtering algorithms for challenging audio environments',
            'Speaker detection and labeling for multi-person videos',
            'Professional punctuation and grammar correction'
          ],
          image: '/features/transcription.webp'
        },
        {
          title: 'Customizable Styling',
          description: 'Personalize your subtitles with various styles, fonts, and animations.',
          points: [
            'Multiple font options and text styling',
            'Color customization with opacity controls',
            'Background styling and positioning',
            'Entrance and exit animations'
          ],
          image: '/features/subtitle-styling.webp'
        },
        {
          title: 'Caption Timing Editor',
          description: 'Fine-tune the timing of your captions for perfect synchronization.',
          points: [
            'Frame-perfect caption timing adjustments',
            'Batch timing modifications',
            'Auto-timing correction for seamless flow',
            'Visual waveform for precision editing'
          ],
          image: '/features/timing-editor.webp'
        }
      ]
    },
    {
      id: 'translation',
      title: 'AI Translation',
      description: 'Translate your videos into multiple languages to reach a global audience.',
      icon: <Languages size={24} />,
      content: [
        {
          title: 'Multi-language Support',
          description: 'Translate your content into over 50 languages with high accuracy.',
          points: [
            'Support for major languages including Spanish, French, German, Chinese, Japanese',
            'Regional dialect options for major languages',
            'Specialized vocabulary handling for technical content',
            'Cultural context preservation'
          ],
          image: '/features/multi-language.webp'
        },
        {
          title: 'Context-aware Translation',
          description: 'Our AI understands context to deliver more natural and accurate translations.',
          points: [
            'Content-specific translation models',
            'Idiomatic expression handling',
            'Contextual meaning preservation',
            'Technical terminology recognition'
          ],
          image: '/features/context-translation.webp'
        },
        {
          title: 'Export Options',
          description: 'Export your translated videos or subtitles in various formats.',
          points: [
            'Embedded subtitles directly in video',
            'SRT files for external use',
            'VTT format for web videos',
            'Translation-only exports for voice dubbing'
          ],
          image: '/features/export-options.webp'
        }
      ]
    },
    {
      id: 'social-optimizer',
      title: 'Social Media Optimizer',
      description: 'Optimize your video content for maximum engagement on social platforms.',
      icon: <TrendingUp size={24} />,
      content: [
        {
          title: 'Platform-specific Optimization',
          description: 'Tailor your content for specific social media platforms.',
          points: [
            'TikTok-optimized clips with trending sound recommendations',
            'Instagram Reels format with engagement-boosting features',
            'YouTube Shorts optimization for discoverability',
            'Twitter/X video format with caption optimization'
          ],
          image: '/features/platform-optimization.webp'
        },
        {
          title: 'Trending Topic Integration',
          description: 'Incorporate trending topics and hashtags relevant to your content.',
          points: [
            'Real-time trend analysis across platforms',
            'Content-relevant hashtag suggestions',
            'Trending sound recommendations for TikTok',
            'Seasonal and event-based content suggestions'
          ],
          image: '/features/trending-topics.webp'
        },
        {
          title: 'Engagement Analytics',
          description: 'Track the performance of your optimized content across platforms.',
          points: [
            'View count and engagement rate tracking',
            'Performance comparison between platforms',
            'Audience demographics insights',
            'Best posting time recommendations'
          ],
          image: '/features/engagement-analytics.webp'
        }
      ]
    },
    {
      id: 'auto-broll',
      title: 'Auto B-roll',
      description: 'Automatically add relevant B-roll footage to enhance your videos.',
      icon: <BrainCircuit size={24} />,
      content: [
        {
          title: 'Content-aware B-roll',
          description: 'AI analyzes your video content to select relevant B-roll footage.',
          points: [
            'Speech analysis for contextual B-roll insertion',
            'Natural transition placement',
            'Content relevance scoring',
            'Dynamic timing adjustments'
          ],
          image: '/features/content-aware.webp'
        },
        {
          title: 'Stock Library Access',
          description: 'Access thousands of high-quality stock videos for B-roll.',
          points: [
            'Extensive royalty-free stock video library',
            'Category-based filtering',
            'Quality and resolution options',
            'One-click B-roll insertion'
          ],
          image: '/features/stock-library.webp'
        },
        {
          title: 'Custom B-roll Upload',
          description: 'Upload and manage your own B-roll footage library.',
          points: [
            'Custom library organization by categories',
            'Metadata tagging for easy search',
            'AI content analysis of your B-roll',
            'Favorites and frequently used collections'
          ],
          image: '/features/custom-broll.webp'
        }
      ]
    },
    {
      id: 'faceless-creation',
      title: 'Faceless Video Creation',
      description: 'Create engaging videos without showing your face using AI-generated visuals.',
      icon: <Bot size={24} />,
      content: [
        {
          title: 'Script to Video',
          description: 'Turn your script into a complete video with AI-generated visuals.',
          points: [
            'Script analysis for optimal visual selection',
            'AI-generated visualization proposals',
            'Keyword-to-visual matching',
            'Scene flow optimization'
          ],
          image: '/features/script-to-video.webp'
        },
        {
          title: 'Visual Style Templates',
          description: 'Choose from various visual styles and templates for your faceless videos.',
          points: [
            'Minimalist design templates',
            'Animated infographic styles',
            'Text-forward templates',
            'Custom style creation'
          ],
          image: '/features/visual-templates.webp'
        },
        {
          title: 'AI Voice Generation',
          description: 'Add professional voiceovers to your faceless videos using AI voices.',
          points: [
            'Multiple voice options with different accents and tones',
            'Natural-sounding speech with proper emphasis',
            'Voice customization options',
            'Pacing and timing adjustments'
          ],
          image: '/features/ai-voice.webp'
        }
      ]
    },
    {
      id: 'publishing',
      title: 'Direct Publishing',
      description: 'Schedule and publish your videos directly to multiple platforms.',
      icon: <Share2 size={24} />,
      content: [
        {
          title: 'Multi-platform Publishing',
          description: 'Publish your videos to multiple social platforms simultaneously.',
          points: [
            'One-click publishing to YouTube, TikTok, Instagram, and more',
            'Platform-specific metadata optimization',
            'Custom thumbnail generation',
            'Tag and category recommendations'
          ],
          image: '/features/multi-publishing.webp'
        },
        {
          title: 'Scheduling Calendar',
          description: 'Plan and schedule your content release with an intuitive calendar.',
          points: [
            'Visual calendar interface',
            'Optimal time recommendations based on analytics',
            'Recurring schedule templates',
            'Time zone management'
          ],
          image: '/features/scheduling.webp'
        },
        {
          title: 'Analytics Dashboard',
          description: 'Track the performance of your published content across platforms.',
          points: [
            'Unified analytics dashboard for all platforms',
            'Performance trends visualization',
            'Audience growth tracking',
            'Content strategy insights'
          ],
          image: '/features/analytics-dashboard.webp'
        }
      ]
    },
    {
      id: 'performance',
      title: 'Performance Analytics',
      description: 'Track and analyze the performance of your content across platforms.',
      icon: <BarChart3 size={24} />,
      content: [
        {
          title: 'Cross-platform Insights',
          description: 'Get a unified view of your content performance across all platforms.',
          points: [
            'Platform comparison metrics',
            'Audience overlap analysis',
            'Content type performance breakdown',
            'Platform-specific audience preferences'
          ],
          image: '/features/cross-platform.webp'
        },
        {
          title: 'Performance Predictions',
          description: 'AI-powered predictions for future content performance.',
          points: [
            'Content trend forecasting',
            'Audience growth projections',
            'Engagement prediction for draft content',
            'Optimization suggestions based on predictions'
          ],
          image: '/features/predictions.webp'
        },
        {
          title: 'Competitor Analysis',
          description: 'Compare your content performance against competitors.',
          points: [
            'Side-by-side competitor metrics',
            'Content strategy comparison',
            'Audience engagement benchmarking',
            'Gap analysis for content opportunities'
          ],
          image: '/features/competitor-analysis.webp'
        }
      ]
    }
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
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features for Content Creators</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore all the tools and features that make {branding.siteName} the ultimate content creation platform
          </p>
          
          <div className="flex flex-wrap justify-center mt-8 gap-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-blue-900/30 px-6 py-3 rounded-lg border border-blue-500/30"
            >
              <p className="font-semibold">AI-powered automation</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="bg-green-900/30 px-6 py-3 rounded-lg border border-green-500/30"
            >
              <p className="font-semibold">Time-saving tools</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              className="bg-purple-900/30 px-6 py-3 rounded-lg border border-purple-500/30"
            >
              <p className="font-semibold">Engagement optimization</p>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Video Demo Section */}
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
          <p className="text-center text-lg mt-4 text-gray-300">See {branding.siteName}'s powerful features in action</p>
        </motion.div>
        
        {/* Features Navigation and Content */}
        <div className="grid md:grid-cols-4 gap-8 h-screen pb-20" style={{ overflowY: 'auto', scrollbarWidth: 'none' }}>
          {/* Sidebar Navigation */}
          <div className="md:col-span-1">
            <motion.div 
              ref={sidebarRef}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-gray-900/40 backdrop-blur-sm rounded-xl p-4 sticky top-0 left-0"
            >
              <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Features</h3>
              <nav className="space-y-2">
                {features.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => handleFeatureChange(feature.id)}
                    className={`w-full flex items-center gap-2 p-3 rounded-lg text-left text-sm transition ${
                      activeFeature === feature.id
                        ? 'bg-purple-900/50 text-white'
                        : 'text-gray-300 hover:bg-gray-800/50'
                    }`}
                  >
                    <div className={`${activeFeature === feature.id ? 'text-purple-400' : 'text-gray-400'}`}>
                      {feature.icon}
                    </div>
                    <span>{feature.title}</span>
                  </button>
                ))}
              </nav>
            </motion.div>
          </div>
          
          {/* Feature Content */}
          <div className="md:col-span-3" ref={featureContentRef}>
            {features.map((feature) => (
              activeFeature === feature.id && (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="bg-gray-900/40 backdrop-blur-sm rounded-xl overflow-hidden"
                >
                  <div className="p-6 border-b border-gray-700">
                    <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
                    <p className="text-gray-300">{feature.description}</p>
                  </div>
                  
                  {/* Features Content */}
                  <div className="p-6">
                    {feature.content.map((item, index) => (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.1 }}
                        key={index}
                        className="mb-12 last:mb-0 border-b border-gray-700/50 pb-8 last:border-0 last:pb-0"
                      >
                        <div className="grid md:grid-cols-2 gap-8">
                          <div>
                            <h3 className="text-xl font-semibold mb-4 text-purple-300">{item.title}</h3>
                            <p className="text-gray-300 mb-6">{item.description}</p>
                            
                            <ul className="space-y-3">
                              {item.points.map((point, i) => (
                                <li key={i} className="flex items-start gap-2">
                                  <div className="bg-purple-900/40 text-purple-400 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  </div>
                                  <span className="text-gray-300 text-sm">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="bg-gray-800/50 rounded-lg overflow-hidden border border-gray-700">
                            <div className="aspect-video bg-gray-800 flex items-center justify-center">
                              {/* Replace with actual images when available */}
                              <div className="text-gray-500 text-center p-4">
                                <Clock className="mx-auto mb-2 h-12 w-12" />
                                <p>Image placeholder for: {item.image}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Try Now CTA */}
                  <div className="p-6 bg-gray-800/30 border-t border-gray-700">
                    <h3 className="text-lg font-semibold mb-4">Ready to try {feature.title}?</h3>
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
              question="How does the AI clip generation work?"
              answer="Our AI analyzes your video content, including speech, visual elements, and pacing to identify the most engaging and shareable moments. It considers factors like emotional peaks, key information, and audience retention patterns to extract clips that are most likely to perform well on social media."
            />
            <FaqItem 
              question="Can I customize the generated clips and subtitles?"
              answer="Yes! After our AI generates clips or subtitles, you have full control to customize them. You can adjust clip timing, edit subtitles text, change styles and colors, add animations, and more using our intuitive editor."
            />
            <FaqItem 
              question="What video formats are supported for upload?"
              answer="We support most common video formats including MP4, MOV, AVI, WMV, and MKV. You can also directly import videos from YouTube by simply pasting the link. Our Expert plan supports videos up to 2 hours in length and 1GB in file size."
            />
            <FaqItem 
              question="How accurate is the subtitle generation?"
              answer="Our AI subtitle generation achieves 98% accuracy for clear speech and performs exceptionally well even in challenging audio environments with background noise. The system also includes automatic punctuation and grammar correction for professional-looking subtitles."
            />
            <FaqItem 
              question="Can I publish directly to social media from {branding.siteName}?"
              answer="Yes, with our Advanced and Expert plans, you can connect your social media accounts (YouTube, TikTok, Instagram, Facebook, Twitter/X) and publish or schedule your content directly from our platform, saving you time and streamlining your workflow."
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
          <h2 className="text-3xl font-bold mb-6">Ready to Transform Your Content Creation?</h2>
          <p className="text-lg text-gray-300 mb-8">
            Join thousands of content creators who are saving time and growing their audience with {branding.siteName}.
            Start your free trial today!
          </p>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/sign-up">
              <button className="bg-purple-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-purple-700 transition">
                Try for free
              </button>
            </Link>
            <Link href="/pricing">
              <button className="bg-transparent border border-gray-600 text-white px-8 py-4 rounded-lg font-medium text-lg hover:bg-gray-800 transition">
                View pricing
              </button>
            </Link>
          </div>
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

export default FeaturesPage; 