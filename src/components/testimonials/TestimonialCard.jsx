import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Star, X, Play } from 'lucide-react';

const TRUNCATE_LENGTH = 300;

export default function TestimonialCard({ testimonial }) {
  const [expanded, setExpanded] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isModalPlaying, setIsModalPlaying] = useState(false);
  const videoRef = useRef(null);
  const modalVideoRef = useRef(null);

  const isLong = testimonial.text && testimonial.text.length > TRUNCATE_LENGTH;

  const handleReadMore = () => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setShowModal(true);
    } else {
      setExpanded(true);
    }
  };

  const displayText = isLong && !expanded
    ? testimonial.text.slice(0, TRUNCATE_LENGTH) + '...'
    : testimonial.text;

  const handlePlay = (ref, setPlaying) => {
    if (ref.current) {
      ref.current.play();
      setPlaying(true);
    }
  };

  const renderVideo = (ref, playing, setPlaying) => (
    <div className="relative group cursor-pointer mb-4" onClick={() => !playing && handlePlay(ref, setPlaying)}>
      <video
        ref={ref}
        className="w-full h-48 object-cover rounded-lg"
        controls={playing}
        preload="metadata"
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      >
        <source src={testimonial.video_url} />
      </video>
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/45 transition-all rounded-lg">
          <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition-transform">
            <Play className="w-8 h-8 text-blue-600 fill-blue-600 ml-1" />
          </div>
        </div>
      )}
    </div>
  );

  const renderMedia = (ref, playing, setPlaying) => (
    <>
      {testimonial.image_url && (
        <img src={testimonial.image_url} alt="תמונה" className="w-full h-48 object-cover rounded-lg mb-4" loading="lazy" />
      )}
      {testimonial.video_url && renderVideo(ref, playing, setPlaying)}
    </>
  );

  return (
    <>
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center gap-1 mb-4">
            {[...Array(testimonial.rating)].map((_, i) => (
              <Star key={i} className="w-4 md:w-5 h-4 md:h-5 fill-yellow-400 text-yellow-400" />
            ))}
          </div>

          {(testimonial.image_url || testimonial.video_url) && (
            <div className="mb-4">
              {renderMedia(videoRef, isPlaying, setIsPlaying)}
            </div>
          )}

          <p className="text-slate-700 mb-2 leading-relaxed italic text-sm md:text-base">
            &ldquo;{displayText}&rdquo;
          </p>

          {isLong && !expanded && (
            <button
              onClick={handleReadMore}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-4 transition-colors"
            >
              קרא עוד ›
            </button>
          )}

          {isLong && expanded && (
            <button
              onClick={() => setExpanded(false)}
              className="text-slate-500 hover:text-slate-700 text-sm font-medium mb-4 transition-colors"
            >
              הצג פחות ‹
            </button>
          )}

          <div className="border-t pt-4 mt-2">
            <div className="font-semibold text-slate-800">{testimonial.name}</div>
            {testimonial.location && (
              <div className="text-xs md:text-sm text-slate-600">{testimonial.location}</div>
            )}
          </div>

          {testimonial.admin_response && (
            <div className="mt-4 bg-blue-50 border-r-4 border-blue-500 p-3 rounded">
              <p className="text-xs font-semibold text-blue-900 mb-1">תגובת הצוות:</p>
              <p className="text-sm text-slate-700">{testimonial.admin_response}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mobile Full-screen Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-[9999] bg-black/80 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-4 py-3 flex items-center justify-between z-10 rounded-t-2xl">
              <div className="flex items-center gap-1">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5">
              {(testimonial.image_url || testimonial.video_url) && (
                <div className="mb-4">
                  {renderMedia(modalVideoRef, isModalPlaying, setIsModalPlaying)}
                </div>
              )}

              <p className="text-slate-700 leading-relaxed italic text-base mb-6">
                &ldquo;{testimonial.text}&rdquo;
              </p>

              <div className="border-t pt-4">
                <div className="font-semibold text-slate-800">{testimonial.name}</div>
                {testimonial.location && (
                  <div className="text-sm text-slate-600">{testimonial.location}</div>
                )}
              </div>

              {testimonial.admin_response && (
                <div className="mt-4 bg-blue-50 border-r-4 border-blue-500 p-3 rounded">
                  <p className="text-xs font-semibold text-blue-900 mb-1">תגובת הצוות:</p>
                  <p className="text-sm text-slate-700">{testimonial.admin_response}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}