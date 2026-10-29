import React, { useState, useRef, useEffect } from 'react';
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
  Key,
  Settings,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  generateSpeechAudio,
  generateImageAI,
  generateVideoStoryboardAI,
  generateScriptBrainAI,
  getStoredApiKey,
  saveStoredApiKey,
  testGeminiApiKey,
} from '../services/aiService';

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
  const [copiedSceneId, setCopiedSceneId] = useState<number | null>(null);

  const downloadStoryboardTxt = () => {
    const content = videoScenes
      .map(
        (s) =>
`========================================
SCENE #${s.sceneNumber} (${s.timeRange})
========================================
- Visual Cue: ${s.visualPrompt}
- Camera Motion: ${s.cameraMovement}
- Voiceover (សំឡេងនិយាយ): ${s.voiceoverText}
- Sound Effect: ${s.soundEffect}
- AI Video Tool Prompt (សម្រាប់ Runway / Kling / Luma):
  ${s.visualPrompt}, ${s.cameraMovement}, ultra realistic, 8k resolution, cinematic lighting`
      )
      .join('\n\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storyboard-production-plan-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- 4. Prompt Brain State ---
  const [brainIdea, setBrainIdea] = useState('');
  const [brainOutputFormat, setBrainOutputFormat] = useState<'video_script' | 'image_prompt' | 'voiceover' | 'tiktok_hooks'>('video_script');
  const [brainLanguage, setBrainLanguage] = useState<'khmer' | 'english' | 'bilingual'>('bilingual');
  const [isGeneratingBrain, setIsGeneratingBrain] = useState(false);
  const [brainResult, setBrainResult] = useState<string | null>(null);
  const [copiedBrain, setCopiedBrain] = useState(false);

  // --- API Key Modal State ---
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => getStoredApiKey());
  const [hasApiKey, setHasApiKey] = useState(() => Boolean(getStoredApiKey()));
  const [keySavedToast, setKeySavedToast] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; model?: string } | null>(null);

  const handleSaveApiKey = () => {
    saveStoredApiKey(apiKeyInput);
    setHasApiKey(Boolean(apiKeyInput.trim()));
    setKeySavedToast(true);
    setTimeout(() => {
      setKeySavedToast(false);
      setIsKeyModalOpen(false);
    }, 1200);
  };

  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) {
      setTestResult({ ok: false, message: 'សូមបញ្ចូល API Key មុននឹងធ្វើតេស្ត!' });
      return;
    }
    setIsTestingKey(true);
    setTestResult(null);
    try {
      const res = await testGeminiApiKey(apiKeyInput);
      setTestResult(res);
      if (res.ok) {
        saveStoredApiKey(apiKeyInput);
        setHasApiKey(true);
      }
    } catch (err: any) {
      setTestResult({ ok: false, message: err.message || 'បញ្ហាក្នុងការតេស្ត API Key' });
    } finally {
      setIsTestingKey(false);
    }
  };

  // --- Handlers: Generate Image ---
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    setImageError(null);

    try {
      const result = await generateImageAI(imagePrompt, aspectRatio, imageStyle);
      const newImage: GeneratedImage = {
        id: 'img-' + Date.now(),
        url: result.imageUrl,
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
      const result = await generateSpeechAudio(ttsText, voiceName, speechStyle);
      const newAudio: GeneratedAudio = {
        id: 'audio-' + Date.now(),
        url: result.audioUrl,
        text: ttsText,
        voiceName: result.voiceName,
        style: speechStyle,
        createdAt: new Date().toLocaleTimeString(),
      };

      setAudioList((prev) => [newAudio, ...prev]);
      playAudio(newAudio.id, newAudio.url);
    } catch (err: any) {
      console.error(err);
      setTtsError(err.message || 'បញ្ហាក្នុងការបង្កើតសំឡេង។');
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
      audioPlayerRef.current.play().catch((err) => {
        console.warn('Audio play failed, falling back to Web Speech:', err);
        handleLiveVoicePreview();
      });
      setCurrentPlayingId(id);
    }
  };

  // --- Handlers: Generate Video Storyboard ---
  const handleGenerateVideoStoryboard = async () => {
    if (!videoPrompt.trim()) return;
    setIsGeneratingVideo(true);
    setVideoError(null);

    try {
      const scenes = await generateVideoStoryboardAI(videoPrompt, videoDuration, cameraMotion);
      if (scenes && Array.isArray(scenes)) {
        setVideoScenes(scenes);
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
      const content = await generateScriptBrainAI(brainIdea, brainOutputFormat, brainLanguage);
      setBrainResult(content);
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

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsKeyModalOpen(true)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer shadow-sm ${
                hasApiKey
                  ? 'bg-emerald-950/70 hover:bg-emerald-900/90 border-emerald-500/60 text-emerald-300 ring-1 ring-emerald-500/30'
                  : 'bg-zinc-900/90 hover:bg-zinc-800 border-amber-500/40 hover:border-amber-400 text-amber-300'
              }`}
            >
              <Key className={`w-3.5 h-3.5 ${hasApiKey ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span>{hasApiKey ? 'Gemini Pro: Active ✅' : 'កំណត់ API Key'}</span>
              <Settings className="w-3 h-3 text-zinc-400" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-950/80 border border-emerald-500/30">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-medium text-emerald-400">
                {hasApiKey ? 'Gemini Pro/Paid Connected' : 'Multi-Tier AI Ready'}
              </span>
            </div>
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
          <div className="space-y-4">
            {/* Production Workflow Guide Banner */}
            <div className="bg-gradient-to-r from-amber-950/40 via-zinc-900 to-zinc-900 border border-amber-500/30 rounded-xl p-4 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>💡 បង្កើត Storyboard បានហើយ តើយកទៅណា ឬប្រើប្រាស់ដូចម្តេច?</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  3-Step Production
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Storyboard នេះជា <b className="text-amber-400">ប្លង់មេផលិតកម្ម (Production Blueprint)</b> សម្រាប់យកទៅផលិតជាវីដេអូពិតប្រាកដ (TikTok, Reels, Shorts, Commercial) តាម ៣ ជំហានងាយៗ៖
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>១. យកសំឡេង AI (TTS)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    ចុចប៊ូតុង "🎙️ យកសំឡេង" លើ Scene នីមួយៗដើម្បីឱ្យ AI អាន រួច Download File .wav ទុក។
                  </p>
                </div>
                <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>២. យករូបភាព ឬ Motion</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    ចុច "🖼️ យករូបភាព" ឬ Copy Prompt យកទៅដាក់ក្នុង Runway, Kling AI, Luma Dream Machine។
                  </p>
                </div>
                <div className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-2.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                    <Film className="w-3.5 h-3.5" />
                    <span>៣. កាត់តលើ CapCut</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-normal">
                    បើក CapCut ដាក់សំឡេង + រូបភាព/វីដេអូតាម Timeline នីមួយៗ រួច Export បង្ហោះលើ TikTok/Reels!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-400" />
                <span>Cinematic Timeline Storyboard ({videoScenes.length} Scenes)</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={downloadStoryboardTxt}
                  className="text-xs bg-zinc-850 hover:bg-zinc-800 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-semibold cursor-pointer transition shadow-sm"
                  title="ទាញយក Storyboard ទាំងអស់ជាឯកសារ .txt"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ទាញយក Storyboard (.txt)</span>
                </button>
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
                  className="text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-750 px-3 py-1.5 rounded-lg border border-zinc-700 flex items-center gap-1 font-semibold cursor-pointer transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>ចម្លងទាំងអស់</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {videoScenes.map((scene) => (
                <div
                  key={scene.sceneNumber}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 hover:border-amber-500/50 transition relative overflow-hidden group shadow-lg flex flex-col justify-between"
                >
                  <div className="space-y-3">
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

                  {/* 1-Click Production Action Buttons */}
                  <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-1.5 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTtsText(scene.voiceoverText);
                        setActiveTab('tts');
                      }}
                      className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                      title="បញ្ជូន Voiceover ទៅបម្លែងជាសំឡេងនិយាយ"
                    >
                      <Volume2 className="w-3 h-3 text-emerald-400" />
                      <span>🎙️ យកសំឡេង</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setImagePrompt(`${scene.visualPrompt}, ${scene.cameraMovement}`);
                        setActiveTab('image');
                      }}
                      className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer"
                      title="បញ្ជូន Visual Prompt ទៅបង្កើតរូបភាព AI"
                    >
                      <ImageIcon className="w-3 h-3 text-amber-400" />
                      <span>🖼️ យករូបភាព</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        copyToClipboard(
                          `${scene.visualPrompt}, camera motion: ${scene.cameraMovement}, ultra realistic, 8k resolution, cinematic lighting`
                        );
                        setCopiedSceneId(scene.sceneNumber);
                        setTimeout(() => setCopiedSceneId(null), 2000);
                      }}
                      className="px-2 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 border border-zinc-700 rounded-lg text-[11px] transition flex items-center gap-1 cursor-pointer ml-auto"
                      title="ចម្លង Prompt សម្រាប់ Runway / Kling / CapCut"
                    >
                      {copiedSceneId === scene.sceneNumber ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400 text-[10px]">បាន Copy</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-zinc-400" />
                          <span className="text-[10px]">Prompt AI Video</span>
                        </>
                      )}
                    </button>
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

      {/* ======================================================== */}
      {/* GEMINI API KEY & VERCEL CONFIGURATION MODAL */}
      {/* ======================================================== */}
      {isKeyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-zinc-900 border border-amber-500/40 rounded-2xl p-6 shadow-2xl text-left space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">កំណត់ Gemini API Key</h3>
                  <p className="text-xs text-zinc-400">សម្រាប់ដំណើរការលើ Vercel ឬ Local Host</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsKeyModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                  Gemini API Key (ផ្ទាល់ខ្លួន ឬ Pro Tier)៖
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => {
                        setApiKeyInput(e.target.value);
                        setTestResult(null);
                      }}
                      placeholder="AIzaSy..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                    {apiKeyInput && (
                      <button
                        type="button"
                        onClick={() => {
                          setApiKeyInput('');
                          setTestResult(null);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        លុប
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleTestKey}
                    disabled={isTestingKey || !apiKeyInput.trim()}
                    className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {isTestingKey ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>កំពុងតេស្ត...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>តេស្ត Key</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1">
                  Key នឹងត្រូវរក្សាទុកក្នុង Browser របស់អ្នក (LocalStorage) ដោយសុវត្ថិភាព។
                </p>
              </div>

              {/* Test Result Card */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                    testResult.ok
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-red-950/40 border-red-500/50 text-red-300'
                  }`}
                >
                  {testResult.ok ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold text-xs">
                      {testResult.ok ? '✅ ដំណើរការជោគជ័យ ១០០%!' : '❌ ការតភ្ជាប់បរាជ័យ'}
                    </p>
                    <p className="text-[11px] opacity-90 mt-0.5">{testResult.message}</p>
                    {testResult.ok && (
                      <p className="text-[10px] text-emerald-400 font-mono mt-1">
                        Model: gemini-2.5-flash | Connected & Verified
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Pro Tier (Tier 3) Explainer */}
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  <span>គណនី Pro (Tier 3) របស់បង ទទួលបានអត្ថប្រយោជន៍អ្វីខ្លះ?</span>
                </div>
                <ul className="text-[11px] text-zinc-300 space-y-1 list-disc list-inside leading-relaxed">
                  <li><b className="text-emerald-400">Rate Limit ខ្ពស់បំផុត៖</b> អាច Request បានរហូតដល់ 1,000+ RPM (មិនជាប់ Limit 15 RPM ដូចគណនី Free ឡើយ)។</li>
                  <li><b className="text-emerald-400">Enterprise Privacy៖</b> Google មិនយក Prompt ឬទិន្នន័យរបស់អ្នកទៅ Train AI ឡើយ។</li>
                  <li><b className="text-emerald-400">ល្បឿនលឿនបំផុត៖</b> ដំណើរការលើ Google Global High-Speed Infrastructure។</li>
                </ul>
              </div>

              {/* Instructions on getting Gemini Key */}
              <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400">
                    💡 របៀបយក API Key ពី Google AI Studio៖
                  </span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:underline"
                  >
                    <span>បើក Google AI Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <ol className="text-xs text-zinc-400 space-y-1 list-decimal list-inside leading-relaxed">
                  <li>ចូលទៅកាន់ <b className="text-zinc-300">Google AI Studio</b> (aistudio.google.com)</li>
                  <li>ចុចលើ <b className="text-zinc-300">&quot;API Keys&quot;</b> ឬចូលគម្រោងដែលបងចង់ប្រើ</li>
                  <li>Copy Key នោះមក Paste ក្នុងប្រអប់ខាងលើ រួចចុច <b className="text-amber-400">&quot;តេស្ត Key&quot;</b> និង <b className="text-amber-400">&quot;រក្សាទុក&quot;</b></li>
                </ol>
              </div>

              {/* Vercel instructions */}
              <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>វិធីដាក់ចូល Vercel Dashboard (អចិន្ត្រៃយ៍)៖</span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  នៅលើ Vercel Dashboard គម្រោងរបស់អ្នក ចូលទៅកាន់ <b className="text-zinc-300">Settings</b> &gt; <b className="text-zinc-300">Environment Variables</b> ហើយបន្ថែមឈ្មោះ <code className="text-amber-300 bg-zinc-900 px-1 py-0.5 rounded">GEMINI_API_KEY</code> និង <code className="text-amber-300 bg-zinc-900 px-1 py-0.5 rounded">VITE_GEMINI_API_KEY</code> ដាក់តម្លៃ API Key របស់អ្នក រួច Redeploy!
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <div className="text-xs">
                {keySavedToast ? (
                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    បានរក្សាទុកដោយជោគជ័យ!
                  </span>
                ) : (
                  <span className="text-zinc-500">
                    {hasApiKey ? '✅ Key ត្រូវបានភ្ជាប់រួចរាល់' : '⚡ អាចដំណើរការ fallback mode ដោយស្វ័យប្រវត្តិ'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsKeyModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  បិទ
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs transition shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  រក្សាទុក (Save Key)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
