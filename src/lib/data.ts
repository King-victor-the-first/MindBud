
import type { MoodBooster } from '@/lib/types';
import { 
    Sprout, ConciergeBell, Cookie, Star, Dog, Coffee, PenSquare, Users, MessageSquarePlus, Trash2, Send, Podcast, 
    StretchHorizontal, GlassWater, NotebookPen, Smile, DoorOpen, Leaf, Heart, Music, BookOpen, Sun, Moon, Phone, 
    Camera, Brush, Lightbulb, Bird, Wind, Flower, Gift, MessageCircle, Share2, Award, ThumbsUp, Edit, Zap, Cloud,
    Mic, Video, ShoppingCart, Briefcase, Home, Drama, Scissors, Palette, Headphones, BookMarked, Trees, Train,
    Car, Bike, Plane, Anchor, Globe, MapPin, Compass, Watch, Gamepad2, Puzzle, Clapperboard, Code, Feather,
    Sunrise, Sunset, Snowflake, CloudRain, CloudSun, Telescope, Microscope, FlaskConical, Beaker, GraduationCap,
    HeartHandshake, HandHelping, HandCoins, Recycle, Waves, Mountain, Flame, Key, Lock, BatteryCharging, Wifi,
    Volume2, BellRing, Inbox, Folder, File, BarChart2, TrendingUp, Radio, Tv, Monitor, Speaker, MousePointer,
    Save, Upload, Download, Settings, SlidersHorizontal, Brain, Footprints, Calendar, Apple, Target
} from 'lucide-react';
import { create } from 'zustand';

