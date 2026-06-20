const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { CalendarIcon, Gem, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

export default function VipForm() {
  const navigate = useNavigate();
  const [sections, setSections] = useState([]);
  const [fields, setFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [vipTermsDocument, setVipTermsDocument] = useState(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    loadFormStructure();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await db.auth.me();
      setUser(userData);
      setFormData(prev => ({
        ...prev,
        user_email: userData.email,
        user_name: userData.full_name || userData.email
      }));
    } catch (error) {
      setUser(null);
    }
  };

  const loadFormStructure = async () => {
    setLoading(true);
    try {
      const [sectionsData, fieldsData, legalDocs] = await Promise.all([
        db.entities.VipFormSection.filter({ is_active: true }),
        db.entities.VipFormField.filter({ is_active: true }),
        db.entities.LegalDocument.filter({ 
          require_acceptance_in_vip_form: true,
          is_active: true 
        })
      ]);

      const sortedSections = sectionsData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      const sortedFields = fieldsData.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      setSections(sortedSections);
      setFields(sortedFields);
      
      // טען מסמך תנאי VIP אם קיים
      if (legalDocs.length > 0) {
        setVipTermsDocument(legalDocs[0]);
      }
    } catch (error) {
      console.error('Error loading form structure:', error);
      toast.error('שגיאה בטעינת הטופס');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^05[0-9]{8}$/;
    return phoneRegex.test(phone);
  };

  const handleEmailBlur = (fieldId, value) => {
    if (value && !validateEmail(value)) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldId]: 'נא להזין כתובת מייל תקינה'
      }));
    }
  };

  const handlePhoneBlur = (fieldId, value) => {
    if (value && !validatePhone(value)) {
      setValidationErrors(prev => ({
        ...prev,
        [fieldId]: 'נא להזין מספר טלפון ישראלי תקין (10 ספרות)'
      }));
    }
  };

  const isFieldVisible = (field) => {
    if (!field.visible_if) return true;
    const conditionField = fields.find(f => f.label === field.visible_if.field);
    if (!conditionField) return true;
    return formData[conditionField.id] === field.visible_if.value;
  };

  const validateForm = () => {
    const errors = {};
    const requiredFields = fields.filter(f => f.is_required);
    
    for (const field of requiredFields) {
      if (!isFieldVisible(field)) continue;
      
      const value = formData[field.id];
      if (!value || (Array.isArray(value) && value.length === 0)) {
        errors[field.id] = `השדה "${field.label}" הוא שדה חובה`;
      }
      
      if (field.field_type === 'email' && value && !validateEmail(value)) {
        errors[field.id] = 'נא להזין כתובת מייל תקינה';
      }
      
      if (field.field_type === 'phone' && value && !validatePhone(value)) {
        errors[field.id] = 'נא להזין מספר טלפון ישראלי תקין (10 ספרות)';
      }

      if (field.field_type === 'date_range' && value) {
        if (!value.startDate || !value.endDate) {
          errors[field.id] = 'נא לבחור תאריך יציאה וחזרה';
        }
      }
    }

    if (!formData.notes || formData.notes.trim() === '') {
      errors.notes = 'שדה ההערות הוא שדה חובה';
    }

    // אם יש מסמך תנאי VIP - חייב לאשר
    if (vipTermsDocument && !termsAccepted) {
      errors.terms_acceptance = 'חובה לאשר את תנאי השירות';
      toast.error('נא לאשר את תנאי השירות');
      return false;
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error('נא לתקן את השדות המסומנים באדום');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const formattedData = {
        ...formData,
        sections: sections.map(section => ({
          title: section.title,
          fields: fields
            .filter(f => f.section_id === section.id && isFieldVisible(f))
            .map(field => {
              let displayValue = formData[field.id];
              
              if (field.field_type === 'date_range' && displayValue && typeof displayValue === 'object') {
                const start = displayValue.startDate ? format(new Date(displayValue.startDate), 'PPP', { locale: he }) : 'לא נבחר';
                const end = displayValue.endDate ? format(new Date(displayValue.endDate), 'PPP', { locale: he }) : 'לא נבחר';
                displayValue = `${start} - ${end}`;
              } else if (Array.isArray(displayValue)) {
                displayValue = displayValue.join(', ');
              } else if (typeof displayValue === 'object') {
                displayValue = JSON.stringify(displayValue);
              } else if (!displayValue) {
                displayValue = 'לא מולא';
              }
              
              return {
                label: field.label,
                value: displayValue
              };
            })
        }))
      };

      await db.entities.VipRequest.create({
        form_data: formattedData,
        user_email: formData.user_email || (user ? user.email : 'אורח'),
        user_name: formData.user_name || (user ? user.full_name || user.email : 'אורח'),
        status: 'new',
        is_read: false,
        terms_accepted: vipTermsDocument ? termsAccepted : false,
        terms_accepted_date: vipTermsDocument && termsAccepted ? new Date().toISOString() : null,
        accepted_documents: vipTermsDocument && termsAccepted ? [vipTermsDocument.id] : []
      });

      toast.success('הטופס נשלח בהצלחה!');
      navigate(createPageUrl('VipThankYou'));
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('שגיאה בשליחת הטופס. אנא נסה שוב.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.id] || '';
    const hasError = validationErrors[field.id];

    switch (field.field_type) {
      case 'text':
        return (
          <div>
            <Input
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.description}
              className={`text-right ${hasError ? 'border-red-500' : ''}`}
            />
            {hasError && <p className="text-red-500 text-xs mt-1">{hasError}</p>}
          </div>
        );

      case 'email':
        return (
          <div>
            <Input
              type="email"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              onBlur={(e) => handleEmailBlur(field.id, e.target.value)}
              placeholder={field.description}
              className={`text-right ${hasError ? 'border-red-500' : ''}`}
            />
            {hasError && <p className="text-red-500 text-xs mt-1">{hasError}</p>}
          </div>
        );

      case 'phone':
        return (
          <div>
            <Input
              type="tel"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              onBlur={(e) => handlePhoneBlur(field.id, e.target.value)}
              placeholder={field.description || "05xxxxxxxx"}
              className={`text-right ${hasError ? 'border-red-500' : ''}`}
              maxLength={10}
            />
            {hasError && <p className="text-red-500 text-xs mt-1">{hasError}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div>
            <Textarea
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.description}
              rows={4}
              className={`text-right ${hasError ? 'border-red-500' : ''}`}
            />
            {hasError && <p className="text-red-500 text-xs mt-1">{hasError}</p>}
          </div>
        );

      case 'number':
        return (
          <div>
            <Input
              type="number"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              placeholder={field.description}
              className={`text-right ${hasError ? 'border-red-500' : ''}`}
            />
            {hasError && <p className="text-red-500 text-xs mt-1">{hasError}</p>}
          </div>
        );

      case 'date':
        return (
          <div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={`w-full justify-start text-right ${hasError ? 'border-red-500' : ''}`}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value ? format(new Date(value), 'PPP', { locale: he }) : <span>בחר תאריך</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => handleFieldChange(field.id, date ? date.toISOString() : '')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {hasError && <p className="text-red-500 text-xs mt-1">{hasError}</p>}
          </div>
        );

      case 'date_range':
        const dateRange = value || { startDate: null, endDate: null };
        return (
          <div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-slate-600">תאריך יציאה</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={`w-full justify-start text-right ${hasError ? 'border-red-500' : ''}`}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.startDate ? format(new Date(dateRange.startDate), 'PPP', { locale: he }) : <span>בחר תאריך</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.startDate ? new Date(dateRange.startDate) : undefined}
                      onSelect={(date) => handleFieldChange(field.id, {
                        ...dateRange,
                        startDate: date ? date.toISOString() : null
                      })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label className="text-sm text-slate-600">תאריך חזרה</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className={`w-full justify-start text-right ${hasError ? 'border-red-500' : ''}`}
                      disabled={!dateRange.startDate}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.endDate ? format(new Date(dateRange.endDate), 'PPP', { locale: he }) : <span>בחר תאריך</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateRange.endDate ? new Date(dateRange.endDate) : undefined}
                      onSelect={(date) => handleFieldChange(field.id, {
                        ...dateRange,
                        endDate: date ? date.toISOString() : null
                      })}
                      disabled={(date) => {
                        if (!dateRange.startDate) return true;
                        return date < new Date(dateRange.startDate);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {hasError && <p className="text-red-500 text-xs mt-1">{hasError}</p>}
          </div>
        );

      case 'select':
        return (
          <div>
            <Select value={value} onValueChange={(val) => handleFieldChange(field.id, val)}>
              <SelectTrigger dir="rtl" className={hasError ? 'border-red-500' : ''}>
                <SelectValue placeholder="בחר..." />
              </SelectTrigger>
              <SelectContent>
                {(field.options || []).map((option, idx) => (
                  <SelectItem key={idx} value={option} className="text-right">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && <p className="text-red-500 text-xs mt-1">{hasError}</p>}
          </div>
        );

      case 'radio':
        return (
          <div>
            <RadioGroup value={value} onValueChange={(val) => handleFieldChange(field.id, val)} dir="rtl">
              {(field.options || []).map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value={option} id={`${field.id}-${idx}`} />
                  <Label htmlFor={`${field.id}-${idx}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {hasError && <p className="text-red-500 text-xs mt-1">{hasError}</p>}
          </div>
        );

      case 'multi_select':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div>
            <div className="space-y-2">
              {(field.options || []).map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2 space-x-reverse">
                  <Checkbox
                    id={`${field.id}-${idx}`}
                    checked={selectedValues.includes(option)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        handleFieldChange(field.id, [...selectedValues, option]);
                      } else {
                        handleFieldChange(field.id, selectedValues.filter(v => v !== option));
                      }
                    }}
                  />
                  <Label htmlFor={`${field.id}-${idx}`}>{option}</Label>
                </div>
              ))}
            </div>
            {hasError && <p className="text-red-500 text-xs mt-1">{hasError}</p>}
          </div>
        );

      default:
        return (
          <div>
            <Input 
              value={value} 
              onChange={(e) => handleFieldChange(field.id, e.target.value)} 
              className={`text-right ${hasError ? 'border-red-500' : ''}`}
            />
            {hasError && <p className="text-red-500 text-xs mt-1">{hasError}</p>}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6"
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <Gem className="w-12 h-12 text-pink-500 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            טופס הזמנת חופשת סקי – שירות VIP
          </h1>
          <p className="text-lg text-slate-600">
            נא למלא את כל השדות המסומנים בכוכבית (*). לאחר השליחה מומחה סקי יחזור אליכם עם תכנון מותאם אישית.
          </p>
          <p className="text-xs text-slate-400 mt-2 mb-4">
            *מילוי הטופס משמש לקבלת הצעת מחיר בלבד וללא כל התחייבות מצידכם
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {sections.map((section) => {
            const sectionFields = fields.filter(f => f.section_id === section.id);
            if (sectionFields.length === 0) return null;

            return (
              <Card key={section.id} className="border-0 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardTitle className="text-xl text-slate-800">{section.title}</CardTitle>
                  {section.description && (
                    <p className="text-sm text-slate-600 mt-2">{section.description}</p>
                  )}
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {sectionFields.map((field) => {
                    if (!isFieldVisible(field)) return null;
                    
                    return (
                      <div key={field.id} className="transition-all duration-150">
                        <Label className="text-base font-medium text-slate-700">
                          {field.label}
                          {field.is_required && <span className="text-red-500 mr-1">*</span>}
                        </Label>
                        {field.description && (
                          <p className="text-xs text-slate-500 mb-2 mt-1">{field.description}</p>
                        )}
                        {renderField(field)}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}

          {/* Notes Field - Always displayed */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="text-xl text-slate-800">הערות נוספות</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <Label className="text-base font-medium text-slate-700">
                הערות או בקשות מיוחדות
                <span className="text-red-500 mr-1">*</span>
              </Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="ספר לנו עוד על מה שאתה מחפש..."
                rows={6}
                className={`mt-2 text-right ${validationErrors.notes ? 'border-red-500' : ''}`}
              />
              {validationErrors.notes && <p className="text-red-500 text-xs mt-1">{validationErrors.notes}</p>}
            </CardContent>
          </Card>

          {/* VIP Terms Section */}
          {vipTermsDocument && (
            <Card className="border-0 shadow-lg border-t-4 border-t-blue-600">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="text-xl text-slate-800">תנאי הזמנת שירות VIP</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-64 overflow-y-auto mb-4">
                  <div className="prose prose-sm prose-slate max-w-none">
                    <ReactMarkdown>
                      {vipTermsDocument.content}
                    </ReactMarkdown>
                  </div>
                </div>
                
                <div className={`flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                  termsAccepted 
                    ? 'bg-green-50 border-green-300' 
                    : validationErrors.terms_acceptance 
                    ? 'bg-red-50 border-red-400' 
                    : 'bg-white border-slate-300'
                }`}>
                  <Checkbox
                    id="terms_acceptance"
                    checked={termsAccepted}
                    onCheckedChange={setTermsAccepted}
                    className="mt-1"
                  />
                  <Label 
                    htmlFor="terms_acceptance" 
                    className="cursor-pointer text-base font-medium text-slate-700 leading-relaxed"
                  >
                    קראתי ואני מאשר/ת את תנאי הזמנת השירות ואת הצהרת הפרטיות
                    <span className="text-red-500 mr-1">*</span>
                  </Label>
                </div>
                
                {validationErrors.terms_acceptance && (
                  <p className="text-red-500 text-sm mt-2 font-medium">{validationErrors.terms_acceptance}</p>
                )}
              </CardContent>
            </Card>
          )}

          <div className="flex justify-center">
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-12 py-6 text-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  שולח...
                </>
              ) : (
                <>
                  <Gem className="w-5 h-5 mr-2" />
                  שלח בקשה
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}