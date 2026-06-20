import React from 'react';
import { Plane, Car, Bed, Shield, MountainSnow, GraduationCap, Ticket } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const TRIP_STEPS = [
  { key: 'flights', label: 'טיסות', icon: Plane, description: 'בחירת טיסות', url: 'FlightStep' },
  { key: 'transport', label: 'תחבורה', icon: Car, description: 'רכב או הסעות', url: 'TransportChoice' },
  { key: 'accommodation', label: 'לינה', icon: Bed, description: 'מלון או דירה', url: 'AccommodationStep' },
  { key: 'insurance', label: 'ביטוח', icon: Shield, description: 'ביטוח נסיעות וסקי', url: 'InsuranceStep' },
  { key: 'equipment', label: 'ציוד', icon: MountainSnow, description: 'השכרת ציוד סקי', url: 'EquipmentStep' },
  { key: 'lessons', label: 'שיעורים', icon: GraduationCap, description: 'מדריך או כיתות', url: 'LessonsStep' },
  { key: 'ski_pass', label: 'סקי-פס', icon: Ticket, description: 'כרטיס לרכבלים', url: 'SkiPassNotice' },
];

export default function TripPlanningProgress({ 
  mode = 'progress', 
  currentStepKey = null, 
  stepsCompleted = {},
  tripId = null,
  isGuest = false
}) {
  const isIntro = mode === 'intro';

  return (
    <div className="w-full py-6" dir="rtl">
      {/* Mobile: Horizontal scroll */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-center justify-between min-w-max px-4 gap-2">
          {TRIP_STEPS.map((step, index) => {
            const isCompleted = !isIntro && stepsCompleted?.[step.key] === true;
            const isCurrent = !isIntro && currentStepKey === step.key;
            const Icon = step.icon;
            
            const stepUrl = isGuest 
              ? createPageUrl(`${step.url}?guest=1`)
              : tripId 
              ? createPageUrl(`${step.url}?tripId=${tripId}`)
              : '#';

            const CircleContent = (
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300
                  ${isCompleted ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-500'}
                  ${isCurrent ? 'ring-4 ring-blue-300 ring-offset-2' : ''}
                  ${!isIntro ? 'cursor-pointer hover:scale-105' : ''}
                `}
              >
                <Icon className="w-5 h-5" />
              </div>
            );

            return (
              <React.Fragment key={step.key}>
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  {/* Step Number */}
                  <div className="text-xs font-semibold text-slate-500 mb-1">
                    {index + 1}
                  </div>
                  
                  {/* Circle with Icon */}
                  <div className="relative">
                    {!isIntro && (tripId || isGuest) ? (
                      <Link to={stepUrl}>
                        {CircleContent}
                      </Link>
                    ) : (
                      CircleContent
                    )}
                  </div>

                  {/* Label */}
                  <div className="mt-2 text-center">
                    <div className={`text-xs font-medium ${isCompleted ? 'text-green-700' : 'text-slate-600'}`}>
                      {step.label}
                    </div>
                    {mode === 'intro' && (
                      <div className="text-[10px] text-slate-500 mt-0.5 max-w-[80px]">
                        {step.description}
                      </div>
                    )}
                  </div>
                </div>

                {/* Connecting Line */}
                {index < TRIP_STEPS.length - 1 && (
                  <div className="flex-shrink-0 w-8 h-0.5 bg-slate-300 mb-8" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}