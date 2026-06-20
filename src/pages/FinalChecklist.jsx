
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { TripPlan } from '@/entities/TripPlan';
import { Equipment } from '@/entities/Equipment';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ListChecks, ArrowLeft, ExternalLink, UserRound, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function FinalChecklist() {
    const [trip, setTrip] = useState(null);
    const [equipment, setEquipment] = useState([]);
    const [checkedItems, setCheckedItems] = useState({});
    const [loading, setLoading] = useState(true);
    const location = useLocation();

    const tripId = new URLSearchParams(location.search).get('tripId');

    useEffect(() => {
        if (!tripId) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                const [tripData, equipmentData] = await Promise.all([
                    TripPlan.get(tripId),
                    Equipment.list()
                ]);

                setTrip(tripData);
                setEquipment(equipmentData);
                if (tripData.equipment_checklist) {
                    setCheckedItems(tripData.equipment_checklist);
                }
            } catch (error) {
                console.error("Failed to fetch data for checklist:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tripId]);

    const handleCheckChange = async (itemId, isChecked) => {
        const newCheckedItems = { ...checkedItems, [itemId]: isChecked };
        setCheckedItems(newCheckedItems);

        try {
            await TripPlan.update(tripId, { equipment_checklist: newCheckedItems });
        } catch (error) {
            console.error("Failed to update checklist:", error);
            // Optionally revert state
        }
    };
    
    const groupedEquipment = equipment.reduce((acc, item) => {
        const category = item.category || 'אחר';
        if (!acc[category]) acc[category] = [];
        acc[category].push(item);
        return acc;
    }, {});

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!trip) {
        return (
            <div className="text-center p-8">
                <h1 className="text-2xl font-bold mb-4">לא נמצא טיול</h1>
                <p>לא הצלחנו למצוא את הטיול המבוקש.</p>
                 <Link to={createPageUrl("MyTrips")}>
                    <Button variant="link">חזור לטיולים שלי</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-8" dir="rtl">
            <div className="max-w-4xl mx-auto">
                <Card className="shadow-lg">
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-2xl md:text-3xl flex items-center gap-2">
                                    <ListChecks className="w-8 h-8 text-blue-600"/>
                                    צ'ק ליסט סופי לטיול
                                </CardTitle>
                                <p className="text-slate-600">{trip.trip_name}</p>
                            </div>
                            <Link to={createPageUrl(`TripDetails?id=${tripId}`)}>
                                <Button variant="outline"><ArrowLeft className="ml-2 h-4 w-4"/>חזרה לפרטי הטיול</Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                       {Object.entries(groupedEquipment).map(([category, items]) => (
                            <div key={category} className="mb-8">
                                <h3 className="text-xl font-semibold mb-4 border-b pb-2">{category}</h3>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]"></TableHead>
                                            <TableHead>פריט</TableHead>
                                            <TableHead>הערות</TableHead>
                                            <TableHead className="text-left">קישורים</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map(item => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Checkbox 
                                                        id={`item-${item.id}`}
                                                        checked={!!checkedItems[item.id]}
                                                        onCheckedChange={(checked) => handleCheckChange(item.id, checked)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <label htmlFor={`item-${item.id}`} className="font-medium">{item.name}</label>
                                                </TableCell>
                                                <TableCell className="text-sm text-slate-500">{item.description}</TableCell>
                                                <TableCell className="text-left">
                                                    <div className="flex gap-2 justify-end">
                                                        {item.link_men && <Button variant="outline" size="icon" asChild><a href={item.link_men} target="_blank" rel="noopener noreferrer" aria-label="לינק לרכישת פריט לגבר"><UserRound className="h-4 w-4 text-blue-600" /></a></Button>}
                                                        {item.link_women && <Button variant="outline" size="icon" asChild><a href={item.link_women} target="_blank" rel="noopener noreferrer" aria-label="לינק לרכישת פריט לאישה"><UserRound className="h-4 w-4 text-pink-600" /></a></Button>}
                                                        {item.link_kids && <Button variant="outline" size="icon" asChild><a href={item.link_kids} target="_blank" rel="noopener noreferrer" aria-label="לינק לרכישת פריט לילד"><Baby className="h-4 w-4" /></a></Button>}
                                                        {item.purchase_link && <Button variant="ghost" size="icon" asChild><a href={item.purchase_link} target="_blank" rel="noopener noreferrer" aria-label="לינק כללי לרכישת פריט"><ExternalLink className="h-4 w-4" /></a></Button>}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                       ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
