
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PartyPopper, ArrowLeft, ListChecks } from 'lucide-react';

export default function TripCompletion() {
    const location = useLocation();
    const urlParams = new URLSearchParams(location.search);
    const tripId = urlParams.get('tripId');

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 md:p-6 flex items-center justify-center" dir="rtl">
            <div className="max-w-2xl mx-auto text-center">
                <Card className="border-0 shadow-2xl shadow-green-500/20 bg-white/90 backdrop-blur-sm">
                    <CardContent className="p-6 md:p-10">
                        <PartyPopper className="w-16 h-16 text-green-500 mx-auto mb-6 animate-bounce" />
                        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4">
                            כל הכבוד! תכנון הטיול הושלם
                        </h1>
                        <p className="text-base md:text-lg text-slate-600 mb-8 leading-relaxed">
                            עברתם את כל השלבים הדרושים לחופשת סקי מושלמת. כעת אתם מוכנים ליהנות מהחופשה שלכם. הדבר האחרון שנותר הוא לעבור על רשימת הציוד ולוודא שלא שכחתם כלום!
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <Link to={createPageUrl(`FinalChecklist?tripId=${tripId}`)}>
                                <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                                    <ListChecks className="w-5 h-5 ml-2" />
                                    עבור לצ'ק ליסט סופי
                                </Button>
                            </Link>
                            <Link to={createPageUrl(`MyTrips`)}>
                                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                                    <ArrowLeft className="w-5 h-5 ml-2" />
                                    חזור לטיולים שלי
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
