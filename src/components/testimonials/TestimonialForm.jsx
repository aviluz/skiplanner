const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Upload, X, Loader2 } from 'lucide-react';

import { toast } from 'sonner';

export default function TestimonialForm({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    rating: 0,
    text: '',
    image_url: '',
    video_url: ''
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);

  const charCount = formData.text.length;
  const MIN_CHARS = 20;
  const MAX_CHARS = 2000;

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    
    setUploadingFile(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      
      if (type === 'image') {
        setFormData(prev => ({ ...prev, image_url: file_url }));
      } else if (type === 'video') {
        setFormData(prev => ({ ...prev, video_url: file_url }));
      }
      
      toast.success('הקובץ הועלה בהצלחה');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('שגיאה בהעלאת הקובץ');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error('אנא הזן שם');
      return;
    }

    if (formData.rating === 0) {
      toast.error('יש לבחור דירוג');
      return;
    }

    if (!formData.text.trim()) {
      toast.error('אנא כתוב המלצה');
      return;
    }

    if (formData.text.trim().length < MIN_CHARS) {
      toast.error(`ההמלצה חייבת להכיל לפחות ${MIN_CHARS} תווים`);
      return;
    }

    if (formData.text.length > MAX_CHARS) {
      toast.error(`ניתן להזין עד ${MAX_CHARS} תווים`);
      return;
    }

    setIsSubmitting(true);

    try {
      await db.entities.Testimonial.create({
        name: formData.name.trim(),
        location: formData.location.trim() || null,
        rating: formData.rating,
        text: formData.text.trim(),
        image_url: formData.image_url || null,
        video_url: formData.video_url || null,
        status: 'pending',
        source: 'user'
      });

      toast.success('תודה רבה! 🙏 ההמלצה נשלחה ותפורסם באתר לאחר אישור.');
      
      // Reset form
      setFormData({
        name: '',
        location: '',
        rating: 0,
        text: '',
        image_url: '',
        video_url: ''
      });
      
      onClose();
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      toast.error('אירעה שגיאה בשליחת ההמלצה. אנא נסה שוב.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-2xl">נשמח לשמוע מכם 🙌</DialogTitle>
          <div className="text-slate-600 text-sm mt-2">
            רוצים לשתף איך היה לכם לתכנן חופשת סקי עם SkiPlanner?
            המלצה קצרה שלכם עוזרת לאחרים לקבל החלטה.
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div>
            <Label htmlFor="name">שם מלא</Label>
            <Input
              id="name"
              placeholder="לדוגמה: יהודה רוזנטל"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              maxLength={30}
            />
          </div>

          <div>
            <Label htmlFor="location">מיקום (אופציונלי)</Label>
            <Input
              id="location"
              placeholder="לדוגמה: שווייץ"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              maxLength={30}
            />
          </div>

          <div>
            <Label>דירוג כוכבים</Label>
            <div className="text-xs text-slate-500 mb-2">בחר דירוג בין 1 ל-5 כוכבים</div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || formData.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="text">המלצה (עד 2,000 תווים)</Label>
            <Textarea
              id="text"
              placeholder="כתבו על החוויה שלכם בתכנון חופשת הסקי"
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              rows={5}
              maxLength={MAX_CHARS}
            />
            <div className="flex items-center justify-between mt-1">
              {charCount < MIN_CHARS && charCount > 0 && (
                <span className="text-xs text-orange-500">נדרשים לפחות {MIN_CHARS} תווים ({MIN_CHARS - charCount} נותרו)</span>
              )}
              {charCount === 0 && <span className="text-xs text-slate-400">מינימום {MIN_CHARS} תווים</span>}
              {charCount >= MIN_CHARS && <span className="text-xs text-green-600">✓</span>}
              <span className={`text-xs mr-auto ${charCount > MAX_CHARS * 0.9 ? 'text-orange-500' : 'text-slate-500'}`}>
                {charCount} / {MAX_CHARS.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <Label>תמונה או וידאו (אופציונלי)</Label>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div>
                <Input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'image')}
                  disabled={uploadingFile}
                />
                <Label htmlFor="image-upload">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    asChild 
                    disabled={uploadingFile || formData.video_url}
                  >
                    <span className="cursor-pointer flex items-center justify-center gap-2">
                      {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      העלה תמונה
                    </span>
                  </Button>
                </Label>
                {formData.image_url && (
                  <div className="relative mt-2">
                    <img src={formData.image_url} alt="תצוגה מקדימה" className="w-full h-24 object-cover rounded" />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
              <div>
                <Input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'video')}
                  disabled={uploadingFile}
                />
                <Label htmlFor="video-upload">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full" 
                    asChild 
                    disabled={uploadingFile || formData.image_url}
                  >
                    <span className="cursor-pointer flex items-center justify-center gap-2">
                      {uploadingFile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      העלה וידאו
                    </span>
                  </Button>
                </Label>
                {formData.video_url && (
                  <div className="relative mt-2">
                    <video src={formData.video_url} className="w-full h-24 object-cover rounded" controls />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, video_url: '' })}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">ניתן להעלות תמונה או וידאו (לא שניהם)</p>
          </div>

          <div className="flex gap-2 pt-4 pb-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="flex-1">
              ביטול
            </Button>
            <Button type="submit" disabled={isSubmitting || charCount < MIN_CHARS} className="flex-1">
              {isSubmitting ? 'שולח...' : 'שליחת המלצה'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}