const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from 'react';

import { UploadFile } from '@/integrations/Core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Loader2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        nickname: '', // Added nickname
        gender: '',
        age: '',
        skiing_level: '',
        profile_image_url: ''
    });
    const { toast } = useToast();
    const fileInputRef = React.useRef(null);
    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const currentUser = await db.auth.me();
                setUser(currentUser);
                setFormData({
                    full_name: currentUser.full_name || '',
                    email: currentUser.email || '',
                    nickname: currentUser.nickname || '', // Initialize nickname from currentUser
                    gender: currentUser.gender || '',
                    age: currentUser.age || '',
                    skiing_level: currentUser.skiing_level || '',
                    profile_image_url: currentUser.profile_image_url || ''
                });
            } catch (error) {
                console.error("User not logged in", error);
                // Optionally redirect to login or show a message
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setSaving(true);
        try {
            const { file_url } = await UploadFile({ file });
            setFormData(prev => ({ ...prev, profile_image_url: file_url }));
            toast({ title: "תמונה הועלתה בהצלחה" });
        } catch (error) {
            console.error("Error uploading image:", error);
            toast({ title: "שגיאה בהעלאת תמונה", variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { email, ...updateData } = formData;
            // Update user data including full_name and nickname
            await db.auth.updateMe(updateData);
            
            // Refresh user data to confirm the update
            const updatedUser = await db.auth.me();
            setUser(updatedUser);
            setFormData({
                full_name: updatedUser.full_name || '',
                email: updatedUser.email || '',
                nickname: updatedUser.nickname || '',
                gender: updatedUser.gender || '',
                age: updatedUser.age || '',
                skiing_level: updatedUser.skiing_level || '',
                profile_image_url: updatedUser.profile_image_url || ''
            });
            
            toast({
                title: "הפרופיל עודכן בהצלחה!",
                description: "הפרטים שלך נשמרו.",
            });
            // Go back to the previous page as requested
            navigate(-1);
        } catch (error) {
            console.error("Error updating profile:", error);
            toast({
                title: "שגיאה בעדכון הפרופיל",
                description: "אנא נסה שוב.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!user) {
        return <div className="text-center p-8">אנא <a href="#" onClick={() => db.auth.redirectToLogin()} className="text-blue-600 underline">התחבר</a> כדי לראות את הפרופיל שלך.</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8" dir="rtl">
            <div className="max-w-4xl mx-auto">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl md:text-3xl">הפרופיל שלי</CardTitle>
                        <CardDescription>עדכן את הפרטים האישיים ותמונת הפרופיל שלך</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="relative">
                                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                                        <AvatarImage src={formData.profile_image_url} alt={formData.full_name} />
                                        <AvatarFallback>
                                            <UserIcon className="h-12 w-12 text-slate-400" />
                                        </AvatarFallback>
                                    </Avatar>
                                    <Button
                                        type="button"
                                        size="icon"
                                        className="absolute bottom-0 left-0 rounded-full"
                                        onClick={() => fileInputRef.current?.click()}
                                        aria-label="העלה תמונת פרופיל"
                                    >
                                        <Upload className="h-4 w-4"/>
                                    </Button>
                                    <Input 
                                      type="file" 
                                      ref={fileInputRef} 
                                      className="hidden" 
                                      onChange={handleImageUpload}
                                      accept="image/png, image/jpeg"
                                    />
                                </div>
                                <div className="flex-grow w-full space-y-4">
                                     <div>
                                        <Label htmlFor="full_name">שם מלא</Label>
                                        <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleInputChange} required />
                                    </div>
                                    <div>
                                        <Label htmlFor="email">כתובת מייל</Label>
                                        <Input id="email" name="email" type="email" value={formData.email} disabled />
                                    </div>
                                    <div>
                                        <Label htmlFor="nickname">כינוי</Label>
                                        <Input id="nickname" name="nickname" value={formData.nickname} onChange={handleInputChange} placeholder="השם שיוצג בהמלצות"/>
                                        <p className="text-xs text-slate-500 mt-1">השם שיוצג לציבור הרחב בהמלצות</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t">
                                <div>
                                    <Label htmlFor="gender">מין</Label>
                                    <Select name="gender" value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                                        <SelectTrigger id="gender"><SelectValue placeholder="בחר/י מין" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="זכר">זכר</SelectItem>
                                            <SelectItem value="נקבה">נקבה</SelectItem>
                                            <SelectItem value="מעדיף/ה לא לציין">מעדיף/ה לא לציין</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="age">גיל</Label>
                                    <Input id="age" name="age" type="number" value={formData.age} onChange={handleInputChange} placeholder="לדוגמה: 30" />
                                </div>
                                 <div>
                                    <Label htmlFor="skiing_level">רמת גלישה</Label>
                                    <Select name="skiing_level" value={formData.skiing_level} onValueChange={(value) => handleSelectChange('skiing_level', value)}>
                                        <SelectTrigger id="skiing_level"><SelectValue placeholder="בחר/י רמה" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="מתחיל">מתחיל</SelectItem>
                                            <SelectItem value="בינוני">בינוני</SelectItem>
                                            <SelectItem value="מתקדם">מתקדם</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            
                            <div className="flex justify-end pt-6 border-t">
                                <Button type="submit" disabled={saving}>
                                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {saving ? 'שומר...' : 'שמור שינויים'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}