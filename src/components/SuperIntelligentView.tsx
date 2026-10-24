import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Volume2,
  Video,
  Wand2,
  Download,
  Play,
  Pause,
  RotateCcw,
  Copy,
  Check,
  Loader2,
  Film,
  Mic,
  Maximize2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Send,
  Zap,
  Sliders,
  RefreshCw,
} from 'lucide-react';

type AISubTab = 'image' | 'tts' | 'video' | 'prompt_brain';

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  aspectRatio: string;
  style: string;
  createdAt: string;
}

interface GeneratedAudio {
  id: string;
  url: string;
  text: string;
  voiceName: string;
  style: string;
  createdAt: string;
  duration?: string;
}

interface VideoScene {
  sceneNumber: number;
  timeRange: string;
  visualPrompt: string;
  cameraMovement: string;
  voiceoverText: string;
  soundEffect: string;
}

export const SuperIntelligentView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AISubTab>('image');

  // --- 1. Image Generation State ---
  const [imagePrompt, setImagePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3' | '3:4'>('1:1');
  const [imageStyle, setImageStyle] = useState('Photorealistic 8K');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([
    {
      id: 'demo-img-1',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop',
      prompt: 'Futuristic glowing cybernetic neural network brain with gold and amber neon pulses, 8k resolution, cinematic lighting',
      aspectRatio: '1:1',
      style: 'Cyberpunk Neon',
      createdAt: 'ទើបបង្កើត',
    },
    {
      id: 'demo-img-2',
      url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop',
      prompt: 'Majestic ancient temple ruins at sunrise with soft golden rays penetrating misty jungle canopy, hyperrealistic digital art',
      aspectRatio: '16:9',
      style: 'Photorealistic 8K',
      createdAt: 'មុននេះបន្តិច',
    },
  ]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(generatedImages[0]);

  // --- 2. Text to Sound / TTS State ---
  const [ttsText, setTtsText] = useState('សួស្តីបងប្អូនទាំងអស់គ្នា! នេះគឺជាប្រព័ន្ធ Super-Intelligent AI បង្កើតសំឡេង និងរូបភាពដោយស្វ័យប្រវត្តិតាមរយៈ Gemini API។');
  const [voiceName, setVoiceName] = useState<'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'>('Kore');
  const [speechStyle, setSpeechStyle] = useState('Clear, professional news anchor');
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [audioList, setAudioList] = useState<GeneratedAudio[]>([]);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // --- 3. Video / Storyboard State ---
  const [videoPrompt, setVideoPrompt] = useState('An epic cinematic drone flight through a neon futuristic city at twilight, ultra-smooth motion');
  const [videoDuration, setVideoDuration] = useState<'5s' | '10s' | '15s'>('10s');
  const [cameraMotion, setCameraMotion] = useState('Drone Flyover & Tilt-Up');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [videoScenes, setVideoScenes] = useState<VideoScene[]>([
    {
      sceneNumber: 1,
      timeRange: '0:00 - 0:03',
      visualPrompt: 'Wide establishing drone shot descending over neon-lit glass skyscrapers at dusk, reflections on wet asphalt',
      cameraMovement: 'Fast forward crane descent with smooth pitch down',
      voiceoverText: 'នៅក្នុងយុគសម័យបច្ចេកវិទ្យា AI ជំនាន់ថ្មី...',
      soundEffect: 'Deep synth bass swell with distant city ambiance',
    },
    {
      sceneNumber: 2,
      timeRange: '0:03 - 0:07',
      visualPrompt: 'Close-up tracking shot of a glowing holographic interface hovering in a high-tech studio',
      cameraMovement: 'Slow 360-degree orbital pan with shallow depth of field',
      voiceoverText: 'គ្រប់គំនិតច្នៃប្រឌិតរបស់អ្នក អាចប្រែក្លាយជាការពិតក្នុងរយៈពេលតែប៉ុន្មានវិនាទី។',
      soundEffect: 'High-tech digital frequency chirps and shimmer',
    },
    {
      sceneNumber: 3,
      timeRange: '0:07 - 0:10',
      visualPrompt: 'High-energy cinematic reveal of Super-Intelligent Suite logo glowing with radiant amber sparkles',
      cameraMovement: 'Dynamic pull-back hero zoom out',
      voiceoverText: 'Super-Intelligent AI — ដំណោះស្រាយសម្រាប់អ្នកបង្កើតមាតិកាជំនាន់ថ្មី!',
      soundEffect: 'Impact boom with cinematic rising orchestral chord',
    },
  ]);

  // --- 4. Prompt Brain State ---
  const [brainIdea, setBrainIdea] = useState('');
  const [brainOutputFormat, setBrainOutputFormat] = useState<'video_script' | 'image_prompt' | 'voiceover' | 'tiktok_hooks'>('video_script');
  const [brainLanguage, setBrainLanguage] = useState<'khmer' | 'english' | 'bilingual'>('bilingual');
  const [isGeneratingBrain, setIsGeneratingBrain] = useState(false);
  const [brainResult, setBrainResult] = useState<string | null>(null);
  const [copiedBrain, setCopiedBrain] = useState(false);

  // --- Handlers: Generate Image ---
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    setImageError(null);

    try {
      const res = await fetch('/api/ai/image-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio,
          style: imageStyle,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to generate image');
      }

      const newImage: GeneratedImage = {
        id: 'img-' + Date.now(),
        url: data.imageUrl,
        prompt: imagePrompt,
        aspectRatio,
        style: imageStyle,
        createdAt: 'ទើបបង្កើតថ្មីៗ',
      };

      setGeneratedImages((prev) => [newImage, ...prev]);
      setSelectedImage(newImage);
    } catch (err: any) {
      console.error(err);
      setImageError(err.message || 'បញ្ហាក្នុងការបង្កើតរូបភាព។ សូមសាកល្បងម្ដងទៀត។');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // --- Handlers: Generate Sound / TTS ---
  const handleGenerateTts = async () => {
    if (!ttsText.trim()) return;
    setIsGeneratingTts(true);
    setTtsError(null);

    try {
      const res = await fetch('/api/ai/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: ttsText,
          voiceName,
          style: speechStyle,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to generate audio');
      }

      const newAudio: GeneratedAudio = {
        id: 'audio-' + Date.now(),
        url: data.audioUrl,
        text: ttsText,
        voiceName,
        style: speechStyle,
        createdAt: new Date().toLocaleTimeString(),
      };

      setAudioList((prev) => [newAudio, ...prev]);
      playAudio(newAudio.id, newAudio.url);
    } catch (err: any) {
      console.error(err);
      setTtsError(err.message || 'បញ្ហាក្នុងការបង្កើតសំឡេង។ សូមសាកល្បងម្ដងទៀត។');
    } finally {
      setIsGeneratingTts(false);
    }
  };

  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  const handleLiveVoicePreview = () => {
    if (!('speechSynthesis' in window)) {
      alert('Browser does not support SpeechSynthesis');
      return;
    }
    window.speechSynthesis.cancel();
    if (isPlayingPreview) {
      setIsPlayingPreview(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(ttsText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsPlayingPreview(false);
    utterance.onerror = () => setIsPlayingPreview(false);
    setIsPlayingPreview(true);
    window.speechSynthesis.speak(utterance);
  };

  const playAudio = (id: string, url: string) => {
    if (audioPlayerRef.current) {
      if (currentPlayingId === id) {
        audioPlayerRef.current.pause();
        setCurrentPlayingId(null);
        return;
      }
      audioPlayerRef.current.src = url;
      audioPlayerRef.current.play();
      setCurrentPlayingId(id);
    }
  };

  // --- Handlers: Generate Video Storyboard ---
  const handleGenerateVideoStoryboard = async () => {
    if (!videoPrompt.trim()) return;
    setIsGeneratingVideo(true);
    setVideoError(null);

    try {
      const res = await fetch('/api/ai/video-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          duration: videoDuration,
          cameraMovement: cameraMotion,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || 'Failed to generate video storyboard');
      }

      if (data.scenes && Array.isArray(data.scenes)) {
        setVideoScenes(data.scenes);
      }
    } catch (err: any) {
      console.error(err);
      setVideoError(err.message || 'បញ្ហាក្នុងការបង្កើត Video Storyboard។');
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // --- Handlers: Prompt Brain ---
  const handleGenerateBrain = async () => {
    if (!brainIdea.trim()) return;
    setIsGeneratingBrain(true);

    try {
      const res = await fetch('/api/ai/text-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: brainIdea,
          format: brainOutputFormat,
          language: brainLanguage,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate content');
      }

      setBrainResult(data.content);
    } catch (err: any) {
      setBrainResult('កំហុសក្នុងការបង្កើត៖ ' + err.message);
    } finally {
      setIsGeneratingBrain(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBrain(true);
    setTimeout(() => setCopiedBrain(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hidden audio element for TTS playback */}
      <audio
        ref={audioPlayerRef}
        onEnded={() => setCurrentPlayingId(null)}
        onError={() => setCurrentPlayingId(null)}
      />

      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900 to-amber-900/20 border border-amber-500/30 p-6 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Super-Intelligent AI Studio</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              បង្កើតរូបភាព, សំឡេង (TTS) & វីដេអូ ដោយប្រើ Gemini AI
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
              ឧបករណ៍ AI ផ្ទាល់ខ្លួនពេញលេញសម្រាប់បង្កើតមាតិកា៖ បង្កើតរូបភាព (Text-to-Image), បម្លែងអត្ថបទទៅជាសំឡេងនិយាយ (Text-to-Speech), និងផលិត Video Storyboard សម្រាប់ TikTok/YouTube។
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-medium text-emerald-400">Gemini 3.8 Engine Active</span>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-2 mt-6 border-t border-zinc-800/80 pt-4 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'image'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>បង្កើតរូបភាព (AI Image)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tts')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'tts'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>បម្លែងជាសំឡេង (Text to Sound)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'video'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>បង្កើតវីដេអូ (AI Video Studio)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prompt_brain')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
              activeTab === 'prompt_brain'
                ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            <Wand2 className="w-4 h-4" />
            <span>អ្នកសរសេរស្គ្រីប & Prompts (AI Brain)</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. IMAGE STUDIO TAB */}
      {/* ======================================================== */}
      {activeTab === 'image' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Config & Prompt */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">បញ្ចូល Prompt បង្កើតរូបភាព</h3>
                </div>
                <span className="text-[11px] text-zinc-500">Gemini Image Model</span>
              </div>

              <div>
                <textarea
                  rows={4}
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="ឧទាហរណ៍៖ Futuristic Angkor Wat temple illuminated by golden neon cyber light at midnight, 8k resolution, cinematic lighting, ultra-detailed..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none transition"
                />
              </div>

              {/* Sample Prompts */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-2 block">
                  គំរូ Prompts រហ័ស (Quick Templates)៖
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Cyberpunk Angkor Wat 2077',
                    'Modern SaaS landing page 3D render',
                    'Futuristic AI robot assistant in glass lab',
                    'Cute 3D Pixar style baby dragon',
                    'Cinematic tropical island resort drone shot',
                  ].map((tpl) => (
                    <button
                      key={tpl}
                      type="button"
                      onClick={() => setImagePrompt(tpl)}
                      className="px-2.5 py-1 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 rounded-lg text-[11px] text-zinc-300 transition cursor-pointer"
                    >
                      {tpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Aspect Ratio */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-2 block">
                  ទំហំខ្នាតរូបភាព (Aspect Ratio)៖
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['1:1', '16:9', '9:16', '4:3', '3:4'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-2 px-1 text-xs font-semibold rounded-lg border transition text-center cursor-pointer ${
                        aspectRatio === ratio
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Presets */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-2 block">
                  ស្ទីលរូបភាព (Visual Style)៖
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Photorealistic 8K',
                    'Cyberpunk Neon',
                    '3D Pixar / Disney',
                    'Anime / Manga',
                    'Minimalist Vector Art',
                    'Cinematic Film Still',
                  ].map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setImageStyle(style)}
                      className={`px-3 py-2 text-xs rounded-lg border text-left transition cursor-pointer ${
                        imageStyle === style
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {imageError && (
                <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <p>{imageError}</p>
                </div>
              )}

              <button
                type="button"
                disabled={isGeneratingImage || !imagePrompt.trim()}
                onClick={handleGenerateImage}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>កំពុងបង្កើតរូបភាពដោយ Gemini AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-zinc-950" />
                    <span>បង្កើតរូបភាពឥឡូវនេះ (Generate Image)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Image Preview & Gallery */}
          <div className="lg:col-span-7 space-y-5">
            {selectedImage ? (
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded text-[11px] font-bold text-amber-300">
                      {selectedImage.aspectRatio}
                    </span>
                    <span className="text-xs text-zinc-400">{selectedImage.style}</span>
                  </div>

                  <a
                    href={selectedImage.url}
                    download={`super-ai-image-${Date.now()}.png`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-lg transition shadow cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>ទាញយករូបភាព (Download)</span>
                  </a>
                </div>

                {/* Main Image Frame */}
                <div className="relative rounded-xl overflow-hidden bg-black/60 border border-zinc-800 flex items-center justify-center min-h-[360px] max-h-[500px]">
                  <img
                    src={selectedImage.url}
                    alt={selectedImage.prompt}
                    className="max-h-[480px] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                  />
                </div>

                <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800">
                  <p className="text-xs text-zinc-300 font-medium leading-relaxed">
                    <span className="text-amber-400 font-bold">Prompt: </span>
                    {selectedImage.prompt}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                <ImageIcon className="w-12 h-12 text-zinc-600 mb-3" />
                <h4 className="text-sm font-bold text-zinc-300">មិនទាន់មានរូបភាពនៅឡើយទេ</h4>
                <p className="text-xs text-zinc-500 mt-1">សូមបញ្ចូល Prompt នៅខាងឆ្វេងដើម្បីបង្កើតរូបភាព</p>
              </div>
            )}

            {/* Gallery Thumbnails */}
            {generatedImages.length > 0 && (
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 shadow-lg space-y-3">
                <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                  <span>វិចិត្រសាលរូបភាព (Generated Gallery)</span>
                  <span className="text-zinc-500 font-normal">({generatedImages.length})</span>
                </h4>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {generatedImages.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      className={`relative aspect-square rounded-lg overflow-hidden border-2 transition cursor-pointer group ${
                        selectedImage?.id === img.id
                          ? 'border-amber-500 ring-2 ring-amber-500/30'
                          : 'border-zinc-800 hover:border-zinc-600 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. TEXT TO SOUND / TTS TAB */}
      {/* ======================================================== */}
      {activeTab === 'tts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-5">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">បញ្ចូលអត្ថបទដើម្បីបង្កើតសំឡេង (TTS)</h3>
                </div>
                <span className="text-[11px] text-zinc-500">Gemini 3.8 Flash-Lite TTS</span>
              </div>

              <div>
                <textarea
                  rows={5}
                  value={ttsText}
                  onChange={(e) => setTtsText(e.target.value)}
                  placeholder="វាយបញ្ចូលអត្ថបទជាភាសាខ្មែរ ឬអង់គ្លេសនៅទីនេះ..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none transition"
                />
              </div>

              {/* Voice Personas */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-2 block">
                  ជ្រើសរើសសំឡេង (Voice Persona)៖
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(
                    [
                      { name: 'Kore', label: 'Kore (Warm)' },
                      { name: 'Puck', label: 'Puck (Playful)' },
                      { name: 'Charon', label: 'Charon (Deep)' },
                      { name: 'Fenrir', label: 'Fenrir (Heroic)' },
                      { name: 'Zephyr', label: 'Zephyr (Smooth)' },
                    ] as const
                  ).map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => setVoiceName(v.name as any)}
                      className={`p-2 rounded-lg border text-xs font-semibold transition text-center cursor-pointer ${
                        voiceName === v.name
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Presets */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-2 block">
                  ទម្រង់សំឡេងនិយាយ (Speech Style & Emotion)៖
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'Clear, professional news anchor',
                    'Warm and engaging storyteller',
                    'Energetic commercial voiceover',
                    'Chill podcast host conversation',
                    'Calm, soothing meditation guide',
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeechStyle(s)}
                      className={`px-3 py-2 text-xs rounded-lg border text-left transition cursor-pointer truncate ${
                        speechStyle === s
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {ttsError && (
                <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <p>{ttsError}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  disabled={isGeneratingTts || !ttsText.trim()}
                  onClick={handleGenerateTts}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-xs sm:text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingTts ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                      <span>កំពុងបង្កើតសំឡេង...</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 text-zinc-950" />
                      <span>បង្កើតសំឡេង WAV</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={!ttsText.trim()}
                  onClick={handleLiveVoicePreview}
                  className={`w-full py-3 border rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                    isPlayingPreview
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-200'
                  }`}
                >
                  {isPlayingPreview ? (
                    <>
                      <Pause className="w-4 h-4 text-emerald-400" />
                      <span>កំពុងបន្លឺសំឡេងផ្ទាល់...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 text-amber-400" />
                      <span>ស្តាប់ផ្ទាល់ (Live Voice Preview)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Generated Audio List */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Mic className="w-4 h-4 text-amber-400" />
                  <span>បញ្ជីសំឡេងដែលបានបង្កើត (Generated Audios)</span>
                </h3>
                <span className="text-xs text-zinc-500">{audioList.length} Tracks</span>
              </div>

              {audioList.length === 0 ? (
                <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-10 text-center flex flex-col items-center justify-center">
                  <Volume2 className="w-10 h-10 text-zinc-600 mb-2" />
                  <p className="text-xs text-zinc-400 font-medium">មិនទាន់មានសំឡេងត្រូវបានបង្កើតនៅឡើយទេ</p>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    ចុចប៊ូតុង "បង្កើតសំឡេងនិយាយ" ខាងឆ្វេងដើម្បីបង្កើត
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {audioList.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3 hover:border-amber-500/40 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded text-[10px]">
                              Voice: {item.voiceName}
                            </span>
                            <span className="text-[11px] text-zinc-500">{item.createdAt}</span>
                          </div>
                          <p className="text-xs text-zinc-300 font-medium line-clamp-2">
                            "{item.text}"
                          </p>
                        </div>

                        <a
                          href={item.url}
                          download={`super-ai-voice-${item.id}.wav`}
                          className="p-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-lg transition shrink-0"
                          title="Download Audio (.wav)"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      {/* Interactive audio waveform bar & play button */}
                      <div className="flex items-center gap-3 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => playAudio(item.id, item.url)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 ${
                            currentPlayingId === item.id
                              ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/30'
                              : 'bg-zinc-800 text-zinc-200 hover:bg-amber-500 hover:text-zinc-950'
                          }`}
                        >
                          {currentPlayingId === item.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>

                        {/* Animated bars */}
                        <div className="flex-1 flex items-center gap-1 h-6">
                          {[35, 60, 45, 90, 75, 40, 85, 55, 70, 95, 65, 50, 80, 40, 60, 30, 70, 85, 45, 60].map(
                            (height, i) => (
                              <div
                                key={i}
                                className={`flex-1 rounded-full transition-all duration-300 ${
                                  currentPlayingId === item.id
                                    ? 'bg-amber-500 animate-pulse'
                                    : 'bg-zinc-700'
                                }`}
                                style={{ height: `${height}%` }}
                              />
                            )
                          )}
                        </div>

                        <span className="text-[10px] text-zinc-400 font-mono">WAV 24kHz</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. VIDEO & STORYBOARD STUDIO TAB */}
      {/* ======================================================== */}
      {activeTab === 'video' && (
        <div className="space-y-6">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">បង្កើត Storyboard & វីដេអូ AI (Video Studio)</h3>
              </div>
              <span className="text-[11px] text-zinc-500">Gemini Video Engine</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-7">
                <label className="text-[11px] text-zinc-400 font-semibold mb-1.5 block">
                  ពិពណ៌នាពីគំនិតវីដេអូ (Video Prompt)៖
                </label>
                <textarea
                  rows={3}
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  placeholder="ឧទាហរណ៍៖ Cinematic commercial for high-end luxury watch on water surface with gold particles..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none transition"
                />
              </div>

              <div className="md:col-span-5 space-y-3">
                <div>
                  <label className="text-[11px] text-zinc-400 font-semibold mb-1 block">
                    រយៈពេលវីដេអូ (Duration)៖
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['5s', '10s', '15s'] as const).map((dur) => (
                      <button
                        key={dur}
                        type="button"
                        onClick={() => setVideoDuration(dur)}
                        className={`py-1.5 text-xs font-semibold rounded-lg border text-center transition cursor-pointer ${
                          videoDuration === dur
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        {dur}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-zinc-400 font-semibold mb-1 block">
                    ចលនាកាមេរ៉ា (Camera Motion)៖
                  </label>
                  <select
                    value={cameraMotion}
                    onChange={(e) => setCameraMotion(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Drone Flyover & Tilt-Up">Drone Flyover & Tilt-Up</option>
                    <option value="Slow Cinematic 360 Orbit">Slow Cinematic 360 Orbit</option>
                    <option value="Fast Dynamic Tracking Shot">Fast Dynamic Tracking Shot</option>
                    <option value="Hyperlapse Forward Dolly">Hyperlapse Forward Dolly</option>
                    <option value="Extreme Close-up Macro Pan">Extreme Close-up Macro Pan</option>
                  </select>
                </div>
              </div>
            </div>

            {videoError && (
              <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-xl text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <p>{videoError}</p>
              </div>
            )}

            <button
              type="button"
              disabled={isGeneratingVideo || !videoPrompt.trim()}
              onClick={handleGenerateVideoStoryboard}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGeneratingVideo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                  <span>កំពុងបង្កើត Cinematic Video Storyboard...</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4 text-zinc-950" />
                  <span>បង្កើត Video Storyboard & AI Motion Scenes</span>
                </>
              )}
            </button>
          </div>

          {/* Storyboard Timeline Display */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-400" />
                <span>Cinematic Timeline Storyboard ({videoScenes.length} Scenes)</span>
              </span>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(
                    videoScenes
                      .map(
                        (s) =>
                          `Scene ${s.sceneNumber} (${s.timeRange}):\nVisual: ${s.visualPrompt}\nCamera: ${s.cameraMovement}\nVoiceover: ${s.voiceoverText}\nSFX: ${s.soundEffect}\n`
                      )
                      .join('\n---\n')
                  )
                }
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>ចម្លង Storyboard ទាំងអស់</span>
              </button>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {videoScenes.map((scene) => (
                <div
                  key={scene.sceneNumber}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-amber-500/50 transition relative overflow-hidden group shadow-lg"
                >
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-xs font-bold text-amber-400">
                      Scene #{scene.sceneNumber}
                    </span>
                    <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 text-[10px] font-mono rounded">
                      {scene.timeRange}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Visual Cue:
                      </span>
                      <p className="text-zinc-200 mt-0.5 leading-relaxed">{scene.visualPrompt}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider block">
                        Camera Motion:
                      </span>
                      <p className="text-zinc-300 mt-0.5 font-medium">{scene.cameraMovement}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                        Voiceover (សំឡេងនិយាយ):
                      </span>
                      <p className="text-emerald-300 mt-0.5 italic">"{scene.voiceoverText}"</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                        Sound FX:
                      </span>
                      <p className="text-indigo-300 mt-0.5 font-mono text-[11px]">{scene.soundEffect}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. PROMPT BRAIN & SCRIPT WRITER TAB */}
      {/* ======================================================== */}
      {activeTab === 'prompt_brain' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">AI Script & Prompt Generator</h3>
                </div>
                <span className="text-[11px] text-zinc-500">Gemini 3.8 Flash</span>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-1.5 block">
                  បញ្ចូលគំនិត ឬប្រធានបទដែលចង់បង្កើត៖
                </label>
                <textarea
                  rows={4}
                  value={brainIdea}
                  onChange={(e) => setBrainIdea(e.target.value)}
                  placeholder="ឧទាហរណ៍៖ របៀបរកចំណូលពីការលក់ទំនិញ Online ឬគំនិតធ្វើវីដេអូ TikTok ផ្សព្វផ្សាយ Coffee Shop ថ្មី..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none transition"
                />
              </div>

              {/* Format selection */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-1.5 block">
                  ទម្រង់លទ្ធផល (Output Format)៖
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'video_script', label: 'TikTok / Reel Script' },
                    { id: 'image_prompt', label: 'Midjourney/Gemini Prompt' },
                    { id: 'voiceover', label: 'Voiceover Text (TTS)' },
                    { id: 'tiktok_hooks', label: 'Viral Hook Titles' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setBrainOutputFormat(fmt.id as any)}
                      className={`px-3 py-2 text-xs rounded-lg border text-left transition cursor-pointer ${
                        brainOutputFormat === fmt.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Language selection */}
              <div>
                <label className="text-[11px] text-zinc-400 font-semibold mb-1.5 block">
                  ភាសា (Language)៖
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'khmer', label: 'ភាសាខ្មែរ' },
                    { id: 'english', label: 'English' },
                    { id: 'bilingual', label: 'Bilingual (ខ្មែរ+Eng)' },
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => setBrainLanguage(lang.id as any)}
                      className={`py-1.5 text-xs rounded-lg border text-center transition cursor-pointer ${
                        brainLanguage === lang.id
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                disabled={isGeneratingBrain || !brainIdea.trim()}
                onClick={handleGenerateBrain}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold rounded-xl text-sm transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingBrain ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Gemini កំពុងសរសេរ...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-zinc-950" />
                    <span>សរសេរខ្លឹមសារស្វ័យប្រវត្តិ (Generate Content)</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Result view */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4 min-h-[420px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>លទ្ធផលពី AI Brain</span>
                  </h3>

                  {brainResult && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(brainResult)}
                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedBrain ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">បានចម្លងរួចរាល់!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>ចម្លងអត្ថបទ</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {brainResult ? (
                  <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 whitespace-pre-wrap text-sm text-zinc-200 leading-relaxed font-sans max-h-[380px] overflow-y-auto">
                    {brainResult}
                  </div>
                ) : (
                  <div className="bg-zinc-950/40 rounded-xl border border-zinc-800/80 p-12 text-center flex flex-col items-center justify-center">
                    <Wand2 className="w-10 h-10 text-zinc-600 mb-2" />
                    <p className="text-xs text-zinc-400 font-medium">មិនទាន់មានលទ្ធផលនៅឡើយទេ</p>
                    <p className="text-[11px] text-zinc-600 mt-1">
                      បញ្ចូលគំនិតនៅខាងឆ្វេង រួចចុច "សរសេរខ្លឹមសារស្វ័យប្រវត្តិ"
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Actions with Result */}
              {brainResult && (
                <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTtsText(brainResult);
                      setActiveTab('tts');
                    }}
                    className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>បញ្ជូនទៅបម្លែងជាសំឡេង (Send to Sound)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
