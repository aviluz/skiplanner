const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Users, ArrowRight, Wallet, Calculator } from "lucide-react";
import ExpenseDashboard from "@/components/expenses/ExpenseDashboard";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function ExpenseTracker() {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [user, setUser] = useState(null);

  // New Group Form State
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupCurrency, setNewGroupCurrency] = useState("ILS");
  const [participantsStr, setParticipantsStr] = useState(""); // Comma separated

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userData, groupsData] = await Promise.all([
        db.auth.me().catch(() => null),
        db.entities.ExpenseGroup.list("-updated_date")
      ]);
      setUser(userData);
      setGroups(groupsData);
    } catch (error) {
      console.error("Error loading expense groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast.error("נא להזין שם לקבוצה");
      return;
    }

    const participants = participantsStr
      .split(",")
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (participants.length < 1) {
      toast.error("יש להזין לפחות משתתף אחד");
      return;
    }

    try {
      const newGroup = await db.entities.ExpenseGroup.create({
        name: newGroupName,
        base_currency: newGroupCurrency,
        participants: participants,
        is_active: true
      });
      
      setGroups([newGroup, ...groups]);
      setSelectedGroup(newGroup);
      setIsCreateOpen(false);
      setNewGroupName("");
      setParticipantsStr("");
      toast.success("הקבוצה נוצרה בהצלחה!");
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("שגיאה ביצירת הקבוצה");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 text-center" dir="rtl">
        <Wallet className="w-16 h-16 text-blue-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-800 mb-2">ניהול הוצאות קבוצתי</h1>
        <p className="text-slate-600 mb-6 max-w-md">
          כדי ליצור ולנהל קבוצות הוצאות לטיולים, עליך להתחבר למערכת.
        </p>
        <Button onClick={() => db.auth.redirectToLogin()}>התחבר / הירשם</Button>
      </div>
    );
  }

  const updateGroupTimestamp = async (groupId) => {
    try {
      await db.entities.ExpenseGroup.update(groupId, {
        updated_date: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating group timestamp:", error);
    }
  };

  if (selectedGroup) {
    updateGroupTimestamp(selectedGroup.id);
    
    return (
      <div className="min-h-screen bg-slate-50" dir="rtl">
        <div className="max-w-5xl mx-auto p-4">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedGroup(null)}
            className="mb-4 text-slate-600 hover:text-blue-600"
          >
            <ArrowRight className="w-4 h-4 ml-2" />
            חזרה לרשימת הקבוצות
          </Button>
          <ExpenseDashboard 
            group={selectedGroup} 
            user={user}
            onGroupDeleted={() => {
              setSelectedGroup(null);
              loadData();
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8" dir="rtl" style={{ direction: 'rtl' }}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
              <Calculator className="w-8 h-8 text-blue-600" />
              ניהול הוצאות טיול
            </h1>
            <p className="text-slate-600 mt-1">נהל בקלות את ההוצאות המשותפות והתחשבנות בין החברים</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 ml-2" />
                קבוצה חדשה
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl">
              <DialogHeader>
                <DialogTitle>יצירת קבוצת הוצאות חדשה</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>שם הטיול / הקבוצה</Label>
                  <Input 
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="לדוגמה: סקי באוסטריה 2025"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>מטבע ראשי</Label>
                  <Select value={newGroupCurrency} onValueChange={setNewGroupCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ILS">₪ שקל חדש</SelectItem>
                      <SelectItem value="EUR">€ יורו</SelectItem>
                      <SelectItem value="USD">$ דולר</SelectItem>
                      <SelectItem value="GBP">£ פאונד</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>משתתפים (מופרד בפסיקים)</Label>
                  <Input 
                    value={participantsStr}
                    onChange={(e) => setParticipantsStr(e.target.value)}
                    placeholder="דני, יוסי, רונית, שירה..."
                  />
                  <p className="text-xs text-slate-500">הכנס לפחות משתתף אחד. ניתן להוסיף משתתפים נוספים בהמשך.</p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>ביטול</Button>
                <Button onClick={handleCreateGroup}>צור קבוצה</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-40 bg-white rounded-xl shadow-sm animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <Card className="bg-white text-center py-12 border-dashed">
            <CardContent>
              <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-700 mb-2">אין עדיין קבוצות</h3>
              <p className="text-slate-500 mb-6">צור את הקבוצה הראשונה שלך והתחל לנהל הוצאות בקלות</p>
              <p className="text-xs text-slate-400 mb-4">ניתן ליצור קבוצה גם עם משתתף אחד</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 ml-2" />
                צור קבוצה ראשונה
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map(group => (
              <Card 
                key={group.id} 
                className="hover:shadow-lg transition-shadow cursor-pointer border-slate-200"
                onClick={() => setSelectedGroup(group)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex justify-between items-start">
                    <span>{group.name}</span>
                    <span className="text-xs font-normal bg-slate-100 px-2 py-1 rounded text-slate-600">
                      {group.base_currency}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    {group.participants?.length || 0} משתתפים
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {group.participants?.slice(0, 3).map((p, i) => (
                      <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                        {p}
                      </span>
                    ))}
                    {(group.participants?.length || 0) > 3 && (
                      <span className="text-xs text-slate-400 px-1">+{group.participants.length - 3}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-4 text-left">
                    נוצר ב: {new Date(group.created_date).toLocaleDateString('he-IL')}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}