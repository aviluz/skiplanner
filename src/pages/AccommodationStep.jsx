import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { transitionGuestToUser } from "@/lib/guestTripMigration";
import { format } from "date-fns";
import { 
  Bed, 
  ArrowLeft, 
  CheckCircle, 
  Calendar,
  Users,
  MapPin,
  ExternalLink,
  Star,
  Home,
  AlertTriangle
} from "lucide-react";
import TripPlanningProgress from "@/components/TripPlanningProgress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";