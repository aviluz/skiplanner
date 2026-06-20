import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InsuranceProvider } from "@/entities/InsuranceProvider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit, Trash, Shield, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const ProviderForm = ({ provider, onSave, onCancel }) => {
    const [formData, setFormData] = useState(provider || {
        name: "",
        description: "",
        logo_url: "",
        action_link: "",
        sort_order: 0,
        is_active: true
    });

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, sort_order: Number(formData.sort_order) });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="name">שם הספק</Label>
                <Input id="name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required />
            </div>
            <div>
                <Label htmlFor="description">תיאור</Label>
                <Textarea id="description" value={formData.description} onChange={e => handleChange('description', e.target.value)} />
            </div>
            <div>
                <Label htmlFor="logo_url">קישור ללוגו</Label>
                <Input id="logo_url" value={formData.logo_url} onChange={e => handleChange('logo_url', e.target.value)} />
            </div>
            <div>
                <Label htmlFor="action_link">קישור להצעה</Label>
                <Input id="action_link" value={formData.action_link} onChange={e => handleChange('action_link', e.target.value)} required />
            </div>
            <div>
                <Label htmlFor="sort_order">סדר הצגה</Label>
                <Input id="sort_order" type="number" value={formData.sort_order} onChange={e => handleChange('sort_order', e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
                <Switch id="is_active" checked={formData.is_active} onCheckedChange={checked => handleChange('is_active', checked)} />
                <Label htmlFor="is_active">פעיל</Label>
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onCancel}>ביטול</Button>
                <Button type="submit">שמור</Button>
            </DialogFooter>
        </form>
    );
};

export default function AdminInsurance() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState(null);

    const { data: providers = [], isLoading, error } = useQuery({
        queryKey: ["insuranceProviders"],
        queryFn: () => InsuranceProvider.list({ sort: 'sort_order' })
    });

    const createMutation = useMutation({
        mutationFn: (newProvider) => InsuranceProvider.create(newProvider),
        onSuccess: () => {
            queryClient.invalidateQueries(["insuranceProviders"]);
            toast.success("ספק ביטוח נוצר בהצלחה!");
            setIsFormOpen(false);
        },
        onError: (err) => toast.error(`שגיאה ביצירת ספק: ${err.message}`)
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, ...updatedProvider }) => InsuranceProvider.update(id, updatedProvider),
        onSuccess: () => {
            queryClient.invalidateQueries(["insuranceProviders"]);
            toast.success("ספק ביטוח עודכן בהצלחה!");
            setIsFormOpen(false);
            setEditingProvider(null);
        },
        onError: (err) => toast.error(`שגיאה בעדכון ספק: ${err.message}`)
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => InsuranceProvider.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries(["insuranceProviders"]);
            toast.success("ספק ביטוח נמחק בהצלחה!");
        },
        onError: (err) => toast.error(`שגיאה במחיקת ספק: ${err.message}`)
    });

    const handleSave = (providerData) => {
        if (editingProvider) {
            updateMutation.mutate({ id: editingProvider.id, ...providerData });
        } else {
            createMutation.mutate(providerData);
        }
    };

    const openCreateForm = () => {
        setEditingProvider(null);
        setIsFormOpen(true);
    };

    const openEditForm = (provider) => {
        setEditingProvider(provider);
        setIsFormOpen(true);
    };

    return (
        <div className="p-4 md:p-8" dir="rtl">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                        <Shield />
                        ניהול ספקי ביטוח
                    </h1>
                    <Button onClick={openCreateForm} className="flex items-center gap-2">
                        <Plus /> הוסף ספק חדש
                    </Button>
                </div>

                {isLoading && <p>טוען ספקים...</p>}
                {error && <p className="text-red-500">שגיאה בטעינת הנתונים: {error.message}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {providers.map(provider => (
                        <Card key={provider.id} className="flex flex-col">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    {provider.logo_url ?
                                      <img src={provider.logo_url} alt={provider.name} className="w-20 h-auto object-contain rounded-md" />
                                      : <div className="w-20 h-20 bg-slate-100 flex items-center justify-center rounded-md"><ImageIcon className="w-8 h-8 text-slate-400" /></div>
                                    }
                                    <div className={`px-2 py-1 text-xs rounded-full ${provider.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {provider.is_active ? 'פעיל' : 'לא פעיל'}
                                    </div>
                                </div>
                                <CardTitle className="pt-4">{provider.name}</CardTitle>
                                <CardDescription>{provider.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow" />
                            <CardFooter className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" onClick={() => openEditForm(provider)}><Edit className="w-4 h-4" /></Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="icon"><Trash className="w-4 h-4" /></Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>אישור מחיקה</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                האם אתה בטוח שברצונך למחוק את הספק "{provider.name}"? לא ניתן לשחזר פעולה זו.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>ביטול</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => deleteMutation.mutate(provider.id)}>מחק</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingProvider ? 'עריכת ספק ביטוח' : 'הוספת ספק ביטוח חדש'}</DialogTitle>
                        </DialogHeader>
                        <ProviderForm
                            provider={editingProvider}
                            onSave={handleSave}
                            onCancel={() => setIsFormOpen(false)}
                        />
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}