export const moodBoosters: MoodBooster[] = [
  // Original & Kindness
  { text: "Gift a neighbor a small plant", icon: Sprout },
  { text: "Help a neighbor with a chore", icon: ConciergeBell },
  { text: "Bake cookies for a friend", icon: Cookie },
  { text: "Leave a positive review for a local business", icon: Star },
  { text: "Offer to walk a neighbor's dog", icon: Dog },
  { text: "Pay for the coffee of the person behind you", icon: Coffee },
  { text: "Write a thank-you note to a community helper", icon: PenSquare },
  { text: "Volunteer at a local shelter for an hour", icon: Users },
  { text: "Give a genuine compliment to a stranger", icon: MessageSquarePlus },
  { text: "Tidy up a shared space you use", icon: Trash2 },
  { text: "Send a positive text to a friend you haven't spoken to recently", icon: Send },
  { text: "Hold the door open for someone", icon: DoorOpen },
  { text: "Let someone go ahead of you in line", icon: Users },
  { text: "Donate a book you've finished to a little free library", icon: BookOpen },
  { text: "Leave a generous tip", icon: HandCoins },
  { text: "Share a friend's creative work online", icon: Share2 },
  { text: "Recommend a small business to a friend", icon: Award },
  { text: "Write a positive comment on a social media post", icon: ThumbsUp },
  { text: "Tell a family member you appreciate them", icon: Heart },
  { text: "Offer your seat to someone on public transport", icon: Train },
  
  // Self-Care & Mindfulness
  { text: "Take five minutes to stretch your body", icon: StretchHorizontal },
  { text: "Drink a full glass of water", icon: GlassWater },
  { text: "Write down three things you are grateful for", icon: NotebookPen },
  { text: "Smile at the next person you see", icon: Smile },
  { text: "Listen to a new, uplifting podcast episode", icon: Podcast },
  { text: "Do a 5-minute guided meditation", icon: Headphones },
  { text: "Sit outside and just listen to the sounds for 2 minutes", icon: Bird },
  { text: "Watch the sunrise or sunset", icon: Sunrise },
  { text: "Take three deep, slow breaths", icon: Wind },
  { text: "Moisturize your hands", icon: HandHelping },
  { text: "Listen to a song that makes you happy", icon: Music },
  { text: "Unfollow social media accounts that don't make you feel good", icon: Trash2 },
  { text: "Take a 15-minute walk without your phone", icon: Compass },
  { text: "Watch a funny video online", icon: Clapperboard },
  { text: "Tidy your desk or one small area", icon: Home },
  { text: "Light a candle with a scent you love", icon: Flame },
  { text: "Plan a future fun activity", icon: Calendar },
  { text: "Look at old photos that make you happy", icon: Camera },
  { text: "Cuddle with a pet", icon: Dog },
  { text: "Take a short nap if you feel tired", icon: Moon },
  
  // Community & Environment
  { text: "Pick up one piece of litter you see outside", icon: Leaf },
  { text: "Sort your recycling for the week", icon: Recycle },
  { text: "Water a plant", icon: Sprout },
  { text: "Turn off lights in rooms you're not using", icon: Lightbulb },
  { text: "Use a reusable bag for shopping", icon: ShoppingCart },
  { text: "Share a post about a cause you care about", icon: Globe },
  { text: "Learn one fact about your local ecosystem", icon: Microscope },
  { text: "Compliment your neighborhood's appearance", icon: Home },
  { text: "Support a local farmer's market", icon: ShoppingCart },
  { text: "Fix something instead of throwing it away", icon: Settings },

  // Creative & Learning
  { text: "Doodle or sketch for 10 minutes", icon: Palette },
  { text: "Learn a new word in a different language", icon: Drama },
  { text: "Read a chapter of a book", icon: BookOpen },
  { text: "Watch a short documentary on a new topic", icon: Tv },
  { text: "Try a new recipe", icon: Cookie },
  { text: "Write a short poem or a single sentence of a story", icon: Edit },
  { text: "Try to solve a puzzle (crossword, sudoku, etc.)", icon: Puzzle },
  { text: "Organize your computer's desktop files", icon: Folder },
  { text: "Learn a keyboard shortcut for an app you use often", icon: Code },
  { text: "Start a free online course on a topic you're curious about", icon: GraduationCap },
  { text: "Create a new music playlist", icon: Music },
  { text: "Take an interesting photo of something mundane", icon: Camera },
  { text: "Rearrange a small part of your room", icon: Home },
  { text: "Try drawing with your non-dominant hand", icon: Brush },
  { text: "Sing along loudly to your favorite song", icon: Mic },

  // Simple Joys
  { text: "Enjoy a cup of tea or coffee without distractions", icon: Coffee },
  { text: "Look up at the clouds and find shapes", icon: Cloud },
  { text: "Smell a flower or a spice", icon: Flower },
  { text: "Listen to a new or un-listened-to music track", icon: Music },
  { text: "Feel the texture of a leaf or a piece of fabric", icon: Feather },
  { text: "Watch people go by from a window or a bench", icon: Monitor },
  { text: "Think of your favorite memory", icon: Brain },
  { text: "Give yourself a compliment in the mirror", icon: Smile },
  { text: "Plan your next weekend", icon: Calendar },
  { text: "Step outside and feel the sun on your face", icon: Sun },
  { text: "Re-watch a favorite scene from a movie", icon: Clapperboard },
  { text: "Savor a piece of fruit", icon: Apple },
  { text: "Wiggle your toes and fingers", icon: Footprints },
  { text: "Identify 5 different colors around you right now", icon: Palette },
  { text: "Think of a joke that makes you laugh", icon: Smile },
  
  // Connection
  { text: "Call a friend or family member just to say hi", icon: Phone },
  { text: "Plan a get-together with friends", icon: Users },
  { text: "Ask someone about their day and really listen", icon: MessageCircle },
  { text: "Send a meme or funny video to a friend", icon: Gift },
  { text: "Reconnect with an old friend online", icon: Inbox },
  { text: "Join a new online community for a hobby you enjoy", icon: Globe },
  { text: "Tell someone you're proud of them", icon: Award },
  { text: "Ask for help with a small task", icon: HandHelping },
  { text: "Listen to a podcast a friend recommended", icon: Headphones },
  { text: "Schedule a video call with someone far away", icon: Video },

  // Productivity & Organization
  { text: "Write down a to-do list for tomorrow", icon: NotebookPen },
  { text: "Tackle one small task you've been procrastinating", icon: Zap },
  { text: "Clean out your email inbox", icon: Inbox },
  { text: "Organize a single drawer or shelf", icon: SlidersHorizontal },
  { text: "Set a small, achievable goal for the week", icon: Target },
  { text: "Review your calendar for the upcoming week", icon: Calendar },
  { text: "Pay one bill or handle a small piece of admin", icon: File },
  { text: "Unsubscribe from mailing lists you don't read", icon: Trash2 },
  { text: "Charge your devices", icon: BatteryCharging },
  { text: "Plan your meals for the next couple of days", icon: NotebookPen },
];

interface WellnessStore {
  steps: number;
  setSteps: (steps: number) => void;
  sleepHours: number;
  setSleepHours: (hours: number) => void;
  currentMood: string;
  setCurrentMood: (mood: string) => void;
}

export const useWellnessStore = create<WellnessStore>((set) => ({
  steps: 0,
  setSteps: (steps) => set({ steps }),
  sleepHours: 0,
  setSleepHours: (hours) => set({ sleepHours: hours }),
  currentMood: 'Neutral',
  setCurrentMood: (mood) => set({ currentMood: mood }),
}));
