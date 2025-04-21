"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import HomeHeader from "@/components/HomeHeader";
import { 
  Book, 
  Mail, 
  MessageCircle, 
  PlayCircle, 
  FileQuestion, 
  ExternalLink 
} from "lucide-react";
import Link from "next/link";
import FAQItem from "@/components/FAQ";
import SearchInput from "@/components/SearchInput";

export default function HelpPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      setIsLoading(false);
    }
  }, [status, router]);

  const handleSearch = (query: string) => {
    // In a real app, this would filter results or navigate to search results
    console.log("Searching for:", query);
  };
  
  const faqs = [
    {
      question: "How do I create my first video?",
      answer: (
        <p>
          Navigate to the Home page and click the "Create Video" button. You can either 
          upload your own video or use our AI to generate one from scratch. Follow the 
          step-by-step process to add captions, effects, and more.
        </p>
      )
    },
    {
      question: "What video formats are supported?",
      answer: (
        <p>
          We support all major video formats including MP4, MOV, AVI and WebM. 
          For best results, we recommend using MP4 with H.264 encoding. 
          Maximum file size is 1GB for standard users and 5GB for premium users.
        </p>
      )
    },
    {
      question: "How do I schedule videos for posting?",
      answer: (
        <p>
          Go to the Schedule page from the sidebar. Click on "New Schedule" and select 
          the video you want to publish. Choose the platform, date, and time, then click 
          "Schedule". You can view and manage all your scheduled posts from the Schedule dashboard.
        </p>
      )
    },
    {
      question: "How do automated series work?",
      answer: (
        <p>
          Automated Series lets you create recurring video posts with set schedules. 
          Navigate to the Automated Series page, click "Create New Series", and follow the setup wizard. 
          You can specify the frequency, platforms, and content types for your automated series.
        </p>
      )
    },
    {
      question: "What's the difference between free and premium plans?",
      answer: (
        <p>
          Free users can create up to 5 videos per month with basic editing features. 
          Premium users get unlimited videos, advanced AI editing tools, higher resolution 
          exports, priority rendering, and access to our exclusive template library. 
          Visit the <Link href="/dashboard/pricing" className="text-purple-600 underline">Pricing page</Link> for details.
        </p>
      )
    },
  ];
  
  const tutorials = [
    {
      title: "Getting Started Guide",
      duration: "5:20",
      thumbnail: "https://images.unsplash.com/photo-1516321497487-e288fb19713f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      url: "#tutorial-1"
    },
    {
      title: "Advanced Editing Techniques",
      duration: "8:45",
      thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      url: "#tutorial-2"
    },
    {
      title: "Publishing to Social Media",
      duration: "4:15",
      thumbnail: "https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
      url: "#tutorial-3"
    },
  ];
  
  // Display loading state
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  return (
    <>
      <HomeHeader pageName="Help & Support" />
      <div className="p-6 max-w-5xl mx-auto">
        {/* Search section */}
        <div className="bg-lightGray p-8 rounded-lg mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">How can we help you?</h1>
          <div className="max-w-xl mx-auto">
            <SearchInput 
              placeholder="Search for help topics..." 
              onSearch={handleSearch}
            />
          </div>
        </div>
        
        {/* Quick links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col items-center text-center">
            <MessageCircle size={40} className="text-purple-600 mb-3" />
            <h2 className="text-xl font-semibold mb-2">Live Chat</h2>
            <p className="text-gray-600 mb-4">
              Connect with our support team for immediate assistance with your questions.
            </p>
            <button className="mt-auto bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors px-6 py-2 rounded-full font-medium">
              Start Chat
            </button>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col items-center text-center">
            <Book size={40} className="text-purple-600 mb-3" />
            <h2 className="text-xl font-semibold mb-2">Documentation</h2>
            <p className="text-gray-600 mb-4">
              Explore our comprehensive guides and documentation for detailed instructions.
            </p>
            <Link 
              href="#" 
              className="mt-auto flex items-center gap-1 bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors px-6 py-2 rounded-full font-medium"
            >
              View Docs <ExternalLink size={16} />
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all flex flex-col items-center text-center">
            <Mail size={40} className="text-purple-600 mb-3" />
            <h2 className="text-xl font-semibold mb-2">Email Support</h2>
            <p className="text-gray-600 mb-4">
              Send us an email for complex issues or feature requests that need deeper attention.
            </p>
            <Link 
              href="mailto:support@editur.com" 
              className="mt-auto bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors px-6 py-2 rounded-full font-medium"
            >
              Contact Support
            </Link>
          </div>
        </div>
        
        {/* Frequently Asked Questions */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
            
            <div className="mt-4 text-center">
              <Link href="#" className="text-purple-600 font-medium hover:underline flex items-center justify-center gap-1">
                View All FAQs <ExternalLink size={16} />
              </Link>
            </div>
          </div>
        </div>
        
        {/* Video Tutorials */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-6">Video Tutorials</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tutorials.map((tutorial, index) => (
              <div 
                key={index} 
                className="bg-white rounded-lg overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-all"
              >
                <div className="relative h-40 bg-gray-200">
                  <img 
                    src={tutorial.thumbnail} 
                    alt={tutorial.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <PlayCircle size={50} className="text-white" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-md text-xs">
                    {tutorial.duration}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg">{tutorial.title}</h3>
                  <Link href={tutorial.url} className="mt-2 text-purple-600 text-sm flex items-center hover:underline">
                    Watch Tutorial <ExternalLink size={14} className="ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Link href="#" className="inline-block bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors px-6 py-2 rounded-full font-medium">
              View All Tutorials
            </Link>
          </div>
        </div>
        
        {/* Contact Support */}
        <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-8 rounded-lg text-white">
          <h2 className="text-2xl font-bold mb-4">Still Need Help?</h2>
          <p className="mb-6">
            Our dedicated support team is ready to assist you with any questions or issues you might encounter.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="bg-white text-purple-600 hover:bg-gray-100 transition-colors px-6 py-2 rounded-full font-medium flex items-center">
              <MessageCircle className="mr-2 h-5 w-5" />
              Start Live Chat
            </button>
            <Link href="mailto:support@editur.com" className="bg-transparent border border-white text-white hover:bg-white hover:bg-opacity-20 transition-colors px-6 py-2 rounded-full font-medium flex items-center">
              <Mail className="mr-2 h-5 w-5" />
              Email Support
            </Link>
          </div>
        </div>
      </div>
    </>
  );
} 