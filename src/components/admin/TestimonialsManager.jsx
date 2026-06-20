const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Star, Check, X, Edit, Trash2, Plus, Search, Upload, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const statusLabels = {
  pending: 'ממתינות לאישור',
  approved: 'מאושרות',
  rejected: 'נדחו'
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

export default function TestimonialsManager() {
  const [testimonials, setTestimonials] = useState([]);
  const [filteredTestimonials, setFilteredTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    rating: 5,
    text: '',
    status: 'approved',
    display_order: 0,
    image_url: '',
    video_url: '',
    admin_response: ''
  });
  const [hoveredRating, setHoveredRating] = useState(0);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    loadTestimonials();
  }, []);

  useEffect(() => {
    filterTestimonials();
  }, [testimonials, filterStatus, searchQuery]);

  const loadTestimonials = async () => {
    setLoading(true);
    try {
      const data = await db.entities.Testimonial.list();
      setTestimonials(data);
    } catch (error) {
      console.error('Error loading testimonials:', error);
      toast.error('שגיאה בטעינת ההמלצות');
    } finally {
      setLoading(false);
    }
  };

  const filterTestimonials = () => {
    let filtered = [...testimonials];

    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) || 
        t.text.toLowerCase().includes(query)
      );
    }

    setFilteredTestimonials(filtered);
  };

  const countWords = (text) => {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  };

  const handleApprove = async (id) => {
    try {
      await db.entities.Testimonial.update(id, {
        status: 'approved',
        approved_at: new Date().toISOString()
      });
      toast.success('ההמלצה אושרה בהצלחה');
      loadTestimonials();
    } catch (error) {
      console.error('Error approving testimonial:', error);
      toast.error('שגיאה באישור ההמלצה');
    }
  };

  const handleReject = async (id) => {
    try {
      await db.entities.Testimonial.update(id, {
        status: 'rejected'
      });
      toast.success('ההמלצה נדחתה');
      loadTestimonials();
    } catch (error) {
      console.error('Error rejecting testimonial:', error);
      toast.error('שגיאה בדחיית ההמלצה');
    }
  };

  const handleEdit = (testimonial) => {
    setEditingTestimonial(testimonial);
    setFormData({
      name: testimonial.name,
      location: testimonial.location || '',
      rating: testimonial.rating,
      text: testimonial.text,
      status: testimonial.status,
      display_order: testimonial.display_order || 0,
      image_url: testimonial.image_url || '',
      video_url: testimonial.video_url || '',
      admin_response: testimonial.admin_response || ''
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    
    setUploadingFile(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      
      if (type === 'image') {
        setFormData(prev => ({ ...prev, image_url: file_url, video_url: '' }));
      } else if (type === 'video') {
        setFormData(prev => ({ ...prev, video_url: file_url, image_url: '' }));
      }
      
      toast.success('הקובץ הועלה בהצלחה');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('שגיאה בהעלאת הקובץ');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSaveResponse = async (testimonialId) => {
    try {
      await db.entities.Testimonial.update(testimonialId, {
        admin_response: responseText.trim() || null
      });
      toast.success('התגובה נשמרה בהצלחה');
      setRespondingTo(null);
      setResponseText('');
      loadTestimonials();
    } catch (error) {
      console.error('Error saving response:', error);
      toast.error('שגיאה בשמירת התגובה');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק המלצה זו?')) return;

    try {
      await db.entities.Testimonial.delete(id);
      toast.success('ההמלצה נמחקה בהצלחה');
      loadTestimonials();
    } catch (error) {
      console.error('Error deleting testimonial:', error);
      toast.error('שגיאה במחיקת ההמלצה');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('אנא הזן שם');
      return;
    }

    if (formData.rating < 1 || formData.rating > 5) {
      toast.error('דירוג חייב להיות בין 1 ל-5');
      return;
    }

    if (!formData.text.trim()) {
      toast.error('אנא כתוב המלצה');
      return;
    }

    const wordCount = countWords(formData.text);
    if (wordCount > 20) {
      toast.error('ניתן להזין עד 20 מילים בלבד');
      return;
    }

    if (formData.text.length > 140) {
      toast.error('ניתן להזין עד 140 תווים');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        location: formData.location.trim() || null,
        rating: parseInt(formData.rating),
        text: formData.text.trim(),
        image_url: formData.image_url || null,
        video_url: formData.video_url || null,
        admin_response: formData.admin_response?.trim() || null,
        status: formData.status,
        source: editingTestimonial ? editingTestimonial.source : 'admin',
        display_order: parseFloat(formData.display_order) || 0
      };

      if (formData.status === 'approved' && !editingTestimonial?.approved_at) {
        payload.approved_at = new Date().toISOString();
      }

      if (editingTestimonial) {
        await db.entities.Testimonial.update(editingTestimonial.id, payload);
        toast.success('ההמלצה עודכנה בהצלחה');
      } else {
        await db.entities.Testimonial.create(payload);
        toast.success('ההמלצה נוספה בהצלחה');
      }

      setIsDialogOpen(false);
      setEditingTestimonial(null);
      setFormData({
        name: '',
        location: '',
        rating: 5,
        text: '',
        status: 'approved',
        display_order: 0,
        image_url: '',
        video_url: '',
        admin_response: ''
      });
      loadTestimonials();
    } catch (error) {
      console.error('Error saving testimonial:', error);
      toast.error('שגיאה בשמירת ההמלצה');
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ניהול המלצות</h2>
          <p className="text-slate-600 mt-1">סקירה וניהול של המלצות לקוחות על SkiPlanner</p>
        </div>
        <Button onClick={() => {
          setEditingTestimonial(null);
          setFormData({
            name: '',
            location: '',
            rating: 5,
            text: '',
            status: 'approved',
            display_order: 0
          });
          setIsDialogOpen(true);
        }}>
          <Plus className="w-4 h-4 ml-2" />
          הוספת המלצה
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label>חיפוש</Label>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="חפש לפי שם או טקסט..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label>סינון לפי סטטוס</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">הכל</SelectItem>
                  <SelectItem value="pending">ממתינות לאישור</SelectItem>
                  <SelectItem value="approved">מאושרות</SelectItem>
                  <SelectItem value="rejected">נדחו</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">שם</TableHead>
                  <TableHead className="text-right">מיקום</TableHead>
                  <TableHead className="text-right">דירוג</TableHead>
                  <TableHead className="text-right">טקסט</TableHead>
                  <TableHead className="text-right">מדיה</TableHead>
                  <TableHead className="text-right">סטטוס</TableHead>
                  <TableHead className="text-right">תאריך</TableHead>
                  <TableHead className="text-right w-40">פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTestimonials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                      לא נמצאו המלצות
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTestimonials.map((testimonial) => (
                    <TableRow key={testimonial.id}>
                      <TableCell className="font-medium">{testimonial.name}</TableCell>
                      <TableCell>{testimonial.location || '-'}</TableCell>
                      <TableCell>{renderStars(testimonial.rating)}</TableCell>
                      <TableCell className="max-w-xs truncate">{testimonial.text}</TableCell>
                      <TableCell>
                        {testimonial.image_url && <Badge variant="outline" className="text-xs">📷 תמונה</Badge>}
                        {testimonial.video_url && <Badge variant="outline" className="text-xs">🎥 וידאו</Badge>}
                        {!testimonial.image_url && !testimonial.video_url && '-'}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[testimonial.status]}>
                          {statusLabels[testimonial.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {format(new Date(testimonial.created_date), 'dd/MM/yy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {testimonial.status === 'pending' && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-green-600 hover:text-green-700"
                                onClick={() => handleApprove(testimonial.id)}
                                title="אישור המלצה"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-600 hover:text-red-700"
                                onClick={() => handleReject(testimonial.id)}
                                title="דחיית המלצה"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700"
                            onClick={() => handleEdit(testimonial)}
                            title="עריכת המלצה"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-purple-600 hover:text-purple-700"
                            onClick={() => {
                              setRespondingTo(testimonial);
                              setResponseText(testimonial.admin_response || '');
                            }}
                            title="הוסף תגובה"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-600 hover:text-slate-700"
                            onClick={() => handleDelete(testimonial.id)}
                            title="מחיקת המלצה"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden p-4 space-y-4">
            {filteredTestimonials.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                לא נמצאו המלצות
              </div>
            ) : (
              filteredTestimonials.map((testimonial) => (
                <Card key={testimonial.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-semibold">{testimonial.name}</div>
                        {testimonial.location && (
                          <div className="text-sm text-slate-500">{testimonial.location}</div>
                        )}
                      </div>
                      <Badge className={statusColors[testimonial.status]}>
                        {statusLabels[testimonial.status]}
                      </Badge>
                    </div>
                    
                    {renderStars(testimonial.rating)}
                    
                    <p className="text-sm text-slate-700">{testimonial.text}</p>
                    
                    {(testimonial.image_url || testimonial.video_url) && (
                      <div className="mt-2">
                        {testimonial.image_url && (
                          <img src={testimonial.image_url} alt="תמונה" className="w-full h-32 object-cover rounded" />
                        )}
                        {testimonial.video_url && (
                          <video src={testimonial.video_url} className="w-full h-32 object-cover rounded" controls />
                        )}
                      </div>
                    )}
                    
                    <div className="text-xs text-slate-400">
                      {format(new Date(testimonial.created_date), 'dd/MM/yy')}
                    </div>
                    
                    <div className="flex gap-2 pt-2 border-t flex-wrap">
                      {testimonial.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-green-600"
                            onClick={() => handleApprove(testimonial.id)}
                          >
                            <Check className="w-4 h-4 ml-1" />
                            אשר
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-red-600"
                            onClick={() => handleReject(testimonial.id)}
                          >
                            <X className="w-4 h-4 ml-1" />
                            דחה
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(testimonial)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-purple-600"
                        onClick={() => {
                          setRespondingTo(testimonial);
                          setResponseText(testimonial.admin_response || '');
                        }}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(testimonial.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial ? 'עריכת המלצה' : 'הוספת המלצה'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">שם מלא</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                maxLength={30}
              />
            </div>

            <div>
              <Label htmlFor="location">מיקום (אופציונלי)</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                maxLength={30}
              />
            </div>

            <div>
              <Label>דירוג כוכבים</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
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
              <Label htmlFor="text">טקסט ההמלצה</Label>
              <Textarea
                id="text"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                rows={4}
                maxLength={140}
              />
              <div className="text-xs text-slate-500 mt-1">
                {countWords(formData.text)} / 20 מילים
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">סטטוס</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">ממתינה לאישור</SelectItem>
                    <SelectItem value="approved">מאושרת</SelectItem>
                    <SelectItem value="rejected">נדחתה</SelectItem>
                    </SelectContent>
                    </Select>
                    </div>

                    <div>
                    <Label htmlFor="display_order">סדר הצגה</Label>
                    <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                    />
                    </div>
                    </div>

                    <div>
                    <Label>תמונה או וידאו (אופציונלי)</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                    <Input
                    id="admin-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'image')}
                    disabled={uploadingFile}
                    />
                    <Label htmlFor="admin-image-upload">
                    <Button type="button" variant="outline" className="w-full" asChild disabled={uploadingFile || formData.video_url}>
                      <span className="cursor-pointer"><Upload className="w-4 h-4 ml-2" />תמונה</span>
                    </Button>
                    </Label>
                    {formData.image_url && (
                    <div className="relative mt-2">
                      <img src={formData.image_url} alt="תצוגה" className="w-full h-20 object-cover rounded" />
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
                    id="admin-video-upload"
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => e.target.files[0] && handleFileUpload(e.target.files[0], 'video')}
                    disabled={uploadingFile}
                    />
                    <Label htmlFor="admin-video-upload">
                    <Button type="button" variant="outline" className="w-full" asChild disabled={uploadingFile || formData.image_url}>
                      <span className="cursor-pointer"><Upload className="w-4 h-4 ml-2" />וידאו</span>
                    </Button>
                    </Label>
                    {formData.video_url && (
                    <div className="relative mt-2">
                      <video src={formData.video_url} className="w-full h-20 object-cover rounded" controls />
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
                    </div>

                    <div>
                    <Label htmlFor="admin_response">תגובת אדמין (אופציונלי)</Label>
                    <Textarea
                    id="admin_response"
                    value={formData.admin_response}
                    onChange={(e) => setFormData({ ...formData, admin_response: e.target.value })}
                    rows={3}
                    placeholder="תגובה להמלצה שתוצג בצד ההמלצה..."
                    />
                    </div>

                    <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                ביטול
              </Button>
              <Button type="submit">
                {editingTestimonial ? 'עדכן' : 'הוסף'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Response Dialog */}
      <Dialog open={!!respondingTo} onOpenChange={(open) => !open && setRespondingTo(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle>תגובה להמלצה של {respondingTo?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-slate-50 p-4 rounded-lg border">
              <div className="flex gap-1 mb-2">
                {[...Array(respondingTo?.rating || 0)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-sm text-slate-700 italic">&ldquo;{respondingTo?.text}&rdquo;</p>
            </div>

            <div>
              <Label>תגובתך להמלצה</Label>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="כתוב תגובה שתוצג מתחת להמלצה..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondingTo(null)}>
              ביטול
            </Button>
            <Button onClick={() => handleSaveResponse(respondingTo.id)}>
              שמור תגובה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}