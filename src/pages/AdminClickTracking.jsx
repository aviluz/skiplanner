import React, { useState, useEffect, useMemo } from 'react';
import { ProductClick, SkiProduct } from '@/entities/all';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BarChart3, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function AdminClickTracking() {
  const [rawClicks, setRawClicks] = useState([]);           // כל הרשומות הגולמיות
  const [aggRows, setAggRows] = useState([]);               // שורות מאוגדות לפי מוצר
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [selectedAggRow, setSelectedAggRow] = useState(null); // שורה מאוגדת שנבחרה לאיפוס

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clicksData, productsData] = await Promise.all([
        ProductClick.list(),
        SkiProduct.list()
      ]);

      setRawClicks(clicksData || []);
      setProducts(productsData || []);

      // אגרגציה לפי product_id
      const productsMap = new Map((productsData || []).map(p => [p.id, p]));
      const byProduct = new Map();

      (clicksData || []).forEach(c => {
        const key = c.product_id || 'unknown';
        const curr = byProduct.get(key) || {
          product_id: key,
          product_name: c.product_name || productsMap.get(key)?.name || 'לא ידוע',
          click_count: 0,
          previous_count: 0,
          last_reset_date: null
        };

        curr.click_count += Number(c.click_count || 0);
        curr.previous_count += Number(c.previous_count || 0);
        if (c.last_reset_date) {
          const currDate = curr.last_reset_date ? new Date(curr.last_reset_date) : null;
          const newDate = new Date(c.last_reset_date);
          curr.last_reset_date = !currDate || newDate > currDate ? c.last_reset_date : curr.last_reset_date;
        }

        byProduct.set(key, curr);
      });

      setAggRows(Array.from(byProduct.values()));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('שגיאה בטעינת הנתונים');
    } finally {
      setLoading(false);
    }
  };

  // סכום כולל אחרי אגרגציה
  const totalClicks = useMemo(
    () => aggRows.reduce((sum, r) => sum + (r.click_count || 0), 0),
    [aggRows]
  );

  const handleOpenReset = (row) => {
    setSelectedAggRow(row); // row מכיל product_id מאוגד
    setResetDialogOpen(true);
  };

  // איפוס לכל הרשומות של המוצר שנבחר
  const confirmReset = async () => {
    if (!selectedAggRow) return;
    try {
      const nowIso = new Date().toISOString();
      const rowsToReset = rawClicks.filter(c => c.product_id === selectedAggRow.product_id);

      // מאפס כל רשומה שמרכיבה את השורה המאוגדת
      await Promise.all(rowsToReset.map(c =>
        ProductClick.update(c.id, {
          previous_count: Number(c.click_count || 0),
          click_count: 0,
          last_reset_date: nowIso
        })
      ));

      toast.success('ספירת הקליקים אופסה בהצלחה');
      setResetDialogOpen(false);
      setSelectedAggRow(null);
      loadData();
    } catch (error) {
      console.error('Error resetting clicks:', error);
      toast.error('שגיאה באיפוס הקליקים');
    }
  };

  const sortedAgg = useMemo(
    () => [...aggRows].sort((a, b) => (b.click_count || 0) - (a.click_count || 0)),
    [aggRows]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">נתוני הקלקות - דילים לציוד</h1>
            <p className="text-slate-600">מעקב אחר לחיצות על קישורי המוצרים</p>
          </div>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 ml-2" />
            רענן נתונים
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">סך הקליקים</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClicks}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">מוצרים עם קליקים</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{aggRows.filter(r => r.click_count > 0).length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ממוצע קליקים למוצר</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {aggRows.length > 0 ? Math.round(totalClicks / aggRows.length) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>פירוט קליקים לפי מוצר</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedAgg.length === 0 ? (
              <div className="text-center py-8 text-slate-500">עדיין אין נתוני קליקים</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">שם המוצר</TableHead>
                      <TableHead className="text-center">מספר קליקים</TableHead>
                      <TableHead className="text-center">קליקים לפני איפוס</TableHead>
                      <TableHead className="text-center">תאריך איפוס אחרון</TableHead>
                      <TableHead className="text-center">פעולות</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedAgg.map(row => (
                      <TableRow key={row.product_id}>
                        <TableCell className="font-medium">{row.product_name}</TableCell>
                        <TableCell className="text-center font-bold text-blue-600">
                          {row.click_count || 0}
                        </TableCell>
                        <TableCell className="text-center text-slate-500">
                          {row.previous_count || '-'}
                        </TableCell>
                        <TableCell className="text-center text-slate-500">
                          {row.last_reset_date
                            ? format(new Date(row.last_reset_date), 'dd/MM/yyyy HH:mm', { locale: he })
                            : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenReset(row)}
                            disabled={!row.click_count || row.click_count === 0}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>אישור איפוס קליקים</AlertDialogTitle>
              <AlertDialogDescription>
                לאפס את ספירת הלחיצות עבור "{selectedAggRow?.product_name}"?
                <br /><br />
                בכל הרשומות של המוצר יישמרו הקליקים הנוכחיים בשדה "קליקים לפני איפוס" והספירה תאופס ל-0.
                <br /><br />
                <strong>פעולה זו בלתי הפיכה.</strong>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setResetDialogOpen(false)}>ביטול</AlertDialogCancel>
              <AlertDialogAction onClick={confirmReset} className="bg-red-600 hover:bg-red-700">
                אפס קליקים
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
