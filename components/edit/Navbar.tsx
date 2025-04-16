import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Avatar } from "@/components/ui/avatar";
import { Crop, Edit, Grid, Languages, Save, User, ChevronLeft, Sparkles, Edit2, Edit3Icon, Captions, Edit3 } from "lucide-react";
import Link from "next/link";

interface NavbarProps {
  selectedTool: string;
  setSelectedTool: (value: string) => void;
  videoTitle?: string;
}

export default function Navbar({ selectedTool, setSelectedTool, videoTitle = "Untitled Video" }: NavbarProps) {
  return (
    <div className="flex items-center justify-between bg-slate50 p-3">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/home" className="border shadow-md py-2 px-3 font-medium flex items-center justify-center gap-1 rounded-md">
          <ChevronLeft size={20} /> Leave
        </Link>
        <div className="flex items-center gap-2 text-yellow-500">
          <p className="text-base">{videoTitle}</p>
        </div>
        {/* <Link href="pricing" className="bg-yellow py-2 px-3 text-base flex items-center rounded-md gap-2 hover:shadow-md">
          <Sparkles size={18} /> Upgrade
        </Link> */}
      </div>
      
      {/* Center Section */}
      <ToggleGroup type="single" value={selectedTool} onValueChange={setSelectedTool} variant="dark" className="flex rounded-xl overflow-hidden bg-bgWhite shadow-md border">
        <ToggleGroupItem
          value="crop"
          className="rounded-none"
        >
          <Crop size={20} /> Crop
        </ToggleGroupItem>
        <ToggleGroupItem
          value="caption"
          className="rounded-none"
        >
          <Captions size={20} /> Captions
        </ToggleGroupItem>
        <ToggleGroupItem
          value="style"
          className="rounded-none"
        >
          <Edit size={20} /> Style
        </ToggleGroupItem>
        <ToggleGroupItem
          value="translate"
          className="rounded-none"
        >
          <Languages size={20} /> Auto Translate
        </ToggleGroupItem>
      </ToggleGroup>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        <Button variant="ghost">Tall Portrait (9:16)</Button>
        <Button variant="default" className="bg-[#312F37] text-white hover:scale-105 transition-all duration-200 hover:bg-[#312F37]">
          Export <Save size={20} />
        </Button>
        <Avatar>
          <User size={20} />
        </Avatar>
      </div>
    </div>
  );
}
