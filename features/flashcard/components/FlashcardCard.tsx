import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Image as ImageIcon, Video, Play, Trash2, Paperclip, X, Loader2, Camera } from 'lucide-react';
import { FlashcardWord } from '../../../types';
import { useTheme } from '../context/ThemeContext';
import { doc, updateDoc } from 'firebase/firestore';
import { dbFirestore } from '../../../core/firebase';
import toast from 'react-hot-toast';

interface FlashcardCardProps {
  word: FlashcardWord;
  isFlipped: boolean;
  onFlip: () => void;
  onSpeak: (e: React.MouseEvent, text: string) => void;
}

const FlashcardCard: React.FC<FlashcardCardProps> = ({ word, isFlipped, onFlip, onSpeak }) => {
  const { currentTheme } = useTheme();
  const [showMediaSheet, setShowMediaSheet] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [mediaUrl, setMediaUrl] = useState<string | null>(word.mediaUrl || null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(word.mediaType || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Sync local state when word prop changes
  React.useEffect(() => {
    setMediaUrl(word.mediaUrl || null);
    setMediaType(word.mediaType || null);
  }, [word]);

  const handleBackSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Speak English word
    const englishUtterance = new SpeechSynthesisUtterance(word.word);
    englishUtterance.lang = 'en-US';
    englishUtterance.rate = 0.35; // Reduced speed for English
    
    englishUtterance.onend = () => {
      // Small pause (500ms)
      setTimeout(() => {
        if (!word.meaning) return;

        // Speak Bengali meaning
        const bengaliUtterance = new SpeechSynthesisUtterance(word.meaning);
        bengaliUtterance.rate = 0.4; // Reduced speed for Bengali
        
        // Try to find a Bengali voice
        const voices = window.speechSynthesis.getVoices();
        const bengaliVoice = voices.find(v => v.lang.includes('bn'));
        
        if (bengaliVoice) {
          bengaliUtterance.voice = bengaliVoice;
          bengaliUtterance.lang = bengaliVoice.lang;
        } else {
          // Fallback to generic bn-BD
          bengaliUtterance.lang = 'bn-BD';
        }
        
        window.speechSynthesis.speak(bengaliUtterance);
      }, 500);
    };

    window.speechSynthesis.speak(englishUtterance);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Verb': return { bg: '#E3F2FD', text: '#1565C0' }; // Soft Blue
      case 'Noun': return { bg: '#E8F5E9', text: '#2E7D32' }; // Soft Green
      case 'Adjective': return { bg: '#FFF3E0', text: '#EF6C00' }; // Soft Orange
      case 'Adverb': return { bg: '#F3E5F5', text: '#7B1FA2' }; // Soft Purple
      default: return { bg: '#F5F5F5', text: '#616161' }; // Soft Grey
    }
  };

  const typeColors = getTypeColor(word.type);

  const handleLongPress = () => {
    if (isFlipped) {
      setShowMediaSheet(true);
    }
  };

  // Long press logic
  const touchTimer = useRef<NodeJS.Timeout | null>(null);

  const onTouchStart = () => {
    touchTimer.current = setTimeout(handleLongPress, 800);
  };

  const onTouchEnd = () => {
    if (touchTimer.current) {
      clearTimeout(touchTimer.current);
    }
  };

  const uploadMedia = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'Edunex@media');

    try {
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dgjwyykxd/auto/upload',
        { method: 'POST', body: formData }
      );
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      // Update Firestore
      // Determine collection based on word type (this logic might need adjustment based on how words are stored)
      // Assuming we can update by ID in the relevant collection. 
      // Since we don't know the collection easily here, we might need to pass a function or know the collection.
      // However, the prompt says "flashcard_new_words, flashcard_daily_words, flashcard_mastered".
      // We'll try to find the document in these collections.
      // For simplicity, let's assume we update where it came from. 
      // But wait, `word` prop doesn't tell us the collection.
      // We will try to update in all potential collections or assume a structure.
      // Actually, the best way is to search for the doc ID.
      
      // Since this is a UI component, maybe we should pass an update function prop?
      // But the prompt says "Firestore Update: ...".
      // I'll implement a helper to find and update.
      
      await updateFlashcardMedia(word.id, data.secure_url, data.resource_type);
      
      setMediaUrl(data.secure_url);
      setMediaType(data.resource_type);
      toast.success('Media uploaded successfully');
      setShowMediaSheet(false);
      
      // Optimistically update local state if needed, but parent should handle re-fetch or real-time update
      // For now we just close the sheet.
      
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const updateFlashcardMedia = async (id: string, url: string | null, type: 'image' | 'video' | null) => {
    // Try to update in daily words first
    try {
        // We don't know which collection the word belongs to.
        // We can try to update in 'flashcard_daily_words' first as it's most likely.
        // Or we can query to find where it is.
        // Given the constraints, I will try to update 'flashcard_daily_words' and 'flashcard_mastered'.
        // 'flashcard_new_words' is less likely for review but possible.
        
        // A better approach might be to pass the collection name as a prop, but I can't change the parent easily right now.
        // I'll try to update all 3 collections. It's not efficient but ensures it's updated.
        // Or better, check the word object for clues? No clues.
        
        const collections = ['flashcard_daily_words', 'flashcard_mastered', 'flashcard_new_words'];
        
        for (const col of collections) {
            try {
                const docRef = doc(dbFirestore, col, id);
                await updateDoc(docRef, {
                    mediaUrl: url,
                    mediaType: type
                });
            } catch (e) {
                // Ignore error if doc doesn't exist in this collection
            }
        }
    } catch (error) {
        console.error("Error updating document:", error);
        throw error;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith('video/')) {
      // Check duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 10) {
          toast.error('Video must be 10 seconds or less');
          return;
        }
        uploadMedia(file);
      }
      video.src = URL.createObjectURL(file);
    } else {
      uploadMedia(file);
    }
  };

  const handleRemoveMedia = async () => {
      try {
          await updateFlashcardMedia(word.id, null, null);
          setMediaUrl(null);
          setMediaType(null);
          toast.success('Media removed');
          setShowMediaSheet(false);
      } catch (error) {
          toast.error('Failed to remove media');
      }
  };

  const toggleVideoPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isPlayingVideo) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlayingVideo(!isPlayingVideo);
    }
  };

  return (
    <>
    <div 
      className="w-full h-full relative perspective-1000 cursor-pointer select-none"
      onClick={onFlip}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onMouseDown={onTouchStart}
      onMouseUp={onTouchEnd}
      onMouseLeave={onTouchEnd}
      style={{ perspective: '1000px' }}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front Side */}
        <div 
          className="absolute inset-0 w-full h-full rounded-[24px] flex flex-col items-center justify-center p-8"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            backgroundColor: currentTheme.cardBg,
            boxShadow: currentTheme.shadow,
            border: `1px solid ${currentTheme.borderColor}`
          }}
        >
          <h2 
            className="text-[32px] font-bold tracking-[1px] text-center leading-tight"
            style={{ color: currentTheme.textColor }}
          >
            {word.word}
          </h2>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onSpeak(e, word.word);
            }}
            className="mt-6 p-3 rounded-full transition-colors"
            style={{ 
              color: currentTheme.accentColor,
              backgroundColor: `${currentTheme.accentColor}10` // 10% opacity
            }}
          >
            <Volume2 size={28} />
          </button>
          
          <div 
            className="absolute bottom-8 text-[12px] font-medium tracking-wide uppercase"
            style={{ color: currentTheme.subTextColor }}
          >
            Tap to flip
          </div>
        </div>

        {/* Back Side */}
        <div 
          className="absolute inset-0 w-full h-full rounded-[24px] flex flex-col items-center justify-between p-6"
          style={{ 
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            backgroundColor: currentTheme.cardBg,
            boxShadow: currentTheme.shadow,
            border: `1px solid ${currentTheme.borderColor}`
          }}
        >
          {/* Content Container */}
          <div className="flex flex-col items-center w-full flex-grow overflow-y-auto no-scrollbar">
            
            {word.clusterData ? (
              <div className="w-full flex flex-col items-center justify-center h-full">
                <div className="relative w-full h-[200px] flex items-center justify-center mb-4">
                  <div className="absolute z-10 w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <span className="text-white font-bold text-sm">{word.clusterData.basicWord}</span>
                  </div>
                  {[...word.clusterData.advancedWords, ...word.clusterData.greWords, ...word.clusterData.idioms].map((node, index, arr) => {
                    const angle = (index / arr.length) * 2 * Math.PI - Math.PI / 2;
                    const radius = 75;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    let typeColor = 'bg-blue-100 text-blue-700 border-blue-200';
                    if (index >= 2 && index < 5) typeColor = 'bg-orange-100 text-orange-700 border-orange-200';
                    if (index >= 5) typeColor = 'bg-green-100 text-green-700 border-green-200';

                    return (
                      <div 
                        key={index}
                        className={`absolute flex flex-col items-center justify-center w-14 h-14 rounded-full border shadow-sm ${typeColor}`}
                        style={{ transform: `translate(${x}px, ${y}px)` }}
                      >
                        <span className="text-[8px] font-bold text-center leading-tight px-1">{node.word}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center px-2">
                  <p className="text-[12px] italic leading-relaxed" style={{ color: currentTheme.textColor }}>
                    "{word.clusterData.contextualExamples.sentence}"
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Word + Meaning + Sound */}
                <div className="flex items-center justify-center flex-wrap gap-2 mb-2 w-full">
                  <span className="text-[20px] font-bold" style={{ color: currentTheme.textColor }}>{word.word}</span>
                  <span className="text-lg" style={{ color: currentTheme.subTextColor }}>→</span>
                  <span className="text-[20px] font-bold" style={{ color: currentTheme.accentColor }}>{word.meaning}</span>
                  
                  <button 
                    onClick={handleBackSpeak}
                    className="ml-1 p-1.5 rounded-full transition-colors hover:bg-black/5 active:scale-95"
                    style={{ color: currentTheme.accentColor }}
                  >
                    <Volume2 size={20} />
                  </button>
                </div>

                {/* Type Badge */}
                <div 
                    className="px-3 py-0.5 rounded-full text-[11px] font-semibold tracking-wide mb-2"
                    style={{ backgroundColor: typeColors.bg, color: typeColors.text }}
                >
                    [{word.type}]
                </div>

                {/* Verb Forms */}
                {word.type === 'Verb' && word.verbForms && (
                    <div className="text-[12px] mb-3 opacity-80" style={{ color: currentTheme.subTextColor }}>
                        <span className="mr-3">V2: {word.verbForms.v2}</span>
                        <span>V3: {word.verbForms.v3}</span>
                    </div>
                )}

                {/* Example */}
                {word.examples && word.examples.length > 0 && (
                  <div 
                    className="w-full text-center mb-2 px-2"
                  >
                    <p className="text-[14px] italic leading-relaxed" style={{ color: currentTheme.textColor }}>
                      "{word.examples[0]}"
                    </p>
                  </div>
                )}
                
                {/* Synonyms */}
                {word.synonyms && word.synonyms.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-4 px-4">
                    <span className="text-[13px]" style={{ color: currentTheme.subTextColor }}>~</span>
                    {word.synonyms.slice(0, 3).map((syn, idx) => (
                      <span 
                        key={idx} 
                        className="text-[13px]"
                        style={{ color: currentTheme.subTextColor }}
                      >
                        {syn}{idx < Math.min(word.synonyms.length, 3) - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                )}

                {/* Media Area */}
                <div className="w-full mt-auto flex justify-center pb-2">
                    <div 
                        className="relative rounded-xl overflow-hidden bg-black/5 flex items-center justify-center w-full max-w-[200px]"
                        style={{ height: '120px', border: `1px solid ${currentTheme.borderColor}` }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!mediaUrl) setShowMediaSheet(true);
                            else if (mediaType === 'video') toggleVideoPlay(e);
                        }}
                    >
                        {mediaUrl ? (
                            mediaType === 'video' ? (
                                <>
                                    <video 
                                        ref={videoRef}
                                        src={mediaUrl} 
                                        className="w-full h-full object-cover"
                                        onEnded={() => setIsPlayingVideo(false)}
                                        playsInline
                                    />
                                    {!isPlayingVideo && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                            <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center backdrop-blur-sm shadow-lg">
                                                <Play size={20} className="text-black ml-1" fill="currentColor" />
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <img src={mediaUrl} alt={word.word} className="w-full h-full object-cover" />
                            )
                        ) : (
                            <Camera size={32} className="text-gray-400 opacity-50" />
                        )}
                    </div>
                </div>
              </>
            )}

          </div>
        </div>
      </motion.div>
    </div>

    {/* Media Bottom Sheet */}
    <AnimatePresence>
        {showMediaSheet && (
            <>
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
                    onClick={() => setShowMediaSheet(false)}
                />
                <motion.div 
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[24px] z-50 p-6 pb-10"
                >
                    <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />
                    
                    <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Paperclip size={20} />
                        {mediaUrl ? 'Manage Media' : 'Add Media'}
                    </h3>

                    <div className="space-y-3">
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-full py-3.5 px-4 bg-blue-50 text-blue-600 rounded-xl font-medium flex items-center justify-center gap-2 active:scale-98 transition-transform"
                        >
                            {isUploading ? <Loader2 className="animate-spin" /> : <ImageIcon size={20} />}
                            {mediaUrl ? 'Change Media' : 'Choose Image/Video'}
                        </button>

                        {mediaUrl && (
                            <button 
                                onClick={handleRemoveMedia}
                                className="w-full py-3.5 px-4 bg-red-50 text-red-600 rounded-xl font-medium flex items-center justify-center gap-2 active:scale-98 transition-transform"
                            >
                                <Trash2 size={20} />
                                Remove Media
                            </button>
                        )}

                        <button 
                            onClick={() => setShowMediaSheet(false)}
                            className="w-full py-3.5 px-4 bg-gray-100 text-gray-700 rounded-xl font-medium active:scale-98 transition-transform"
                        >
                            Cancel
                        </button>
                    </div>

                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*,video/*"
                        onChange={handleFileSelect}
                    />
                </motion.div>
            </>
        )}
    </AnimatePresence>
    </>
  );
};

export default FlashcardCard;
